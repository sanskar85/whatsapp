import { Document } from 'mongoose';
import IContactCard from '../contact-cards';
import IUpload from '../uploads';
import { IUser } from '../users';

export default interface IScheduler extends Document {
	user: IUser;

	csv: IUpload;

	message: string;
	attachments: IUpload[];
	shared_contact_cards: IContactCard[];
	polls: {
		title: string;
		options: string[];
		isMultiSelect: boolean;
	}[];

	active: boolean;

	title: string;
	description: string;
	start_from: string;
	end_at: string;
}
