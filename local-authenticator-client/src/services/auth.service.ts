import APIInstance from '../config/APIInstance';

export default class AuthService {
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
}
