import { Document } from 'mongoose';
import IPlan from './plan';
import { TRANSACTION_STATUS } from '../../config/const';

export default interface IPaymentBucket extends Document {
	phone_number: string;
	name: string;
	email: string;
	admin_number: string;
	whatsapp_numbers: string[];
	plan: IPlan;
	billing_address: {
		street: string;
		city: string;
		district: string;
		state: string;
		country: string;
		pincode: string;
	};

	transaction_status: TRANSACTION_STATUS;

	type: 'subscription' | 'one-time';

	gross_amount: number;
	discount_coupon: ICoupon;
	discount: number;
	total_amount: number;
	tax: number;
}
