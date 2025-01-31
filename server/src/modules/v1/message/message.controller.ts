import { NextFunction, Request, Response } from 'express';
import Logger from 'n23-logger';
import WAWebJS, { MessageMedia, Poll } from 'whatsapp-web.js';
import { MISC_PATH } from '../../../config/const';
import APIError, { API_ERRORS } from '../../../errors/api-errors';
import { WhatsappProvider } from '../../../provider/whatsapp_provider';
import GroupMergeService from '../../../services/merged-groups';
import UserPreferencesService from '../../../services/user/userPreferences';
import { randomVector, Respond } from '../../../utils/ExpressUtils';
import { FileUtils } from '../../../utils/files';
import VCardBuilder from '../../../utils/VCardBuilder';
import { SendMessageValidationResult } from './message.validator';

async function sendMessage(req: Request, res: Response, next: NextFunction) {
	const { user } = req.locals;
	const data = req.locals.data as SendMessageValidationResult;

	const client_id = WhatsappProvider.clientByUser(user.getUserId());

	if (!client_id) {
		return next(new APIError(API_ERRORS.USER_ERRORS.SESSION_INVALIDATED));
	}

	const whatsapp = WhatsappProvider.clientByClientID(client_id)!;

	const recipients: string[] = [];

	if (data.recipient_type === 'GROUP') {
		const group_ids = await new GroupMergeService(user.getUser()).extractWhatsappGroupIds(
			data.recipient
		);
		recipients.push(...group_ids);
	} else {
		recipients.push(`${data.recipient}@c.us`);
	}

	let error = false;

	for (const recipient of recipients) {
		let contact;
		const opts = {} as WAWebJS.MessageSendOptions;
		try {
			contact = await whatsapp.getClient().getContactById(recipient);
		} catch (e) {
			return next(new APIError(API_ERRORS.USER_ERRORS.INVALID_CONTACT));
		}

		let message;

		if (data.message.type === 'text') {
			let msg = data.message.text;
			if (msg) {
				if (msg.includes('{{public_name}}')) {
					msg = msg.replace('{{public_name}}', contact.pushname);
				}
				message = msg;
			}
		} else if (data.message.type === 'media') {
			let path;
			try {
				path = await FileUtils.downloadFile(data.message.link, __basedir + MISC_PATH);
			} catch (e) {
				return next(new APIError(API_ERRORS.COMMON_ERRORS.FILE_UPLOAD_ERROR));
			}

			const media = MessageMedia.fromFilePath(path);
			if (!media) {
				return next(new APIError(API_ERRORS.COMMON_ERRORS.INTERNAL_SERVER_ERROR));
			}

			if (data.message.caption) {
				opts.caption = data.message.caption;
			}

			message = media;
		} else if (data.message.type === 'contact') {
			const contact = data.message.contact;
			const { contact_details_work, contact_details_phone, contact_details_other, ...contactData } =
				contact;
			const card = new VCardBuilder(contactData);
			if (contact_details_work) {
				card.setContactWork(contact_details_work, contact_details_work);
			}
			if (contact_details_phone) {
				card.setContactPhone(contact_details_phone, contact_details_phone);
			}
			for (const other of contact_details_other) {
				card.addContactOther(other, other);
			}

			message = card.build();
		} else if (data.message.type === 'poll') {
			const { title, options, isMultiSelect } = data.message.poll;
			message = new Poll(title, options, {
				messageSecret: randomVector(32),
				allowMultipleAnswers: isMultiSelect,
			});
		}

		if (!message) {
			error = true;
			continue;
		}

		try {
			whatsapp
				.getClient()
				.sendMessage(recipient, message, opts)
				.then(async (_msg) => {
					const userPrefService = await UserPreferencesService.getService(user.getUserId());
					if (userPrefService.getMessageStarRules().individual_outgoing_messages) {
						setTimeout(() => {
							_msg.star();
						}, 1000);
					}
					await whatsapp.getClient().interface.openChatWindow(recipient);
				});

			return Respond({
				res,
				status: 200,
			});
		} catch (e: any) {
			error = true;
			Logger.info('Error sending message: ', e.message);
		}
	}

	if (error) {
		return next(new APIError(API_ERRORS.COMMON_ERRORS.INTERNAL_SERVER_ERROR));
	}
}

const Controller = {
	sendMessage,
};

export default Controller;
