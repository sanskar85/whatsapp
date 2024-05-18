import { NextFunction, Request, Response } from 'express';
import { TASK_PATH, TASK_RESULT_TYPE } from '../../config/const';
import APIError, { API_ERRORS } from '../../errors/api-errors';
import TaskService from '../../services/task';
import { Respond, RespondCSV, RespondVCF } from '../../utils/ExpressUtils';
import { FileUtils } from '../../utils/files';

async function listTasks(req: Request, res: Response, next: NextFunction) {
	const tasks = await new TaskService(req.locals.user.getUser()).listTasks();
	return Respond({
		res,
		status: 200,
		data: {
			tasks,
		},
	});
}

async function downloadTask(req: Request, res: Response, next: NextFunction) {
	try {
		const { data, result_type, id } = await new TaskService(req.locals.user.getUser()).getFile(
			req.locals.id
		);

		const file_path =
			__basedir + TASK_PATH + id + (result_type === TASK_RESULT_TYPE.VCF ? '.vcf' : '.csv');

		if (result_type === TASK_RESULT_TYPE.CSV) {
			return RespondCSV({
				res,
				filename: data.substring(0, data.length - 4),
				data: await FileUtils.readFile(file_path),
			});
		} else if (result_type === TASK_RESULT_TYPE.VCF) {
			return RespondVCF({
				res,
				filename: data.substring(0, data.length - 4),
				data: await FileUtils.readFile(file_path),
			});
		}

		return next(new APIError(API_ERRORS.COMMON_ERRORS.NOT_FOUND));
	} catch (err) {
		return next(new APIError(API_ERRORS.COMMON_ERRORS.NOT_FOUND));
	}
}

async function deleteTask(req: Request, res: Response, next: NextFunction) {
	try {
		const filename = await new TaskService(req.locals.user.getUser()).deleteTask(req.locals.id);

		const file_path = __basedir + TASK_PATH + filename;
		FileUtils.deleteFile(file_path);
		return Respond({
			res,
			status: 200,
		});
	} catch (err) {
		return next(new APIError(API_ERRORS.COMMON_ERRORS.NOT_FOUND));
	}
}

const ReportController = {
	downloadTask,
	listTasks,
	deleteTask,
};

export default ReportController;
