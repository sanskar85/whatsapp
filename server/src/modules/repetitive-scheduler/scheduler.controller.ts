import { NextFunction, Request, Response } from 'express';
import { SOCKET_RESPONSES, TASK_RESULT_TYPE, TASK_TYPE } from '../../config/const';
import APIError, { API_ERRORS } from '../../errors/api-errors';
import InternalError, { INTERNAL_ERRORS } from '../../errors/internal-errors';
import { WhatsappProvider } from '../../provider/whatsapp_provider';
import GroupMergeService from '../../services/merged-groups';
import RepetitiveSchedulerService from '../../services/repetitive-scheduler';
import TaskService from '../../services/task';
import UploadService from '../../services/uploads';
import CSVParser from '../../utils/CSVParser';
import { idValidator, Respond, RespondCSV } from '../../utils/ExpressUtils';
import { FileUtils } from '../../utils/files';
import WhatsappUtils from '../../utils/WhatsappUtils';
import { CreateSchedulerValidationResult } from './scheduler.validator';

async function allSchedulers(req: Request, res: Response, next: NextFunction) {
	const service = new RepetitiveSchedulerService(req.locals.user.getUser());
	const schedulers = await service.allScheduler();

	return Respond({
		res,
		status: 200,
		data: {
			schedulers: schedulers.map((e) => ({
				...e,
				attachments: e.attachments.map((attachments) => attachments.id),
				shared_contact_cards: e.shared_contact_cards.map((cards) => cards._id),
			})),
		},
	});
}

async function schedulerById(req: Request, res: Response, next: NextFunction) {
	const service = new RepetitiveSchedulerService(req.locals.user.getUser());

	try {
		const scheduler = await service.schedulerByID(req.locals.id);

		return Respond({
			res,
			status: 200,
			data: {
				scheduler: {
					...scheduler,
					attachments: scheduler.attachments.map((attachments) => attachments.id),
				},
			},
		});
	} catch (err) {
		return next(new APIError(API_ERRORS.COMMON_ERRORS.NOT_FOUND));
	}
}

async function createScheduler(req: Request, res: Response, next: NextFunction) {
	const { client_id } = req.locals;
	const data = req.locals.data as CreateSchedulerValidationResult;

	const whatsapp = WhatsappProvider.clientByClientID(client_id);
	if (!whatsapp) {
		return next(new APIError(API_ERRORS.USER_ERRORS.SESSION_INVALIDATED));
	}
	const whatsappUtils = new WhatsappUtils(whatsapp);
	if (!whatsapp.isReady()) {
		return next(new APIError(API_ERRORS.USER_ERRORS.SESSION_INVALIDATED));
	}

	const taskService = new TaskService(req.locals.user.getUser());
	const task_id = await taskService.createTask(TASK_TYPE.SCHEDULE_CAMPAIGN, TASK_RESULT_TYPE.NONE, {
		description: data.title,
	});

	Respond({
		res,
		status: 201,
	});

	const schedulerService = new RepetitiveSchedulerService(req.locals.user.getUser());
	const [_, media_attachments] = await new UploadService(req.locals.user.getUser()).listAttachments(
		data.attachments
	);

	const type = data.recipient_from;
	const recipient_data = data.recipient_data as string[];
	const uploadService = new UploadService(req.locals.user.getUser());
	const groupMergeService = new GroupMergeService(req.locals.user.getUser());

	let numbers: string[] = [];

	if (type === 'NUMBERS') {
		numbers = await whatsappUtils.getNumberIds(recipient_data);
	} else if (type === 'CSV') {
		const csv = await uploadService.getCSVFile(
			idValidator(recipient_data as unknown as string)[1]!
		);
		if (!csv) {
			return taskService.markFailed(task_id);
		}
		const parsed_csv = await FileUtils.readCSV(csv);
		if (!parsed_csv) {
			return taskService.markFailed(task_id);
		}

		const promises = parsed_csv.map(async (row) => {
			const numberWithId = await whatsappUtils.getNumberWithId(row.number);
			if (!numberWithId) {
				return; // Skips to the next iteration
			}
			numbers.push(numberWithId.numberId);
		});

		await Promise.all(promises);
	} else if (type === 'GROUP_INDIVIDUAL') {
		try {
			const _group_ids = await groupMergeService.extractWhatsappGroupIds(recipient_data);
			numbers = (
				await Promise.all(_group_ids.map((id) => whatsappUtils.getParticipantsChatByGroup(id)))
			).flat();
		} catch (err) {
			return taskService.markFailed(task_id);
		}
	} else if (type === 'GROUP') {
		try {
			const _group_ids = await groupMergeService.extractWhatsappGroupIds(recipient_data);
			numbers = await whatsappUtils.getChatIds(_group_ids);
		} catch (err) {
			return taskService.markFailed(task_id);
		}
	} else if (type === 'LABEL') {
		try {
			numbers = (
				await Promise.all(recipient_data.map((id) => whatsappUtils.getChatIdsByLabel(id)))
			).flat();
		} catch (err) {
			return taskService.markFailed(task_id);
		}
	}

	try {
		const scheduler = schedulerService.createScheduler({
			...data,
			recipients: numbers,
			attachments: media_attachments,
		});

		taskService.markCompleted(task_id, scheduler.id.toString());
		whatsapp.sendToClient(SOCKET_RESPONSES.TASK_COMPLETED, task_id.toString());
	} catch (err) {
		return taskService.markFailed(task_id);
	}
}

