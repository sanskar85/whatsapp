import mongoose from 'mongoose';
import IWebhook from '../../types/apikey/webhook';

const schema = new mongoose.Schema<IWebhook>(
	{
		linked_to: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: true,
		},
		name: {
			type: String,
			required: true,
		},
		url: {
			type: String,
			required: true,
		},
	},
	{
		timestamps: { createdAt: true },
	}
);

const WebhookDB = mongoose.model<IWebhook>('Webhook', schema);

export default WebhookDB;
