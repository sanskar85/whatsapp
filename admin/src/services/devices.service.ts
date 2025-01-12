import APIInstance from '../config/APIInstance';
import { User } from '../store/types/UsersState';

export default class DeviceService {
	// static async getUsers(): Promise<User[]> {
	// 	try {
	// 		const { data } = await APIInstance.get(`/users`);
	// 		return data.users.map((user: User) => ({
	// 			id: (user.id as string) ?? '',
	// 			name: (user.name as string) ?? '',
	// 			phone: (user.phone as string) ?? '',
	// 			type: (user.type as string) ?? 'PERSONAL',
	// 			subscription_expiry: (user.subscription_expiry as string) ?? '',
	// 		}));
	// 	} catch (err) {
	// 		return [];
	// 	}
	// }

	static async getDevices({ csv }: { csv: boolean } = { csv: false }) {
		try {
			const response = await APIInstance.get(
				`/users/devices?csv=${csv ? 'true' : 'false'}`,

				{ responseType: csv ? 'blob' : 'json' }
			);

			if (csv) {
				const blob = new Blob([response.data], { type: 'text/csv' });
				const downloadLink = document.createElement('a');
				downloadLink.href = window.URL.createObjectURL(blob);
				downloadLink.download = 'User Details.csv'; // Specify the filename
				document.body.appendChild(downloadLink);
				downloadLink.click();
				document.body.removeChild(downloadLink);
			} else {
				return response.data.devices.map((user: User) => ({
					id: (user.id as string) ?? '',
					device_id: (user.device_id as string) ?? '',
					name: (user.name as string) ?? '',
					username: (user.username as string) ?? '',
					profile_name: (user.profile_name as string) ?? '',
					phone: (user.phone as string) ?? '',
					type: (user.type as string) ?? 'PERSONAL',
					isOnline: (user.isOnline as boolean) ?? false,
					isGoogleSheetAvailable: (user.isGoogleSheetAvailable as boolean) ?? false,
					subscription_expiry: (user.subscription_expiry as string) ?? '',
				}));
			}
		} catch (err) {
			return [];
		}
	}

	static async shareMessageLogs(user_id: string, email: string) {
		try {
			await APIInstance.post(`/users/${user_id}/share-log-file`, {
				email,
			});
			return true;
		} catch (err) {
			return false;
		}
	}

	static async extendExpiry(user_id: string, date: string) {
		try {
			await APIInstance.post(`/users/${user_id}/extend-expiry`, {
				date: date,
			});
		} catch (err) {
			//ignore
		}
	}

	static async sendPaymentReminder(user_id: string, message: string) {
		try {
			await APIInstance.post(`/users/${user_id}/send-payment-reminder`, {
				message,
			});
		} catch (err) {
			//ignore
		}
	}

	static async logoutDevice(user_id: string) {
		try {
			await APIInstance.post(`/users/${user_id}/logout`);
		} catch (err) {
			//ignore
		}
	}
}
