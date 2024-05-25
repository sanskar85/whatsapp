import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import { StoreNames } from '..';
import { UserDetailsState } from '../types/UserDetails';

const initialState: UserDetailsState = {
	name: '',
	phoneNumber: '',
	isSubscribed: false,
	subscriptionExpiration: '',
	userType: 'PERSONAL',
	canSendMessage: false,

	messageLoggerEnabled: false,

	groups: [],
	labels: [],
	contactsCount: null,
	data_loaded: false,
};

const UserDetailsSlice = createSlice({
	name: StoreNames.USER,
	initialState,
	reducers: {
		reset: (state) => {
			state.name = initialState.name;
			state.phoneNumber = initialState.phoneNumber;
			state.isSubscribed = initialState.isSubscribed;
			state.canSendMessage = initialState.canSendMessage;
			state.subscriptionExpiration = initialState.subscriptionExpiration;
			state.userType = initialState.userType;

			state.groups = initialState.groups;
			state.labels = initialState.labels;
		},
		setUserDetails: (state, action: PayloadAction<Partial<typeof initialState>>) => {
			if (action.payload.name) {
				state.name = action.payload.name;
			}
			if (action.payload.phoneNumber) {
				state.phoneNumber = action.payload.phoneNumber;
			}
			if (action.payload.isSubscribed) {
				state.isSubscribed = action.payload.isSubscribed;
			}
			if (action.payload.canSendMessage) {
				state.canSendMessage = action.payload.canSendMessage;
			}
			if (action.payload.subscriptionExpiration) {
				state.subscriptionExpiration = action.payload.subscriptionExpiration;
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
		},
		setName: (state, action: PayloadAction<typeof initialState.name>) => {
			state.name = action.payload;
		},
		setPhoneNumber: (state, action: PayloadAction<typeof initialState.phoneNumber>) => {
			state.phoneNumber = action.payload;
		},
		setIsSubscribed: (state, action: PayloadAction<typeof initialState.isSubscribed>) => {
			state.isSubscribed = action.payload;
		},
		setSubscriptionExpiration: (
			state,
			action: PayloadAction<typeof initialState.subscriptionExpiration>
		) => {
			state.subscriptionExpiration = action.payload;
		},
		setUserType: (state, action: PayloadAction<typeof initialState.userType>) => {
			state.userType = action.payload;
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
	},
});

export const {
	reset,
	setUserDetails,
	setName,
	setPhoneNumber,
	setIsSubscribed,
	setSubscriptionExpiration,
	setUserType,
	setGroups,
	setLabels,
	setContactsCount,
	setDataLoaded,
} = UserDetailsSlice.actions;

export default UserDetailsSlice.reducer;
