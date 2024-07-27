import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import APIError from '../../errors/api-errors';

export type AssignLabelValidationResult = {
	type: 'CSV' | 'GROUP' | 'NUMBERS';
	csv_file: string;
	group_ids: string[];
	numbers: string[];
	label_id: string;
};

export async function AssignLabelValidator(req: Request, res: Response, next: NextFunction) {
	const reqValidator = z
		.object({
			type: z.enum(['CSV', 'GROUP', 'NUMBERS']),
			csv_file: z.string().default(''),
			group_ids: z.string().array().default([]),
			numbers: z.string().array().default([]),
			label_id: z.string(),
		})
		.refine((obj) => {
			if (obj.type === 'CSV' && obj.csv_file.length === 0) {
				return false;
			} else if (obj.type === 'GROUP' && obj.group_ids.length === 0) {
				return false;
			} else if (obj.type === 'NUMBERS' && obj.numbers.length === 0) {
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
