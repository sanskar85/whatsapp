import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import { StoreNames } from '../config';
import { PaymentRecords } from '../types/PaymentState';

const initialState: PaymentRecords = {
	list: [],
	paymentRecord: {
		transaction_date: '',
		order_id: '',
		plan: '',
		whatsapp_numbers: [],
		name: '',
		phone_number: '',
		email: '',
		admin_number: '',
		billing_address: {
			street: '',
			city: '',
			district: '',
			state: '',
			country: '',
			pincode: '',
			gstin: '',
		},
		gross_amount: 0,
		discount: 0,
		tax: 0,
		total_amount: 0,
		transaction_status: '',
		invoice_id: '',
		coupon: '',
	},
	uiDetails: {
		isSaving: false,
		isFetching: false,
		isDeleting: false,
		isCreating: false,
		isUpdating: false,
		error: '',
	},
};

const PaymentReducers = createSlice({
	name: StoreNames.PAYMENTS,
	initialState,
	reducers: {
		reset: (state) => {
			state.list = initialState.list;
			state.paymentRecord = initialState.paymentRecord;
			state.uiDetails = initialState.uiDetails;
		},
		setRecordsList: (state, action: PayloadAction<typeof initialState.list>) => {
			state.list = action.payload;
			state.uiDetails.isFetching = false;
		},
		setPaymentRecord: (state, action: PayloadAction<typeof initialState.paymentRecord>) => {
			state.paymentRecord = action.payload;
		},
		startSaving: (state) => {
			state.uiDetails.isSaving = true;
		},
		stopSaving: (state) => {
			state.uiDetails.isSaving = false;
		},
		setIsFetching: (state, action: PayloadAction<typeof initialState.uiDetails.isFetching>) => {
			state.uiDetails.isFetching = action.payload;
		},
		setIsDeleting: (state, action: PayloadAction<typeof initialState.uiDetails.isDeleting>) => {
			state.uiDetails.isDeleting = action.payload;
		},
		setIsCreating: (state, action: PayloadAction<typeof initialState.uiDetails.isCreating>) => {
			state.uiDetails.isCreating = action.payload;
		},
		setIsUpdating: (state, action: PayloadAction<typeof initialState.uiDetails.isUpdating>) => {
			state.uiDetails.isUpdating = action.payload;
		},
		setError: (state, action: PayloadAction<typeof initialState.uiDetails.error>) => {
			state.uiDetails.error = action.payload;
		},
	},
});

export const {
	reset,
	startSaving,
	stopSaving,
	setRecordsList,
	setPaymentRecord,
	setIsFetching,
	setIsDeleting,
	setIsCreating,
	setIsUpdating,
	setError,
} = PaymentReducers.actions;

export default PaymentReducers.reducer;
