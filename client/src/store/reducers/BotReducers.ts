import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import { StoreNames } from '..';
import { Bot, BotState } from '../types/BotState';

const initialState: BotState = {
	all_bots: [],
	details: {
		bot_id: '',
		trigger: [],
		message: '',
		random_string: false,
		respond_to: 'ALL',
		options: 'INCLUDES_IGNORE_CASE',
		startAt: '10:00',
		endAt: '18:00',
		attachments: [],
		shared_contact_cards: [],
		isActive: false,
		response_delay_seconds: 1,
		trigger_gap_seconds: 1,
		polls: [],
		forward: {
			number: '',
			message: '',
		},
		nurturing: [],
	},
	ui: {
		isAddingBot: false,
		isEditingBot: false,
		triggerError: '',
		messageError: '',
		respondToError: '',
		optionsError: '',
		contactCardsError: '',
		attachmentError: '',
		triggerGapError: '',
		responseGapError: '',
	},
	response_delay: {
		time: 1,
		type: 'SEC',
	},
	trigger_gap: {
		time: 1,
		type: 'SEC',
	},
};

const BotSlice = createSlice({
	name: StoreNames.CHATBOT,
	initialState,
	reducers: {
		reset: (state) => {
			state.details = initialState.details;
			state.ui = initialState.ui;
			state.response_delay = initialState.response_delay;
			state.trigger_gap = initialState.trigger_gap;
		},
		setBots: (state, action: PayloadAction<typeof initialState.all_bots>) => {
			state.all_bots = action.payload;
		},
		addBot: (state, action: PayloadAction<Bot>) => {
			state.all_bots.push(action.payload);
		},
		removeBot: (state, action: PayloadAction<string>) => {
			state.all_bots = state.all_bots.filter((bot) => bot.bot_id !== action.payload);
		},
		setSelectedBot: (state, action: PayloadAction<string>) => {
			const index = state.all_bots.findIndex((bot) => bot.bot_id === action.payload);
			if (index === -1) {
				return;
			}
			state.details.bot_id = state.all_bots[index].bot_id;
			state.details.trigger = state.all_bots[index].trigger;
			state.details.message = state.all_bots[index].message;
			state.details.random_string = state.all_bots[index].random_string;
			state.details.respond_to = state.all_bots[index].respond_to;
			state.details.options = state.all_bots[index].options;
			state.details.attachments = state.all_bots[index].attachments;
			state.details.shared_contact_cards = state.all_bots[index].shared_contact_cards;
			state.details.isActive = state.all_bots[index].isActive;
			state.details.response_delay_seconds = state.all_bots[index].response_delay_seconds;
			state.details.trigger_gap_seconds = state.all_bots[index].trigger_gap_seconds;
			state.details.polls = state.all_bots[index].polls;
			state.details.forward.number = state.all_bots[index].forward.number ?? '';
			state.details.forward.message = state.all_bots[index].forward.message ?? '';
			state.details.nurturing = state.all_bots[index].nurturing;
			state.details.startAt = state.all_bots[index].startAt;
			state.details.endAt = state.all_bots[index].endAt;

			state.ui.isEditingBot = true;

			state.response_delay.time =
				state.details.response_delay_seconds % 3600 === 0
					? state.details.response_delay_seconds / 3600
					: state.details.response_delay_seconds % 60 === 0
					? state.details.response_delay_seconds / 60
					: state.details.response_delay_seconds;
			state.response_delay.type =
				state.details.response_delay_seconds % 3600 === 0
					? 'HOUR'
					: state.details.response_delay_seconds % 60 === 0
					? 'MINUTE'
					: 'SECOND';

			state.trigger_gap.time =
				state.details.trigger_gap_seconds % 3600 === 0
					? state.details.trigger_gap_seconds / 3600
					: state.details.trigger_gap_seconds % 60 === 0
					? state.details.trigger_gap_seconds / 60
					: state.details.trigger_gap_seconds;
			state.trigger_gap.type =
				state.details.trigger_gap_seconds % 3600 === 0
					? 'HOUR'
					: state.details.trigger_gap_seconds % 60 === 0
					? 'MINUTE'
					: 'SECOND';
		},
		updateBot: (state, action: PayloadAction<{ id: string; data: Bot }>) => {
			state.all_bots = state.all_bots.map((bot) => {
				if (bot.bot_id === action.payload.id) {
					return action.payload.data;
				}
				return bot;
			});
		},
		setTriggerAtIndex: (state, action: PayloadAction<{ index: number; value: string }>) => {
			state.details.trigger[action.payload.index] = action.payload.value;
		},
		addTrigger: (state) => {
			state.details.trigger.push('');
		},
		removeTrigger: (state, action: PayloadAction<number>) => {
			state.details.trigger.splice(action.payload, 1);
		},
		removeAllTriggers: (state) => {
			state.details.trigger = [];
		},
		setMessage: (state, action: PayloadAction<typeof initialState.details.message>) => {
			state.details.message = action.payload;
			state.ui.messageError = '';
		},
		toggleRandomString: (state) => {
			state.details.random_string = !state.details.random_string;
		},
		setRespondTo: (state, action: PayloadAction<typeof initialState.details.respond_to>) => {
			state.details.respond_to = action.payload;
			state.ui.respondToError = '';
		},
		setOptions: (state, action: PayloadAction<typeof initialState.details.options>) => {
			state.details.options = action.payload;
			state.ui.optionsError = '';
		},
		setStartAt: (state, action: PayloadAction<typeof initialState.details.startAt>) => {
			state.details.startAt = action.payload;
		},
		setEndAt: (state, action: PayloadAction<typeof initialState.details.endAt>) => {
			state.details.endAt = action.payload;
		},
		setAttachments: (state, action: PayloadAction<typeof initialState.details.attachments>) => {
			state.details.attachments = action.payload;
			state.ui.attachmentError = '';
		},
		setContactCards: (
			state,
			action: PayloadAction<typeof initialState.details.shared_contact_cards>
		) => {
			state.details.shared_contact_cards = action.payload;
			state.ui.contactCardsError = '';
		},
		setResponseDelayTime: (state, action: PayloadAction<number>) => {
			state.response_delay.time = action.payload;
			state.details.response_delay_seconds =
				state.response_delay.time *
				(state.response_delay.type === 'HOUR'
					? 3600
					: state.response_delay.type === 'MINUTE'
					? 60
					: 1);

			state.ui.responseGapError = '';
		},
		setResponseDelayType: (state, action: PayloadAction<string>) => {
			state.response_delay.type = action.payload;
			state.details.response_delay_seconds =
				state.response_delay.time *
				(state.response_delay.type === 'HOUR'
					? 3600
					: state.response_delay.type === 'MINUTE'
					? 60
					: 1);
			state.ui.responseGapError = '';
		},
		setTriggerGapTime: (state, action: PayloadAction<number>) => {
			state.trigger_gap.time = action.payload;
			state.details.trigger_gap_seconds =
				state.trigger_gap.time *
				(state.trigger_gap.type === 'HOUR' ? 3600 : state.trigger_gap.type === 'MINUTE' ? 60 : 1);
			state.ui.triggerGapError = '';
		},
		setTriggerGapType: (state, action: PayloadAction<string>) => {
			state.trigger_gap.type = action.payload;
			state.details.trigger_gap_seconds =
				state.trigger_gap.time *
				(state.trigger_gap.type === 'HOUR' ? 3600 : state.trigger_gap.type === 'MINUTE' ? 60 : 1);
			state.ui.triggerGapError = '';
		},
		setPolls: (state, action: PayloadAction<typeof initialState.details.polls>) => {
			state.details.polls = action.payload;
		},
		setNurturing: (state, action: PayloadAction<typeof initialState.details.nurturing>) => {
			state.details.nurturing = action.payload;
		},
		setAddingBot: (state, action: PayloadAction<boolean>) => {
			state.ui.isAddingBot = action.payload;
		},
		setEditingBot: (state, action: PayloadAction<boolean>) => {
			state.ui.isEditingBot = action.payload;
		},
		setForwardTo: (state, action: PayloadAction<string>) => {
			state.details.forward.number = action.payload;
		},
		setForwardMessage: (state, action: PayloadAction<string>) => {
			state.details.forward.message = action.payload;
		},
		setError: (
			state,
			action: PayloadAction<{
				type:
					| 'triggerError'
					| 'messageError'
					| 'respondToError'
					| 'optionsError'
					| 'contactCardsError'
					| 'attachmentError'
					| 'triggerGapError'
					| 'responseGapError';

				error: string;
			}>
		) => {
			state.ui[action.payload.type] = action.payload.error;
		},
	},
});

export const {
	reset,
	setBots,
	addBot,
	updateBot,
	removeBot,
	setSelectedBot,
	addTrigger,
	removeAllTriggers,
	removeTrigger,
	setTriggerAtIndex,
	setMessage,
	toggleRandomString,
	setRespondTo,
	setOptions,
	setAttachments,
	setContactCards,
	setResponseDelayTime,
	setResponseDelayType,
	setTriggerGapTime,
	setTriggerGapType,
	setPolls,
	setError,
	setNurturing,
	setAddingBot,
	setEditingBot,
	setForwardMessage,
	setForwardTo,
	setEndAt,
	setStartAt,
} = BotSlice.actions;

export default BotSlice.reducer;