async function updateScheduler(req: Request, res: Response, next: NextFunction) {
	const { client_id } = req.locals;
	const data = req.locals.data as CreateSchedulerValidationResult;
	const schedulerService = new RepetitiveSchedulerService(req.locals.user.getUser());
	const [_, media_attachments] = await new UploadService(req.locals.user.getUser()).listAttachments(
		data.attachments
	);

	const whatsapp = WhatsappProvider.clientByClientID(client_id);
	if (!whatsapp) {
		return next(new APIError(API_ERRORS.USER_ERRORS.SESSION_INVALIDATED));
	}
	const whatsappUtils = new WhatsappUtils(whatsapp);
	if (!whatsapp.isReady()) {
		return next(new APIError(API_ERRORS.USER_ERRORS.SESSION_INVALIDATED));
	}

	const taskService = new TaskService(req.locals.user.getUser());
	const task_id = await taskService.createTask(TASK_TYPE.SCHEDULE_CAMPAIGN, TASK_RESULT_TYPE.NONE, {
		description: `Update scheduler ${req.locals.id}`,
	});

	Respond({
		res,
		status: 200,
	});

	const type = data.recipient_from;
	const recipient_data = data.recipient_data as string[];
	const uploadService = new UploadService(req.locals.user.getUser());
	const groupMergeService = new GroupMergeService(req.locals.user.getUser());

	let numbers: string[] = [];

	if (type === 'NUMBERS') {
		numbers = await whatsappUtils.getNumberIds(recipient_data);
	} else if (type === 'CSV') {
		const csv = await uploadService.getCSVFile(
			idValidator(recipient_data as unknown as string)[1]!
		);
		if (!csv) {
			return taskService.markFailed(task_id);
		}
		const parsed_csv = await FileUtils.readCSV(csv);
		if (!parsed_csv) {
			return taskService.markFailed(task_id);
		}

		const promises = parsed_csv.map(async (row) => {
			const numberWithId = await whatsappUtils.getNumberWithId(row.number);
			if (!numberWithId) {
				return; // Skips to the next iteration
			}
			numbers.push(numberWithId.numberId);
		});

		await Promise.all(promises);
	} else if (type === 'GROUP_INDIVIDUAL') {
		try {
			const _group_ids = await groupMergeService.extractWhatsappGroupIds(recipient_data);
			numbers = (
				await Promise.all(_group_ids.map((id) => whatsappUtils.getParticipantsChatByGroup(id)))
			).flat();
		} catch (err) {
			return taskService.markFailed(task_id);
		}
	} else if (type === 'GROUP') {
		try {
			const _group_ids = await groupMergeService.extractWhatsappGroupIds(recipient_data);
			numbers = await whatsappUtils.getChatIds(_group_ids);
		} catch (err) {
			return taskService.markFailed(task_id);
		}
	} else if (type === 'LABEL') {
		try {
			numbers = (
				await Promise.all(recipient_data.map((id) => whatsappUtils.getChatIdsByLabel(id)))
			).flat();
		} catch (err) {
			return taskService.markFailed(task_id);
		}
	}

	try {
		const scheduler = await schedulerService.modifyScheduler(req.locals.id, {
			...data,
			recipients: numbers,
			attachments: media_attachments,
		});

		taskService.markCompleted(task_id, scheduler.id.toString());
		whatsapp.sendToClient(SOCKET_RESPONSES.TASK_COMPLETED, task_id.toString());

		return Respond({
			res,
			status: 200,
			data: {
				scheduler: {
					...scheduler,
					attachments: scheduler.attachments.map((attachments) => attachments.id),
					shared_contact_cards: scheduler.shared_contact_cards.map((cards) => cards._id),
				},
			},
		});
	} catch (err) {
		return taskService.markFailed(task_id);
	}
}

