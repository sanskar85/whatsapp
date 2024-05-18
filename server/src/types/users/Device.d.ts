import { Document, Types } from 'mongoose';

export default interface IDevice extends Document {
	user: Types.ObjectId;
	phone: string;
	name: string;
	client_id: string;
	userType: 'BUSINESS' | 'PERSONAL';
	subscription_expiry: Date;
	business_details: {
		description: string;
		email: string;
		websites: string[];
		latitude: number;
		longitude: number;
		address: string;
	};
	createdAt: Date;
	revoke_at: Date;
}
