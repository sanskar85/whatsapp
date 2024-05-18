import axios from 'axios';
import { io } from 'socket.io-client';
import { recheckNetwork } from '../hooks/useNetwork';
import AuthService from '../services/auth.service';
import { getClientID } from '../utils/ChromeUtils';
import { NAVIGATION, SERVER_URL } from './const';

const socket = io(SERVER_URL);
const APIInstance = axios.create({
	baseURL: SERVER_URL,
	headers: {
		'Content-Type': 'application/json',
		Accept: 'application/json',
	},
	withCredentials: true,
});

APIInstance.interceptors.request.use(async (request) => {
	const client_id = await getClientID();
	if (client_id) {
		request.headers['client-id'] = client_id;
	}
	return request;
});
APIInstance.interceptors.response.use(
	async (response) => response,
	async (error) => {
		const originalRequest = error.config;

		if (error.code === 'ERR_NETWORK') {
			if (await recheckNetwork()) {
				originalRequest._retry = true;
				return APIInstance(originalRequest);
			} else {
				return Promise.reject(error);
			}
		}

		if (error.response?.data?.title === 'SESSION_INVALIDATED' && !originalRequest._retry) {
			originalRequest._retry = true;

			const authenticated = await AuthService.isAuthenticated();

			if (authenticated) {
				return APIInstance(originalRequest);
			} else {
				window.location.assign(NAVIGATION.WELCOME);
			}
		}

		return Promise.reject(error);
	}
);

export default APIInstance;
export { socket };
