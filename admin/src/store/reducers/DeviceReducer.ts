import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import { StoreNames } from '../config';
import { DevicesState } from '../types/DevicesState';

const initialState: DevicesState = {
	list: [],
	selectedDevice: [],
	uiDetails: {
		isSaving: false,
		isFetching: false,
		isDeleting: false,
		isCreating: false,
		isUpdating: false,
		error: '',
	},
};

const DeviceSlice = createSlice({
	name: StoreNames.DEVICES,
	initialState,
	reducers: {
		reset: (state) => {
			state.list = initialState.list;
			state.selectedDevice = initialState.selectedDevice;
			state.uiDetails = initialState.uiDetails;
		},
		setDeviceList: (state, action: PayloadAction<typeof initialState.list>) => {
			state.list = action.payload;
		},
		addSelectedDevice: (state, action: PayloadAction<string>) => {
			state.selectedDevice.push(action.payload);
		},
		removeSelectedDevice: (state, action: PayloadAction<string>) => {
			state.selectedDevice = state.selectedDevice.filter((id) => id !== action.payload);
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
	setIsFetching,
	setIsDeleting,
	setIsCreating,
	setIsUpdating,
	setError,
	setDeviceList,
	addSelectedDevice,
	removeSelectedDevice,
} = DeviceSlice.actions;

export default DeviceSlice.reducer;
