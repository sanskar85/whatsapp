import { NextFunction, Request, Response } from 'express';
import { SHORTNER_REDIRECT } from '../../config/const';
import APIError, { API_ERRORS } from '../../errors/api-errors';
import ShortnerDB from '../../repository/shortner';
import { Respond } from '../../utils/ExpressUtils';
import {
	CreateLinkValidationResult,
	CreateWhatsappLinkValidationResult,
	UpdateLinkValidationResult,
} from './shortner.validator';

async function createWhatsappLink(req: Request, res: Response, next: NextFunction) {
	const { number, message, title } = req.locals.data as CreateWhatsappLinkValidationResult;
	const link = `https://wa.me/${number}?text=${encodeURIComponent(message)}`;

	const doc = await ShortnerDB.create({
		title,
		link,
		user: req.locals.user.getUserId(),
	});

	return Respond({
		res,
		status: 200,
		data: {
			shorten_link: `${SHORTNER_REDIRECT}${doc.key}`,
			link: doc.link,
			id: doc._id,
			title: doc.title,
			base64: doc.qrString,
		},
	});
}

async function createLink(req: Request, res: Response, next: NextFunction) {
	const { link, title } = req.locals.data as CreateLinkValidationResult;

	const doc = await ShortnerDB.create({
		link,
		user: req.locals.user.getUserId(),
		title,
	});

	return Respond({
		res,
		status: 200,
		data: {
			id: doc._id,
			shorten_link: `${SHORTNER_REDIRECT}${doc.key}`,
			title: doc.title,
			link: doc.link,
			base64: doc.qrString,
		},
	});
}

async function updateLink(req: Request, res: Response, next: NextFunction) {
	const { link, title, number, message } = req.locals.data as UpdateLinkValidationResult;
	const doc = await ShortnerDB.findOne({
		_id: req.locals.id,
		user: req.locals.user.getUserId(),
	});

	if (!doc) {
		return next(new APIError(API_ERRORS.COMMON_ERRORS.NOT_FOUND));
	}
	if (!link) {
		doc.link = `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
		doc.qrString = '';
	} else {
		doc.link = link;
	}
	doc.title = title;
	await doc.save();

	return Respond({
		res,
		status: 200,
		data: {
			id: doc._id,
			shorten_link: `${SHORTNER_REDIRECT}${doc.key}`,
			link: doc.link,
			title: doc.title,
			base64: doc.qrString,
		},
	});
}

async function deleteLink(req: Request, res: Response, next: NextFunction) {
	const doc = await ShortnerDB.findOne({
		_id: req.locals.id,
		user: req.locals.user.getUserId(),
	});

	if (!doc) {
		return next(new APIError(API_ERRORS.COMMON_ERRORS.NOT_FOUND));
	}
	await doc.remove();

	return Respond({
		res,
		status: 200,
		data: {},
	});
}

async function open(req: Request, res: Response, next: NextFunction) {
	const id = req.params.id;
	const doc = await ShortnerDB.findOne({ key: id });
	if (!doc) {
		return res.send();
	}
	return res.redirect(doc.link);
}

async function listAll(req: Request, res: Response, next: NextFunction) {
	const docs = await ShortnerDB.find({ user: req.locals.user.getUserId() });

	const promises = docs.map((doc) => ({
		id: doc._id,
		title: doc.title,
		shorten_link: `${SHORTNER_REDIRECT}${doc.key}`,
		link: doc.link,
		base64: doc.qrString,
	}));

	return Respond({
		res,
		status: 200,
		data: {
			links: await Promise.all(promises),
		},
	});
}

const WhatsappShortner = {
	createWhatsappLink,
	createLink,
	open,
	deleteLink,
	updateLink,
	listAll,
};

export default WhatsappShortner;
