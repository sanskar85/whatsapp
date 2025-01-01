import APIInstance from '../config/APIInstance';
import { Bot } from '../store/types/BotState';

export default class BotService {
	static async createBot(data: {
		trigger: string[];
		message: string;
		random_string: boolean;
		recipient: {
			include: string[];
			exclude: string[];
			saved: boolean;
			unsaved: boolean;
		};
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
			random_string: boolean;
			attachments: string[];
			shared_contact_cards: string[];
			polls: {
				title: string;
				options: string[];
				isMultiSelect: boolean;
			}[];
		}[];
		allowed_country_codes: string[];
	}) {
		try {
			const { data: response } = await APIInstance.post(`/whatsapp/bot`, data);
			const res = response.bot;
			return {
				bot_id: res.bot_id ?? '',
				trigger: res.trigger ?? [],
				options: res.options ?? 'INCLUDES_MATCH_CASE',
				startAt: res.startAt ?? '',
				endAt: res.endAt ?? '',
				recipient: res.recipient ?? {
					include: [],
					exclude: [],
					saved: false,
					unsaved: false,
				},
				message: res.message ?? '',
				random_string: res.random_string ?? false,
				attachments: res.attachments ?? [],
				shared_contact_cards: res.shared_contact_cards ?? [],
				trigger_gap_seconds: res.trigger_gap_seconds ?? 0,
				response_delay_seconds: res.response_delay_seconds ?? 0,
				isActive: res.isActive ?? false,
				polls: res.polls ?? [],
				forward: res.forward ?? { number: '', message: '' },
				nurturing: res.nurturing ?? [],
				allowed_country_codes: res.allowed_country_codes ?? [],
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
				trigger: res.trigger ?? [],
				options: res.options ?? 'INCLUDES_MATCH_CASE',
				startAt: res.startAt ?? '',
				endAt: res.endAt ?? '',
				recipient: res.recipient ?? {
					include: [],
					exclude: [],
					saved: false,
					unsaved: false,
				},
				message: res.message ?? '',
				random_string: res.random_string ?? false,
				attachments: res.attachments ?? [],
				shared_contact_cards: res.shared_contact_cards ?? [],
				trigger_gap_seconds: res.trigger_gap_seconds ?? 0,
				response_delay_seconds: res.response_delay_seconds ?? 0,
				isActive: res.isActive ?? false,
				polls: res.polls ?? [],
				forward: res.forward ?? { number: '', message: '' },
				nurturing: res.nurturing ?? [],
				allowed_country_codes: res.allowed_country_codes ?? [],
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
				trigger: res.trigger ?? [],
				options: res.options ?? 'INCLUDES_MATCH_CASE',
				startAt: res.startAt ?? '',
				endAt: res.endAt ?? '',
				recipient: res.recipient ?? {
					include: [],
					exclude: [],
					saved: false,
					unsaved: false,
				},
				message: res.message ?? '',
				random_string: res.random_string ?? false,
				attachments: res.attachments ?? [],
				shared_contact_cards: res.shared_contact_cards ?? [],
				trigger_gap_seconds: res.trigger_gap_seconds ?? 0,
				response_delay_seconds: res.response_delay_seconds ?? 0,
				isActive: res.isActive ?? false,
				polls: res.polls || [],
				forward: res.forward ?? { number: '', message: '' },
				nurturing: res.nurturing ?? [],
				allowed_country_codes: res.allowed_country_codes ?? [],
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
			trigger: string[];
			message: string;
			random_string: boolean;
			recipient: {
				include: string[];
				exclude: string[];
				saved: boolean;
				unsaved: boolean;
			};
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
				random_string: boolean;
				attachments: string[];
				shared_contact_cards: string[];
				polls: {
					title: string;
					options: string[];
					isMultiSelect: boolean;
				}[];
			}[];
			allowed_country_codes: string[];
		}
	) {
		try {
			const { data: response } = await APIInstance.patch(`/whatsapp/bot/${id}`, data);
			const res = response.bot as {
				bot_id: string;
				trigger: string[];
				options: string;
				startAt: string;
				endAt: string;
				recipient: {
					include: string[];
					exclude: string[];
					saved: boolean;
					unsaved: boolean;
				};
				message: string;
				random_string: boolean;
				attachments: string[];
				shared_contact_cards: string[];
				trigger_gap_seconds: number;
				response_delay_seconds: number;
				isActive: boolean;
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
					random_string: boolean;
					message: string;
					after: number;
					attachments: { _id: string }[];
					shared_contact_cards: { _id: string }[];
					polls: { title: string; options: string[]; isMultiSelect: boolean }[];
					start_from: string;
					end_at: string;
				}[];
				allowed_country_codes: string[];
			};

			return {
				bot_id: res.bot_id ?? '',
				trigger: res.trigger ?? [],
				options: res.options ?? '',
				startAt: res.startAt ?? '',
				endAt: res.endAt ?? '',
				recipient: res.recipient ?? {
					include: [],
					exclude: [],
					saved: false,
					unsaved: false,
				},
				message: res.message ?? '',
				random_string: res.random_string ?? false,
				attachments: res.attachments ?? [],
				shared_contact_cards: res.shared_contact_cards ?? [],
				trigger_gap_seconds: res.trigger_gap_seconds ?? 0,
				response_delay_seconds: res.response_delay_seconds ?? 0,
				isActive: res.isActive ?? false,
				polls: res.polls ?? [],
				forward: res.forward ?? { number: '', message: '' },
				nurturing:
					(res.nurturing ?? []).map((nurturing) => {
						return {
							message: nurturing.message ?? '',
							random_string: nurturing.random_string ?? false,
							after: nurturing.after ?? '',
							attachments: (nurturing.attachments ?? []).map(
								(attachment) => attachment._id as string
							),
							shared_contact_cards: (nurturing ?? []).shared_contact_cards.map(
								(contact) => contact._id as string
							),
							polls: nurturing.polls ?? [],
							start_from: nurturing.start_from ?? '',
							end_at: nurturing.end_at ?? '',
						};
					}) ?? [],
				allowed_country_codes: res.allowed_country_codes ?? [],
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
