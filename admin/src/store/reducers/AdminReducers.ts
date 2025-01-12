import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import { StoreNames } from '../config';
import { AdminDetailsState } from '../types/admin';

const initialState: AdminDetailsState = {
	clientId: '',
	promotionalMessage: {
		message_1: '',
		message_2: '',
	},
	token: '',
};

const AdminReducers = createSlice({
	name: StoreNames.ADMIN,
	initialState,
	reducers: {
		setClientId: (state, action: PayloadAction<typeof state.clientId>) => {
			state.clientId = action.payload;
		},
		setPromotionalMessage: (state, action: PayloadAction<typeof state.promotionalMessage>) => {
			state.promotionalMessage = action.payload;
		},
		changePromotionalMessage: (
			state,
			action: PayloadAction<{ message_1: string; message_2: string }>
		) => {
			state.promotionalMessage = action.payload;
		},
		setToken: (state, action) => {
			state.token = action.payload;
		},
	},
});

export const { setClientId, setPromotionalMessage, setToken, changePromotionalMessage } =
	AdminReducers.actions;

export default AdminReducers.reducer;
