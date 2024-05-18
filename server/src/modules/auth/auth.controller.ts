import { NextFunction, Request, Response } from 'express';
import { saveRefreshTokens } from '../../config/cache';
import {
	CLIENT_ID_COOKIE,
	IS_PRODUCTION,
	JWT_COOKIE,
	JWT_REFRESH_COOKIE,
} from '../../config/const';
import APIError, { API_ERRORS } from '../../errors/api-errors';
import { WhatsappProvider } from '../../provider/whatsapp_provider';
import { UserService } from '../../services';
import { DeviceService } from '../../services/user';
import { Respond, generateClientID } from '../../utils/ExpressUtils';
import { LoginValidationResult } from './auth.validator';

const JWT_EXPIRE_TIME = 3 * 60 * 1000;
const REFRESH_EXPIRE_TIME = 30 * 24 * 60 * 60 * 1000;

async function validateClientID(req: Request, res: Response, next: NextFunction) {
	const client_id = req.cookies[CLIENT_ID_COOKIE];
	if (!client_id) {
		return next(new APIError(API_ERRORS.USER_ERRORS.SESSION_INVALIDATED));
	}

	const authStatus = await DeviceService.isValidDevice(client_id);
	const whatsapp = WhatsappProvider.clientByClientID(client_id);

	if (!whatsapp) {
		return next(new APIError(API_ERRORS.USER_ERRORS.SESSION_INVALIDATED));
	}

	if (!authStatus.valid) {
		if (client_id) {
			whatsapp.logoutClient();
		}
		return next(new APIError(API_ERRORS.USER_ERRORS.SESSION_INVALIDATED));
	}
	try {
		const device = await DeviceService.getDeviceService(whatsapp.getContact().id.user);
		const { isNew, isSubscribed } = device.isSubscribed();
		return Respond({
			res,
			status: 200,
			data: {
				session_expires_at: device.getExpiration(null).toDate(),
				isWhatsappReady: whatsapp.isReady(),
				status: whatsapp.getStatus(),
				phone_number: whatsapp.getContact().id.user,
				name: whatsapp.getContact().pushname,
				isSubscribed,
				canSendMessage: isNew || isSubscribed,
			},
		});
	} catch (err) {
		return next(new APIError(API_ERRORS.USER_ERRORS.SESSION_INVALIDATED));
	}
}

async function initiateWhatsapp(req: Request, res: Response, next: NextFunction) {
	const client_id = generateClientID();

	const whatsapp = WhatsappProvider.getInstance(req.locals.user, client_id);
	whatsapp.initialize();

	try {
		res.cookie(CLIENT_ID_COOKIE, client_id, {
			sameSite: 'strict',
			expires: new Date(Date.now() + REFRESH_EXPIRE_TIME),
			httpOnly: IS_PRODUCTION,
			secure: IS_PRODUCTION,
		});
		return Respond({
			res,
			status: 200,
			data: {
				client_id,
			},
		});
	} catch (err) {
		return next(new APIError(API_ERRORS.USER_ERRORS.SESSION_INVALIDATED));
	}
}

async function deviceLogout(req: Request, res: Response, next: NextFunction) {
	const { client_id } = req.locals;
	WhatsappProvider.clientByClientID(client_id)?.logoutClient();

	return Respond({
		res,
		status: 200,
		data: {},
	});
}

async function login(req: Request, res: Response, next: NextFunction) {
	const { username, password, role } = req.locals.data as LoginValidationResult;
	try {
		const userService = await UserService.getServiceByCredentials(username, password);

		if (userService.getRole().toLowerCase() !== role) {
			return next(new APIError(API_ERRORS.USER_ERRORS.USER_NOT_FOUND_ERROR));
		}

		res.cookie(JWT_COOKIE, userService.getToken(), {
			sameSite: 'strict',
			expires: new Date(Date.now() + JWT_EXPIRE_TIME),
			httpOnly: IS_PRODUCTION,
			secure: IS_PRODUCTION,
		});
		const t = userService.getRefreshToken();

		saveRefreshTokens(t, userService.getID().toString());
		res.cookie(JWT_REFRESH_COOKIE, t, {
			sameSite: 'strict',
			expires: new Date(Date.now() + REFRESH_EXPIRE_TIME),
			httpOnly: IS_PRODUCTION,
			secure: IS_PRODUCTION,
		});

		const client_id = WhatsappProvider.clientByUser(userService.getID());

		if (client_id) {
			const whatsapp = WhatsappProvider.clientByClientID(client_id);
			if (whatsapp?.isReady()) {
				res.cookie(CLIENT_ID_COOKIE, client_id, {
					sameSite: 'strict',
					expires: new Date(Date.now() + REFRESH_EXPIRE_TIME),
					httpOnly: IS_PRODUCTION,
					secure: IS_PRODUCTION,
				});
			}
		}

		return Respond({
			res,
			status: 200,
			data: {},
		});
	} catch (err) {
		return next(new APIError(API_ERRORS.USER_ERRORS.USER_NOT_FOUND_ERROR));
	}
}

async function logout(req: Request, res: Response) {
	const refreshTokens = req.cookies[JWT_REFRESH_COOKIE] as string;
	res.clearCookie(JWT_COOKIE);
	res.clearCookie(JWT_REFRESH_COOKIE);
	res.clearCookie(CLIENT_ID_COOKIE);
	await UserService.logout(refreshTokens);
	return Respond({
		res,
		status: 200,
		data: {},
	});
}

async function validateLogin(req: Request, res: Response) {
	return Respond({
		res,
		status: 200,
		data: {},
	});
}

const AuthController = {
	validateClientID,
	logout,
	login,
	validateLogin,
	deviceLogout,
	initiateWhatsapp,
};

export default AuthController;
