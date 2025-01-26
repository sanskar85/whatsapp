import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import { StoreNames } from '../config';
import { SchedulerByDateDetails, SchedulerByDateState } from '../types/ScheduleByDateState';

const initialState: SchedulerByDateState = {
	all_schedulers: [],
	details: {
		daily_count: '0',
		id: '',
		recipient_from: 'NUMBERS',
		recipient_data: [],
		message: '',
		random_string: false,
		shared_contact_cards: [],
		attachments: [],
		title: '',
		start_time: '10:00',
		end_time: '18:00',
		polls: [],
		description: '',
		dates: [],
		remove_duplicates: false,
	},
	variables: [],
	isRecipientsLoading: false,
	isBusinessAccount: true,
	recipients: [],
	ui: {
		campaignLoading: false,
		exportingCampaign: false,
		deletingCampaign: false,
		messageError: false,
		campaignNameError: false,
		recipientsError: false,
		apiError: '',
		editingMessage: false,
		dateError: false,
		dailyCountError: '',
	},
};

const SchedulerByDateSlice = createSlice({
	name: StoreNames.SCHEDULER_BY_DATE,
	initialState,
	reducers: {
		reset: (state) => {
			state.details = initialState.details;
			state.isRecipientsLoading = initialState.isRecipientsLoading;
			state.isBusinessAccount = initialState.isBusinessAccount;
			state.recipients = initialState.recipients;
			state.ui = initialState.ui;
		},
		setAllRepetitiveSchedulers: (
			state,
			action: PayloadAction<typeof initialState.all_schedulers>
		) => {
			state.all_schedulers = action.payload;
		},
		editSelectedScheduler: (
			state,
			action: PayloadAction<(typeof initialState.all_schedulers)[0]>
		) => {
			state.all_schedulers = state.all_schedulers.map((scheduler) => {
				if (scheduler.id === action.payload.id) {
					return action.payload;
				}
				return scheduler;
			});
			state.ui.editingMessage = false;
			state.details = initialState.details;
		},
		addScheduler: (state, action: PayloadAction<SchedulerByDateDetails & { active: boolean }>) => {
			state.all_schedulers.push(action.payload);
			state.details = initialState.details;
		},
		deleteScheduler: (state, action: PayloadAction<string>) => {
			state.all_schedulers = state.all_schedulers.filter(
				(scheduler) => scheduler.id !== action.payload
			);
		},
		resetSelectedScheduler: (state) => {
			state.details = initialState.details;
		},
		setSelectedScheduler: (
			state,
			action: PayloadAction<(typeof initialState.all_schedulers)[0]>
		) => {
			state.details.id = action.payload.id;
			state.details.message = action.payload.message;
			state.details.title = action.payload.title;
			state.details.shared_contact_cards = action.payload.shared_contact_cards;
			state.details.attachments = action.payload.attachments;
			state.details.polls = action.payload.polls;
			state.details.start_time = action.payload.start_time;
			state.details.end_time = action.payload.end_time;
			state.details.description = action.payload.description;
			state.details.dates = action.payload.dates;
			state.details.daily_count = action.payload.daily_count;
			state.details.recipient_data = action.payload.recipient_data;
			state.details.recipient_from = action.payload.recipient_from;
			state.ui.editingMessage = true;
		},
		setCampaignName: (state, action: PayloadAction<typeof initialState.details.title>) => {
			state.details.title = action.payload;
		},
		setRecipientsLoading: (
			state,
			action: PayloadAction<typeof initialState.isRecipientsLoading>
		) => {
			state.isRecipientsLoading = action.payload;
		},
		setBusinessAccount: (state, action: PayloadAction<typeof initialState.isBusinessAccount>) => {
			state.isBusinessAccount = action.payload;
		},
		setRecipients: (state, action: PayloadAction<typeof initialState.recipients>) => {
			state.recipients = action.payload;
		},
		setVariables: (state, action: PayloadAction<typeof initialState.variables>) => {
			state.variables = action.payload;
		},
		setRecipientsFrom: (
			state,
			action: PayloadAction<typeof initialState.details.recipient_from>
		) => {
			state.details.recipient_from = action.payload;
			state.details.recipient_data = '';
		},
		setRecipientsData: (state, action: PayloadAction<string[] | string>) => {
			state.details.recipient_data = action.payload;
		},
		setMessage: (state, action: PayloadAction<typeof initialState.details.message>) => {
			state.details.message = action.payload;
		},
		toggleRandomString: (state) => {
			state.details.random_string = !state.details.random_string;
		},
		setAttachments: (state, action: PayloadAction<typeof initialState.details.attachments>) => {
			state.details.attachments = action.payload;
		},
		setContactCards: (
			state,
			action: PayloadAction<typeof initialState.details.shared_contact_cards>
		) => {
			state.details.shared_contact_cards = action.payload;
		},
		setStartTime: (state, action: PayloadAction<typeof initialState.details.start_time>) => {
			state.details.start_time = action.payload;
		},
		setEndTime: (state, action: PayloadAction<typeof initialState.details.end_time>) => {
			state.details.end_time = action.payload;
		},
		setPolls: (state, action: PayloadAction<typeof initialState.details.polls>) => {
			state.details.polls = action.payload;
		},
		setDescription: (state, action: PayloadAction<typeof initialState.details.description>) => {
			state.details.description = action.payload;
		},
		setMessagesPerDay: (state, action: PayloadAction<typeof initialState.details.daily_count>) => {
			state.details.daily_count = action.payload;
		},
		setCampaignLoading: (state, action: PayloadAction<boolean>) => {
			state.ui.campaignLoading = action.payload;
		},
		setExportingCampaign: (state, action: PayloadAction<boolean>) => {
			state.ui.exportingCampaign = action.payload;
		},
		setDeletingCampaign: (state, action: PayloadAction<boolean>) => {
			state.ui.deletingCampaign = action.payload;
		},
		addBlankDate: (state) => {
			state.details.dates.push('');
			state.ui.dateError = false;
		},
		removeDate: (state, action: PayloadAction<number>) => {
			state.details.dates.splice(action.payload, 1);
			state.ui.dateError = false;
		},
		setDate: (state, action: PayloadAction<{ index: number; date: string }>) => {
			state.details.dates[action.payload.index] = action.payload.date;
			state.ui.dateError = false;
		},
		setDailyCount: (state, action: PayloadAction<string>) => {
			state.details.daily_count = action.payload;
			state.ui.dailyCountError = '';
		},
		setMessageError: (state, action: PayloadAction<boolean>) => {
			state.ui.messageError = action.payload;
		},
		setCampaignNameError: (state, action: PayloadAction<boolean>) => {
			state.ui.campaignNameError = action.payload;
		},
		setRecipientsError: (state, action: PayloadAction<boolean>) => {
			state.ui.recipientsError = action.payload;
		},
		setDateError: (state, action: PayloadAction<boolean>) => {
			state.ui.dateError = action.payload;
		},
		setAPIError: (state, action: PayloadAction<string>) => {
			state.ui.apiError = action.payload;
		},
		setDailyCountError: (state, action: PayloadAction<string>) => {
			state.ui.dailyCountError = action.payload;
		},
		setEditingScheduler: (state, action: PayloadAction<boolean>) => {
			if (!action.payload) {
				state.details = initialState.details;
			}
			state.ui.editingMessage = action.payload;
		},
	},
});

export const {
	reset,
	setAllRepetitiveSchedulers,
	editSelectedScheduler,
	addScheduler,
	deleteScheduler,
	setSelectedScheduler,
	setCampaignName,
	setRecipientsFrom,
	setBusinessAccount,
	setRecipients,
	setVariables,
	setMessage,
	toggleRandomString,
	setAttachments,
	setContactCards,
	setEditingScheduler,
	setStartTime,
	setEndTime,
	setPolls,
	setDescription,
	setCampaignLoading,
	setDeletingCampaign,
	setExportingCampaign,
	setMessageError,
	setCampaignNameError,
	setRecipientsError,
	setRecipientsLoading,
	setAPIError,
	setDailyCountError,
	addBlankDate,
	removeDate,
	setDate,
	setDateError,
	setMessagesPerDay,
	setRecipientsData,
	setDailyCount,
	resetSelectedScheduler,
} = SchedulerByDateSlice.actions;

export default SchedulerByDateSlice.reducer;
