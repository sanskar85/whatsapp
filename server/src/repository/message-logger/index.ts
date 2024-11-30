import mongoose, { Schema } from 'mongoose';
import IMessageLogger from '../../types/messageLogger';

const schema = new mongoose.Schema<IMessageLogger>({
	user: {
		type: Schema.Types.ObjectId,
		ref: 'User',
	},

	sheetId: {
		type: String,
		required: true,
	},
	timestamp: String,
	from: String,
	to: String,
	savedName: String,
	displayName: String,
	groupName: String,
	message: String,
	isCaption: String,
	link: String,
});

const MessageLoggerDB = mongoose.model<IMessageLogger>('MessageLogger', schema);

export default MessageLoggerDB;
