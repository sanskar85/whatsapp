import { Document, Schema } from 'mongoose';
import IContactCard from '../contact-cards';
import IUpload from '../uploads';
import { IUser } from '../users';

export default interface IRepetitiveScheduler extends Document {
	user: IUser;

	recipients: string[];

	recipient_from: string;
	recipient_data: Schema.Types.Mixed;

	scheduling_index: number;

	message: string;
	attachments: IUpload[];
	shared_contact_cards: IContactCard[];
	polls: {
		title: string;
		options: string[];
		isMultiSelect: boolean;
	}[];

	active: boolean;
	random_string: boolean;

	title: string;
	description: string;
	dates: string[];

	daily_count: number;

	start_time: string;
	end_time: string;
}
