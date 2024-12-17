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

	// individual_text_message: boolean;
	// individual_media_message: boolean;
	// group_text_message: boolean;
	// group_media_message: boolean;

	// isMessageStarEnabled: boolean;
}
