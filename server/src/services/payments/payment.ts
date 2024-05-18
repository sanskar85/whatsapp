import { Types } from 'mongoose';
import { SUBSCRIPTION_STATUS, TRANSACTION_STATUS } from '../../config/const';
import InternalError, { INTERNAL_ERRORS } from '../../errors/internal-errors';
import RazorpayProvider from '../../provider/razorpay';
import { RAZORPAY_API_KEY } from '../../provider/razorpay/config/const';
import PaymentDB from '../../repository/payments/payment';
import SubscriptionDB from '../../repository/payments/subscription';
import IPaymentBucket from '../../types/payment/payment-bucket';
import DateUtils from '../../utils/DateUtils';
import { parseSubscriptionStatus } from '../../utils/ExpressUtils';
import { DeviceService } from '../user';

export default class PaymentService {
	private bucket: IPaymentBucket;
	public constructor(bucket: IPaymentBucket) {
		this.bucket = bucket;
	}

	async initializeOneTimePayment() {
		const customer = await RazorpayProvider.customers.createCustomer({
			name: this.bucket.name,
			email: this.bucket.email,
			phone_number: this.bucket.phone_number,
			billing_address: this.bucket.billing_address,
		});
		if (!customer) {
			throw new InternalError(INTERNAL_ERRORS.RAZORPAY_ERRORS.CUSTOMER_ERROR);
		}
		const { id: customer_id } = customer;
		const payment = new PaymentDB({
			bucket: this.bucket,
			transaction_date: DateUtils.getDate(),
		});
		const order = await RazorpayProvider.orders.createOrder({
			amount: this.bucket.total_amount,
			reference_id: payment._id,
			customer_id: customer_id,
		});

		payment.order_id = order.id;
		await payment.save();

		return {
			transaction_id: payment._id,
			order_id: order.id,
			razorpay_options: {
				description: 'Whatsleads One Time Payment',
				currency: order.currency,
				amount: order.amount * 100,
				name: 'Whatsleads',
				order_id: order.id,
				prefill: {
					name: this.bucket.name,
					contact: this.bucket.phone_number,
					email: this.bucket.email,
				},
				key: RAZORPAY_API_KEY,
				theme: {
					color: '#4CB072',
				},
			},
		};
	}

	public async confirmOneTimePayment(order_id: string, payment_id: string) {
		const walletTransaction = await PaymentDB.findOne({ order_id: order_id });
		if (walletTransaction === null) {
			throw new InternalError(INTERNAL_ERRORS.PAYMENT_ERROR.PAYMENT_NOT_FOUND);
		}

		if (this.bucket.transaction_status === TRANSACTION_STATUS.SUCCESS) {
			return;
		}

		const order = await RazorpayProvider.orders.getOrder(order_id);

		if (order.status !== 'paid') {
			throw new InternalError(INTERNAL_ERRORS.RAZORPAY_ERRORS.ORDER_PENDING);
		}

		walletTransaction.amount = order.amount;
		walletTransaction.payment_id = payment_id;
		walletTransaction.save();

		this.bucket.transaction_status = TRANSACTION_STATUS.SUCCESS;

		const month = this.bucket.plan.months;
		for (const number of this.bucket.whatsapp_numbers) {
			await DeviceService.addMonthToExpiry(number, month);
		}
		await this.bucket.save();
	}

	public async createSubscription() {
		const subscription_doc = new SubscriptionDB({
			bucket: this.bucket,
			plan: this.bucket.plan,
			coupon: this.bucket.discount_coupon,
		});

		const subscription = await RazorpayProvider.subscription.createSubscription({
			email: this.bucket.email,
			phone: this.bucket.phone_number,
			plan_id: subscription_doc.plan.plan_id,
		});

		subscription_doc.subscription_status = SUBSCRIPTION_STATUS.ACTIVE;
		subscription_doc.subscription_id = subscription.id;
		subscription_doc.subscription_link = subscription.short_url;
		subscription_doc.remaining_count = subscription.remaining_count;
		subscription_doc.paid_count = subscription.plan_count;
		subscription_doc.total_count = subscription.total_count;

		await subscription_doc.save();

		this.bucket.transaction_status = TRANSACTION_STATUS.RECURRING;
		await this.bucket.save();

		return {
			transaction_id: subscription_doc._id,
			subscription_id: subscription_doc.subscription_id,
			payment_link: subscription_doc.subscription_link,
		};
	}

