import mongoose, { Schema } from 'mongoose';
import IScheduler from '../../types/scheduler';

const schedulerSchema = new mongoose.Schema<IScheduler>({
	user: {
		type: Schema.Types.ObjectId,
		ref: 'User',
	},
	csv: {
		type: Schema.Types.ObjectId,
		ref: 'Upload',
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
	start_from: String,
	end_at: String,
});

const SchedulerDB = mongoose.model<IScheduler>('Scheduler', schedulerSchema);

export default SchedulerDB;
