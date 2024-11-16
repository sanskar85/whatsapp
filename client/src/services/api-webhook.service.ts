/* eslint-disable @typescript-eslint/no-explicit-any */
import APIInstance from '../config/APIInstance';

export default class APIWebhookService {
	static async listKeys() {
		try {
			const { data } = await APIInstance.get('/api-keys');
			return (data.list ?? []).map((list: any) => {
				return {
					id: list.id ?? '',
					name: list.name ?? '',
					device: list.device ?? '',
					createdAt: list.createdAt ?? '',
				};
			}) as {
				id: string;
				name: string;
				device: string;
				createdAt: string;
			}[];
		} catch (err) {
			return [];
		}
	}

	static async createApiKey(name: string) {
		const { data } = await APIInstance.post('/api-keys', {
			name,
		});

		return data.token as string;
	}

	static async regenerateAPIKey(id: string) {
		const { data } = await APIInstance.post(`/api-keys/${id}/regenerate-token`);
		return data.token as string;
	}

	static async deleteApiKey(id: string) {
		await APIInstance.delete(`/api-keys/${id}`);
	}

	static async listWebhooks() {
		const { data } = await APIInstance.get('/api-keys/webhooks');
		return (data.list ?? []).map((list: any) => {
			return {
				id: list.id ?? '',
				name: list.name ?? '',
				url: list.url ?? '',
				createdAt: list.createdAt ?? '',
			};
		}) as {
			id: string;
			name: string;
			url: string;
			createdAt: string;
		}[];
	}

	static async createWebhook(name: string, url: string) {
		const { data } = await APIInstance.post('/api-keys/webhooks', {
			name,
			url,
		});

		return {
			id: data.id ?? '',
			name: data.name ?? '',
			url: data.url ?? '',
			createdAt: data.createdAt ?? '',
		};
	}

	static async deleteWebhook(id: string) {
		await APIInstance.delete(`/api-keys/webhooks/${id}`);
	}

	static async validateWebhook(id: string) {
		await APIInstance.post(`/api-keys/webhooks/${id}/validate`);
	}
}
