import moment from 'moment';
import { Types } from 'mongoose';
import { MESSAGE_STATUS } from '../../config/const';
import InternalError, { INTERNAL_ERRORS } from '../../errors/internal-errors';
import { BotDB } from '../../repository/bot';
import { MessageDB } from '../../repository/messenger';
import { AuthDetailDB, UserDB } from '../../repository/user';
import { IUser } from '../../types/user';
import DateUtils from '../../utils/DateUtils';
import { PaymentService } from '../payments';

export default class UserService {
	private user: IUser;

	public constructor(user: IUser) {
		this.user = user;
	}

	static async getService(phone: string | Types.ObjectId) {
		let user: IUser | null = null;
		if (typeof phone === 'string') {
			user = await UserDB.findOne({ phone });
		} else {
			user = await UserDB.findById(phone);
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

	getPhoneNumber() {
		return this.user.phone;
	}

	getUserType() {
		return this.user.userType;
	}

	async login(client_id: string) {
		try {
			const auth = await AuthDetailDB.findOne({
				user: this.user._id,
				client_id,
			});
			if (auth && !auth.isRevoked) return;
			if (auth && auth.isRevoked) {
				await auth.remove();
			}
			await AuthDetailDB.create({
				user: this.user._id,
				client_id,
			});
		} catch (e) {
			//ignored
		}
	}
	async logout(client_id?: string) {
		if (client_id) {
			UserService.logout(client_id);
			return [client_id];
		}

		const auth = await AuthDetailDB.find({
			user: this.user._id,
			isRevoked: false,
		});

		auth.forEach((el) => el.remove());

		return auth.map((el) => el.client_id);
	}

	getUser() {
		return this.user;
	}

	isSubscribed() {
		const isPaymentValid = this.user.subscription_expiry
			? DateUtils.getMoment(this.user.subscription_expiry).isAfter(DateUtils.getMomentNow())
			: false;
		const isNew = DateUtils.getMoment(this.user.createdAt)
			.add(7, 'days')
			.isAfter(DateUtils.getMomentNow());
		return {
			isSubscribed: isPaymentValid,
			isNew: isNew,
		};
	}

	getExpiration(format?: string) {
		if (format) {
			return DateUtils.getMoment(this.user.subscription_expiry).format(format);
		}
		return DateUtils.getMoment(this.user.subscription_expiry);
	}

	async save() {
		this.user.save();
	}

	async addMonthToExpiry(months: number = 1) {
		if (this.user.subscription_expiry) {
			if (DateUtils.getMoment(this.user.subscription_expiry).isAfter(DateUtils.getMomentNow())) {
				this.user.subscription_expiry = DateUtils.getMoment(this.user.subscription_expiry)
					.add(months, 'months')
					.toDate();
			} else {
				this.user.subscription_expiry = DateUtils.getMomentNow().add(months, 'months').toDate();
			}
		} else {
			this.user.subscription_expiry = DateUtils.getMomentNow().add(months, 'months').toDate();
		}

		await this.user.save();
	}

	async setExpiry(date: moment.Moment) {
		if (this.user.subscription_expiry) {
			if (DateUtils.getMoment(this.user.subscription_expiry).isBefore(date)) {
				this.user.subscription_expiry = date.toDate();
				await this.user.save();
			}
		} else {
			this.user.subscription_expiry = date.toDate();
			await this.user.save();
		}
	}

	getPaymentRecords() {
		return PaymentService.getPaymentRecords(this.user.phone);
	}

	pauseSubscription(id: Types.ObjectId) {
		return PaymentService.pauseSubscription(id, this.user.phone);
	}

	resumeSubscription(id: Types.ObjectId) {
		return PaymentService.resumeSubscription(id, this.user.phone);
	}

	static async createUser({
		name,
		phone,
		isBusiness,
		business_details,
	}: {
		name?: string;
		phone: string;
		isBusiness?: boolean;
		business_details?: {
			description: string;
			email: string;
			websites: string[];
			latitude: number;
			longitude: number;
			address: string;
		};
	}) {
		const user = await UserDB.findOne({ phone });

		if (user) {
			user.userType = isBusiness ? 'BUSINESS' : 'PERSONAL';
			user.name = name ?? '';
			user.business_details = business_details ?? {
				description: '',
				email: '',
				websites: [] as string[],
				latitude: 0,
				longitude: 0,
				address: '',
			};
			await user.save();

			return new UserService(user);
		}

		const createdUser = await UserDB.create({
			name,
			phone,
			userType: isBusiness ? 'BUSINESS' : 'PERSONAL',
			business_details: business_details ?? {
				description: '',
				email: '',
				websites: [] as string[],
				latitude: 0,
				longitude: 0,
				address: '',
			},
		});

		return new UserService(createdUser);
	}

	static async logout(client_id: string) {
		try {
			await AuthDetailDB.deleteOne({
				client_id,
			});
		} catch (e) {
			//ignored
		}
	}

	static async isValidAuth(client_id: string): Promise<
		| {
				valid: false;
				revoke_at: undefined;
				user: undefined;
		  }
		| {
				valid: true;
				revoke_at: Date;
				user: IUser;
		  }
	> {
		const auth = await AuthDetailDB.findOne({
			client_id,
		}).populate('user');

		if (!auth) {
			return {
				valid: false,
				revoke_at: undefined,
				user: undefined,
			};
		}

		const isPaymentValid = !auth.user.subscription_expiry
			? DateUtils.getMoment(auth.user.subscription_expiry).isAfter(DateUtils.getMomentNow())
			: false;

		if (auth.isRevoked) {
			return {
				valid: false,
				revoke_at: undefined,
				user: undefined,
			};
		}

		if (isPaymentValid) {
			return {
				valid: true,
				revoke_at: auth.user.subscription_expiry,
				user: auth.user,
			};
		}

		if (DateUtils.getMoment(auth.revoke_at).isBefore(DateUtils.getMomentNow())) {
			if (!auth.isRevoked) {
				await auth.updateOne({
					isRevoked: true,
				});
			}
			return {
				valid: false,
				revoke_at: undefined,
				user: undefined,
			};
		}

		return {
			valid: true,
			revoke_at: auth.revoke_at,
			user: auth.user,
		};
	}

	static async getRevokedSessions() {
		const revokable = await AuthDetailDB.find({
			revoke_at: {
				$lt: DateUtils.getMomentNow().toDate(),
			},
		}).populate('user');

		const sessions = revokable.filter((auth) => {
			const userService = new UserService(auth.user);
			const { isSubscribed } = userService.isSubscribed();
			return !isSubscribed || auth.isRevoked;
		});

		return sessions;
	}

	static async getInactiveSessions() {
		const revokable = await AuthDetailDB.find({
			isRevoked: false,
			last_active: {
				$lt: DateUtils.getMomentNow().subtract(12, 'hours').toDate(),
			},
		});

		const scheduled = await MessageDB.find({
			status: MESSAGE_STATUS.PENDING,
		}).distinct('user');
		const responseUsers = await BotDB.find().distinct('user');

		const scheduledSet = new Set(scheduled);
		const responseSet = new Set(responseUsers.map((user) => user.toString()));

		const sessions = revokable.filter(
			(auth) => !scheduledSet.has(auth.client_id) && !responseSet.has(auth.user.toString())
		);

		return sessions;
	}

	static async sessionDisconnected(client_id: string) {
		await AuthDetailDB.updateOne(
			{ client_id },
			{
				last_active: DateUtils.getMomentNow().toDate(),
			}
		);
	}
}
