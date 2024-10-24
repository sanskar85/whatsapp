export type APIWebhookState = {
	list: APIWebhook[];
	details: APIWebhook;
	loading: boolean;
	error: string;
	selectedList: string[];
	token: string;
};

export type APIWebhook = {
	id: string;
	name: string;
	createdAt: string;
};
