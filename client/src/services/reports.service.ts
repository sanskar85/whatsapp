import APIInstance from '../config/APIInstance';

type Poll = {
	title: string;
	isMultiSelect: boolean;
	options: string[];
};
export default class ReportsService {
	static async generateAllCampaigns() {
		try {
			const { data: response } = await APIInstance.get(`/reports/campaign`);

			return response.report as {
				campaign_id: string;
				campaignName: string;
				sent: number;
				failed: number;
				pending: number;
				isPaused: boolean;
				createdAt: string;
				description: string;
				startDate:string;
			}[];
		} catch (err) {
			return [];
		}
	}
	static async pauseCampaign(id: string) {
		try {
			await APIInstance.post(`/reports/campaign/${id}/pause`);
		} catch (err) {
			return null;
		}
	}
	static async resumeCampaign(id: string) {
		try {
			await APIInstance.post(`/reports/campaign/${id}/resume`);
		} catch (err) {
			return null;
		}
	}
	static async deleteCampaign(id: string) {
		try {
			await APIInstance.delete(`/reports/campaign/${id}/delete`);
		} catch (err) {
			return null;
		}
	}
	static async generateReport(id: string) {
		try {
			const response = await APIInstance.get(`/reports/campaign/${id}`, {
				responseType: 'blob',
			});
			const blob = new Blob([response.data], { type: 'text/csv' });

			// Create a temporary link element
			const downloadLink = document.createElement('a');
			downloadLink.href = window.URL.createObjectURL(blob);
			downloadLink.download = 'generated_report.csv'; // Specify the filename

			// Append the link to the body and trigger the download
			document.body.appendChild(downloadLink);
			downloadLink.click();

			// Clean up - remove the link
			document.body.removeChild(downloadLink);
		} catch (err) {
			//ignore
		}
	}
	static async listPolls(): Promise<Poll[]> {
		try {
			const { data } = await APIInstance.get('/reports/polls');
			return data.polls.map(
				(poll: { title: string; options: string[]; isMultiSelect: boolean }) => {
					return {
						title: (poll.title ?? '') as string,
						isMultiSelect: (poll.isMultiSelect ?? false) as boolean,
						options: poll.options?.map((option: string) => option ?? '') as string[],
					};
				}
			);
		} catch (err) {
			return [];
		}
	}

	static async pollDetails({ title, isMultiSelect, options }: Poll, csv: boolean = false) {
		if (csv) {
			try {
				const response = await APIInstance.get('/reports/polls', {
					params: { title, isMultiSelect, options: options.join('|$|'), export_csv: csv },
					responseType: 'blob',
				});

				const blob = new Blob([response.data], { type: 'text/csv' });

				// Create a temporary link element
				const downloadLink = document.createElement('a');
				downloadLink.href = window.URL.createObjectURL(blob);
				downloadLink.download = `Poll Report.csv`; // Specify the filename

				// Append the link to the body and trigger the download
				document.body.appendChild(downloadLink);
				downloadLink.click();

				// Clean up - remove the link
				document.body.removeChild(downloadLink);
			} catch (err) {
				return [];
			}
		}
		try {
			const { data } = await APIInstance.get('/reports/polls', {
				params: { title, isMultiSelect, options: options.join('|$|') },
			});

			return data.polls.map(
				(poll: {
					group_name: string;
					isMultiSelect: boolean;
					options: string[];
					selected_option: string[];
					title: string;
					voted_at: string;
					voter_name: string;
					voter_number: string;
				}) => {
					return {
						group_name: (poll.group_name ?? '') as string,
						isMultiSelect: (poll.isMultiSelect ?? false) as boolean,
						options: poll.options?.map((option: string) => option ?? '') as string[],
						selected_option: poll.selected_option?.map(
							(option: string) => option ?? ''
						) as string[],
						title: (poll.title ?? '') as string,
						voted_at: (poll.voted_at ?? '') as string,
						voter_name: (poll.voter_name ?? '') as string,
						voter_number: (poll.voter_number ?? '') as string,
					};
				}
			);
		} catch (err) {
			return null;
		}
	}
}
