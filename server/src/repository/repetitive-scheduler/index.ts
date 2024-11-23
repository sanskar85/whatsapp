import mongoose, { Schema } from 'mongoose';
import IRepetitiveScheduler from '../../types/repetitive-scheduler';

const schedulerSchema = new mongoose.Schema<IRepetitiveScheduler>({
	user: {
		type: Schema.Types.ObjectId,
		ref: 'User',
	},

	recipients: {
		type: [String],
		default: [],
	},
	recipient_from: String,
	recipient_data: Schema.Types.Mixed,

	scheduling_index: {
		type: Number,
		default: 0,
	},

	message: String,
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

	active: {
		type: Boolean,
		default: true,
	},

	random_string: Boolean,
	title: String,
	description: String,

	dates: {
		type: [String],
		default: [],
	},
	daily_count: {
		type: Number,
		default: 100,
	},
	start_time: {
		type: String,
		default: '10:00',
	},
	end_time: {
		type: String,
		default: '18:00',
	},
});

const RepetitiveSchedulerDB = mongoose.model<IRepetitiveScheduler>(
	'RepetitiveScheduler',
	schedulerSchema
);

export default RepetitiveSchedulerDB;
