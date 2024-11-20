import axios from 'axios';
import { Types } from 'mongoose';
import { MessageMedia } from 'whatsapp-web.js';
import InternalError, { COMMON_ERRORS } from '../../errors/internal-errors';
import APIKeyDB from '../../repository/keys/APIKey';
import WebhookDB from '../../repository/keys/Webhook';
import IAPIKey from '../../types/keys/APIKey';
import IWebhook from '../../types/keys/Webhook';
import DateUtils from '../../utils/DateUtils';

function processDocs(doc: IAPIKey) {
	return {
		id: doc._id,
		name: doc.name,
		createdAt: DateUtils.getMoment(doc.createdAt).format('YYYY-MM-DD HH:mm:ss'),
	};
}

function processWebhookDocs(doc: IWebhook) {
	return {
		id: doc._id,
		name: doc.name,
		url: doc.url,
		createdAt: DateUtils.getMoment(doc.createdAt).format('YYYY-MM-DD HH:mm:ss'),
	};
}

export default class ApiKeyService {
	private userId: Types.ObjectId;
	public constructor(userId: Types.ObjectId) {
		this.userId = userId;
	}

	public static async getDoc(token: string) {
		const doc = await APIKeyDB.findOne({ token });
		if (!doc) {
			throw new InternalError(COMMON_ERRORS.NOT_FOUND);
		}

		return {
			linked_to: doc.linked_to,
		};
	}

	public async listAPIKeys() {
		const docs = await APIKeyDB.find({ linked_to: this.userId });
		return docs.map(processDocs);
	}

	public async createAPIKey(details: { name: string }) {
		const doc = await APIKeyDB.create({
			linked_to: this.userId,
			name: details.name,
		});
		return {
			id: doc._id,
			name: doc.name,
			token: doc.token,
			createdAt: DateUtils.getMoment(doc.createdAt).format('YYYY-MM-DD HH:mm:ss'),
		};
	}

	public async deleteAPIKey(id: Types.ObjectId) {
		await APIKeyDB.deleteOne({ _id: id });
	}

	public async regenerateAPIKey(id: Types.ObjectId) {
		const doc = await APIKeyDB.findById(id);
		if (!doc) {
			throw new InternalError(COMMON_ERRORS.NOT_FOUND);
		}

		doc.token = doc.generateToken();
		await doc.save();
		return doc.token;
	}

	public async listWebhooks() {
		const docs = await WebhookDB.find({ linked_to: this.userId });
		return docs.map(processWebhookDocs);
	}

	public async createWebhook(details: { name: string; url: string }) {
		const doc = await WebhookDB.create({
			linked_to: this.userId,
			name: details.name,
			url: details.url,
		});
		return {
			id: doc._id,
			name: doc.name,
			url: doc.url,
			createdAt: DateUtils.getMoment(doc.createdAt).format('YYYY-MM-DD HH:mm:ss'),
		};
	}

	public async deleteWebhook(id: Types.ObjectId) {
		await WebhookDB.deleteOne({ _id: id });
	}

	public async validateWebhook(id: Types.ObjectId) {
		const doc = await WebhookDB.findOne({ _id: id, linked_to: this.userId });

		if (!doc) {
			throw new InternalError(COMMON_ERRORS.NOT_FOUND);
		}

		try {
			await axios.post(doc.url);
		} catch (error) {
			throw new InternalError(COMMON_ERRORS.NOT_FOUND);
		}
	}

	async sendWebhook(details: {
		recipient: string;
		recipient_name: string | undefined;
		chat_id: string;
		chat_name: string;
		message: import('whatsapp-web.js').Message;
	}) {
		const webhooks = await WebhookDB.find({ linked_to: this.userId });

		let webhookData: any = {
			recipient: details.recipient,
			recipient_name: details.recipient_name,
			chat_id: details.chat_id,
			chat_name: details.chat_name,
		};

		if (details.message.hasMedia && details.message instanceof MessageMedia) {
			const msg = details.message as MessageMedia;
			webhookData.message = {
				type: 'media',
				media: {
					caption: details.message.body,
					mimetype: msg.mimetype,
					filename: msg.filename,
					size: msg.filesize,
					base64: msg.data,
				},
			};
		} else {
			webhookData.message = {
				type: 'text',
				text: details.message.body,
			};
		}

		webhooks.forEach(async (webhook) => {
			const webhook_url = webhook.url;
			axios.post(webhook_url, webhookData).catch((e) => {});
		});
	}

	// public async sendWebhook(device: IWhatsappLink, body: any) {
	// 	const docs = await WebhookDB.find({ linked_to: this.account._id, device_id: device._id });

	// 	for (const doc of docs) {
	// 		try {
	// 			await axios.post(doc.url, body);
	// 		} catch (error) {}
	// 	}
	// }
}
