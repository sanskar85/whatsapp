import mongoose, { Schema } from 'mongoose';
import { BOT_TRIGGER_OPTIONS } from '../../config/const';
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
	start_time: String,
	end_time: String,
	canSendAdmin: Boolean,
	multiple_responses: Boolean,
	triggers: [String],
	options: {
		type: String,
		enum: BOT_TRIGGER_OPTIONS,
		default: BOT_TRIGGER_OPTIONS.EXACT_MATCH_CASE,
	},
	forward: {
		number: String,
		message: String,
	},
	allowed_country_codes: {
		type: [String],
		default: [],
	},
	moderation_rules: {
		type: {
			file_types: [String],
			group_rule: {
				message: String,
				shared_contact_cards: [
					{
						type: Schema.Types.ObjectId,
						ref: 'ContactCard',
					},
				],
				attachments: [
					{
						type: Schema.Types.ObjectId,
						ref: 'Upload',
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
			admin_rule: {
				message: String,
				shared_contact_cards: [
					{
						type: Schema.Types.ObjectId,
						ref: 'ContactCard',
					},
				],
				attachments: [
					{
						type: Schema.Types.ObjectId,
						ref: 'Upload',
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
			creator_rule: {
				message: String,
				shared_contact_cards: [
					{
						type: Schema.Types.ObjectId,
						ref: 'ContactCard',
					},
				],
				attachments: [
					{
						type: Schema.Types.ObjectId,
						ref: 'Upload',
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
		},
		default: {
			file_types: [],
			group_rule: {
				message: '',
				shared_contact_cards: [],
				attachments: [],
				polls: [],
			},
			admin_rule: {
				message: '',
				shared_contact_cards: [],
				attachments: [],
				polls: [],
			},
			creator_rule: {
				message: '',
				shared_contact_cards: [],
				attachments: [],
				polls: [],
			},
		},
	},
});

const MergedGroupDB = mongoose.model<IMergedGroup>('MergedGroup', mergedGroupSchema);

export default MergedGroupDB;
