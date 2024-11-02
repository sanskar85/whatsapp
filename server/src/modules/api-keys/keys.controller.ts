import { NextFunction, Request, Response } from 'express';
import ServerError from '../../config/ServerError';
import APIError, { COMMON_ERRORS } from '../../errors/api-errors';
import ApiKeyService from '../../services/keys';
import { Respond } from '../../utils/ExpressUtils';
import { TCreateAPIKey, TWebhook } from './keys.validator';

async function createAPIKey(req: Request, res: Response, next: NextFunction) {
	const { user, data } = req.locals;
	const { name } = data as TCreateAPIKey;

	const apiKeyService = new ApiKeyService(user.getUserId());

	try {
		const doc = await apiKeyService.createAPIKey({ name });
		return Respond({
			res,
			status: 201,
			data: doc,
		});
	} catch (error) {
		next(new APIError(COMMON_ERRORS.INTERNAL_SERVER_ERROR));
	}
}

async function listKeys(req: Request, res: Response, next: NextFunction) {
	const { user } = req.locals;

	const apiKeyService = new ApiKeyService(user.getUserId());

	try {
		const docs = await apiKeyService.listAPIKeys();
		return Respond({
			res,
			status: 201,
			data: {
				list: docs,
			},
		});
	} catch (error) {
		next(new APIError(COMMON_ERRORS.INTERNAL_SERVER_ERROR));
	}
}

async function deleteAPIKey(req: Request, res: Response, next: NextFunction) {
	const { user, id } = req.locals;

	const apiKeyService = new ApiKeyService(user.getUserId());

	try {
		await apiKeyService.deleteAPIKey(id);
		return Respond({
			res,
			status: 200,
		});
	} catch (error) {
		next(new APIError(COMMON_ERRORS.INTERNAL_SERVER_ERROR));
	}
}

async function regenerateToken(req: Request, res: Response, next: NextFunction) {
	const { user, id } = req.locals;

	const apiKeyService = new ApiKeyService(user.getUserId());

	try {
		const token = await apiKeyService.regenerateAPIKey(id);
		return Respond({
			res,
			status: 200,
			data: { token },
		});
	} catch (error) {
		next(new APIError(COMMON_ERRORS.INTERNAL_SERVER_ERROR));
	}
}

async function listWebhooks(req: Request, res: Response, next: NextFunction) {
	const { user } = req.locals;

	const apiKeyService = new ApiKeyService(user.getUserId());

	try {
		const docs = await apiKeyService.listWebhooks();
		return Respond({
			res,
			status: 201,
			data: {
				list: docs,
			},
		});
	} catch (error) {
		next(new APIError(COMMON_ERRORS.INTERNAL_SERVER_ERROR));
	}
}

async function createWebhook(req: Request, res: Response, next: NextFunction) {
	const { data, user } = req.locals;
	const { name, url } = data as TWebhook;

	const apiKeyService = new ApiKeyService(user.getUserId());

	try {
		const doc = await apiKeyService.createWebhook({ name, url });
		return Respond({
			res,
			status: 201,
			data: doc,
		});
	} catch (error) {
		next(new APIError(COMMON_ERRORS.INTERNAL_SERVER_ERROR));
	}
}

async function deleteWebhook(req: Request, res: Response, next: NextFunction) {
	const { user, id } = req.locals;

	const apiKeyService = new ApiKeyService(user.getUserId());

	try {
		await apiKeyService.deleteWebhook(id);
		return Respond({
			res,
			status: 200,
		});
	} catch (error) {
		next(new APIError(COMMON_ERRORS.INTERNAL_SERVER_ERROR));
	}
}

async function validateWebhook(req: Request, res: Response, next: NextFunction) {
	const { user, id } = req.locals;

	const apiKeyService = new ApiKeyService(user.getUserId());

	try {
		await apiKeyService.validateWebhook(id);
		return Respond({
			res,
			status: 200,
		});
	} catch (error) {
		if (error instanceof ServerError) {
			return next(error);
		}
		next(new APIError(COMMON_ERRORS.INTERNAL_SERVER_ERROR));
	}
}

const Controller = {
	createAPIKey,
	listKeys,
	deleteAPIKey,
	regenerateToken,
	listWebhooks,
	createWebhook,
	deleteWebhook,
	validateWebhook,
};

export default Controller;
