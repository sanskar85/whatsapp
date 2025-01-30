import { Document } from 'mongoose';

export default interface IBusinessLead extends Document {
	number: string;
	country: string;
	public_name: string;
	isEnterprise: boolean;
	description: string;
	email: string;
	websites: string[];
	latitude: number;
	longitude: number;
	address: string;
	isGroupContact: boolean;
	group_details?: {
		group_id: string;
		group_name: string;
		user_type: 'CREATOR' | 'ADMIN' | 'USER';
		description?: string;
		participants?: number;
		canAddParticipants?: string;
		canSendMessages?: string;
	};
}
