import { Document } from 'mongoose';
import { IUser } from '../users';

export default interface IShortner extends Document {
	user: IUser;
	title: string;
	key: string;
	link: string;
	qrString: string;
}
