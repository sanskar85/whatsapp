import APIInstance from '../config/APIInstance';

export default class ReportService {
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
			//ignore
		}
	}
}
