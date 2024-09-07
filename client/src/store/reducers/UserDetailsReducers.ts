import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import { StoreNames } from '..';
import { UserDetailsState } from '../types/UserDetails';

const initialState: UserDetailsState = {
	name: '',
	isSubscribed: false,
	userType: 'PERSONAL',
	canSendMessage: false,

	session_expires_at: '',
	isWhatsappReady: false,
	phone_number: '',

	messageLoggerEnabled: false,

	groups: [],
	labels: [],
	contactsCount: null,
	data_loaded: false,
	settingsOpen: false,

	isLoggedIn: true,
};

const UserDetailsSlice = createSlice({
	name: StoreNames.USER,
	initialState,
	reducers: {
		reset: (state) => {
			state.name = initialState.name;
			state.isSubscribed = initialState.isSubscribed;
			state.canSendMessage = initialState.canSendMessage;
			state.session_expires_at = initialState.session_expires_at;
			state.userType = initialState.userType;

			state.groups = initialState.groups;
			state.labels = initialState.labels;
		},
		setUserDetails: (state, action: PayloadAction<Partial<typeof initialState>>) => {
			if (action.payload.name) {
				state.name = action.payload.name;
			}
			if (action.payload.isSubscribed) {
				state.isSubscribed = action.payload.isSubscribed;
			}
			if (action.payload.canSendMessage) {
				state.canSendMessage = action.payload.canSendMessage;
			}
			if (action.payload.userType) {
				state.userType = action.payload.userType;
			}

			if (action.payload.groups) {
				state.groups = action.payload.groups;
			}
			if (action.payload.labels) {
				state.labels = action.payload.labels;
			}
			if (action.payload.contactsCount) {
				state.contactsCount = action.payload.contactsCount;
			}
			if (action.payload.data_loaded !== undefined) {
				state.data_loaded = action.payload.data_loaded;
			}
			if (action.payload.messageLoggerEnabled !== undefined) {
				state.messageLoggerEnabled = action.payload.messageLoggerEnabled;
			}

			if (action.payload.session_expires_at) {
				state.session_expires_at = action.payload.session_expires_at;
			}
			if (action.payload.isWhatsappReady) {
				state.isWhatsappReady = action.payload.isWhatsappReady;
			}
			if (action.payload.phone_number) {
				state.phone_number = action.payload.phone_number;
			}
		},

		setGroups: (state, action: PayloadAction<typeof initialState.groups>) => {
			state.groups = action.payload;
		},
		setLabels: (state, action: PayloadAction<typeof initialState.labels>) => {
			state.labels = action.payload;
		},
		setContactsCount: (state, action: PayloadAction<typeof initialState.contactsCount>) => {
			state.contactsCount = action.payload;
		},
		setDataLoaded: (state, action: PayloadAction<typeof initialState.data_loaded>) => {
			state.data_loaded = action.payload;
		},
		setSettingsOpen: (state, action: PayloadAction<boolean>) => {
			state.settingsOpen = action.payload;
		},
		setIsLoggedIn: (state, action: PayloadAction<boolean>) => {
			state.isLoggedIn = action.payload;
		},
	},
});

export const {
	reset,
	setUserDetails,
	setGroups,
	setLabels,
	setContactsCount,
	setDataLoaded,
	setSettingsOpen,
	setIsLoggedIn,
} = UserDetailsSlice.actions;

export default UserDetailsSlice.reducer;