	public async acceptSubscriptionPayment(subscription_id: string, payment_id: string) {
		const subscription_doc = await SubscriptionDB.findOne({ subscription_id });
		if (subscription_doc === null) {
			throw new InternalError(INTERNAL_ERRORS.PAYMENT_ERROR.PAYMENT_NOT_FOUND);
		}

		if (this.bucket.transaction_status !== TRANSACTION_STATUS.RECURRING) {
			return;
		}

		const subscription = await RazorpayProvider.subscription.getSubscription(subscription_id);

		if (parseSubscriptionStatus(subscription.status) !== SUBSCRIPTION_STATUS.ACTIVE) {
			subscription_doc.subscription_status = subscription.status;
			subscription_doc.save();
			return;
		}
		const payment = await RazorpayProvider.payments.getPayment(payment_id);

		await PaymentDB.create({
			bucket: this.bucket,
			amount: payment.amount,
			order_id: payment.order_id,
			payment_id: payment.payment_id,
			transaction_date: DateUtils.getDate(),
		});

		const month = this.bucket.plan.months;
		for (const number of this.bucket.whatsapp_numbers) {
			await DeviceService.addMonthToExpiry(number, month);
		}
		await this.bucket.save();
	}

	static async getPaymentRecords(phone_number: string) {
		const _payments = await PaymentDB.find({
			'bucket.whatsapp_numbers': phone_number,
		});

		const _subscriptions = await SubscriptionDB.find({
			'bucket.whatsapp_numbers': phone_number,
			subscription_status: {
				$in: [SUBSCRIPTION_STATUS.ACTIVE, SUBSCRIPTION_STATUS.HALTED, SUBSCRIPTION_STATUS.PENDING],
			},
		}).populate('plan bucket');

		const payments = _payments.map((payment) => ({
			id: payment._id,
			amount: payment.amount,
			transaction_date: DateUtils.getMoment(payment.transaction_date).format('DD/MM/YYYY'),
			order_id: payment.order_id,
			payment_id: payment.payment_id,
		}));

		const subscriptions = _subscriptions.map((subscription) => ({
			id: subscription._id,
			status: subscription.subscription_status,
			link: subscription.subscription_link,
			action_supported: subscription.bucket.admin_number === phone_number,
			canPause: subscription.subscription_status === SUBSCRIPTION_STATUS.ACTIVE,
			canResume: subscription.subscription_status === SUBSCRIPTION_STATUS.PAUSED,
			plan: subscription.plan.code,
			plan_price: subscription.plan.amount,
			transaction_date: DateUtils.getMoment(subscription.createdAt).format('DD/MM/YYYY'),
		}));

		return { subscriptions, payments };
	}

	static async pauseSubscription(id: Types.ObjectId, phone_number: string) {
		const subscription = await SubscriptionDB.findById(id).populate('bucket');
		if (!subscription) {
			throw new InternalError(INTERNAL_ERRORS.PAYMENT_ERROR.PAYMENT_NOT_FOUND);
		} else if (subscription.bucket.admin_number !== phone_number) {
			throw new InternalError(INTERNAL_ERRORS.PAYMENT_ERROR.ACCESS_DENIED);
		} else if (subscription.subscription_status !== SUBSCRIPTION_STATUS.ACTIVE) {
			throw new InternalError(INTERNAL_ERRORS.PAYMENT_ERROR.ACCESS_DENIED);
		}
		RazorpayProvider.subscription.pauseSubscription(subscription.subscription_id);
		subscription.subscription_status = SUBSCRIPTION_STATUS.PAUSED;
		subscription.save();
	}

	static async resumeSubscription(id: Types.ObjectId, phone_number: string) {
		const subscription = await SubscriptionDB.findById(id).populate('bucket');

		if (!subscription) {
			throw new InternalError(INTERNAL_ERRORS.PAYMENT_ERROR.PAYMENT_NOT_FOUND);
		} else if (subscription.bucket.admin_number !== phone_number) {
			throw new InternalError(INTERNAL_ERRORS.PAYMENT_ERROR.ACCESS_DENIED);
		} else if (subscription.subscription_status !== SUBSCRIPTION_STATUS.PAUSED) {
			throw new InternalError(INTERNAL_ERRORS.PAYMENT_ERROR.ACCESS_DENIED);
		}
		RazorpayProvider.subscription.resumeSubscription(subscription.subscription_id);
		subscription.subscription_status = SUBSCRIPTION_STATUS.ACTIVE;
		subscription.save();
	}
}
