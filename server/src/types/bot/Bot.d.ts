import { Document } from 'mongoose';
import { BOT_TRIGGER_OPTIONS } from '../../config/const';
import IContactCard from '../contact-cards';
import IPolls from '../polls';
import IUpload from '../uploads';
import { IUser } from '../users';

export default interface IBot extends Document {
	user: IUser;

	recipient: {
		saved: boolean;
		unsaved: boolean;
		include: string[];
		exclude: string[];
	};

	trigger: string[];
	trigger_gap_seconds: number;
	response_delay_seconds: number;

	options: BOT_TRIGGER_OPTIONS;

	startAt: string;
	endAt: string;

	random_string: boolean;
	message: string;
	attachments: IUpload[];
	shared_contact_cards: IContactCard[];
	polls: {
		title: string;
		options: string[];
		isMultiSelect: boolean;
	}[];
	forward: {
		number: string;
		message: string;
	};
	allowed_country_codes: string[];
	group_respond: boolean;
	nurturing: {
		random_string: boolean;
		message: string;
		after: number;
		start_from: string;
		end_at: string;
		attachments?: IUpload[];
		shared_contact_cards?: IContactCard[];
		polls?: IPolls[];
	}[];
	active: boolean;
}
