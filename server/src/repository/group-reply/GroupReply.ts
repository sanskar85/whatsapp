import mongoose, { Schema } from 'mongoose';
import IGroupReply from '../../types/group-reply';

const schema = new mongoose.Schema<IGroupReply>(
	{
		user: {
			type: Schema.Types.ObjectId,
			ref: 'User',
		},
		from: {
			type: String,
		},
		mergedGroup: {
			type: Schema.Types.ObjectId,
			ref: 'MergedGroup',
		},
		group_name: String,
		unique_id: String,
	},
	{ timestamps: true }
);
schema.index({ user: 1, from: 1, mergedGroup: 1, unique_id: 1 }, { unique: true });

const GroupReplyDB = mongoose.model<IGroupReply>('GroupReply', schema);

export default GroupReplyDB;
