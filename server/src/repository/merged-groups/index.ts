import mongoose, { Schema } from 'mongoose';
import IMergedGroup from '../../types/merged-group';

const mergedGroupSchema = new mongoose.Schema<IMergedGroup>({
	user: {
		type: Schema.Types.ObjectId,
		ref: 'User',
	},
	name: String,
	groups: [String],
	group_reply_saved: [
		{
			text: String,
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
	group_reply_unsaved: [
		{
			text: String,
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
	private_reply_saved: [
		{
			text: String,
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
	private_reply_unsaved: [
		{
			text: String,
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
	restricted_numbers: [
		{
			type: Schema.Types.ObjectId,
			ref: 'Upload',
		},
	],
	reply_business_only: Boolean,
	random_string: Boolean,
	active: { type: Boolean, default: true },
	min_delay: Number,
	max_delay: Number,
	canSendAdmin: Boolean,
});

const MergedGroupDB = mongoose.model<IMergedGroup>('MergedGroup', mergedGroupSchema);

export default MergedGroupDB;
