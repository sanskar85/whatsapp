import { NextFunction, Request, Response } from 'express';
import APIError, { API_ERRORS } from '../errors/api-errors';
import { UserService } from '../services';
import ApiKeyService from '../services/keys';

export default async function VerifyAPIToken(req: Request, res: Response, next: NextFunction) {
	const bearer = req.headers.authorization;
	const token = bearer?.split(' ')[1];

	if (!token) {
		return next(new APIError(API_ERRORS.USER_ERRORS.AUTHORIZATION_ERROR));
	}
	try {
		const apiKey = await ApiKeyService.getDoc(token);

		const user = await UserService.getService(apiKey.linked_to);
		req.locals.user = user;

		next();
	} catch (err) {
		return next(new APIError(API_ERRORS.USER_ERRORS.AUTHORIZATION_ERROR));
	}
}
