import countries from './countries.json';

export const DATABASE_URL = process.env.DATABASE_URL as string;

export const CHROMIUM_PATH = process.env.CHROMIUM_PATH as string;

export const IS_PRODUCTION = process.env.MODE === 'production';

export const IS_WINDOWS = process.env.OS === 'WINDOWS';

export const PORT = process.env.PORT !== undefined ? process.env.PORT : undefined;
export const SALT_FACTOR = Number(process.env.SALT_FACTOR) ?? 0;
export const JWT_SECRET = process.env.JWT_SECRET ?? 'hello';
export const REFRESH_SECRET = process.env.REFRESH_SECRET ?? 'world';
export const JWT_EXPIRE = process.env.JWT_EXPIRE ?? '3m';
export const REFRESH_EXPIRE = process.env.REFRESH_EXPIRE ?? '30days';

export const JWT_COOKIE = 'jwt';
export const JWT_REFRESH_COOKIE = 'jwt_refresh';

export enum SOCKET_EVENTS {
	INITIALIZE = 'initialize',
}

export enum SOCKET_RESPONSES {
	INITIALIZED = 'initialized',
	QR_GENERATED = 'qr-generated',
	WHATSAPP_AUTHENTICATED = 'whatsapp-authenticated',
	WHATSAPP_READY = 'whatsapp-ready',
	WHATSAPP_CLOSED = 'whatsapp-closed',

	TASK_CREATED = 'task-created',
	TASK_COMPLETED = 'task-completed',
	TASK_FAILED = 'task-failed',
}

export const COUNTRIES: {
	[key: string]: string;
} = countries;

export enum TRANSACTION_STATUS {
	SUCCESS = 'success',
	FAILED = 'failed',
	PENDING = 'pending',
	CANCELLED = 'cancelled',
	RECURRING = 'recurring',
}

export enum SUBSCRIPTION_STATUS {
	UNDER_CREATION = 'under-creation',
	CREATED = 'created',
	AUTHENTICATED = 'authenticated',
	ACTIVE = 'active',
	PAUSED = 'paused',
	PENDING = 'pending',
	HALTED = 'halted',
	CANCELLED = 'cancelled',
	COMPLETED = 'completed',
	EXPIRED = 'expired',
}

export enum CAMPAIGN_STATUS {
	CREATED = 'CREATED',
	ACTIVE = 'ACTIVE',
	PAUSED = 'PAUSED',
	COMPLETED = 'COMPLETED',
}

export enum MESSAGE_STATUS {
	SENT = 'SENT',
	FAILED = 'FAILED',
	PENDING = 'PENDING',
	PAUSED = 'PAUSED',
}

export enum BILLING_PLANS_TYPE {
	SILVER_MONTH = 'SILVER_MONTH',
	GOLD_MONTH = 'GOLD_MONTH',
	PLATINUM_MONTH = 'PLATINUM_MONTH',
	SILVER_YEAR = 'SILVER_YEAR',
	GOLD_YEAR = 'GOLD_YEAR',
	PLATINUM_YEAR = 'PLATINUM_YEAR',
}
export const BILLING_PLANS_DETAILS = {
	[BILLING_PLANS_TYPE.SILVER_MONTH]: {
		amount: 1500,
		user_count: 1,
		plan_id: 'plan_MtXgVPSDQrYvMd',
	},
	[BILLING_PLANS_TYPE.GOLD_MONTH]: { amount: 2500, user_count: 2, plan_id: 'plan_MtXgVPSDQrYvMd' },
	[BILLING_PLANS_TYPE.PLATINUM_MONTH]: {
		amount: 3000,
		user_count: 4,
		plan_id: 'plan_MtXgVPSDQrYvMd',
	},
	[BILLING_PLANS_TYPE.SILVER_YEAR]: {
		amount: 15000,
		user_count: 1,
		plan_id: 'plan_MtXgVPSDQrYvMd',
	},
	[BILLING_PLANS_TYPE.GOLD_YEAR]: { amount: 20000, user_count: 2, plan_id: 'plan_MtXgVPSDQrYvMd' },
	[BILLING_PLANS_TYPE.PLATINUM_YEAR]: {
		amount: 30000,
		user_count: 4,
		plan_id: 'plan_MtXgVPSDQrYvMd',
	},
};

