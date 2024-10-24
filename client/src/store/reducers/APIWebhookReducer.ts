import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { StoreNames } from '../config';
import { APIWebhookState } from '../types/APIWebhookState';

const initState: APIWebhookState = {
	error: '',
	loading: false,
	list: [],
	details: {
		id: '',
		name: '',
		createdAt: '',
	},
	selectedList: [],
	token: '',
};

const APIWebhookSlice = createSlice({
	name: StoreNames.API,
	initialState: initState,
	reducers: {
		reset: (state) => {
			state.list = initState.list;
			state.details = initState.details;
			state.loading = initState.loading;
			state.error = initState.error;
		},
		setAPIDetails: (state, action: PayloadAction<typeof initState.details>) => {
			state.details = action.payload;
		},
		setAPIList: (state, action: PayloadAction<typeof initState.list>) => {
			state.list = action.payload;
		},
		deleteAPI: (state, action: PayloadAction<string[]>) => {
			state.list = state.list.filter((item) => !action.payload.includes(item.id));
		},
		addAPI: (state, action: PayloadAction<typeof initState.details>) => {
			state.list.push(action.payload);
		},
		setLoading: (state, action: PayloadAction<boolean>) => {
			state.loading = action.payload;
		},
		setError: (state, action: PayloadAction<string>) => {
			state.error = action.payload;
		},
		setAPIName: (state, action: PayloadAction<string>) => {
			state.details.name = action.payload;
		},
		addToSelectedList: (state, action: PayloadAction<string>) => {
			state.selectedList.push(action.payload);
		},
		removeFromSelectedList: (state, action: PayloadAction<string>) => {
			state.selectedList = state.selectedList.filter((item) => item !== action.payload);
		},
		clearSelectedList: (state) => {
			state.selectedList = [];
		},
		selectAllList: (state) => {
			state.selectedList = state.list.map((item) => item.id);
		},
		clearSelectedDetails: (state) => {
			state.details = initState.details;
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
	setLoading,
	setError,
	setAPIName,
	addToSelectedList,
	clearSelectedList,
	removeFromSelectedList,
	selectAllList,
	deleteAPI,
	clearSelectedDetails,
	setToken,
} = APIWebhookSlice.actions;

export default APIWebhookSlice.reducer;
