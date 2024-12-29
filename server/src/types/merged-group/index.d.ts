import { Document } from 'mongoose';
import { BOT_TRIGGER_OPTIONS } from '../../config/const';
import IContactCard from '../contact-cards';
import IPolls from '../polls';
import IUpload from '../uploads';
import { IUser } from '../users';

export default interface IMergedGroup extends Document {
	user: IUser;
	name: string;
	groups: string[];
	group_reply_saved: {
		text: string;
		attachments?: IUpload[];
		shared_contact_cards?: IContactCard[];
		polls?: IPolls[];
	}[];
	group_reply_unsaved: {
		text: string;
		attachments?: IUpload[];
		shared_contact_cards?: IContactCard[];
		polls?: IPolls[];
	}[];
	private_reply_saved: {
		text: string;
		attachments?: IUpload[];
		shared_contact_cards?: IContactCard[];
		polls?: IPolls[];
	}[];
	private_reply_unsaved: {
		text: string;
		attachments?: IUpload[];
		shared_contact_cards?: IContactCard[];
		polls?: IPolls[];
	}[];
	allowed_country_codes: string[];
	restricted_numbers: IUpload[];
	reply_business_only: boolean;
	random_string: boolean;
	active: boolean;
	min_delay: number;
	max_delay: number;
	start_time: string;
	end_time: string;
	canSendAdmin: boolean;
	multiple_responses: boolean;
	triggers: string[];
	options: BOT_TRIGGER_OPTIONS;
	forward: {
		number: string;
		message: string;
	};
	moderation_rules: {
		file_types: string[];
		group_rule: {
			message: string;
			shared_contact_cards: Types.ObjectId[];
			attachments: Types.ObjectId[];
			polls: {
				title: string;
				options: string[];
				isMultiSelect: boolean;
			}[];
		};
		admin_rule: {
			message: string;
			shared_contact_cards: Types.ObjectId[];
			attachments: Types.ObjectId[];
			polls: {
				title: string;
				options: string[];
				isMultiSelect: boolean;
			}[];
		};
		creator_rule: {
			message: string;
			shared_contact_cards: Types.ObjectId[];
			attachments: Types.ObjectId[];
			polls: {
				title: string;
				options: string[];
				isMultiSelect: boolean;
			}[];
		};
	};
}
