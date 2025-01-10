import { UserRoles } from '../../config/const';
import { WhatsappProvider } from '../../provider/whatsapp_provider';
import { DeviceDB, UserDB } from '../../repository/user';
import { IDevice, IUser } from '../../types/users';
import DateUtils from '../../utils/DateUtils';
import UserService from './user';
import UserPreferencesService from './userPreferences';

export default class AdminService extends UserService {
	public constructor(user: IUser) {
		super(user);
	}

	async allUsers() {
		const users = await UserDB.find({
			role: UserRoles.USER,
		});

		const client_ids = users
			.map((user) => WhatsappProvider.clientByUser(user._id))
			.filter((client) => !!client) as string[];

		const devices = await DeviceDB.find({
			client_id: {
				$in: client_ids,
			},
		});

		const devicesMap = devices.reduce(
			(acc, device) => {
				acc[device.user.toString()] = device;
				return acc;
			},
			{} as {
				[key: string]: IDevice;
			}
		);

		const userLinkMap = users.reduce(
			(acc, user) => {
				acc[user._id.toString()] = {
					user,
					device: devicesMap[user._id.toString()] ?? null,
				};
				return acc;
			},
			{} as {
				[key: string]: {
					user: IUser;
					device: IDevice | null;
				};
			}
		);

		const promises = Object.keys(userLinkMap).map(async (key) => {
			const { user, device } = userLinkMap[key];

			const userPrefService = await UserPreferencesService.getService(user._id);

			const isOnline = !!(device?.client_id
				? WhatsappProvider.clientByClientID(device.client_id)?.isReady()
				: false);

			return {
				id: user._id as string,
				username: user.username,
				name: user.name,
				device_id: device?._id as string,
				profile_name: device?.name ?? 'N/A',
				phone: device?.phone ?? 'N/A',
				type: (device?.userType ?? 'N/A') as 'BUSINESS' | 'PERSONAL' | 'N/A',
				subscription_expiry: device?.subscription_expiry
					? DateUtils.format(device.subscription_expiry, 'DD/MM/YYYY')
					: 'N/A',
				description: device?.business_details.description ?? '',
				email: device?.business_details.email ?? '',
				websites: (device?.business_details.websites ?? []).join(', '),
				latitude: device?.business_details.latitude ?? 0,
				longitude: device?.business_details.longitude ?? 0,
				address: device?.business_details.address ?? '',
				isOnline,
				isGoogleSheetAvailable: userPrefService.getMessageLogSheetId() !== '',
			};
		});

		return Promise.all(promises);
	}

	async allDevices() {
		const users = await UserDB.find({
			role: UserRoles.USER,
		});

		const devices = await DeviceDB.find();

		const usersMap = users.reduce(
			(acc, user) => {
				acc[user._id.toString()] = user;
				return acc;
			},
			{} as {
				[key: string]: IUser;
			}
		);

		const devicesLinkMap = devices.reduce(
			(acc, device) => {
				acc[device.user.toString()] = {
					user: usersMap[device.user.toString()],
					device: device,
				};
				return acc;
			},
			{} as {
				[key: string]: {
					user: IUser;
					device: IDevice | null;
				};
			}
		);

		const promises = Object.keys(devicesLinkMap).map(async (key) => {
			const { user, device } = devicesLinkMap[key];

			const userPrefService = await UserPreferencesService.getService(user._id);

			const isOnline = !!(device?.client_id
				? WhatsappProvider.clientByClientID(device.client_id)?.isReady()
				: false);

			return {
				id: user._id as string,
				username: user.username,
				name: user.name,
				device_id: device?._id as string,
				profile_name: device?.name ?? 'N/A',
				phone: device?.phone ?? 'N/A',
				type: (device?.userType ?? 'N/A') as 'BUSINESS' | 'PERSONAL' | 'N/A',
				subscription_expiry: device?.subscription_expiry
					? DateUtils.format(device.subscription_expiry, 'DD/MM/YYYY')
					: 'N/A',
				description: device?.business_details.description ?? '',
				email: device?.business_details.email ?? '',
				websites: (device?.business_details.websites ?? []).join(', '),
				latitude: device?.business_details.latitude ?? 0,
				longitude: device?.business_details.longitude ?? 0,
				address: device?.business_details.address ?? '',
				isOnline,
				isGoogleSheetAvailable: userPrefService.getMessageLogSheetId() !== '',
			};
		});

		return Promise.all(promises);
	}
}
