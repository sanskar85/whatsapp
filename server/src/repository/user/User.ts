import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import mongoose, { Schema } from 'mongoose';
import {
	JWT_EXPIRE,
	JWT_SECRET,
	REFRESH_EXPIRE,
	REFRESH_SECRET,
	UserRoles,
} from '../../config/const';
import { IUser } from '../../types/users';
import { generateHashedPassword } from '../../utils/ExpressUtils';

const schema = new Schema<IUser>(
	{
		name: String,
		username: {
			type: String,
			unique: true,
			index: true,
		},
		password: {
			type: String,
			select: false,
		},
		role: {
			type: String,
			enum: Object.values(UserRoles),
			default: UserRoles.USER,
		},
	},
	{ timestamps: true }
);

schema.pre('save', async function (next) {
	if (!this.isModified('password')) return next();

	try {
		this.password = await generateHashedPassword(this.password);
		return next();
	} catch (err: any) {
		return next(err);
	}
});

schema.methods.verifyPassword = async function (password: string) {
	return await bcrypt.compare(password, this.password);
};

schema.methods.getSignedToken = function () {
	return jwt.sign({ id: this._id }, JWT_SECRET, {
		expiresIn: JWT_EXPIRE,
	});
};

schema.methods.getRefreshToken = function () {
	const token = jwt.sign({ id: this._id }, REFRESH_SECRET, {
		expiresIn: REFRESH_EXPIRE,
	});
	return token;
};

const UserDB = mongoose.model<IUser>('User', schema);

export default UserDB;
