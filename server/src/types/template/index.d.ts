import { Document } from 'mongoose';
import { IUser } from '../users';

export default interface ITemplate extends Document {
	user: IUser;
	name: string;
	message: string;
	poll: {
		title: string;
		options: string[];
		isMultiSelect: boolean;
	};
	type: 'MESSAGE' | 'POLL';
}
