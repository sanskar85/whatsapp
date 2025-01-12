export type DevicesState = {
	list: Device[];
	selectedDevice: string[];
	uiDetails: {
		isSaving: boolean;
		isFetching: boolean;
		isDeleting: boolean;
		isCreating: boolean;
		isUpdating: boolean;
		error: string;
	};
};

type Device = {
	id: string;
	device_id: string;
	name: string;
	username: string;
	profile_name: string;
	phone: string;
	type: 'BUSINESS' | 'PERSONAL';
	subscription_expiry: string;
	isOnline: boolean;
	isGoogleSheetAvailable: boolean;
};
