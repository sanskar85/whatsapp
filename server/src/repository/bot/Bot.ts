import mongoose, { Schema } from 'mongoose';
import { BOT_TRIGGER_OPTIONS, BOT_TRIGGER_TO } from '../../config/const';
import IBot from '../../types/bot/Bot';

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
	trigger: [String],
	trigger_gap_seconds: Number,
	response_delay_seconds: Number,
	startAt: String,
	endAt: String,
	options: {
		type: String,
		enum: Object.values(BOT_TRIGGER_OPTIONS),
	},
	random_string: Boolean,
	message: String,
	group_respond: {
		type: Boolean,
		default: false,
	},
	attachments: [
		{
			type: Schema.Types.ObjectId,
			ref: 'Upload',
		},
	],
	shared_contact_cards: [
		{
			type: Schema.Types.ObjectId,
			ref: 'ContactCard',
		},
	],
	polls: [
		{
			title: String,
			options: [String],
			isMultiSelect: Boolean,
		},
	],
	nurturing: [
		{
			random_string: Boolean,
			message: String,
			after: Number,
			start_from: String,
			end_at: String,
			attachments: [
				{
					type: Schema.Types.ObjectId,
					ref: 'Upload',
				},
			],
			shared_contact_cards: [
				{
					type: Schema.Types.ObjectId,
					ref: 'ContactCard',
				},
			],
			polls: [
				{
					title: String,
					options: [String],
					isMultiSelect: Boolean,
				},
			],
		},
	],
	forward: {
		number: String,
		message: String,
	},
	active: {
		type: Boolean,
		default: true,
	},
});

const BotDB = mongoose.model<IBot>('Bot', botSchema);

export default BotDB;
