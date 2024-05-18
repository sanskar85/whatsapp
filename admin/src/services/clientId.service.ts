import APIInstance from '../config/APIInstance';

export default class ClientIdService {
	static async getClientID() {
		try {
			const { data } = await APIInstance.get('/auth/admin/client-id');
			return data.client_id;
		} catch (err) {
			//ignore
		}
	}
	static async setClientID(client_id: string) {
		try {
			await APIInstance.post('/auth/admin/client-id', { client_id });
		} catch (err) {
			//ignore
		}
	}
}
