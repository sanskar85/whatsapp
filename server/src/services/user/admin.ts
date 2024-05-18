import { DeviceDB } from '../../repository/user';
import { IUser } from '../../types/users';
import DateUtils from '../../utils/DateUtils';
import UserService from './user';

export default class AdminService extends UserService {
	public constructor(user: IUser) {
		super(user);
	}

	async allUsers() {
		const devices = await DeviceDB.find().populate<{ user: IUser }>('user');
		return devices.map((device) => {
			return {
				id: device._id as string,
				username: device.user.username,
				name: device.name,
				phone: device.phone,
				type: device.userType,
				subscription_expiry: DateUtils.format(device.subscription_expiry, 'DD/MM/YYYY'),
				description: device.business_details.description ?? '',
				email: device.business_details.email ?? '',
				websites: (device.business_details.websites ?? []).join(', '),
				latitude: device.business_details.latitude ?? '',
				longitude: device.business_details.longitude ?? '',
				address: device.business_details.address ?? '',
			};
		});
	}
}
