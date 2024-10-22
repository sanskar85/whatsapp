import { NextFunction, Request, Response } from 'express';
import { JwtPayload, verify } from 'jsonwebtoken';
import { saveRefreshTokens } from '../config/cache';
import { IS_PRODUCTION, JWT_COOKIE, JWT_REFRESH_COOKIE, JWT_SECRET } from '../config/const';
import APIError, { API_ERRORS } from '../errors/api-errors';
import { UserService } from '../services';
import { idValidator } from '../utils/ExpressUtils';

const JWT_EXPIRE_TIME = 3 * 60 * 1000;
const REFRESH_EXPIRE_TIME = 30 * 24 * 60 * 60 * 1000;

export default async function VerifyAPIToken(req: Request, res: Response, next: NextFunction) {
	const token = req.cookies[JWT_COOKIE];

	let id = '';
	try {
		if (!token) {
			throw new Error('Token is required');
		}
		const decoded = verify(token, JWT_SECRET) as JwtPayload;
		id = decoded.id;
	} catch (e) {
		const refreshToken = req.cookies[JWT_REFRESH_COOKIE];
		if (!refreshToken) {
			return next(new APIError(API_ERRORS.USER_ERRORS.AUTHORIZATION_ERROR));
		}

		const { valid: valid_auth, user } = await UserService.isValidAuth(refreshToken);
		if (!valid_auth) {
			return next(new APIError(API_ERRORS.USER_ERRORS.AUTHORIZATION_ERROR));
		}
		req.locals.user = new UserService(user);

		res.cookie(JWT_COOKIE, user.getSignedToken(), {
			sameSite: 'strict',
			expires: new Date(Date.now() + JWT_EXPIRE_TIME),
			httpOnly: IS_PRODUCTION,
			secure: IS_PRODUCTION,
		});
		const t = user.getRefreshToken();
		saveRefreshTokens(t, user._id);
		res.cookie(JWT_REFRESH_COOKIE, t, {
			sameSite: 'strict',
			expires: new Date(Date.now() + REFRESH_EXPIRE_TIME),
			httpOnly: IS_PRODUCTION,
			secure: IS_PRODUCTION,
		});

		next();
		return;
	}
	const [isIDValid, valid_id] = idValidator(id);

	if (!isIDValid) {
		return next(new APIError(API_ERRORS.USER_ERRORS.AUTHORIZATION_ERROR));
	}
	try {
		const user = await UserService.getService(valid_id);
		req.locals.user = user;

		res.cookie(JWT_COOKIE, user.getToken(), {
			sameSite: 'strict',
			expires: new Date(Date.now() + JWT_EXPIRE_TIME),
			httpOnly: true,
			secure: process.env.MODE !== 'development',
		});
		next();
	} catch (e) {
		return next(new APIError(API_ERRORS.USER_ERRORS.AUTHORIZATION_ERROR));
	}
}
