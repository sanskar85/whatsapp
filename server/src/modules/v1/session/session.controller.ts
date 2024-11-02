import { NextFunction, Request, Response } from 'express';
import { WhatsappProvider } from '../../../provider/whatsapp_provider';
import { Respond } from '../../../utils/ExpressUtils';

async function validateToken(req: Request, res: Response, next: NextFunction) {
	return Respond({
		res,
		status: 200,
		data: {
			message: 'Token is valid',
		},
	});
}

async function deviceReady(req: Request, res: Response, next: NextFunction) {
	const { user } = req.locals;

	const client_id = WhatsappProvider.clientByUser(user.getUserId());

	let deviceReady = false;
	if (!client_id) {
		deviceReady = false;
	} else {
		const whatsapp = WhatsappProvider.clientByClientID(client_id);
		if (!whatsapp) {
			deviceReady = false;
		} else {
			deviceReady = whatsapp.isReady();
		}
	}

	return Respond({
		res,
		status: 200,
		data: {
			deviceReady,
		},
	});
}

const Controller = {
	validateToken,
	deviceReady,
};

export default Controller;
