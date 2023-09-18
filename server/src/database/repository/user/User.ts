import mongoose, { Schema } from 'mongoose';
import { IUser } from '../../../types/user';

const userSchema = new Schema<IUser>(
	{
		phone: {
			type: String,
			required: true,
		},
	},
	{ timestamps: true }
);

const User = mongoose.model<IUser>('User', userSchema);

export default User;
