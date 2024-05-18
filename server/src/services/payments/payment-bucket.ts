import { Types } from 'mongoose';
import { SUBSCRIPTION_STATUS, TRANSACTION_STATUS } from '../../config/const';
import InternalError, { INTERNAL_ERRORS } from '../../errors/internal-errors';
import CouponDB from '../../repository/payments/coupon';
import PaymentDB from '../../repository/payments/payment';
import PaymentBucketDB from '../../repository/payments/payment-bucket';
import PlanDB from '../../repository/payments/plan';
import SubscriptionDB from '../../repository/payments/subscription';
import IPaymentBucket, {
	PaymentRecord,
	SubscriptionRecord,
} from '../../types/payment/payment-bucket';
import DateUtils from '../../utils/DateUtils';
import PaymentService from './payment';

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
			gstin: string;
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

	static async getPaymentRecords(phone: string) {
		const paymentRecords = await PaymentDB.aggregate([
			{
				$lookup: {
					from: PaymentBucketDB.collection.name, // Name of the OtherModel collection
					localField: 'bucket',
					foreignField: '_id',
					as: 'payment_bucket',
				},
			},
			{ $addFields: { payment_bucket: { $arrayElemAt: ['$payment_bucket', 0] } } },
			{ $addFields: { whatsapp_numbers: '$payment_bucket.whatsapp_numbers' } },
			{
				$match: {
					$and: [{ whatsapp_numbers: phone }, { payment_id: { $ne: null } }],
				},
			},
		]);

		const subscriptionRecords = await SubscriptionDB.aggregate([
			{
				$lookup: {
					from: PaymentBucketDB.collection.name, // Name of the OtherModel collection
					localField: 'bucket',
					foreignField: '_id',
					as: 'payment_bucket',
				},
			},
			{ $addFields: { payment_bucket: { $arrayElemAt: ['$payment_bucket', 0] } } },
			{ $addFields: { whatsapp_numbers: '$payment_bucket.whatsapp_numbers' } },
			{
				$match: {
					$and: [{ whatsapp_numbers: phone }],
				},
			},
			{
				$lookup: {
					from: PlanDB.collection.name, // Name of the OtherModel collection
					localField: 'plan',
					foreignField: '_id',
					as: 'plan',
				},
			},
			{ $addFields: { plan: { $arrayElemAt: ['$plan', 0] } } },
		]);

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

	static async getAllPaymentRecords() {
		const paymentRecords = await PaymentDB.aggregate([
			{
				$lookup: {
					from: PaymentBucketDB.collection.name, // Name of the OtherModel collection
					localField: 'bucket',
					foreignField: '_id',
					as: 'payment_bucket',
				},
			},
			{ $addFields: { bucket: { $arrayElemAt: ['$payment_bucket', 0] } } },
			{
				$match: {
					bucket: { $exists: true },
				},
			},
			{
				$lookup: {
					from: PlanDB.collection.name, // Name of the OtherModel collection
					localField: 'bucket.plan',
					foreignField: '_id',
					as: 'plan',
				},
			},
			{
				$lookup: {
					from: CouponDB.collection.name, // Name of the OtherModel collection
					localField: 'bucket.discount_coupon',
					foreignField: '_id',
					as: 'discount_coupon',
				},
			},
			{ $addFields: { plan: { $arrayElemAt: ['$plan', 0] } } },
			{ $addFields: { discount_coupon: { $arrayElemAt: ['$discount_coupon', 0] } } },
			{ $addFields: { whatsapp_numbers: '$bucket.whatsapp_numbers' } },
			{ $addFields: { name: '$bucket.name' } },
			{ $addFields: { phone_number: '$bucket.phone_number' } },
			{ $addFields: { email: '$bucket.email' } },
			{ $addFields: { admin_number: '$bucket.admin_number' } },
			{ $addFields: { billing_address: '$bucket.billing_address' } },
			{ $addFields: { gross_amount: '$bucket.gross_amount' } },
			{ $addFields: { discount: '$bucket.discount' } },
			{ $addFields: { total_discount: '$bucket.total_discount' } },
			{ $addFields: { tax: '$bucket.tax' } },
			{ $addFields: { transaction_status: '$bucket.transaction_status' } },
			{ $addFields: { plan: '$plan.code' } },
			{ $addFields: { discount_coupon: '$discount_coupon.code' } },
			{
				$sort: {
					transaction_status: 1,
					transaction_date: 1,
				},
			},
			{
				$project: {
					_id: 0,
					whatsapp_numbers: 1,
					name: 1,
					phone_number: 1,
					email: 1,
					admin_number: 1,
					billing_address: 1,
					gross_amount: 1,
					discount: 1,
					total_discount: 1,
					tax: 1,
					total_amount: '$amount',
					transaction_status: 1,
					transaction_date: 1,
					order_id: 1,
					payment_id: 1,
					invoice_id: 1,
					plan: 1,
					discount_coupon: 1,
				},
			},
		]);
		return paymentRecords as {
			plan: string;
			whatsapp_numbers: string[];
			name: string;
			phone_number: string;
			email: string;
			admin_number: string;
			billing_address: {
				street: string;
				city: string;
				district: string;
				state: string;
				country: string;
				pincode: string;
				gstin: string;
			};
			gross_amount: number;
			discount: number;
			discount_coupon: string;
			tax: number;
			total_amount: number;
			transaction_status: string;
			transaction_date: string;
			order_id: string;
			payment_id: string;
			invoice_id: string;
		}[];
	}
}
