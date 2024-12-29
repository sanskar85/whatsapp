import mongoose, { Schema } from 'mongoose';
import { IUserPreferences } from '../../types/users';

const schema = new Schema<IUserPreferences>({
	user: {
		type: Schema.Types.ObjectId,
		ref: 'User',
	},
	isLoggerEnabled: {
		type: Boolean,
		default: false,
	},
	messageLogSheetId: {
		type: String,
		default: '',
	},
	messageLogRules: {
		type: Object,
		default: {
			individual_text: {
				id: 'individual_text',
				name: 'Text',
				saved: false,
				unsaved: false,
				exclude: [],
				include: [],
				loggers: [],
			},
			individual_media: {
				id: 'individual_media',
				name: 'Media',
				saved: false,
				unsaved: false,
				exclude: [],
				include: [],
				loggers: [],
			},
		},
	},
	messageModerationRules: {
		type: Object,
		default: {},
	},
	messageStarRules: {
		type: Object,
		default: {
			individual_outgoing_messages: false,
			individual_incoming_messages: false,
			group_outgoing_messages: false,
			group_incoming_messages: false,
		},
	},
});

const UserPreferencesDB = mongoose.model<IUserPreferences>('UserPreferences', schema);

export default UserPreferencesDB;
