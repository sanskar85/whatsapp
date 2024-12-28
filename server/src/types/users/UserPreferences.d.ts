import { Document, Types } from 'mongoose';
import IUser from './User';

export default interface IUserPreferences extends Document {
	user: IUser;

	isLoggerEnabled: boolean;

	messageLogSheetId: string;

	messageLogRules: {
		[key: string]: {
			id: string;
			name: string;
			saved: boolean;
			unsaved: boolean;
			include: string[];
			exclude: string[];
			loggers: string[];
		};
	};

	messageModerationRules: {
		[key: string]: {
			merged_groups: Types.ObjectId[];
			groups: string[];
			file_types: string[];
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
	};

	messageStarRules: {
		individual_outgoing_messages: boolean;
		individual_incoming_messages: boolean;
		group_outgoing_messages: boolean;
		group_incoming_messages: boolean;
	};
}
