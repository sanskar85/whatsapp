/* eslint-disable no-var */

import { Types } from 'mongoose';
import { UserService } from '../services';
import { AdminService } from '../services/user';

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
	user: UserService;
	admin: AdminService;
	data: any;
	id: Types.ObjectId;
	token: string;
}

export { IAPIError, default as ServerError } from './server-error';
