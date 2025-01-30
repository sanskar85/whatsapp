import APIInstance from '../config/APIInstance';

export default class ReportService {
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

	static async exportBusinessLeads() {
		try {
			const response = await APIInstance.get(`/reports/leads/business`, {
				responseType: 'blob',
				headers: {
					'Content-Type': 'text/csv',
				},
			});

			const blob = new Blob([response.data], { type: 'text/csv' });
			const downloadLink = document.createElement('a');
			downloadLink.href = window.URL.createObjectURL(blob);
			downloadLink.download = 'Business Leads.csv'; // Specify the filename
			document.body.appendChild(downloadLink);
			downloadLink.click();
			document.body.removeChild(downloadLink);
		} catch (err) {
			console.log(err);
		}
	}
}
