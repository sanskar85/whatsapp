import APIInstance from '../config/APIInstance';
import { SchedulerByDateDetails } from '../store/types/ScheduleByDateState';

const validateScheduler = (
	scheduler: (SchedulerByDateDetails & {
		active: boolean;
	})[]
) => {
	return scheduler.map((res) => ({
		id: res.id ?? '',
		recipient_from: res.recipient_from ?? 'NUMBERS',
		recipient_data: res.recipient_data ?? '',
		message: res.message ?? '',
		attachments: res.attachments ?? [],
		shared_contact_cards: res.attachments ?? [],
		polls: res.polls ?? [],
		active: res.active ?? false,
		random_string: res.random_string ?? false,
		title: res.title ?? '',
		description: res.description ?? '',
		dates: res.dates ?? [],
		daily_count: res.daily_count.toString() ?? '0',
		start_time: res.start_time ?? '10:00',
		end_time: res.end_time ?? '18:00',
	})) as (SchedulerByDateDetails & {
		active: boolean;
	})[];
};

export class SchedulerByDateService {
	static async listAllSchedulers() {
		const { data } = await APIInstance.get('/repetitive-scheduler');
		return validateScheduler(data.schedulers);
	}

	static async createScheduler(
		scheduler: Omit<SchedulerByDateDetails, 'daily_count'> & { daily_count: number }
	) {
		const { data } = await APIInstance.post('/repetitive-scheduler', scheduler);
		console.log(data);
		return validateScheduler([data.scheduler])[0];
	}

	static async updateScheduler(
		scheduler: Omit<SchedulerByDateDetails, 'daily_count'> & { daily_count: number }
	) {
		const { data } = await APIInstance.patch(`/repetitive-scheduler/${scheduler.id}`, scheduler);
		return validateScheduler([data.scheduler])[0];
	}

	static async toggleActive(id: string) {
		const { data } = await APIInstance.put(`/repetitive-scheduler/${id}`);
		return validateScheduler([data.scheduler])[0];
	}

	static async deleteScheduler(id: string) {
		await APIInstance.delete(`/repetitive-scheduler/${id}`);
	}

	static async reschedule(id: string) {
		await APIInstance.put(`/repetitive-scheduler/${id}/reschedule`);
	}

	static async downloadResponses(id: string) {
		const response = await APIInstance.get(`/repetitive-scheduler/${id}/report`, {
			responseType: 'blob',
		});
		const blob = new Blob([response.data], { type: 'text/csv' });

		// Create a temporary link element
		const downloadLink = document.createElement('a');
		downloadLink.href = window.URL.createObjectURL(blob);
		downloadLink.download = `Scheduler_by_date_report.csv`; // Specify the filename

		// Append the link to the body and trigger the download
		document.body.appendChild(downloadLink);
		downloadLink.click();

		// Clean up - remove the link
		document.body.removeChild(downloadLink);
	}
}
