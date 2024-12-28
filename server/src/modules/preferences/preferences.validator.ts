import { NextFunction, Request, Response } from 'express';
import { Types } from 'mongoose';
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

export type CreateMessageModerationRule = {
	title: string;
	merged_groups: Types.ObjectId[];
	file_types: string[];
	admin_rule: {
		message: string;
		shared_contact_cards: Types.ObjectId[];
		attachments: Types.ObjectId[];
		polls: {
			title: string;
			options: string[];
			isMultiSelect: boolean;
		}[];
	};
	creator_rule: {
		message: string;
		shared_contact_cards: Types.ObjectId[];
		attachments: Types.ObjectId[];
		polls: {
			title: string;
			options: string[];
			isMultiSelect: boolean;
		}[];
	};
};

export type UpdateMessageLogRule = {
	id: string;
	saved: boolean;
	unsaved: boolean;
	loggers: string[];
	include: string[];
	exclude: string[];
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

export async function CreateMessageModerationRuleValidator(
	req: Request,
	res: Response,
	next: NextFunction
) {
	const idValidator = z
		.string()
		.array()
		.default([])
		.refine((r) => !r.some((value) => !Types.ObjectId.isValid(value)))
		.transform((r) => r.map((value) => new Types.ObjectId(value)));

	const reqValidator = z.object({
		title: z.string().min(1, 'Title length should be more than 1.'),
		merged_groups: idValidator,
		file_types: z.string().array().default([]),
		admin_rule: z.object({
			message: z.string().default(''),
			shared_contact_cards: idValidator,
			attachments: idValidator,
			polls: z
				.object({
					title: z.string(),
					options: z.string().array().min(1),
					isMultiSelect: z.boolean().default(false),
				})
				.array()
				.default([]),
		}),
		creator_rule: z.object({
			message: z.string().default(''),
			shared_contact_cards: idValidator,
			attachments: idValidator,
			polls: z
				.object({
					title: z.string(),
					options: z.string().array().min(1),
					isMultiSelect: z.boolean().default(false),
				})
				.array()
				.default([]),
		}),
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
