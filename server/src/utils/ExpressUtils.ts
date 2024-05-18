import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { Request, Response } from 'express';
import fs from 'fs';
import mime from 'mime';
import { Types } from 'mongoose';
import { z } from 'zod';
import { SALT_FACTOR, SUBSCRIPTION_STATUS } from '../config/const';
import DateUtils from './DateUtils';

type ResponseData = {
	res: Response;
	status: 200 | 201 | 400 | 401 | 403 | 404 | 500;
	data?: object;
};
type CSVResponseData = Omit<ResponseData, 'status' | 'data'> & {
	filename: string;
	data: string;
};
type FileResponseData = Omit<ResponseData, 'status' | 'data'> & {
	filename: string;
	filepath: string;
};

export const Respond = ({ res, status, data = {} }: ResponseData) => {
	if (status === 200 || status === 201) {
		return res.status(status).json({ ...data, success: true });
	}
	return res.status(status).json({ ...data, success: false });
};

export const RespondCSV = ({ res, filename, data }: CSVResponseData) => {
	res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
	res.set('Content-Type', 'text/csv');
	res.status(200).send(data);
};
export const RespondVCF = ({ res, filename, data }: CSVResponseData) => {
	res.setHeader('Content-Disposition', `attachment; filename="${filename}.vcf"`);
	res.set('Content-Type', 'text/vcf');
	res.status(200).send(data);
};
export const RespondFile = ({ res, filename, filepath }: FileResponseData) => {
	const stat = fs.statSync(filepath);
	res.setHeader(
		'Content-Disposition',
		`attachment; filename="${filename}.${mime.getExtension(mime.getType(filepath) ?? '')}"`
	);
	res.set('content-length', stat.size.toString());
	res.set('Content-Type', mime.getType(filepath) ?? '');
	res.status(200).sendFile(filepath);
};

export const Delay = async (seconds: number) => {
	return new Promise((resolve, reject) => {
		setTimeout(() => {
			resolve(null);
		}, seconds * 1000);
	});
};

export const parseAmount = (amount: number) => {
	return Number(amount.toFixed(2));
};

export const getRequestIP = (req: Request) => {
	return (req.headers['x-real-ip'] ?? req.socket.remoteAddress)?.toString();
};

export function generateClientID() {
	return crypto.randomUUID();
}

export function generateRandomText(length: number = 6) {
	return crypto.randomBytes(length).toString('hex');
}

export function randomMessageText() {
	const clocks = [
		'🕐',
		'🕑',
		'🕒',
		'🕓',
		'🕔',
		'🕕',
		'🕖',
		'🕗',
		'🕘',
		'🕙',
		'🕚',
		'🕛',
		'🕜',
		'🕝',
		'🕞',
		'🕟',
		'🕠',
		'🕡',
		'🕢',
		'🕣',
		'🕤',
		'🕥',
		'🕦',
		'🕧',
	];
	const shuffled = clocks.sort(() => 0.5 - Math.random());
	const selected = shuffled.slice(0, 6);
	return `\n\n\n${selected.join('')}`;
}

export function generateInvoiceID(id: string) {
	// 23-24/Saas/000001
	const moment_now = DateUtils.getMomentNow();

	const startYear = moment_now.month() >= 3 ? moment_now.year() : moment_now.year() - 1;
	const year = startYear.toString().slice(2) + '-' + (startYear + 1).toString().slice(2);

	let invoice_id = year;
	invoice_id += '/Saas/';
	invoice_id += id.toString().padStart(6, '0');
	return invoice_id;
}

type IDValidatorResult = [true, Types.ObjectId] | [false, undefined];
export function idValidator(id: string): IDValidatorResult {
	const validator = z
		.string()
		.refine((value) => Types.ObjectId.isValid(value))
		.transform((value) => new Types.ObjectId(value));

	const result = validator.safeParse(id);
	if (result.success === false) {
		return [false, undefined];
	} else {
		return [true, result.data];
	}
}

export function getRandomNumber(min: number, max: number) {
	return min + Math.random() * (max - min);
}

export function parseSubscriptionStatus(text: string) {
	if (text === SUBSCRIPTION_STATUS.ACTIVE) {
		return SUBSCRIPTION_STATUS.ACTIVE;
	} else if (text === SUBSCRIPTION_STATUS.AUTHENTICATED) {
		return SUBSCRIPTION_STATUS.AUTHENTICATED;
	} else if (text === SUBSCRIPTION_STATUS.CANCELLED) {
		return SUBSCRIPTION_STATUS.CANCELLED;
	} else if (text === SUBSCRIPTION_STATUS.COMPLETED) {
		return SUBSCRIPTION_STATUS.COMPLETED;
	} else if (text === SUBSCRIPTION_STATUS.CREATED) {
		return SUBSCRIPTION_STATUS.CREATED;
	} else if (text === SUBSCRIPTION_STATUS.EXPIRED) {
		return SUBSCRIPTION_STATUS.EXPIRED;
	} else if (text === SUBSCRIPTION_STATUS.HALTED) {
		return SUBSCRIPTION_STATUS.HALTED;
	} else if (text === SUBSCRIPTION_STATUS.PENDING) {
		return SUBSCRIPTION_STATUS.PENDING;
	} else {
		return SUBSCRIPTION_STATUS.UNDER_CREATION;
	}
}

export function validatePhoneNumber(num: string) {
	var re = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/im;

	return re.test(num);
}

export async function generateHashedPassword(password: string) {
	return await bcrypt.hash(password, SALT_FACTOR);
}
