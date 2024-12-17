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
});

const UserPreferencesDB = mongoose.model<IUserPreferences>('UserPreferences', schema);

export default UserPreferencesDB;
