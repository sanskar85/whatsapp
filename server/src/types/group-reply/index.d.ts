import { Document } from 'mongoose';
import IMergedGroup from '../merged-group';
import { IUser } from '../users';
export default interface IGroupReply extends Document {
	user: IUser;
	from: string;
	mergedGroup: IMergedGroup;
	group_name: string;
	unique_id: string;
	createdAt: Date;
	updatedAt: Date;
}
