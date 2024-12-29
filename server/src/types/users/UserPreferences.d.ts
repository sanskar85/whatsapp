import { Document } from 'mongoose';
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

	messageStarRules: {
		individual_outgoing_messages: boolean;
		individual_incoming_messages: boolean;
		group_outgoing_messages: boolean;
		group_incoming_messages: boolean;
	};
}
