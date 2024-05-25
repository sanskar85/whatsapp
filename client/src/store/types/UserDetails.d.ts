import { EXPORTS_TYPE } from '../../config/const';

export type UserDetailsState = {
	name: string;
	phoneNumber: string;
	isSubscribed: boolean;
	canSendMessage: boolean;
	subscriptionExpiration: string;
	userType: 'BUSINESS' | 'PERSONAL';

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
};

export type PaymentRecords = {
	subscriptions: [];
	payments: [];
};
