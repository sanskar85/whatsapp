import { NextFunction, Request, Response } from 'express';
import APIError, { API_ERRORS } from '../../errors/api-errors';
import { UserService } from '../../services';
import AdminService from '../../services/user/admin-service';
import { Respond } from '../../utils/ExpressUtils';

async function listUsers(req: Request, res: Response, next: NextFunction) {
	const userService = new AdminService(req.locals.admin);

	return Respond({
		res,
		status: 200,
		data: {
			users: await userService.allUsers(),
		},
	});
}
async function extendUserExpiry(req: Request, res: Response, next: NextFunction) {
	try {
		const userService = await UserService.getService(req.locals.id);
		userService.addMonthToExpiry((req.body.months as number) ?? 0);

		return Respond({
			res,
			status: 200,
			data: {},
		});
	} catch (err) {
		return next(new APIError(API_ERRORS.COMMON_ERRORS.NOT_FOUND));
	}
}

const AuthController = {
	listUsers,
	extendUserExpiry,
};

export default AuthController;
