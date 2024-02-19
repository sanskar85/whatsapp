import APIInstance from '../config/APIInstance';
import { Bot } from '../store/types/BotState';

export default class BotService {
	static async createBot(data: {
		trigger: string;
		message: string;
		respond_to: string;
		trigger_gap_seconds: number;
		response_delay_seconds: number;
		options: string;
		startAt: string;
		endAt: string;
		shared_contact_cards?: string[];
		attachments: string[];
		polls: {
			title: string;
			options: string[];
			isMultiSelect: boolean;
		}[];
		forward: {
			number: string;
			message: string;
		};
		nurturing: {
			message: string;
			after: number;
		}[];
	}) {
		try {
			const { data: response } = await APIInstance.post(`/whatsapp/bot`, data);
			const res = response.bot;
			return {
				bot_id: res.bot_id ?? '',
				trigger: res.trigger ?? '',
				options: res.options ?? '',
				startAt: res.startAt ?? '',
				endAt: res.endAt ?? '',
				respond_to: res.respond_to ?? '',
				message: res.message ?? '',
				attachments: res.attachments ?? [],
				shared_contact_cards: res.shared_contact_cards ?? [],
				trigger_gap_seconds: res.trigger_gap_seconds ?? 0,
				response_delay_seconds: res.response_delay_seconds ?? 0,
				isActive: res.isActive ?? false,
				polls: res.polls ?? [],
				forward: res.forward ?? { number: '', message: '' },
				nurturing: res.nurturing ?? [],
			};
		} catch (err) {
			throw new Error('Error Saving Bot');
		}
	}

	static async toggleBot(id: string) {
		try {
			const { data: response } = await APIInstance.put(`/whatsapp/bot/${id}`);
			const res = response.bot as Bot;

			return {
				bot_id: res.bot_id ?? '',
				trigger: res.trigger ?? '',
				options: res.options ?? '',
				startAt: res.startAt ?? '',
				endAt: res.endAt ?? '',
				respond_to: res.respond_to ?? '',
				message: res.message ?? '',
				attachments: res.attachments ?? [],
				shared_contact_cards: res.shared_contact_cards ?? [],
				trigger_gap_seconds: res.trigger_gap_seconds ?? 0,
				response_delay_seconds: res.response_delay_seconds ?? 0,
				isActive: res.isActive ?? false,
				polls: res.polls ?? [],
				forward: res.forward ?? { number: '', message: '' },
				nurturing: res.nurturing ?? [],
			};
		} catch (err) {
			return null;
		}
	}

	static async listBots() {
		try {
			const { data: response } = await APIInstance.get(`/whatsapp/bot`);
			return response.bots.map((res: Bot) => ({
				bot_id: res.bot_id ?? '',
				trigger: res.trigger ?? '',
				options: res.options ?? '',
				startAt: res.startAt ?? '',
				endAt: res.endAt ?? '',
				respond_to: res.respond_to ?? '',
				message: res.message ?? '',
				attachments: res.attachments ?? [],
				shared_contact_cards: res.shared_contact_cards ?? [],
				trigger_gap_seconds: res.trigger_gap_seconds ?? 0,
				response_delay_seconds: res.response_delay_seconds ?? 0,
				isActive: res.isActive ?? false,
				polls: res.polls || [],
				forward: res.forward ?? { number: '', message: '' },
				nurturing: res.nurturing ?? [],
			})) as Bot[];
		} catch (err) {
			return [];
		}
	}

	static async deleteBot(id: string) {
		try {
			await APIInstance.delete(`/whatsapp/bot/${id}`);
			return true;
		} catch (err) {
			return false;
		}
	}

	static async updateBot(
		id: string,
		data: {
			trigger: string;
			message: string;
			respond_to: string;
			trigger_gap_seconds: number;
			options: string;
			startAt: string;
			endAt: string;
			shared_contact_cards?: string[];
			attachments: string[];
			polls: {
				title: string;
				options: string[];
				isMultiSelect: boolean;
			}[];
			forward: {
				number: string;
				message: string;
			};
			nurturing: {
				message: string;
				after: number;
			}[];
		}
	) {
		try {
			const { data: response } = await APIInstance.patch(`/whatsapp/bot/${id}`, data);
			const res = response.bot as Bot;

			return {
				bot_id: res.bot_id ?? '',
				trigger: res.trigger ?? '',
				options: res.options ?? '',
				startAt: res.startAt ?? '',
				endAt: res.endAt ?? '',
				respond_to: res.respond_to ?? '',
				message: res.message ?? '',
				attachments: res.attachments ?? [],
				shared_contact_cards: res.shared_contact_cards ?? [],
				trigger_gap_seconds: res.trigger_gap_seconds ?? 0,
				response_delay_seconds: res.response_delay_seconds ?? 0,
				isActive: res.isActive ?? false,
				polls: res.polls ?? [],
				forward: res.forward ?? { number: '', message: '' },
				nurturing: res.nurturing ?? [],
			} as Bot;
		} catch (err) {
			throw new Error('Error Saving group');
		}
	}

	static async downloadResponses(id: string) {
		try {
			const response = await APIInstance.get(`/whatsapp/bot/${id}/responses`, {
				responseType: 'blob',
			});
			const blob = new Blob([response.data], { type: 'text/csv' });

			// Create a temporary link element
			const downloadLink = document.createElement('a');
			downloadLink.href = window.URL.createObjectURL(blob);
			downloadLink.download = `Bot Responses.csv`; // Specify the filename

			// Append the link to the body and trigger the download
			document.body.appendChild(downloadLink);
			downloadLink.click();

			// Clean up - remove the link
			document.body.removeChild(downloadLink);
		} catch (err) {
			return [];
		}
	}
}
