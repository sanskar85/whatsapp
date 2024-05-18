import { NextFunction, Request, Response } from 'express';
import APIError, { API_ERRORS } from '../../errors/api-errors';
import { DeviceService } from '../../services/user';
import CSVParser from '../../utils/CSVParser';
import DateUtils from '../../utils/DateUtils';
import { Respond, RespondCSV } from '../../utils/ExpressUtils';

async function listUsers(req: Request, res: Response, next: NextFunction) {
	const userService = req.locals.admin;

	const options = {
		csv: false,
	};
	if (req.query.csv === 'true') {
		options.csv = true;
	}

	if (options.csv) {
		return RespondCSV({
			res,
			filename: 'Exported Contacts',
			data: CSVParser.exportUsersDetails(await userService.allUsers()),
		});
	} else {
		return Respond({
			res,
			status: 200,
			data: {
				users: await userService.allUsers(),
			},
		});
	}
}

async function extendUserExpiry(req: Request, res: Response, next: NextFunction) {
	try {
		if (!req.body.date) {
			return next(new APIError(API_ERRORS.COMMON_ERRORS.INVALID_FIELDS));
		}
		const deviceService = await DeviceService.getDeviceService(req.locals.id);
		deviceService.setExpiry(DateUtils.getMoment(req.body.date, 'YYYY-MM-DD'));

		return Respond({
			res,
			status: 200,
			data: {},
		});
	} catch (err) {
		return next(new APIError(API_ERRORS.COMMON_ERRORS.NOT_FOUND));
	}
}

async function logoutUsers(req: Request, res: Response, next: NextFunction) {
	const deviceService = await DeviceService.getDeviceService(req.locals.id);
	await deviceService.logout();
	return Respond({
		res,
		status: 200,
		data: {},
	});
}

async function paymentRemainder(req: Request, res: Response, next: NextFunction) {
	// const adminService = new AdminService(req.locals.admin);

	// const whatsapp = WhatsappProvider.getInstance(adminService.getClientID());
	// if (!whatsapp.isReady()) {
	// 	return next(new APIError(API_ERRORS.USER_ERRORS.WHATSAPP_NOT_READY));
	// }
	// const userService = await UserService.getService(req.locals.id);

	// whatsapp
	// 	.getClient()
	// 	.sendMessage(userService.getPhoneNumber() + '@c.us', req.locals.data)
	// 	.catch((err) => Logger.error('Error sending message:', err));

	return Respond({
		res,
		status: 200,
		data: {},
	});
}

const AuthController = {
	listUsers,
	extendUserExpiry,
	logoutUsers,
	paymentRemainder,
};

export default AuthController;
