import { Document, Types } from 'mongoose';

export default interface IAPIKey extends Document {
	_id: Types.ObjectId;
	linked_to: Types.ObjectId;

	name: string;
	token: string;
	createdAt: Date;

	generateToken(): string;
}
