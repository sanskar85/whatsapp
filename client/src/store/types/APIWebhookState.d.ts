export type APIWebhookState = {
	APIlist: API[];
	webhookList: Webhook[];
	APIdetails: API;
	APIloading: boolean;
	APIerror: string;
	APIselectedList: string[];
	token: string;
	webhookDetails: Webhook;
	webhookLoading: boolean;
	webhookError: string;
	webhookSelectedList: string[];
};

export type API = {
	id: string;
	name: string;
	createdAt: string;
};

export type Webhook = {
	id: string;
	name: string;
	url: string;
	createdAt: string;
};
