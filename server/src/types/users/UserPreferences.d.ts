import { Document } from 'mongoose';
import IUser from './User';

export default interface IUserPreferences extends Document {
	user: IUser;

	isMessagesLogEnabled: boolean;
	messageLogSheetId: string;
}
