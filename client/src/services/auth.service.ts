import APIInstance from '../config/APIInstance';
export default class AuthService {
	static async isAuthenticated() {
		try {
			await APIInstance.get(`/auth/validate`);
			return true;
		} catch (err) {
			return false;
		}
	}
	static async initiateWhatsapp() {
		try {
			const { data } = await APIInstance.post(`/auth/initiate-client`);
			return data.client_id ?? '';
		} catch (err) {
			return '';
		}
	}
	static async validateClientID() {
		try {
			const { data } = await APIInstance.get(`/auth/validate-client-id`);
			return {
				session_expires_at: data.session_expires_at,
				isWhatsappReady: data.isWhatsappReady,
				status: data.status,
				phone_number: data.phone_number,
				name: data.name,
				isSubscribed: data.isSubscribed,
				canSendMessage: data.canSendMessage,
			};
		} catch (err) {
			return null;
		}
	}
	static async login(username: string, password: string) {
		try {
			await APIInstance.post(`/auth/login`, {
				username,
				password,
				role: 'user',
			});
			return true;
		} catch (err) {
			return false;
		}
	}
	static async register(username: string) {
		try {
			await APIInstance.post(`/auth/register`, {
				username,
				role: 'user',
			});
			return true;
		} catch (err) {
			return false;
		}
	}

	static async forgotPassword(username: string) {
		try {
			await APIInstance.post(`/auth/forgot-password`, {
				username,
			});
			return true;
		} catch (err) {
			return false;
		}
	}

	static async updatePassword(password: string) {
		try {
			await APIInstance.patch(`/auth/update-password`, {
				password,
			});
			return true;
		} catch (err) {
			return false;
		}
	}

	static async logoutWhatsapp() {
		try {
			await APIInstance.post(`/auth/logout-whatsapp`);
		} catch (err) {
			//ignore
		}
	}
}