async function toggleActive(req: Request, res: Response, next: NextFunction) {
	try {
		const schedulerService = new RepetitiveSchedulerService(req.locals.user.getUser());

		const scheduler = await schedulerService.toggleActive(req.locals.id);

		return Respond({
			res,
			status: 200,
			data: {
				scheduler: scheduler,
			},
		});
	} catch (err) {
		if (err instanceof InternalError) {
			if (err.isSameInstanceof(INTERNAL_ERRORS.COMMON_ERRORS.NOT_FOUND)) {
				return next(new APIError(API_ERRORS.COMMON_ERRORS.NOT_FOUND));
			}
		}
		return next(new APIError(API_ERRORS.COMMON_ERRORS.INTERNAL_SERVER_ERROR));
	}
}

async function reschedule(req: Request, res: Response, next: NextFunction) {
	try {
		const schedulerService = new RepetitiveSchedulerService(req.locals.user.getUser());

		await schedulerService.scheduleMessagesByID(req.locals.id);

		return Respond({
			res,
			status: 200,
			data: {},
		});
	} catch (err) {
		if (err instanceof InternalError) {
			if (err.isSameInstanceof(INTERNAL_ERRORS.COMMON_ERRORS.NOT_FOUND)) {
				return next(new APIError(API_ERRORS.COMMON_ERRORS.NOT_FOUND));
			}
		}
		return next(new APIError(API_ERRORS.COMMON_ERRORS.INTERNAL_SERVER_ERROR));
	}
}

async function deleteScheduler(req: Request, res: Response, next: NextFunction) {
	const schedulerService = new RepetitiveSchedulerService(req.locals.user.getUser());
	schedulerService.delete(req.locals.id);

	return Respond({
		res,
		status: 200,
		data: {},
	});
}

async function downloadSchedulerReport(req: Request, res: Response, next: NextFunction) {
	try {
		const schedulerService = new RepetitiveSchedulerService(req.locals.user.getUser());
		const reports = await schedulerService.generateReport(req.locals.id);

		return RespondCSV({
			res,
			filename: 'Scheduler Reports',
			data: CSVParser.exportSchedulerReport(reports),
		});
	} catch (err) {
		next(new APIError(API_ERRORS.COMMON_ERRORS.NOT_FOUND));
	}
}

const schedulerController = {
	allSchedulers,
	deleteScheduler,
	updateScheduler,
	createScheduler,
	toggleActive,
	schedulerById,
	downloadSchedulerReport,
	reschedule,
};

export default schedulerController;
