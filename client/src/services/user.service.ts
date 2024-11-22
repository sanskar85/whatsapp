import axios from 'axios';
import APIInstance from '../config/APIInstance';
import { SERVER_URL } from '../config/const';
import { getClientID } from '../utils/ChromeUtils';

export default class UserService {
	static async isAuthenticated() {
		try {
			const { data } = await axios.get(SERVER_URL + 'auth/validate', {
				headers: {
					'client-id': getClientID(),
					'Cache-Control': 'no-cache',
					Pragma: 'no-cache',
					Expires: '0',
				},
			});
			return {
				session_active: true,
				whatsapp_ready: data.isWhatsappReady,
			};
		} catch (err) {
			return {
				session_active: false,
				whatsapp_ready: false,
			};
		}
	}
	static async getUserPreferences() {
		const { data } = await APIInstance.get(`/users/preferences`);
		return {
			messageLoggerEnabled: data.messageLoggerEnabled as boolean,
			individual_text_message: data.individual_text_message as boolean,
			individual_media_message: data.individual_media_message as boolean,
			group_text_message: data.group_text_message as boolean,
			group_media_message: data.group_media_message as boolean,
		};
	}

	static async enableMessageLogging({
		individual_text_message,
		individual_media_message,
		group_text_message,
		group_media_message,
	}: {
		individual_text_message?: boolean;
		individual_media_message?: boolean;
		group_text_message?: boolean;
		group_media_message?: boolean;
	}) {
		const { data } = await APIInstance.post(`/users/enable-message-logger`, {
			messageLoggerEnabled: true,
			individual_text_message,
			individual_media_message,
			group_text_message,
			group_media_message,
		});
		return {
			messageLoggerEnabled: data.messageLoggerEnabled as boolean,
			individual_text_message: data.individual_text_message as boolean,
			individual_media_message: data.individual_media_message as boolean,
			group_text_message: data.group_text_message as boolean,
			group_media_message: data.group_media_message as boolean,
		};
	}

	static async disableMessageLogging() {
		const { data } = await APIInstance.post(`/users/disable-message-logger`, {
			messageLoggerEnabled: false,
		});
		return {
			messageLoggerEnabled: data.messageLoggerEnabled as boolean,
		};
	}

	static async logout() {
		try {
			await APIInstance.post(`/auth/logout`);
			return true;
		} catch (err) {
			return false;
		}
	}
}
