import APIInstance from '../config/APIInstance';

type Scheduler = {
	id: string;
	title: string;
	message: string;
	random_string: boolean;
	attachments: string[];
	shared_contact_cards: string[];
	polls: {
		title: string;
		options: string[];
		isMultiSelect: boolean;
	}[];
	isActive: boolean;
	start_from: string;
	end_at: string;
	csv: string;
};

export default class MessageService {
	static async scheduleCampaign(data: {
		type:
			| 'NUMBERS'
			| 'CSV'
			| 'GROUP'
			| 'SAVED'
			| 'UNSAVED'
			| 'LABEL'
			| 'GROUP_INDIVIDUAL'
			| 'GROUP_INDIVIDUAL_WITHOUT_ADMINS';
		numbers?: string[];
		csv_file?: string;
		group_ids?: string[];
		label_ids?: string[];
		message?: string;
		random_string?: boolean;
		variables?: string[];
		shared_contact_cards?: string[];
		attachments?: string[];
		campaign_name: string;
		min_delay: number;
		max_delay: number;
		startTime?: string;
		endTime?: string;
		batch_delay?: number;
		batch_size?: number;
		description?: string;
		remove_duplicates?: boolean;
	}) {
		const { csv_file, ...details } = data;
		try {
			await APIInstance.post(`/whatsapp/schedule-message`, {
				...details,
				...(csv_file ? { csv_file } : {}),
			});
			return true;
		} catch (err: unknown) {
			return false;
			//ignored
		}
	}
	static async scheduleMessage(details: Omit<Scheduler, 'id' | 'isActive'>) {
		try {
			const response = await APIInstance.post(`/scheduler`, details);
			return {
				id: response.data.scheduler.id ?? '',
				title: response.data.scheduler.title ?? '',
				message: response.data.scheduler.message ?? '',
				random_string: response.data.scheduler.random_string,
				attachments: response.data.scheduler.attachments ?? [],
				shared_contact_cards: response.data.scheduler.shared_contact_cards ?? [],
				polls: response.data.scheduler.polls ?? [],
				isActive: response.data.scheduler.isActive,
				start_from: response.data.scheduler.start_from ?? '',
				end_at: response.data.scheduler.end_at ?? '',
				csv: response.data.csv ?? '',
			} as Scheduler;
		} catch (err: unknown) {
			return null;
		}
	}

	static async getScheduledMessages() {
		try {
			const { data } = await APIInstance.get('/scheduler');

			return (data.schedulers as Scheduler[]).map((scheduler) => ({
				id: scheduler.id ?? '',
				title: scheduler.title ?? '',
				message: scheduler.message ?? '',
				random_string: scheduler.random_string ?? false,
				attachments: scheduler.attachments ?? [],
				shared_contact_cards: scheduler.shared_contact_cards ?? [],
				polls: scheduler.polls ?? [],
				isActive: scheduler.isActive,
				start_from: scheduler.start_from ?? '',
				end_at: scheduler.end_at ?? '',
				csv: scheduler.csv ?? '',
			}));
		} catch (err: unknown) {
			return [] as Scheduler[];
		}
	}

	static async generateScheduledMessagesReport(id: string) {
		try {
			const response = await APIInstance.get(`/scheduler/${id}/report`, {
				responseType: 'blob',
			});

			const contentType = response.headers['content-type'];
			const blob = new Blob([response.data], { type: contentType });

			// Create a temporary link element
			const downloadLink = document.createElement('a');
			downloadLink.href = window.URL.createObjectURL(blob);

			const contentDispositionHeader = response.headers['content-disposition'];
			const fileNameMatch = contentDispositionHeader.match(/filename="(.+)"/);
			const fileName = fileNameMatch ? fileNameMatch[1] : 'download.csv';

			downloadLink.download = fileName; // Specify the filename

			// Append the link to the body and trigger the download
			document.body.appendChild(downloadLink);
			downloadLink.click();

			// Clean up - remove the link
			document.body.removeChild(downloadLink);
		} catch (err) {
			//ignore
		}
	}

	static async editScheduledMessage(scheduledMessage: Omit<Scheduler, 'isActive'>) {
		try {
			const { data } = await APIInstance.patch(
				`/scheduler/${scheduledMessage.id}`,
				scheduledMessage
			);
			return {
				id: data.bot.id ?? '',
				title: data.bot.title ?? '',
				message: data.bot.message ?? '',
				random_string: data.bot.random_string,
				attachments: data.bot.attachments ?? [],
				shared_contact_cards: data.bot.shared_contact_cards ?? [],
				polls: data.bot.polls ?? [],
				isActive: data.bot.isActive,
				start_from: data.bot.start_from ?? '',
				end_at: data.bot.end_at ?? '',
				csv: data.bot.csv ?? '',
			} as Scheduler;
		} catch (err) {
			return null;
		}
	}

	static async toggleScheduledMessage(id: string) {
		try {
			const { data } = await APIInstance.put(`/scheduler/${id}`);
			return {
				id: data.scheduler.id ?? '',
				title: data.scheduler.title ?? '',
				message: data.scheduler.message ?? '',
				random_string: data.scheduler.random_string,
				attachments: data.scheduler.attachments ?? [],
				shared_contact_cards: data.scheduler.shared_contact_cards ?? [],
				polls: data.scheduler.polls ?? [],
				isActive: data.scheduler.isActive,
				start_from: data.scheduler.start_from ?? '',
				end_at: data.scheduler.end_at ?? '',
				csv: data.scheduler.csv ?? '',
			} as Scheduler;
		} catch (err: unknown) {
			return null;
		}
	}

	static async reschedule(id: string) {
		try {
			await APIInstance.put(`/scheduler/${id}/reschedule`);
			return true;
		} catch (err: unknown) {
			return false;
		}
	}

	static async deleteScheduledMessage(id: string) {
		try {
			const { data } = await APIInstance.delete(`/scheduler/${id}`);
			if (data.success) return true;
			else return false;
		} catch (err) {
			return 'Unable to delete scheduled message';
		}
	}
}
