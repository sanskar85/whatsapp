import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { StoreNames } from '../config';
import { APIWebhookState } from '../types/APIWebhookState';

const initState: APIWebhookState = {
	APIerror: '',
	APIloading: false,
	APIlist: [],
	APIdetails: {
		id: '',
		name: '',
		createdAt: '',
	},
	APIselectedList: [],
	token: '',
	webhookDetails: {
		id: '',
		name: '',
		url: '',
		createdAt: '',
	},
	webhookError: '',
	webhookLoading: false,
	webhookList: [],
	webhookSelectedList: [],
};

const APIWebhookSlice = createSlice({
	name: StoreNames.API,
	initialState: initState,
	reducers: {
		reset: (state) => {
			state.APIlist = initState.APIlist;
			state.APIdetails = initState.APIdetails;
			state.APIloading = initState.APIloading;
			state.APIerror = initState.APIerror;
			state.APIselectedList = initState.APIselectedList;
			state.token = initState.token;
			state.webhookDetails = initState.webhookDetails;
			state.webhookError = initState.webhookError;
			state.webhookLoading = initState.webhookLoading;
		},
		setAPIDetails: (state, action: PayloadAction<typeof initState.APIdetails>) => {
			state.APIdetails = action.payload;
		},
		setWebhookDetails: (state, action: PayloadAction<typeof initState.webhookDetails>) => {
			state.webhookDetails = action.payload;
		},
		setAPIList: (state, action: PayloadAction<typeof initState.APIlist>) => {
			state.APIlist = action.payload;
		},
		setWebhookList: (state, action: PayloadAction<typeof initState.webhookList>) => {
			state.webhookList = action.payload;
		},
		deleteAPI: (state, action: PayloadAction<string[]>) => {
			state.APIlist = state.APIlist.filter((item) => !action.payload.includes(item.id));
		},
		deleteWebhook: (state, action: PayloadAction<string[]>) => {
			state.webhookList = state.webhookList.filter((item) => !action.payload.includes(item.id));
		},
		addAPI: (state, action: PayloadAction<typeof initState.APIdetails>) => {
			state.APIlist.push(action.payload);
		},
		addWebhook: (state, action: PayloadAction<typeof initState.webhookDetails>) => {
			state.webhookList.push(action.payload);
		},
		setAPILoading: (state, action: PayloadAction<boolean>) => {
			state.APIloading = action.payload;
		},
		setWebhookLoading: (state, action: PayloadAction<boolean>) => {
			state.webhookLoading = action.payload;
		},
		setAPIError: (state, action: PayloadAction<string>) => {
			state.APIerror = action.payload;
		},
		setWebhookError: (state, action: PayloadAction<string>) => {
			state.webhookError = action.payload;
		},
		setAPIName: (state, action: PayloadAction<string>) => {
			state.APIdetails.name = action.payload;
		},
		setWebhookName: (state, action: PayloadAction<string>) => {
			state.webhookDetails.name = action.payload;
		},
		setWebhookURL: (state, action: PayloadAction<string>) => {
			state.webhookDetails.url = action.payload;
		},
		addToSelectedAPIList: (state, action: PayloadAction<string>) => {
			state.APIselectedList.push(action.payload);
		},
		addToSelectedListWebhook: (state, action: PayloadAction<string>) => {
			state.webhookSelectedList.push(action.payload);
		},
		removeFromSelectedList: (state, action: PayloadAction<string>) => {
			state.APIselectedList = state.APIselectedList.filter((item) => item !== action.payload);
		},
		removeFromSelectedListWebhook: (state, action: PayloadAction<string>) => {
			state.webhookSelectedList = state.APIselectedList.filter((item) => item !== action.payload);
		},
		clearSelectedListAPI: (state) => {
			state.APIselectedList = [];
		},
		clearSelectedListWebhook: (state) => {
			state.webhookSelectedList = [];
		},
		selectAllListAPI: (state) => {
			state.APIselectedList = state.APIlist.map((item) => item.id);
		},
		selectAllListWebhook: (state) => {
			state.APIselectedList = state.webhookList.map((item) => item.id);
		},
		clearSelectedAPIDetails: (state) => {
			state.APIdetails = initState.APIdetails;
		},
		clearSelectedWebhookDetails: (state) => {
			state.webhookDetails = initState.webhookDetails;
		},
		setToken: (state, action: PayloadAction<string>) => {
			state.token = action.payload;
		},
	},
});

export const {
	reset,
	setAPIDetails,
	setAPIList,
	addAPI,
	setAPILoading,
	setAPIError,
	setAPIName,
	addToSelectedAPIList,
	clearSelectedListAPI,
	addToSelectedListWebhook,
	removeFromSelectedList,
	selectAllListAPI,
	deleteAPI,
	clearSelectedWebhookDetails,
	setToken,
	addWebhook,
	clearSelectedAPIDetails,
	clearSelectedListWebhook,
	deleteWebhook,
	removeFromSelectedListWebhook,
	selectAllListWebhook,
	setWebhookDetails,
	setWebhookError,
	setWebhookList,
	setWebhookLoading,
	setWebhookName,
	setWebhookURL,
} = APIWebhookSlice.actions;

export default APIWebhookSlice.reducer;
