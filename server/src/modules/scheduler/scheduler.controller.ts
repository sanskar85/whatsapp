import { NextFunction, Request, Response } from 'express';
import APIError, { API_ERRORS } from '../../errors/api-errors';
import InternalError, { INTERNAL_ERRORS } from '../../errors/internal-errors';
import SchedulerService from '../../services/scheduler';
import UploadService from '../../services/uploads';
import CSVParser from '../../utils/CSVParser';
import { Respond, RespondCSV } from '../../utils/ExpressUtils';
import { CreateSchedulerValidationResult } from './scheduler.validator';

async function allSchedulers(req: Request, res: Response, next: NextFunction) {
	const service = new SchedulerService(req.locals.user.getUser());
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
	const service = new SchedulerService(req.locals.user.getUser());

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
	const data = req.locals.data as CreateSchedulerValidationResult;

	const schedulerService = new SchedulerService(req.locals.user.getUser());
	const [_, media_attachments] = await new UploadService(req.locals.user.getUser()).listAttachments(
		data.attachments
	);

	const scheduler = schedulerService.createScheduler({
		...data,
		attachments: media_attachments,
	});

	return Respond({
		res,
		status: 201,
		data: {
			scheduler: {
				...scheduler,
				attachments: scheduler.attachments.map((attachments) => attachments.id),
			},
		},
	});
}

async function updateScheduler(req: Request, res: Response, next: NextFunction) {
	const data = req.locals.data as CreateSchedulerValidationResult;
	const schedulerService = new SchedulerService(req.locals.user.getUser());
	const [_, media_attachments] = await new UploadService(req.locals.user.getUser()).listAttachments(
		data.attachments
	);

	try {
		const bot = await schedulerService.modifyScheduler(req.locals.id, {
			...data,
			attachments: media_attachments,
		});

		return Respond({
			res,
			status: 200,
			data: {
				bot: {
					...bot,
					attachments: bot.attachments.map((attachments) => attachments.id),
					shared_contact_cards: bot.shared_contact_cards.map((cards) => cards._id),
				},
			},
		});
	} catch (err) {
		return next(new APIError(API_ERRORS.COMMON_ERRORS.NOT_FOUND));
	}
}

async function toggleActive(req: Request, res: Response, next: NextFunction) {
	try {
		const schedulerService = new SchedulerService(req.locals.user.getUser());

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
		const schedulerService = new SchedulerService(req.locals.user.getUser());

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
	const schedulerService = new SchedulerService(req.locals.user.getUser());
	schedulerService.deleteBot(req.locals.id);

	return Respond({
		res,
		status: 200,
		data: {},
	});
}

async function downloadSchedulerReport(req: Request, res: Response, next: NextFunction) {
	try {
		const schedulerService = new SchedulerService(req.locals.user.getUser());
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

const BotController = {
	allSchedulers,
	deleteScheduler,
	updateScheduler,
	createScheduler,
	toggleActive,
	schedulerById,
	downloadSchedulerReport,
	reschedule,
};

export default BotController;
