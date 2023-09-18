import { Document } from 'mongoose';
import { IUser } from '../users';

export default interface IPayment extends Document {
	user: IUser;
	total_amount: number;
	expires_at: Date;
	reference_id: string;
	transaction_status: WALLET_TRANSACTION_STATUS;
	transaction_date: Date;
}
