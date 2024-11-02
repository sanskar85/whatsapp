import { Document } from 'mongoose';
import { UserRoles } from '../../config/const';

export default interface IUser extends Document {
	username: string;
	password: string;
	name: string;
	role: UserRoles;

	createdAt: Date;

	verifyPassword(password: string): Promise<boolean>;

	getSignedToken(): string;
	getRefreshToken(): string;
}
