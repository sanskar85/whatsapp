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
			saved: {
				id: 'saved',
				name: 'Saved',
				exclude: [],
				include: [],
				loggers: [],
			},
			unsaved: {
				id: 'unsaved',
				name: 'Unsaved',
				exclude: [],
				include: [],
				loggers: [],
			},
		},
	},
});

const UserPreferencesDB = mongoose.model<IUserPreferences>('UserPreferences', schema);

export default UserPreferencesDB;
