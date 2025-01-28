import { NextFunction, Request, Response } from 'express';
import { saveRefreshTokens } from '../../config/cache';
import { IS_PRODUCTION, JWT_COOKIE, JWT_REFRESH_COOKIE, SERVER_URL } from '../../config/const';
import APIError, { API_ERRORS } from '../../errors/api-errors';
import { WhatsappProvider } from '../../provider/whatsapp_provider';
import StorageDB from '../../repository/storage';
import { UserService } from '../../services';
import { DeviceService } from '../../services/user';
import {
	Respond,
	generateClientID,
	generateRandomText,
	idValidator,
} from '../../utils/ExpressUtils';
import { sendLoginCredentialsEmail, sendPasswordResetEmail } from '../../utils/email';
import { LoginValidationResult } from './auth.validator';

const JWT_EXPIRE_TIME = 3 * 60 * 1000;
const REFRESH_EXPIRE_TIME = 30 * 24 * 60 * 60 * 1000;

async function validateClientID(req: Request, res: Response, next: NextFunction) {
	const client_id = req.locals.client_id;
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
				session_expires_at: device.getExpiration('Do MMM YYYY'),
				isWhatsappReady: whatsapp.isReady(),
				status: whatsapp.getStatus(),
				phone_number: whatsapp.getContact().id.user,
				name: whatsapp.getContact().pushname,
				userType: whatsapp.getContact().isBusiness ? 'BUSINESS' : 'PERSONAL',
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

		saveRefreshTokens(t, userService.getUserId().toString());
		res.cookie(JWT_REFRESH_COOKIE, t, {
			sameSite: 'strict',
			expires: new Date(Date.now() + REFRESH_EXPIRE_TIME),
			httpOnly: IS_PRODUCTION,
			secure: IS_PRODUCTION,
		});

		const client_id = WhatsappProvider.clientByUser(userService.getUserId());

		if (client_id) {
			const whatsapp = WhatsappProvider.clientByClientID(client_id);
			if (whatsapp?.isReady()) {
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

async function register(req: Request, res: Response, next: NextFunction) {
	const { username } = req.locals.data as LoginValidationResult;
	try {
		const [userService, password] = await UserService.createUser(username);

		sendLoginCredentialsEmail(username, username, password);

		res.cookie(JWT_COOKIE, userService.getToken(), {
			sameSite: 'strict',
			expires: new Date(Date.now() + JWT_EXPIRE_TIME),
			httpOnly: IS_PRODUCTION,
			secure: IS_PRODUCTION,
		});
		const t = userService.getRefreshToken();

		saveRefreshTokens(t, userService.getUserId().toString());
		res.cookie(JWT_REFRESH_COOKIE, t, {
			sameSite: 'strict',
			expires: new Date(Date.now() + REFRESH_EXPIRE_TIME),
			httpOnly: IS_PRODUCTION,
			secure: IS_PRODUCTION,
		});

		return Respond({
			res,
			status: 200,
			data: {},
		});
	} catch (err) {
		return next(new APIError(API_ERRORS.COMMON_ERRORS.ALREADY_EXISTS));
	}
}

async function serviceAccount(req: Request, res: Response, next: NextFunction) {
	const { id } = req.locals;
	try {
		const userService = await UserService.getService(id);

		res.cookie(JWT_COOKIE, userService.getToken(), {
			sameSite: 'strict',
			expires: new Date(Date.now() + JWT_EXPIRE_TIME),
			httpOnly: IS_PRODUCTION,
			secure: IS_PRODUCTION,
		});
		const t = userService.getRefreshToken();

		saveRefreshTokens(t, userService.getUserId().toString());
		res.cookie(JWT_REFRESH_COOKIE, t, {
			sameSite: 'strict',
			expires: new Date(Date.now() + REFRESH_EXPIRE_TIME),
			httpOnly: IS_PRODUCTION,
			secure: IS_PRODUCTION,
		});

		return Respond({
			res,
			status: 200,
			data: {},
		});
	} catch (err) {
		return next(new APIError(API_ERRORS.USER_ERRORS.USER_NOT_FOUND_ERROR));
	}
}

async function updatePassword(req: Request, res: Response) {
	const { password } = req.body;
	if (!password || password.length < 8) {
		return Respond({
			res,
			status: 400,
			data: {},
		});
	}
	await req.locals.user.setPassword(password);
	return Respond({
		res,
		status: 200,
		data: {},
	});
}

async function forgotPassword(req: Request, res: Response, next: NextFunction) {
	const { username } = req.body;

	if (!username) {
		return next(new APIError(API_ERRORS.COMMON_ERRORS.INVALID_FIELDS));
	}

	try {
		const userService = await UserService.getService(username);
		const token = await userService.generatePasswordResetToken();

		const resetLink = `${SERVER_URL}/auth/reset-password/${token}`;

		const success = await sendPasswordResetEmail(username, resetLink);

		return Respond({
			res,
			status: success ? 200 : 400,
			data: {},
		});
	} catch (err) {
		return next(new APIError(API_ERRORS.USER_ERRORS.USER_NOT_FOUND_ERROR));
	}
}

async function resetPassword(req: Request, res: Response) {
	const user_id = await StorageDB.getString(req.params.id);

	try {
		if (!user_id) {
			return res.send('Error resetting password');
		}
		const [valid, id] = idValidator(user_id);
		if (!valid) {
			return res.send('Error resetting password');
		}
		StorageDB.deleteKey(req.params.id);
		const userService = await UserService.getService(id);
		const text = generateRandomText(8);
		await userService.setPassword(text);
		sendLoginCredentialsEmail(userService.getUser().username, userService.getUser().username, text);

		return res.send('Password reset successfully');
	} catch (err) {
		return res.send('Error resetting password');
	}
}

async function logout(req: Request, res: Response) {
	const refreshTokens = req.cookies[JWT_REFRESH_COOKIE] as string;
	res.clearCookie(JWT_COOKIE);
	res.clearCookie(JWT_REFRESH_COOKIE);
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
	register,
	updatePassword,
	forgotPassword,
	validateLogin,
	deviceLogout,
	initiateWhatsapp,
	logoutWhatsapp: deviceLogout,
	resetPassword,
	serviceAccount,
};

export default AuthController;
