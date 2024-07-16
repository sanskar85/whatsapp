import { EXPORTS_TYPE } from '../../config/const';

export type UserDetailsState = {
	name: string;
	isSubscribed: boolean;
	canSendMessage: boolean;
	userType: 'BUSINESS' | 'PERSONAL';

	session_expires_at: string;
	isWhatsappReady: boolean;
	phone_number: string;

	messageLoggerEnabled: boolean;

	groups: {
		id: string;
		name: string;
		isMergedGroup: boolean;
		participants: number;
	}[];
	labels: {
		id: string;
		name: string;
	}[];
	contactsCount: {
		[EXPORTS_TYPE.SAVED]: number;
		[EXPORTS_TYPE.UNSAVED]: number;
		[EXPORTS_TYPE.SAVED_CHAT]: number;
	} | null;

	data_loaded: boolean;
	settingsOpen: boolean;
};

export type PaymentRecords = {
	subscriptions: [];
	payments: [];
};
