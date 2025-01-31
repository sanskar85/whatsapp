import { NextFunction, Request, Response } from 'express';
import { Types } from 'mongoose';
import { z } from 'zod';
import { BOT_TRIGGER_OPTIONS } from '../../config/const';
import APIError from '../../errors/api-errors';
import IPolls from '../../types/polls';

export type CreateGroupValidationResult = {
	csv_file: string;
	name: string;
};

export type GroupSettingValidationResult = {
	description?: string | undefined;
	edit_group_settings?: boolean | undefined;
	send_messages?: boolean | undefined;
	add_others?: boolean | undefined;
	admin_group_settings?: boolean | undefined;
	groups: string[];
};
export type MergeGroupValidationResult = {
	group_name: string;
	group_ids: string[];
	group_reply_saved: {
		text: string;
		shared_contact_cards: Types.ObjectId[];
		attachments: Types.ObjectId[];
		polls: IPolls[];
	}[];
	group_reply_unsaved: {
		text: string;
		shared_contact_cards: Types.ObjectId[];
		attachments: Types.ObjectId[];
		polls: IPolls[];
	}[];
	private_reply_saved: {
		text: string;
		shared_contact_cards: Types.ObjectId[];
		attachments: Types.ObjectId[];
		polls: IPolls[];
	}[];
	private_reply_unsaved: {
		text: string;
		shared_contact_cards: Types.ObjectId[];
		attachments: Types.ObjectId[];
		polls: IPolls[];
	}[];
	private_reply_admin: {
		text: string;
		shared_contact_cards: Types.ObjectId[];
		attachments: Types.ObjectId[];
		polls: IPolls[];
	}[];
	restricted_numbers: Types.ObjectId[];
	reply_business_only: boolean;
	random_string: boolean;
	min_delay: number;
	max_delay: number;
	start_time: string;
	end_time: string;
	canSendAdmin: boolean;
	multiple_responses: boolean;
	triggers: string[];
	options: BOT_TRIGGER_OPTIONS;
	forward: {
		number: string;
		message: string;
	};
	allowed_country_codes: string[];
};

type ModeratorRule = {
	file_types: string[];
	message: string;
	shared_contact_cards: Types.ObjectId[];
	attachments: Types.ObjectId[];
	polls: {
		title: string;
		options: string[];
		isMultiSelect: boolean;
	}[];
};

export type MessageModerationValidationResult = {
	file_types: string[];
	group_rule: ModeratorRule;
	creator_rule: ModeratorRule;
	admin_rule: ModeratorRule;
};

export async function CreateGroupValidator(req: Request, res: Response, next: NextFunction) {
	if (req.method !== 'POST') {
		return next();
	}
	const reqValidator = z.object({
		csv_file: z.string().default(''),
		name: z.string(),
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

export async function MergeGroupValidator(req: Request, res: Response, next: NextFunction) {
	const reqValidator = z
		.object({
			group_name: z.string(),
			group_ids: z.string().array().default([]),
			group_reply_saved: z
				.object({
					text: z.string(),
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
			group_reply_unsaved: z
				.object({
					text: z.string(),
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
			private_reply_saved: z
				.object({
					text: z.string(),
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
			private_reply_unsaved: z
				.object({
					text: z.string(),
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
			private_reply_admin: z
				.object({
					text: z.string(),
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
			restricted_numbers: z
				.string()
				.array()
				.default([])
				.refine((r) => !r.some((value) => !Types.ObjectId.isValid(value)))
				.transform((r) => r.map((value) => new Types.ObjectId(value))),
			allowed_country_codes: z.string().array().default([]),
			reply_business_only: z.boolean().default(false),
			multiple_responses: z.boolean().default(false),
			random_string: z.boolean().default(false),
			min_delay: z.number().positive().default(2),
			max_delay: z.number().positive().default(5),
			start_time: z.string().default('10:00'),
			end_time: z.string().default('18:00'),
			canSendAdmin: z.boolean().default(false),
			triggers: z.string().array().default([]),
			options: z.enum([
				BOT_TRIGGER_OPTIONS.EXACT_IGNORE_CASE,
				BOT_TRIGGER_OPTIONS.EXACT_MATCH_CASE,
				BOT_TRIGGER_OPTIONS.INCLUDES_IGNORE_CASE,
				BOT_TRIGGER_OPTIONS.INCLUDES_MATCH_CASE,
				BOT_TRIGGER_OPTIONS.ANYWHERE_MATCH_CASE,
				BOT_TRIGGER_OPTIONS.ANYWHERE_IGNORE_CASE,
			]),
			forward: z
				.object({
					number: z.string(),
					message: z.string().default(''),
				})
				.default({
					number: '',
					message: '',
				}),
		})
		.refine((obj) => obj.group_ids.length !== 0);
	const validationResult = reqValidator.safeParse(req.body);
	if (validationResult.success) {
		req.locals.data = validationResult.data;
		return next();
	}
	const message = validationResult.error.issues
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

export async function GroupSettingValidator(req: Request, res: Response, next: NextFunction) {
	const reqValidator = z.object({
		description: z.string().optional(),
		edit_group_settings: z.boolean().optional(),
		send_messages: z.boolean().optional(),
		add_others: z.boolean().optional(),
		admin_group_settings: z.boolean().optional(),
		groups: z.string().array(),
	});

	const validationResult = reqValidator.safeParse(req.body);
	if (validationResult.success) {
		req.locals.data = validationResult.data;
		return next();
	}
	const message = validationResult.error.issues
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

export async function LinkReportValidator(req: Request, res: Response, next: NextFunction) {
	const reqValidator = z.object({
		links: z.string().array(),
	});

	const reqValidatorResult = reqValidator.safeParse(req.body);

	if (reqValidatorResult.success) {
		req.locals.data = reqValidatorResult.data.links;
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

export async function MessageModerationValidator(req: Request, res: Response, next: NextFunction) {
	const moderationSchema = z.object({
		message: z.string(),
		shared_contact_cards: z.string().array(),
		attachments: z.string().array(),
		polls: z
			.object({
				title: z.string(),
				options: z.string().array(),
				isMultiSelect: z.boolean(),
			})
			.array(),
	});

	const reqValidator = z.object({
		file_types: z.string().array(),
		group_rule: moderationSchema,
		creator_rule: moderationSchema,
		admin_rule: moderationSchema,
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
