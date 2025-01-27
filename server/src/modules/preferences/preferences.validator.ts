import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import APIError from '../../errors/api-errors';

export type CreateMessageLogRule = {
	group_id: string[];
	saved: boolean;
	unsaved: boolean;
	loggers: string[];
	include: string[];
	exclude: string[];
};

export type UpdateMessageLogRule = {
	id: string;
	saved: boolean;
	unsaved: boolean;
	loggers: string[];
	include: string[];
	exclude: string[];
};

export type CreateMediaModerationRule = {
	group_id: string[];
	restricted_medias: string[];
};

export type UpdateMediaModerationRule = {
	id: string;
	restricted_medias: string[];
};

export type UpdateMessageStar = {
	individual_outgoing_messages: boolean;
	individual_incoming_messages: boolean;
	group_outgoing_messages: boolean;
	group_incoming_messages: boolean;
};

export async function CreateMessageLogRuleValidator(
	req: Request,
	res: Response,
	next: NextFunction
) {
	const reqValidator = z.object({
		group_id: z.string().array().default([]),
		saved: z.boolean().default(true),
		unsaved: z.boolean().default(true),
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
		saved: z.boolean().default(true),
		unsaved: z.boolean().default(true),
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

export async function UpdateMessageStarRulesValidator(
	req: Request,
	res: Response,
	next: NextFunction
) {
	const reqValidator = z.object({
		individual_outgoing_messages: z.boolean().default(false),
		individual_incoming_messages: z.boolean().default(false),
		group_outgoing_messages: z.boolean().default(false),
		group_incoming_messages: z.boolean().default(false),
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

export async function CreateMediaModerationRuleValidator(
	req: Request,
	res: Response,
	next: NextFunction
) {
	const reqValidator = z.object({
		group_id: z.string().array().default([]),
		restricted_medias: z.string().array().default([]),
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

export async function UpdateMediaModerationRuleValidator(
	req: Request,
	res: Response,
	next: NextFunction
) {
	const reqValidator = z.object({
		id: z.string(),
		restricted_medias: z.string().array().default([]),
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
