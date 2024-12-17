import countries from './countries.json';
import mime_types from './mime-types.json';

export const SERVER_URL = import.meta.env.VITE_SERVER_URL;
export const WEBPAGE_URL = import.meta.env.VITE_WEBPAGE_URL;
export const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
export const CAPTCHA_KEY = import.meta.env.VITE_CAPTCHA_KEY;
export const DATA_LOADED_DELAY = import.meta.env.VITE_DATA_LOADED_DELAY;

export const NAVIGATION = {
	WELCOME: '/welcome',
	HOME: '/',
	SCHEDULER: '/campaign',
	BOT: '/bot',
	SETTINGS: '/settings',
	NETWORK_ERROR: '/network-error',
	REPORTS: '/reports',
	POLL_RESPONSES: '/poll-responses',
	SHORT: '/short',
	CONTACT: '/contact',
	ATTACHMENTS: '/attachments',
	CSV: '/csv',
	GROUP_MERGE: '/group-merge',
	TASKS: '/pending-tasks',
	OPEN: '/open',
	API: '/api-keys',
	SCHEDULER_BY_DATE: '/scheduler-by-date',
	ENHANCEMENT: '/enhancements',
};

export enum CHROME_ACTION {
	PRIVACY_UPDATED = 'PRIVACY_UPDATED',
	OPEN_URL = 'OPEN_URL',
}

export enum PRIVACY_TYPE {
	RECENT = 'RECENT',
	NAME = 'NAME',
	PHOTO = 'PHOTO',
	CONVERSATION = 'CONVERSATION',
}

export enum EXPORTS_TYPE {
	ALL = 'ALL',
	SAVED = 'SAVED',
	SAVED_CHAT = 'SAVED_CHAT',
	UNSAVED = 'UNSAVED',
	GROUP = 'GROUP',
	GROUP_ALL = 'GROUP_ALL',
	LABEL = 'LABEL',
	LABEL_ALL = 'LABEL_ALL',
	BUSINESS_ONLY = 'BUSINESS_ONLY',
}

export enum TRANSACTION_STATUS {
	CODE = 'CODE',
	CHECKING_COUPON = 'CHECKING_COUPON',
	COUPON_VALID = 'COUPON_VALID',
	COUPON_ERROR = 'COUPON_ERROR',
	TRANSACTION_ID = 'TRANSACTION_ID',
	GROSS_AMOUNT = 'GROSS_AMOUNT',
	TAX = 'TAX',
	DISCOUNT = 'DISCOUNT',
	TOTAL_AMOUNT = 'TOTAL_AMOUNT',
	TRANSACTION_ERROR = 'TRANSACTION_ERROR',
}

export enum SOCKET_EVENT {
	INITIALIZE = 'initialize',
	INITIALIZED = 'initialized',
	QR_GENERATED = 'qr-generated',
	WHATSAPP_AUTHENTICATED = 'whatsapp-authenticated',
	WHATSAPP_READY = 'whatsapp-ready',
	WHATSAPP_CLOSED = 'whatsapp-closed',
	PAYMENT_SUCCESS = 'payment-success',

	TASK_CREATED = 'task-created',
	TASK_COMPLETED = 'task-completed',
	TASK_FAILED = 'task-failed',
}

export enum SETTINGS {
	NAME = 'NAME',
	PHONE_NUMBER = 'PHONE_NUMBER',
	IS_SUBSCRIBED = 'IS_SUBSCRIBED',
	SUBSCRIPTION_EXPIRATION = 'SUBSCRIPTION_EXPIRATION',
	USER_TYPE = 'USER_TYPE',
	PAYMENT_RECORDS = 'PAYMENT_RECORDS',
}

export const COUNTRIES: {
	[country_code: string]: string;
} = countries;

export const COUNTRIES_OPTIONS = Object.entries(COUNTRIES).map(([code, name]) => ({
	code,
	name,
}));

export const MIME_TYPES: {
	value: string;
	name: string;
}[] = mime_types;

export const MIME_TYPES_OPTIONS = Object.entries(MIME_TYPES).map(([value, name]) => ({
	value,
	name,
}));

export enum Colors {
	ACCENT_LIGHT = '#E8F2ED',
	ACCENT_DARK = '#4F966E',
	PRIMARY_DARK = '#0D1C12',
	BACKGROUND_LIGHT = '#F7FCFA',
}
