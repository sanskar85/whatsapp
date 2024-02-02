/* eslint-disable no-var */

import { Types } from 'mongoose';
import { IUser } from './user';

export { APIError } from './server-error';

declare global {
	var __basedir: string;
	var __augmont_auth_token: string;

	namespace Express {
		interface Request {
			locals: Locals;
		}
		interface Response {
			locals: Locals;
		}
	}
}
export interface Locals {
	client_id: string;
	user: IUser;
	data: any;
	id: Types.ObjectId;
	token: string;
}

export { IAPIError, default as ServerError } from './server-error';
