import { NextFunction, Request, Response } from 'express';
import { Types } from 'mongoose';
import { z } from 'zod';
import APIError from '../../errors/api-errors';

export type CreateSchedulerValidationResult = {
	recipient_from:
		| 'CSV'
		| 'NUMBERS'
		| 'SAVED'
		| 'UNSAVED'
		| 'GROUP'
		| 'GROUP_INDIVIDUAL'
		| 'GROUP_INDIVIDUAL_WITHOUT_ADMINS'
		| 'LABEL';
	recipient_data: string | string[];

	message: string;
	shared_contact_cards: Types.ObjectId[];
	attachments: Types.ObjectId[];
	polls: {
		title: string;
		options: string[];
		isMultiSelect: boolean;
	}[];
	random_string: boolean;

	title: string;
	description: string;

	dates: string[];
	daily_count: number;
	start_time: string;
	end_time: string;
	remove_duplicates: boolean;
};

export async function CreateSchedulerValidator(req: Request, res: Response, next: NextFunction) {
	const reqValidator = z.object({
		recipient_from: z.enum([
			'NUMBERS',
			'CSV',
			'SAVED',
			'UNSAVED',
			'GROUP',
			'GROUP_INDIVIDUAL',
			'GROUP_INDIVIDUAL_WITHOUT_ADMINS',
			'LABEL',
		]),
		recipient_data: z.string().or(z.array(z.string())).default(''),
		random_string: z.boolean().default(false),
		message: z.string().trim().default(''),
		title: z.string().trim().default(''),
		description: z.string().trim().default(''),
		dates: z.string().array().min(1),
		daily_count: z.number().default(100),
		start_time: z.string().default('10:00'),
		end_time: z.string().default('18:00'),
		shared_contact_cards: z
			.string()
			.array()
			.default([])
			.refine((attachments) => !attachments.some((value) => !Types.ObjectId.isValid(value)))
			.transform((attachments) => attachments.map((value) => new Types.ObjectId(value))),
		attachments: z
			.string()
			.array()
			.default([])
			.refine((attachments) => !attachments.some((value) => !Types.ObjectId.isValid(value)))
			.transform((attachments) => attachments.map((value) => new Types.ObjectId(value))),
		polls: z
			.object({
				title: z.string(),
				options: z.string().array().min(1),
				isMultiSelect: z.boolean().default(false),
			})
			.array()
			.default([]),
		remove_duplicates: z.boolean().default(false),
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
