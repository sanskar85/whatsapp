import mongoose, { Schema } from 'mongoose';
import { IUserPreferences } from '../../types/users';

const schema = new Schema<IUserPreferences>({
	user: {
		type: Schema.Types.ObjectId,
		ref: 'User',
	},
	isMessagesLogEnabled: {
		type: Boolean,
		default: false,
	},
	messageLogSheetId: {
		type: String,
		default: '',
	},
	individual_text_message: {
		type: Boolean,
		default: false,
	},
	individual_media_message: {
		type: Boolean,
		default: false,
	},
	group_text_message: {
		type: Boolean,
		default: false,
	},
	group_media_message: {
		type: Boolean,
		default: false,
	},
	isMessageStarEnabled: {
		type: Boolean,
		default: false,
	},
});

const UserPreferencesDB = mongoose.model<IUserPreferences>('UserPreferences', schema);

export default UserPreferencesDB;
