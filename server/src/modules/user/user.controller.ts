import { NextFunction, Request, Response } from 'express';
import APIError, { API_ERRORS } from '../../errors/api-errors';
import { shareToDrive } from '../../provider/google/SheetAuth';
import { DeviceService, UserService } from '../../services/user';
import UserPreferencesService from '../../services/user/userPreferences';
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

async function listDevices(req: Request, res: Response, next: NextFunction) {
	const userService = req.locals.admin;

	const options = {
		csv: false,
	};
	if (req.query.csv === 'true') {
		options.csv = true;
	}

	const devices = await userService.allDevices();

	if (options.csv) {
		return RespondCSV({
			res,
			filename: 'Exported Devices',
			data: CSVParser.exportUsersDetails(devices),
		});
	} else {
		return Respond({
			res,
			status: 200,
			data: {
				devices: devices,
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
	const userService = await UserService.getService(req.locals.id);
	await DeviceService.logoutUser(userService.getUserId());
	return Respond({
		res,
		status: 200,
		data: {},
	});
}

async function shareLogFile(req: Request, res: Response, next: NextFunction) {
	const userPrefService = await UserPreferencesService.getService(req.locals.id);

	const sheetID = userPrefService.getMessageLogSheetId();

	if (!sheetID) {
		return next(new APIError(API_ERRORS.COMMON_ERRORS.NOT_FOUND));
	}

	return Respond({
		res,
		status: (await shareToDrive(sheetID, req.locals.data)) ? 200 : 500,
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

const Controller = {
	listUsers,
	listDevices,
	extendUserExpiry,
	logoutUsers,
	paymentRemainder,
	shareLogFile,
};

export default Controller;
