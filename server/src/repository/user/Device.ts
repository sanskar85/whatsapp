import { Schema, default as mongoose } from 'mongoose';
import { IDevice } from '../../types/users';

const MILIS_IN_DAY = 24 * 60 * 60 * 1000;
const REVOCATION_TIME = 7 * MILIS_IN_DAY;

const schema = new mongoose.Schema<IDevice>(
	{
		client_id: {
			type: String,
		},
		user: {
			type: Schema.Types.ObjectId,
			ref: 'User',
		},
		phone: {
			type: String,
			required: true,
		},
		name: {
			type: String,
		},
		userType: {
			type: String,
		},
		business_details: {
			description: String,
			email: String,
			websites: [String],
			latitude: Number,
			longitude: Number,
			address: String,
		},
		subscription_expiry: {
			type: Date,
			required: true,
			default: () => Date.now(),
		},
		revoke_at: {
			type: Date,
			required: true,
			default: () => {
				return Date.now() + REVOCATION_TIME;
			},
			index: true,
			expires: 0,
		},
	},
	{ timestamps: { createdAt: true } }
);

schema.index({ user: 1, phone: 1 }, { unique: true });

const DeviceDB = mongoose.model<IDevice>('Device', schema);

export default DeviceDB;
