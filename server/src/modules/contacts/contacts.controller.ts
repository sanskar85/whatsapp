import csv from 'csvtojson/v2';
import { NextFunction, Request, Response } from 'express';
import fs from 'fs';
import { Types } from 'mongoose';
import Logger from 'n23-logger';
import { getOrCache } from '../../config/cache';
import {
	CACHE_TOKEN_GENERATOR,
	COUNTRIES,
	CSV_PATH,
	SOCKET_RESPONSES,
	TASK_PATH,
	TASK_RESULT_TYPE,
	TASK_TYPE,
} from '../../config/const';
import APIError, { API_ERRORS } from '../../errors/api-errors';
import { WhatsappProvider } from '../../provider/whatsapp_provider';
import { UserService } from '../../services';
import TaskService from '../../services/task';
import { TBusinessContact, TContact } from '../../types/whatsapp';
import CSVParser from '../../utils/CSVParser';
import { Respond, RespondCSV } from '../../utils/ExpressUtils';
import VCFParser from '../../utils/VCFParser';
import WhatsappUtils from '../../utils/WhatsappUtils';
import { FileUtils } from '../../utils/files';
import { ValidateNumbersValidationResult } from './contacts.validator';

async function contacts(req: Request, res: Response, next: NextFunction) {
	const client_id = req.locals.client_id;
	const whatsapp = WhatsappProvider.getInstance(client_id);
	const whatsappUtils = new WhatsappUtils(whatsapp);
	if (!whatsapp.isReady()) {
		return next(new APIError(API_ERRORS.USER_ERRORS.SESSION_INVALIDATED));
	}

	const taskService = new TaskService(req.locals.user);
	const options = {
		saved_contacts: true,
		non_saved_contacts: true,
		saved_chat_contacts: true,
		business_contacts_only: req.body.business_contacts_only ?? false,
		vcf: req.body.vcf ?? false,
	};

	let task_id: Types.ObjectId | null = null;
	if (req.body.saved_contacts) {
		options.saved_contacts = true;
		options.non_saved_contacts = false;
		options.saved_chat_contacts = false;
		task_id = await taskService.createTask(
			TASK_TYPE.EXPORT_SAVED_CONTACTS,
			options.vcf ? TASK_RESULT_TYPE.VCF : TASK_RESULT_TYPE.CSV,
			{
				description: `Export saved contacts to ${
					options.vcf ? TASK_RESULT_TYPE.VCF : TASK_RESULT_TYPE.CSV
				}`,
			}
		);
	} else if (req.body.non_saved_contacts) {
		options.non_saved_contacts = true;
		options.saved_contacts = false;
		options.saved_chat_contacts = false;
		task_id = await taskService.createTask(
			TASK_TYPE.EXPORT_UNSAVED_CONTACTS,
			options.vcf ? TASK_RESULT_TYPE.VCF : TASK_RESULT_TYPE.CSV,
			{
				description: `Export non saved contacts to ${
					options.vcf ? TASK_RESULT_TYPE.VCF : TASK_RESULT_TYPE.CSV
				}`,
			}
		);
	} else if (req.body.saved_chat_contacts) {
		options.saved_chat_contacts = true;
		options.saved_contacts = false;
		options.non_saved_contacts = false;
		task_id = await taskService.createTask(
			TASK_TYPE.EXPORT_CHAT_CONTACTS,
			options.vcf ? TASK_RESULT_TYPE.VCF : TASK_RESULT_TYPE.CSV,
			{
				description: `Export saved chat contacts to ${
					options.vcf ? TASK_RESULT_TYPE.VCF : TASK_RESULT_TYPE.CSV
				}`,
			}
		);
	} else {
		task_id = await taskService.createTask(
			TASK_TYPE.EXPORT_ALL_CONTACTS,
			options.vcf ? TASK_RESULT_TYPE.VCF : TASK_RESULT_TYPE.CSV,
			{
				description: `Export all contacts to ${
					options.vcf ? TASK_RESULT_TYPE.VCF : TASK_RESULT_TYPE.CSV
				}`,
			}
		);
	}

	Respond({
		res,
		status: 201,
	});
	try {

		const { saved, non_saved, saved_chat } = await getOrCache(
			CACHE_TOKEN_GENERATOR.CONTACTS(req.locals.user._id),
			() => whatsappUtils.getContacts()
		);

		let listed_contacts = [
			...(options.saved_chat_contacts ? saved : []),
			...(options.non_saved_contacts ? non_saved : []),
			...(options.saved_chat_contacts ? saved_chat : []),
		];

		if (options.business_contacts_only) {
			listed_contacts = listed_contacts.filter((c) => c.isBusiness);
		}

		const contacts: {
			name: string | undefined;
			number: string;
			isBusiness: string;
			country: string;
			public_name: string;
			description?: string;
			email?: string;
			websites?: string[];
			latitude?: number;
			longitude?: number;
			address?: string;
		}[] = await whatsappUtils.contactsWithCountry(listed_contacts);

		const data = options.vcf
			? options.business_contacts_only
				? VCFParser.exportBusinessContacts(contacts as TBusinessContact[])
				: VCFParser.exportContacts(contacts as TContact[])
			: options.business_contacts_only
			? CSVParser.exportBusinessContacts(contacts as TBusinessContact[])
			: CSVParser.exportContacts(contacts as TContact[]);

		const file_name = `Exported Contacts${options.vcf ? '.vcf' : '.csv'}`;

		const file_path = __basedir + TASK_PATH + task_id.toString() + (options.vcf ? '.vcf' : '.csv');

		await FileUtils.writeFile(file_path, data);

		taskService.markCompleted(task_id, file_name);
		whatsapp.sendToClient(SOCKET_RESPONSES.TASK_COMPLETED, task_id.toString());
	} catch (err) {
		taskService.markFailed(task_id);
		whatsapp.sendToClient(SOCKET_RESPONSES.TASK_FAILED, task_id.toString());
	}
}

