import axios from 'axios';
import APIInstance from '../config/APIInstance';
import { SERVER_URL } from '../config/const';

export default class AuthService {
	static async isAuthenticated() {
		try {
			await axios.get(SERVER_URL + 'auth/validate', {
				headers: {
					'Cache-Control': 'no-cache',
					Pragma: 'no-cache',
					Expires: '0',
				},
				withCredentials: true,
			});
			return true;
		} catch (err) {
			return false;
		}
	}

	static async login(username: string, password: string) {
		try {
			await APIInstance.post(`/auth/login`, {
				username,
				password,
				role: 'admin',
			});
			return true;
		} catch (err) {
			return false;
		}
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
