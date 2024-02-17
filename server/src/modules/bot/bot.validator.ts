import { NextFunction, Request, Response } from 'express';
import { Types } from 'mongoose';
import { z } from 'zod';
import { BOT_TRIGGER_OPTIONS, BOT_TRIGGER_TO } from '../../config/const';
import APIError from '../../errors/api-errors';

export type CreateBotValidationResult = {
	respond_to: BOT_TRIGGER_TO;
	trigger_gap_seconds: number;
	response_delay_seconds: number;
	options: BOT_TRIGGER_OPTIONS;
	trigger: string;
	message: string;
	shared_contact_cards: Types.ObjectId[];
	attachments: Types.ObjectId[];
	group_respond: boolean;
	polls: {
		title: string;
		options: string[];
		isMultiSelect: boolean;
	}[];
	forward: {
		number: string;
		message: string;
	};
	nurturing: {
		message: string;
		after: number;
		start_from: string;
		end_at: string;
		shared_contact_cards?: Types.ObjectId[];
		attachments?: Types.ObjectId[];
		polls?: {
			title: string;
			options: string[];
			isMultiSelect: boolean;
		}[];
	}[];
};

export async function CreateBotValidator(req: Request, res: Response, next: NextFunction) {
	const reqValidator = z.object({
		trigger: z.string().default(''),
		message: z.string().trim().default(''),
		respond_to: z.enum([
			BOT_TRIGGER_TO.ALL,
			BOT_TRIGGER_TO.SAVED_CONTACTS,
			BOT_TRIGGER_TO.NON_SAVED_CONTACTS,
		]),
		trigger_gap_seconds: z.number().positive().default(1),
		response_delay_seconds: z.number().nonnegative().default(0),
		options: z.enum([
			BOT_TRIGGER_OPTIONS.EXACT_IGNORE_CASE,
			BOT_TRIGGER_OPTIONS.EXACT_MATCH_CASE,
			BOT_TRIGGER_OPTIONS.INCLUDES_IGNORE_CASE,
			BOT_TRIGGER_OPTIONS.INCLUDES_MATCH_CASE,
		]),
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
		group_respond: z.boolean().default(false),
		polls: z
			.object({
				title: z.string(),
				options: z.string().array().min(1),
				isMultiSelect: z.boolean().default(false),
			})
			.array()
			.default([]),
		forward: z
			.object({
				number: z.string(),
				message: z.string().default(''),
			})
			.default({
				number: '',
				message: '',
			}),
		nurturing: z
			.object({
				after: z.number(),
				message: z.string(),
				start_from: z.string().trim().default('00:01'),
				end_at: z.string().trim().default('23:59'),
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
			})
			.array()
			.default([]),
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

export async function CouponValidator(req: Request, res: Response, next: NextFunction) {
	const couponValidator = z.object({
		coupon_code: z.string(),
	});
	const validationResult = couponValidator.safeParse(req.body);
	if (validationResult.success) {
		req.locals.data = validationResult.data.coupon_code;
		return next();
	}

	return next(
		new APIError({
			STATUS: 400,
			TITLE: 'INVALID_FIELDS',
			MESSAGE: 'Invalid Bucket ID or coupon code',
		})
	);
}
