import crypto from 'crypto';
import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { z } from 'zod';
import { SUBSCRIPTION_STATUS } from '../config/const';
type ResponseData = {
	res: Response;
	status: 200 | 201 | 400 | 401 | 403 | 404 | 500;
	data?: object;
};

export const Respond = ({ res, status, data = {} }: ResponseData) => {
	if (status === 200 || status === 201) {
		return res.status(status).json({ ...data, success: true });
	}
	return res.status(status).json({ ...data, success: false });
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
export function generateBatchID() {
	return crypto.randomBytes(6).toString('hex');
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
	const randomDecimal = Math.random();

	const randomInRange = min + randomDecimal * (max - min);

	return randomInRange;
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
