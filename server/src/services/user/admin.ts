import { UserRoles } from '../../config/const';
import { WhatsappProvider } from '../../provider/whatsapp_provider';
import { DeviceDB, UserDB } from '../../repository/user';
import { IDevice, IUser } from '../../types/users';
import DateUtils from '../../utils/DateUtils';
import UserService from './user';

export default class AdminService extends UserService {
	public constructor(user: IUser) {
		super(user);
	}

	async allUsers() {
		const users = await UserDB.find({
			role: UserRoles.USER,
		});

		const ids = users.map((user) => user._id);

		const devices = await DeviceDB.find({
			user: {
				$in: ids,
			},
		});

		const userLinkMap = devices.reduce(
			(acc, device) => {
				acc[device.user.toString()] = {
					user: users.find((user) => user._id.toString() === device.user.toString()) as IUser,
					device,
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

		return Object.keys(userLinkMap).map((key) => {
			const { user, device } = userLinkMap[key];
			const isOnline = !!(device?.client_id
				? WhatsappProvider.clientByClientID(device.client_id)?.isReady()
				: false);
			return {
				id: user._id as string,
				username: user.username,
				name: user.name,
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
			};
		});
	}
}
