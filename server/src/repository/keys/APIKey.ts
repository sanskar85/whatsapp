import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { API_SECRET } from '../../config/const';
import IAPIKey from '../../types/keys/APIKey';

const schema = new mongoose.Schema<IAPIKey>(
	{
		linked_to: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: true,
		},

		name: {
			type: String,
			required: true,
		},
		token: {
			type: String,
			required: true,
			select: false,
			default: function () {
				return jwt.sign({ id: this._id }, API_SECRET);
			},
		},
	},
	{
		timestamps: { createdAt: true },
	}
);

schema.methods.generateToken = function () {
	return jwt.sign({ id: this._id }, API_SECRET);
};

const APIKeyDB = mongoose.model<IAPIKey>('APIKey', schema);

export default APIKeyDB;