async function countContacts(req: Request, res: Response, next: NextFunction) {
	const client_id = req.locals.client_id;

	const whatsapp = WhatsappProvider.getInstance(client_id);
	const whatsappUtils = new WhatsappUtils(whatsapp);
	if (!whatsapp.isReady()) {
		return next(new APIError(API_ERRORS.USER_ERRORS.SESSION_INVALIDATED));
	}

	try {
		const { saved, non_saved, saved_chat, groups } = await getOrCache(
			CACHE_TOKEN_GENERATOR.CONTACTS(req.locals.user._id),
			async () => whatsappUtils.getContacts()
		);

		return Respond({
			res,
			status: 200,
			data: {
				saved_contacts: saved.length,
				non_saved_contacts: non_saved.length,
				saved_chat_contacts: saved_chat.length,
				total_contacts: saved.length + non_saved.length + saved_chat.length,
				groups: groups.length,
			},
		});
	} catch (err) {
		return next(new APIError(API_ERRORS.USER_ERRORS.SESSION_INVALIDATED));
	}
}

export async function validate(req: Request, res: Response, next: NextFunction) {
	const client_id = req.locals.client_id;

	const whatsapp = WhatsappProvider.getInstance(client_id);
	const whatsappUtils = new WhatsappUtils(whatsapp);
	if (!whatsapp.isReady()) {
		return next(new APIError(API_ERRORS.USER_ERRORS.SESSION_INVALIDATED));
	}
	const {
		type,
		csv_file,
		numbers: requestedNumberList,
	} = req.locals.data as ValidateNumbersValidationResult;

	const { isSubscribed, isNew } = new UserService(req.locals.user).isSubscribed();

	if (!isSubscribed && !isNew) {
		return next(new APIError(API_ERRORS.PAYMENT_ERRORS.PAYMENT_REQUIRED));
	}

	let numbers_to_be_checked: string[] = [];

	if (type === 'CSV') {
		const csvFilePath = __basedir + CSV_PATH + csv_file;
		if (!fs.existsSync(csvFilePath)) {
			return next(new APIError(API_ERRORS.COMMON_ERRORS.NOT_FOUND));
		}
		const parsed_csv = await csv().fromFile(csvFilePath);

		if (!parsed_csv) {
			return next(new APIError(API_ERRORS.COMMON_ERRORS.ERROR_PARSING_CSV));
		}

		numbers_to_be_checked = parsed_csv.map((item) => item.number);
	} else if (type === 'NUMBERS') {
		numbers_to_be_checked = requestedNumberList as string[];
	}

	const chat_ids = await whatsappUtils.getNumberIds(numbers_to_be_checked);

	const valid_contacts_promises = chat_ids.map(async (chat_id) => {
		const contact = await whatsapp.getClient().getContactById(chat_id);
		const country_code = await contact.getCountryCode();
		const country = COUNTRIES[country_code as string];
		return {
			name: contact.name ?? 'Unknown',
			number: contact.number,
			isBusiness: contact.isBusiness ? 'Business' : 'Personal',
			public_name: contact.pushname ?? '',
			country,
		};
	});

	try {
		const valid_contacts = await Promise.all(valid_contacts_promises);
		return RespondCSV({
			res,
			filename: 'Validated Contacts',
			data: CSVParser.exportContacts(valid_contacts as TContact[]),
		});
	} catch (e) {
		next(new APIError(API_ERRORS.WHATSAPP_ERROR.MESSAGE_SENDING_FAILED, e));
	}
}

const ContactsController = {
	getContacts: contacts,
	countContacts,
	validate,
};

export default ContactsController;
