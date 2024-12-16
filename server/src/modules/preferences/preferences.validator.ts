import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import APIError from '../../errors/api-errors';

export type CreateMessageLogRule = {
	group_id: string[];
	loggers: string[];
	include: string[];
	exclude: string[];
};

export type UpdateMessageLogRule = {
	id: string;
	loggers: string[];
	include: string[];
	exclude: string[];
};

export async function CreateMessageLogRuleValidator(
	req: Request,
	res: Response,
	next: NextFunction
) {
	const reqValidator = z.object({
		group_id: z.string().array().default([]),
		loggers: z.string().array().default([]),
		include: z.string().array().default([]),
		exclude: z.string().array().default([]),
	});

	const reqValidatorResult = reqValidator.safeParse(req.body);

	if (reqValidatorResult.success) {
		req.locals.data = reqValidatorResult.data;
		return next();
	}
	const message = reqValidatorResult.error.issues
		.map((err) => err.path)
		.flat()
		.filter((item, pos, arr) => arr.indexOf(item) == pos)
		.join(', ');

	return next(
		new APIError({
			STATUS: 400,
			TITLE: 'INVALID_FIELDS',
			MESSAGE: message,
		})
	);
}

export async function UpdateMessageLogRuleValidator(
	req: Request,
	res: Response,
	next: NextFunction
) {
	const reqValidator = z.object({
		id: z.string(),
		loggers: z.string().array().default([]),
		include: z.string().array().default([]),
		exclude: z.string().array().default([]),
	});
	const reqValidatorResult = reqValidator.safeParse(req.body);

	if (reqValidatorResult.success) {
		req.locals.data = reqValidatorResult.data;
		return next();
	}
	const message = reqValidatorResult.error.issues
		.map((err) => err.path)
		.flat()
		.filter((item, pos, arr) => arr.indexOf(item) == pos)
		.join(', ');

	return next(
		new APIError({
			STATUS: 400,
			TITLE: 'INVALID_FIELDS',
			MESSAGE: message,
		})
	);
}
