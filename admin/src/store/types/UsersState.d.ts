export type UsersState = {
	list: User[];
	selectedUsers: string[];
	uiDetails: {
		isSaving: boolean;
		isFetching: boolean;
		isDeleting: boolean;
		isCreating: boolean;
		isUpdating: boolean;
		error: string;
	};
};

type User = {
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
	is_expired: boolean;
};
