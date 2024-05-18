import { Types } from 'mongoose';
import { getRefreshTokens, removeRefreshTokens } from '../../config/cache';
import { UserRoles } from '../../config/const';
import InternalError, { INTERNAL_ERRORS } from '../../errors/internal-errors';
import StorageDB from '../../repository/storage';
import { UserDB } from '../../repository/user';
import { IUser } from '../../types/users';
import { generateRandomText, idValidator } from '../../utils/ExpressUtils';

export default class UserService {
	private user: IUser;

	public constructor(user: IUser) {
		this.user = user;
	}

	static async getServiceByCredentials(username: string, password: string) {
		const user = await UserDB.findOne({ username }).select('+password');

		if (user === null) {
			throw new InternalError(INTERNAL_ERRORS.USER_ERRORS.NOT_FOUND);
		}

		const password_matched = await user.verifyPassword(password);
		if (!password_matched) {
			throw new InternalError(INTERNAL_ERRORS.USER_ERRORS.INVALID_PASSWORD);
		}
		return new UserService(user);
	}

	static async getService(username: string | Types.ObjectId) {
		let user: IUser | null = null;
		if (typeof username === 'string') {
			user = await UserDB.findOne({ username });
		} else {
			user = await UserDB.findById(username);
		}

		if (user === null) {
			throw new InternalError(INTERNAL_ERRORS.USER_ERRORS.NOT_FOUND);
		}
		return new UserService(user);
	}

	getID() {
		return new Types.ObjectId(this.user._id);
	}

	getName() {
		return this.user.name;
	}

	getToken() {
		return this.user.getSignedToken();
	}

	getRefreshToken() {
		return this.user.getRefreshToken();
	}

	getUser() {
		return this.user;
	}

	async setPassword(password: string) {
		this.user.password = password;
		await this.user.save();
	}

	getRole() {
		return this.user.role;
	}

	async generatePasswordResetToken() {
		const token = generateRandomText(24);
		await StorageDB.setString(token, this.getID().toString());
		return token;
	}

	static async isValidAuth(
		refreshToken: string
	): Promise<{ valid: true; user: IUser } | { valid: false; user: null }> {
		const refreshTokens = await getRefreshTokens();

		const [isIDValid, id] = idValidator(refreshTokens[refreshToken] ?? '');

		if (!isIDValid) {
			return {
				valid: false,
				user: null,
			};
		}

		const user = await UserDB.findById(id);
		if (user === null) {
			return {
				valid: false,
				user: null,
			};
		}
		return {
			valid: true,
			user: user,
		};
	}

	static async createUser(username: string, password?: string) {
		const user = await UserDB.findOne({ username });

		if (user) {
			throw new InternalError(INTERNAL_ERRORS.USER_ERRORS.USERNAME_ALREADY_EXISTS);
		}

		const createdUser = await UserDB.create({
			username,
			password: password ?? generateRandomText(8),
			role: UserRoles.USER,
		});
		return new UserService(createdUser);
	}

	static async logout(refreshToken: string) {
		try {
			await removeRefreshTokens(refreshToken);
		} catch (e) {
			//ignored
		}
	}

	async logout(refreshToken: string) {
		removeRefreshTokens(refreshToken);
	}
}
