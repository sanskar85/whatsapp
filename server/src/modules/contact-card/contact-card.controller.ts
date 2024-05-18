import { NextFunction, Request, Response } from 'express';
import APIError, { API_ERRORS } from '../../errors/api-errors';
import { WhatsappProvider } from '../../provider/whatsapp_provider';
import ContactCardService from '../../services/contact-card';
import { Respond, validatePhoneNumber } from '../../utils/ExpressUtils';
import { CreateContactValidationResult } from './contact-card.validator';

async function listContactCards(req: Request, res: Response, next: NextFunction) {
	const contact_cards = await new ContactCardService(req.locals.user.getUser()).listContacts();

	return Respond({
		res,
		status: 200,
		data: {
			contact_cards,
		},
	});
}

async function createContactCard(req: Request, res: Response, next: NextFunction) {
	const client_id = req.locals.client_id;

	const whatsapp = WhatsappProvider.clientByClientID(client_id)!;
	if (!whatsapp.isReady()) {
		return next(new APIError(API_ERRORS.USER_ERRORS.SESSION_INVALIDATED));
	}

	const data = req.locals.data as CreateContactValidationResult;
	const service = new ContactCardService(req.locals.user.getUser());
	const details: {
		contact_details_phone?: {
			contact_number: string;
			whatsapp_id?: string;
		};
		contact_details_work?: {
			contact_number: string;
			whatsapp_id?: string;
		};
		contact_details_other: {
			contact_number: string;
			whatsapp_id?: string;
		}[];
	} = {
		contact_details_other: [],
	};

	if (data.contact_details_phone) {
		details.contact_details_phone = await getNumberDetails(whatsapp, data.contact_details_phone);
	}

	if (data.contact_details_work) {
		details.contact_details_work = await getNumberDetails(whatsapp, data.contact_details_work);
	}

	for (const number of data.contact_details_other) {
		const detail = await getNumberDetails(whatsapp, number);
		details.contact_details_other.push(detail);
	}
	const contact_card = await service.createContactCard({
		...data,
		contact_details_phone: details.contact_details_phone,
		contact_details_work: details.contact_details_work,
		contact_details_other: details.contact_details_other,
	});

	return Respond({
		res,
		status: 200,
		data: {
			contact_card,
		},
	});
}

async function updateContactCard(req: Request, res: Response, next: NextFunction) {
	const client_id = req.locals.client_id;
	const whatsapp = WhatsappProvider.clientByClientID(client_id)!;

	if (!whatsapp.isReady()) {
		return next(new APIError(API_ERRORS.USER_ERRORS.SESSION_INVALIDATED));
	}

	const data = req.locals.data as CreateContactValidationResult;
	const service = new ContactCardService(req.locals.user.getUser());
	const details: {
		contact_details_phone?: {
			contact_number: string;
			whatsapp_id?: string;
		};
		contact_details_work?: {
			contact_number: string;
			whatsapp_id?: string;
		};
		contact_details_other: {
			contact_number: string;
			whatsapp_id?: string;
		}[];
	} = {
		contact_details_other: [],
	};

	if (data.contact_details_phone) {
		details.contact_details_phone = await getNumberDetails(whatsapp, data.contact_details_phone);
	}

	if (data.contact_details_work) {
		details.contact_details_work = await getNumberDetails(whatsapp, data.contact_details_work);
	}

	for (const number of data.contact_details_other) {
		const detail = await getNumberDetails(whatsapp, number);
		details.contact_details_other.push(detail);
	}
	const contact_card = await service.updateContactCard(req.locals.id, {
		...data,
		contact_details_phone: details.contact_details_phone,
		contact_details_work: details.contact_details_work,
		contact_details_other: details.contact_details_other,
	});

	return Respond({
		res,
		status: 200,
		data: {
			contact_card,
		},
	});
}

async function deleteContactCard(req: Request, res: Response, next: NextFunction) {
	new ContactCardService(req.locals.user.getUser()).deleteContactCard(req.locals.id);

	return Respond({
		res,
		status: 200,
		data: {},
	});
}
const ContactCardController = {
	listContactCards,
	createContactCard,
	updateContactCard,
	deleteContactCard,
};

export default ContactCardController;

async function getNumberDetails(whatsapp: WhatsappProvider, phone: string) {
	const number = phone.startsWith('+') ? phone.substring(1) : phone;
	if (!validatePhoneNumber(number)) {
		return {
			contact_number: `+${number}`,
		};
	} else {
		const numberId = await whatsapp.getClient().getNumberId(number);
		if (numberId) {
			return {
				contact_number: `+${numberId.user}`,
				whatsapp_id: numberId.user,
			};
		} else {
			return {
				contact_number: `+${number}`,
			};
		}
	}
}
