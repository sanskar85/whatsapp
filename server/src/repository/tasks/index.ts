import mongoose, { Schema } from 'mongoose';
import { TASK_RESULT_TYPE, TASK_STATUS, TASK_TYPE } from '../../config/const';
import ITask from '../../types/tasks';

const schema = new mongoose.Schema<ITask>(
	{
		user: {
			type: Schema.Types.ObjectId,
			ref: 'User',
		},
		type: {
			type: String,
			enum: Object.keys(TASK_TYPE),
			required: true,
		},
		status: {
			type: String,
			enum: Object.keys(TASK_STATUS),
			default: TASK_STATUS.PENDING,
		},
		data_result_type: {
			type: String,
			enum: Object.keys(TASK_RESULT_TYPE),
			required: true,
		},
		data: String,
		description: String,
	},
	{ timestamps: { createdAt: true } }
);

const TaskDB = mongoose.model<ITask>('Task', schema);

export default TaskDB;
