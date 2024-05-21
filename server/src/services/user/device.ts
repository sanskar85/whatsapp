import moment from 'moment';
import { Types } from 'mongoose';
import WAWebJS from 'whatsapp-web.js';
import InternalError, { INTERNAL_ERRORS } from '../../errors/internal-errors';
import { DeviceDB } from '../../repository/user';
import { IDevice, IUser } from '../../types/users';
import DateUtils from '../../utils/DateUtils';
import BotService from '../bot';
import { PaymentService } from '../payments';
import UserService from './user';

export default class DeviceService extends UserService {
	private device: IDevice;

	public constructor(device: IDevice, user: IUser) {
		super(user);
		this.device = device;
	}

	static async getDeviceService(phone: string | Types.ObjectId) {
		let device: IDevice | null = null;

		if (typeof phone === 'string') {
			device = await DeviceDB.findOne({ phone });
		} else {
			device = await DeviceDB.findById(phone);
		}
		if (device === null) {
			throw new InternalError(INTERNAL_ERRORS.USER_ERRORS.NOT_FOUND);
		}
		const user = await UserService.getService(new Types.ObjectId(device.user));
		return new DeviceService(device, user.getUser());
	}

	static async getServiceByClientID(client_id: string) {
		const device = await DeviceDB.findOne({ client_id });
		if (device === null) {
			throw new InternalError(INTERNAL_ERRORS.USER_ERRORS.NOT_FOUND);
		}

		const user = await UserService.getService(device.user);
		return new DeviceService(device, user.getUser());
	}

	getUserId() {
		return new Types.ObjectId(this.device._id);
	}

	getName() {
		return this.device.name;
	}

	getPhoneNumber() {
		return this.device.phone;
	}

	getUserType() {
		return this.device.userType;
	}

	async setClientID(client_id: string) {
		await DeviceDB.updateOne({ _id: this.device._id }, { client_id });
	}

	async logout() {
		DeviceService.logout(this.device.client_id);
	}

	isSubscribed() {
		const isPaymentValid = this.device.subscription_expiry
			? DateUtils.getMoment(this.device.subscription_expiry).isAfter(DateUtils.getMomentNow())
			: false;

		const isNew = DateUtils.getMoment(this.device.createdAt)
			.add(7, 'days')
			.isAfter(DateUtils.getMomentNow());

		return {
			isSubscribed: isPaymentValid,
			isNew: isNew,
		};
	}

	getExpiration<T extends string | null>(
		format: T = null as T
	): T extends string ? string : moment.Moment {
		if (format) {
			return DateUtils.getMoment(this.device.subscription_expiry).format(format) as T extends string
				? string
				: moment.Moment;
		}
		return DateUtils.getMoment(this.device.subscription_expiry) as T extends string
			? string
			: moment.Moment;
	}

	async addMonthToExpiry(months: number = 1) {
		if (this.device.subscription_expiry) {
			if (DateUtils.getMoment(this.device.subscription_expiry).isAfter(DateUtils.getMomentNow())) {
				this.device.subscription_expiry = DateUtils.getMoment(this.device.subscription_expiry)
					.add(months, 'months')
					.toDate();
			} else {
				this.device.subscription_expiry = DateUtils.getMomentNow().add(months, 'months').toDate();
			}
		} else {
			this.device.subscription_expiry = DateUtils.getMomentNow().add(months, 'months').toDate();
		}

		await this.device.save();
	}
	async setExpiry(date: moment.Moment) {
		if (this.device.subscription_expiry) {
			if (DateUtils.getMoment(this.device.subscription_expiry).isBefore(date)) {
				this.device.subscription_expiry = date.toDate();
				await this.device.save();
			}
		} else {
			this.device.subscription_expiry = date.toDate();
			await this.device.save();
		}
	}

	getPaymentRecords() {
		return PaymentService.getPaymentRecords(this.device.phone);
	}

	pauseSubscription(id: Types.ObjectId) {
		return PaymentService.pauseSubscription(id, this.device.phone);
	}

	resumeSubscription(id: Types.ObjectId) {
		return PaymentService.resumeSubscription(id, this.device.phone);
	}

	static async createDevice({
		user,
		name,
		phone,
		isBusiness,
		business_details,
	}: {
		user: UserService;
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
		const device = await DeviceDB.findOne({ phone });

		if (device) {
			device.user = user.getUserId();
			device.userType = isBusiness ? 'BUSINESS' : 'PERSONAL';
			device.name = name ?? '';
			device.business_details = business_details ?? {
				description: '',
				email: '',
				websites: [] as string[],
				latitude: 0,
				longitude: 0,
				address: '',
			};
			await device.save();
			return new DeviceService(device, user.getUser());
		}

		const created_device = await DeviceDB.create({
			user: user.getUserId(),
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
		return new DeviceService(created_device, user.getUser());
	}
	static async addMonthToExpiry(phone: string, months: number = 1) {
		let device = await DeviceDB.findOne({ phone });

		if (!device) {
			device = await DeviceDB.create({
				phone,
			});
		}

		if (device.subscription_expiry) {
			if (DateUtils.getMoment(device.subscription_expiry).isAfter(DateUtils.getMomentNow())) {
				device.subscription_expiry = DateUtils.getMoment(device.subscription_expiry)
					.add(months, 'months')
					.toDate();
			} else {
				device.subscription_expiry = DateUtils.getMomentNow().add(months, 'months').toDate();
			}
		} else {
			device.subscription_expiry = DateUtils.getMomentNow().add(months, 'months').toDate();
		}
	}

	static async logout(client_id: string) {
		try {
			await DeviceDB.updateOne(
				{
					client_id,
				},
				{
					client_id: '',
				}
			);
		} catch (e) {
			//ignored
		}
	}

	static async isValidDevice(client_id: string): Promise<
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
		const auth = await DeviceDB.findOne({
			client_id,
		}).populate<{ user: IUser }>('user');

		if (!auth) {
			return {
				valid: false,
				revoke_at: undefined,
				user: undefined,
			};
		}

		const isPaymentValid = !auth.subscription_expiry
			? DateUtils.getMoment(auth.subscription_expiry).isAfter(DateUtils.getMomentNow())
			: false;

		if (isPaymentValid) {
			return {
				valid: true,
				revoke_at: auth.subscription_expiry,
				user: auth.user,
			};
		}

		if (DateUtils.getMoment(auth.revoke_at).isBefore(DateUtils.getMomentNow())) {
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

	public async handleMessage({
		triggered_from,
		body,
		contact,
		client_id,
		isGroup = false,
		fromPoll = false,
		message_id = '',
	}: {
		triggered_from: string;
		body: string;
		contact: WAWebJS.Contact;
		isGroup: boolean;
		fromPoll: boolean;
		message_id: string;
		client_id: string;
	}) {
		const { isSubscribed, isNew } = this.isSubscribed();
		if (!isSubscribed && !isNew) {
			return;
		}

		const botService = new BotService(this.getUser());
		botService.handleMessage(triggered_from, body, contact, {
			isGroup,
			fromPoll,
			message_id,
			isNew,
			isSubscribed,
			client_id,
			device_id: this.device._id,
		});
	}
}
