import { Document } from 'mongoose';
import { TASK_RESULT_TYPE, TASK_STATUS, TASK_TYPE } from '../../config/const';
import { IUser } from '../users';

export default interface ITask extends Document {
	user: IUser;
	type: TASK_TYPE;
	status: TASK_STATUS;
	data: string;
	data_result_type: TASK_RESULT_TYPE;
	description: string;
	createdAt: Date;
}
