import { Document } from 'mongoose';
import { IUser } from '../users';
export default interface IVoteResponse extends Document {
	user: IUser;

	title: string;
	options: string[];
	isMultiSelect: boolean;

	chat_id: string;

	voter_number: string;
	voter_name: string;
	group_name: string;

	selected_option: string[];

	voted_at: Date;
}
