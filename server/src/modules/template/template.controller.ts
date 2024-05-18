import { NextFunction, Request, Response } from 'express';
import APIError, { API_ERRORS } from '../../errors/api-errors';
import InternalError, { INTERNAL_ERRORS } from '../../errors/internal-errors';
import { TemplateService } from '../../services';
import { Respond } from '../../utils/ExpressUtils';
import {
	MessageTemplateValidationResult,
	PollTemplateValidationResult,
} from './template.validator';

async function listMessageTemplates(req: Request, res: Response, next: NextFunction) {
	const templateService = new TemplateService(req.locals.user.getUser());

	return Respond({
		res,
		status: 200,
		data: {
			templates: await templateService.listMessageTemplates(),
		},
	});
}
async function addMessageTemplate(req: Request, res: Response, next: NextFunction) {
	const { name, message } = req.locals.data as MessageTemplateValidationResult;

	const templateService = new TemplateService(req.locals.user.getUser());
	const template = templateService.addMessageTemplate(name, message);

	return Respond({
		res,
		status: 201,
		data: {
			template,
		},
	});
}
async function updateMessageTemplate(req: Request, res: Response, next: NextFunction) {
	const { name, message } = req.locals.data as MessageTemplateValidationResult;

	const templateService = new TemplateService(req.locals.user.getUser());
	try {
		await templateService.updateMessageTemplate(req.locals.id, name, message);

		return Respond({
			res,
			status: 201,
			data: {
				template: {
					id: req.locals.id,
					name,
					message,
				},
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

async function listPollTemplates(req: Request, res: Response, next: NextFunction) {
	const templateService = new TemplateService(req.locals.user.getUser());

	return Respond({
		res,
		status: 200,
		data: {
			templates: await templateService.listPollTemplates(),
		},
	});
}
async function addPollTemplate(req: Request, res: Response, next: NextFunction) {
	const { name, poll } = req.locals.data as PollTemplateValidationResult;

	const templateService = new TemplateService(req.locals.user.getUser());
	const template = templateService.addPollTemplate(name, poll);

	return Respond({
		res,
		status: 201,
		data: {
			template,
		},
	});
}
async function updatePollTemplate(req: Request, res: Response, next: NextFunction) {
	const { name, poll } = req.locals.data as PollTemplateValidationResult;

	const templateService = new TemplateService(req.locals.user.getUser());
	try {
		await templateService.updatePollTemplate(req.locals.id, name, poll);

		return Respond({
			res,
			status: 201,
			data: {
				template: {
					id: req.locals.id,
					name,
					poll,
				},
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
async function deleteTemplate(req: Request, res: Response, next: NextFunction) {
	const templateService = new TemplateService(req.locals.user.getUser());
	try {
		await templateService.deleteTemplate(req.locals.id);

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

const TemplateController = {
	listMessageTemplates,
	addMessageTemplate,
	updateMessageTemplate,
	listPollTemplates,
	addPollTemplate,
	updatePollTemplate,
	deleteTemplate,
};

export default TemplateController;
