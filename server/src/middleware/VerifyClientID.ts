import { NextFunction, Request, Response } from 'express';
import APIError, { API_ERRORS } from '../errors/api-errors';
import { WhatsappProvider } from '../provider/whatsapp_provider';
import { DeviceService } from '../services/user';

export default async function VerifyClientID(req: Request, res: Response, next: NextFunction) {
	const user = req.locals.user;
	try {
		const client_id = WhatsappProvider.clientByUser(user.getUserId());
		if (!client_id) {
			return next(new APIError(API_ERRORS.USER_ERRORS.SESSION_INVALIDATED));
		}

		const { valid } = await DeviceService.isValidDevice(client_id);
		if (!valid) {
			WhatsappProvider.deleteSession(client_id);

			return next(new APIError(API_ERRORS.USER_ERRORS.SESSION_INVALIDATED));
		}
		req.locals.client_id = client_id;
		res.locals.client_id = client_id;

		next();
	} catch (e: unknown) {
		return next(new APIError(API_ERRORS.USER_ERRORS.AUTHORIZATION_ERROR));
	}
}
