import { Document } from 'mongoose';
import IUser from './User';

export default interface IUserPreferences extends Document {
	user: IUser;

	isMessagesLogEnabled: boolean;
	messageLogSheetId: string;

	individual_text_message: boolean;
	individual_media_message: boolean;
	group_text_message: boolean;
	group_media_message: boolean;
}
