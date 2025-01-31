import APIInstance from '../config/APIInstance';

export default class ReportService {
	static async exportBusinessLeads({
		type,
		page,
		limit,
	}: {
		type: 'ALL' | 'GROUP_ALL' | 'GROUP_ADMINS';
		page: string;
		limit: string;
	}) {
		try {
			const response = await APIInstance.get(
				`/reports/leads/business?type=${type}&page=${page}&limit=${limit}`,
				{
					responseType: 'blob',
					headers: {
						'Content-Type': 'text/csv',
					},
				}
			);

			const blob = new Blob([response.data], { type: 'text/csv' });
			const downloadLink = document.createElement('a');
			downloadLink.href = window.URL.createObjectURL(blob);
			downloadLink.download = 'Business Leads.csv'; // Specify the filename
			document.body.appendChild(downloadLink);
			downloadLink.click();
			document.body.removeChild(downloadLink);
		} catch (err) {
			//ignore
			throw new Error();
		}
	}
}
