import { Types } from 'mongoose';
import { TASK_RESULT_TYPE, TASK_STATUS, TASK_TYPE } from '../../config/const';
import InternalError, { INTERNAL_ERRORS } from '../../errors/internal-errors';
import TaskDB from '../../repository/tasks';
import { IUser } from '../../types/users';
import DateUtils from '../../utils/DateUtils';

export default class TaskService {
	private user: IUser;

	public constructor(user: IUser) {
		this.user = user;
	}

	async listTasks() {
		const tasks = await TaskDB.find({ user: this.user._id }).sort({ createdAt: -1 });
		return tasks.map((task) => ({
			id: task._id as string,
			type: task.type,
			description: task.description,
			status: task.status,
			data: task.data,
			data_result_type: task.data_result_type,
			createdAt: DateUtils.format(task.createdAt),
		}));
	}

	async createTask(
		type: TASK_TYPE,
		response_type: TASK_RESULT_TYPE,
		{ description }: { description?: string } = {}
	) {
		const task = await TaskDB.create({
			user: this.user,
			type,
			data_result_type: response_type,
			description,
		});
		return task._id as Types.ObjectId;
	}

	async markCompleted(id: Types.ObjectId, data?: string) {
		await TaskDB.updateOne(
			{
				_id: id,
			},
			{
				data,
				status: TASK_STATUS.COMPLETED,
			}
		);
	}

	async markFailed(id: Types.ObjectId) {
		await TaskDB.updateOne(
			{
				_id: id,
			},
			{
				status: TASK_STATUS.FAILED,
			}
		);
	}

	async getFile(id: Types.ObjectId) {
		const task = await TaskDB.findById(id);
		if (!task || ![TASK_RESULT_TYPE.CSV, TASK_RESULT_TYPE.VCF].includes(task.data_result_type)) {
			throw new InternalError(INTERNAL_ERRORS.COMMON_ERRORS.NOT_FOUND);
		}
		return { data: task.data, result_type: task.data_result_type, id: task._id };
	}

	async deleteTask(id: Types.ObjectId) {
		const task = await TaskDB.findById(id);
		if (!task) {
			throw new InternalError(INTERNAL_ERRORS.COMMON_ERRORS.NOT_FOUND);
		}
		await TaskDB.deleteOne({ _id: id });
		return (
			id +
			(task.data_result_type === TASK_RESULT_TYPE.VCF
				? '.vcf'
				: task.data_result_type === TASK_RESULT_TYPE.CSV
				? '.csv'
				: '')
		);
	}
}