export enum BOT_TRIGGER_OPTIONS {
	INCLUDES_IGNORE_CASE = 'INCLUDES_IGNORE_CASE',
	INCLUDES_MATCH_CASE = 'INCLUDES_MATCH_CASE',
	EXACT_IGNORE_CASE = 'EXACT_IGNORE_CASE',
	EXACT_MATCH_CASE = 'EXACT_MATCH_CASE',
}
export enum BOT_TRIGGER_TO {
	ALL = 'ALL',
	SAVED_CONTACTS = 'SAVED_CONTACTS',
	NON_SAVED_CONTACTS = 'NON_SAVED_CONTACTS',
}

export enum TASK_TYPE {
	EXPORT_ALL_CONTACTS = 'EXPORT_ALL_CONTACTS',
	EXPORT_CHAT_CONTACTS = 'EXPORT_CHAT_CONTACTS',
	EXPORT_SAVED_CONTACTS = 'EXPORT_SAVED_CONTACTS',
	EXPORT_UNSAVED_CONTACTS = 'EXPORT_UNSAVED_CONTACTS',
	EXPORT_GROUP_CONTACTS = 'EXPORT_GROUP_CONTACTS',
	EXPORT_LABEL_CONTACTS = 'EXPORT_LABEL_CONTACTS',
	SCHEDULE_CAMPAIGN = 'SCHEDULE_CAMPAIGN',
}

export enum TASK_STATUS {
	COMPLETED = 'COMPLETED',
	PENDING = 'PENDING',
	FAILED = 'FAILED',
}

export enum TASK_RESULT_TYPE {
	CSV = 'CSV',
	VCF = 'VCF',
}

export const TAX = 0.18;

export const UPLOADS_PATH = '/static/uploads/';
export const CSV_PATH = '/static/csv/';
export const ATTACHMENTS_PATH = '/static/attachments/';
export const INVOICE_PATH = '/static/invoices/';
export const MISC_PATH = '/static/misc/';
export const TASK_PATH = '/static/task/';
export const LOGO_PATH = '/static/assets/logo.png';

export const SHORTNER_REDIRECT = 'https://open.whatsleads.in/';

export const SESSION_STARTUP_WAIT_TIME = 5 * 60 * 1000; //milis
export const CACHE_TIMEOUT = 60 * 60; //seconds
export const REFRESH_CACHE_TIMEOUT = 30 * 24 * 60 * 60; //seconds

export const CACHE_TOKEN_GENERATOR = {
	CONTACTS: (user_id: string, business_only: boolean = false) =>
		`CONTACTS?user_id=${user_id}&business_only=${business_only}`,
	CONTACT_DETAILS: (user_id: string, business_only: boolean = false) =>
		`CONTACT_DETAILS?user_id=${user_id}&business_only=${business_only}`,
	CONTACTS_COUNT: (user_id: string, business_only: boolean = false) =>
		`CONTACTS_COUNT?user_id=${user_id}`,
	REFRESH_TOKENS: () => `REFRESH_TOKENS`,

	SAVED_CHAT_CONTACTS: (user_id: string, business_only: boolean = false) =>
		`SAVED_CHAT_CONTACTS?user_id=${user_id}&business_only=${business_only}`,

	NON_SAVED_CONTACTS: (user_id: string, business_only: boolean = false) =>
		`NON_SAVED_CONTACTS?user_id=${user_id}&business_only=${business_only}`,

	GROUPS: (user_id: string) => `GROUPS?user_id=${user_id}`,

	LABELS: (user_id: string) => `LABELS?user_id=${user_id}`,

	MAPPED_CONTACTS: (user_id: string, business_only: boolean = false) =>
		`MAPPED_CONTACTS?user_id=${user_id}&business_only=${business_only}`,

	GROUPS_EXPORT: (user_id: string, group_id: string, business_only: boolean = false) =>
		`GROUPS_EXPORT?user_id=${user_id}&group_id=${group_id}&business_only=${business_only}`,

	LABELS_EXPORT: (user_id: string, label_id: string, business_only: boolean = false) =>
		`LABELS_EXPORT?user_id=${user_id}&label_id=${label_id}&business_only=${business_only}`,
};
