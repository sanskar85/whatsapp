import { NextFunction, Request, Response } from 'express';
import { Types } from 'mongoose';
import { z } from 'zod';
import APIError from '../../errors/api-errors';

export type ScheduleMessageValidationResult = {
	type:
		| 'CSV'
		| 'NUMBERS'
		| 'SAVED'
		| 'UNSAVED'
		| 'GROUP'
		| 'GROUP_INDIVIDUAL'
		| 'GROUP_INDIVIDUAL_WITHOUT_ADMINS'
		| 'LABEL';
	message: string;
	numbers: string[];
	csv_file: Types.ObjectId;
	group_ids: string[];
	label_ids: string[];
	variables: string[];
	shared_contact_cards: Types.ObjectId[];
	attachments: Types.ObjectId[];
	polls: {
		title: string;
		options: string[];
		isMultiSelect: boolean;
	}[];

	campaign_name: string;
	description: string;
	startDate: string;
	startTime: string;
	endTime: string;
	min_delay: number;
	max_delay: number;
	batch_delay: number;
	batch_size: number;
	random_string: boolean;
	remove_duplicates: boolean;
};

export async function ScheduleMessageValidator(req: Request, res: Response, next: NextFunction) {
	const reqValidator = z
		.object({
			type: z.enum([
				'NUMBERS',
				'CSV',
				'GROUP_INDIVIDUAL',
				'GROUP',
				'SAVED',
				'UNSAVED',
				'LABEL',
				'GROUP_INDIVIDUAL_WITHOUT_ADMINS',
			]),
			numbers: z.string().array().default([]),
			csv_file: z
				.string()
				.refine((txt) => Types.ObjectId.isValid(txt))
				.transform((txt) => new Types.ObjectId(txt))
				.optional(),
			group_ids: z.string().array().default([]),
			label_ids: z.string().array().default([]),
			random_string: z.boolean().default(false),
			message: z.string().default(''),
			variables: z.string().array().default([]),
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
			campaign_name: z.string().default(''),
			description: z.string().default(''),
			startDate: z.string().optional(),
			startTime: z.string().optional(),
			endTime: z.string().optional(),
			min_delay: z.number().positive(),
			max_delay: z.number().positive(),
			batch_delay: z.number().positive().default(1),
			batch_size: z.number().positive().default(1),
			remove_duplicates: z.boolean().default(false),
		})
		.refine((obj) => {
			if (obj.type === 'NUMBERS' && obj.numbers.length === 0) {
				return false;
			} else if (obj.type === 'CSV' && !obj.csv_file) {
				return false;
			} else if (obj.type === 'GROUP' && obj.group_ids.length === 0) {
				return false;
			} else if (obj.type === 'GROUP_INDIVIDUAL' && obj.group_ids.length === 0) {
				return false;
			} else if (obj.type === 'LABEL' && obj.label_ids.length === 0) {
				return false;
			}
			if (
				obj.message.length === 0 &&
				obj.attachments.length === 0 &&
				obj.shared_contact_cards.length === 0 &&
				obj.polls.length === 0
			) {
				return false;
			}
			return true;
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
