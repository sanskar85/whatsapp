import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import APIError from '../../../errors/api-errors';

export type SendMessageValidationResult = {
	message:
		| {
				type: 'text';
				text: string;
		  }
		| {
				type: 'media';
				link: string;
		  }
		| {
				type: 'contact';
				contact: {
					first_name: string;
					middle_name: string;
					last_name: string;
					title: string;
					organization: string;
					email_personal: string;
					email_work: string;
					links: string[];
					street: string;
					city: string;
					state: string;
					country: string;
					pincode: string;
					contact_details_phone: string;
					contact_details_work: string;
					contact_details_other: string[];
				};
		  }
		| {
				type: 'poll';
				poll: {
					title: string;
					options: string[];
					isMultiSelect: boolean;
				};
		  };
	recipient: string;
};

export async function SendMessageValidator(req: Request, res: Response, next: NextFunction) {
	const textType = z.object({
		type: z.literal('text'),
		text: z.string().trim().trim().min(1),
	});

	const mediaType = z.object({
		type: z.literal('media'),
		link: z.string().trim().min(1).url(),
	});

	const contactType = z.object({
		type: z.literal('contact'),
		contact: z.object({
			first_name: z.string().trim().default(''),
			middle_name: z.string().trim().default(''),
			last_name: z.string().trim().default(''),
			title: z.string().trim().default(''),
			organization: z.string().trim().default(''),
			email_personal: z.string().trim().default(''),
			email_work: z.string().trim().default(''),
			contact_details_phone: z.string().trim().default(''),
			contact_details_work: z.string().trim().default(''),
			contact_details_other: z.string().array().default([]),
			links: z.string().array().default([]),
			street: z.string().trim().default(''),
			city: z.string().trim().default(''),
			state: z.string().trim().default(''),
			country: z.string().trim().default(''),
			pincode: z.string().trim().default(''),
		}),
	});

	const pollType = z.object({
		type: z.literal('poll'),
		poll: z.object({
			title: z.string(),
			options: z.string().array().min(1),
			isMultiSelect: z.boolean().default(false),
		}),
	});

	const reqValidator = z.object({
		recipient: z.string().trim().min(1, 'Please provide a valid phone number.'),
		message: z.discriminatedUnion('type', [textType, mediaType, contactType, pollType]),
	});

	const reqValidatorResult = reqValidator.safeParse(req.body);

	if (reqValidatorResult.success) {
		req.locals.data = reqValidatorResult.data;
		return next();
	}

	return next(
		new APIError({
			STATUS: 400,
			TITLE: 'INVALID_FIELDS',
			MESSAGE: "Invalid fields in the request's body.",
			OBJECT: reqValidatorResult.error.flatten(),
		})
	);
}
