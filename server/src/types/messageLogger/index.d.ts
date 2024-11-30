import { Document } from 'mongoose';
import { IUser } from '../users';

export default interface IMessageLogger extends Document {
	user: IUser;

	sheetId: string;
	timestamp: string;
	from: string;
	to: string;
	savedName: string;
	displayName: string;
	groupName: string;
	message: string;
	isCaption: string;
	link: string;
}
