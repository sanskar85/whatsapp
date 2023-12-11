import { Types } from 'mongoose';
import { SUBSCRIPTION_STATUS, TRANSACTION_STATUS } from '../../../config/const';
import InternalError, { INTERNAL_ERRORS } from '../../../errors/internal-errors';
import IPaymentBucket from '../../../types/payment/payment-bucket';
import { IUser } from '../../../types/user';
import DateUtils from '../../../utils/DateUtils';
import CouponDB from '../../repository/payments/coupon';
import PaymentDB from '../../repository/payments/payment';
import PaymentBucketDB from '../../repository/payments/payment-bucket';
import PlanDB from '../../repository/payments/plan';
import SubscriptionDB from '../../repository/payments/subscription';
import PaymentService from './payment';

type PaymentRecord = {
	type: 'payment';
	id: string;
	date: string;
	amount: number;
};

type SubscriptionRecord = {
	type: 'subscription';
	id: string;
	plan: string;
	isActive: boolean;
	isPaused: boolean;
};

export default class PaymentBucketService {
	private bucket: IPaymentBucket;
	private paymentService: PaymentService;

	constructor(bucket: IPaymentBucket) {
		this.bucket = bucket;
		this.paymentService = new PaymentService(bucket);
	}

	public static async createBucket(data: {
		plan_name: string;
		phone_number: string;
		name: string;
		email: string;
		type: 'subscription' | 'one-time';
		admin_number: string;
		whatsapp_numbers: string[];
		billing_address: {
			street: string;
			city: string;
			district: string;
			state: string;
			country: string;
			pincode: string;
		};
	}) {
		const plan = await PlanDB.findOne({ code: data.plan_name });
		if (!plan) {
			throw new InternalError(INTERNAL_ERRORS.COMMON_ERRORS.NOT_FOUND);
		}
		const bucket = await PaymentBucketDB.create({ ...data, plan, gross_amount: plan.amount });
		return new PaymentBucketService(bucket);
	}

	static async getBucketById(id: Types.ObjectId) {
		const bucket = await PaymentBucketDB.findById(id).populate('plan discount_coupon');
		if (!bucket) {
			throw new InternalError(INTERNAL_ERRORS.PAYMENT_ERROR.PAYMENT_NOT_FOUND);
		}
		return new PaymentBucketService(bucket);
	}
	static async getBucketBySubscription(id: string) {
		const subscription = await SubscriptionDB.findOne({ subscription_id: id }).populate(
			'bucket bucket.plan bucket.discount_coupon'
		);
		if (!subscription) {
			throw new InternalError(INTERNAL_ERRORS.PAYMENT_ERROR.PAYMENT_NOT_FOUND);
		}
		return new PaymentBucketService(subscription.bucket);
	}
	static async getBucketByOrderID(id: string) {
		const subscription = await PaymentDB.findOne({ order_id: id }).populate(
			'bucket bucket.plan bucket.discount_coupon'
		);
		if (!subscription) {
			throw new InternalError(INTERNAL_ERRORS.PAYMENT_ERROR.PAYMENT_NOT_FOUND);
		}
		return new PaymentBucketService(subscription.bucket);
	}

	getBucket() {
		return this.bucket;
	}
	getPaymentService() {
		return this.paymentService;
	}

	getTransactionDetails() {
		return {
			bucket_id: this.bucket._id,
			type: this.bucket.type,
			gross_amount: this.bucket.gross_amount,
			tax: this.bucket.tax,
			discount: this.bucket.discount,
			total_amount: this.bucket.total_amount,
			status: this.bucket.transaction_status,
		};
	}

	async generatePaymentLink() {
		if (this.bucket.type === 'one-time') {
			const transactionDetails = await this.paymentService.initializeOneTimePayment();
			return {
				bucket_id: this.bucket._id,
				transaction_id: transactionDetails.transaction_id,
				order_id: transactionDetails.order_id,
				razorpay_options: transactionDetails.razorpay_options,
			};
		} else {
			const transactionDetails = await this.paymentService.createSubscription();
			return {
				bucket_id: this.bucket._id,
				transaction_id: transactionDetails.transaction_id,
				subscription_id: transactionDetails.subscription_id,
				payment_link: transactionDetails.payment_link,
			};
		}
	}

	async applyCoupon(coupon: string) {
		const couponDetails = await CouponDB.findOne({ code: coupon });

		if (couponDetails === null) {
			throw new InternalError(INTERNAL_ERRORS.PAYMENT_ERROR.COUPON_NOT_FOUND);
		}

		if (this.bucket.discount_coupon) {
			await this.removeCoupon();
		}

		const applied_by_user = await PaymentBucketDB.count({
			discount_coupon: couponDetails._id,
			transaction_status: TRANSACTION_STATUS.SUCCESS,
			whatsapp_numbers: { $in: this.bucket.whatsapp_numbers },
		});

		if (applied_by_user >= couponDetails.count_per_user) {
			throw new InternalError(INTERNAL_ERRORS.PAYMENT_ERROR.COUPON_USAGE_EXCEEDED);
		}

		this.bucket.discount = couponDetails.discount_percentage * this.bucket.gross_amount;
		couponDetails.available_coupons -= 1;
		this.bucket.discount_coupon = couponDetails;

		await this.bucket.save();
		await couponDetails.save();
	}

	async removeCoupon() {
		if (this.bucket.discount_coupon === null) {
			return;
		}
		this.bucket.discount_coupon.available_coupons += 1;
		await this.bucket.discount_coupon.save();

		this.bucket.discount = 0;
		this.bucket.discount_coupon = null;
		await this.bucket.save();
	}

	static async getPaymentRecords(user: IUser) {
		const paymentRecords = await PaymentDB.find({
			'bucket.user': user,
			payment_id: { $ne: null },
		});

		const subscriptionRecords = await SubscriptionDB.find({
			'bucket.user': user,
		}).populate('plan');

		const records: (PaymentRecord | SubscriptionRecord)[] = [];
		const _paymentRecords = paymentRecords.map(
			(paymentRecord): PaymentRecord => ({
				type: 'payment',
				id: paymentRecord._id.toString(),
				date: DateUtils.getMoment(paymentRecord.transaction_date).format('DD MMM yyyy'),
				amount: paymentRecord.amount,
			})
		);

		const _subscriptionRecords = subscriptionRecords.map(
			(paymentRecord): SubscriptionRecord => ({
				type: 'subscription',
				id: paymentRecord._id.toString(),
				plan: paymentRecord.plan.code,
				isActive: paymentRecord.subscription_status === SUBSCRIPTION_STATUS.ACTIVE,
				isPaused: paymentRecord.subscription_status === SUBSCRIPTION_STATUS.PAUSED,
			})
		);

		records.push(..._subscriptionRecords);
		records.push(..._paymentRecords);
		return records;
	}
}
