import mongoose, { Schema } from 'mongoose';
import { BOT_TRIGGER_OPTIONS, BOT_TRIGGER_TO } from '../../../config/const';
import IBot from '../../../types/bot/Bot';

const botSchema = new mongoose.Schema<IBot>({
	user: {
		type: Schema.Types.ObjectId,
		ref: 'User',
	},
	respond_to: {
		type: String,
		enum: Object.values(BOT_TRIGGER_TO),
		default: BOT_TRIGGER_TO.ALL,
	},
	trigger: {
		type: String,
	},
	trigger_gap_seconds: {
		type: Number,
	},
	options: {
		type: String,
		enum: Object.values(BOT_TRIGGER_OPTIONS),
	},
	message: String,
	attachments: [
		{
			type: Schema.Types.ObjectId,
			ref: 'Upload',
		},
	],
	shared_contact_cards: [String],
	group_respond: {
		type: Boolean,
		default: false,
	},
	active: {
		type: Boolean,
		default: true,
	},
});

const BotDB = mongoose.model<IBot>('Bot', botSchema);

export default BotDB;
