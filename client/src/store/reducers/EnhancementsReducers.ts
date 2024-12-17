import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { LoggerRule } from '../../services/enhancements.service';
import { EnhancementState } from '../types/Enhancements';

const initState: EnhancementState = {
	message_logger: false,
	logger_prefs: {
		individual_text: {
			saved: false,
			unsaved: false,
			exclude: [],
			include: [],
			id: 'individual_text',
			name: 'Text',
			loggers: [],
		},
		individual_media: {
			saved: false,
			unsaved: false,
			exclude: [],
			include: [],
			id: 'individual_media',
			name: 'Media',
			loggers: [],
		},
	},
	newRuleDetails: {
		group_id: [],
		loggers: [],
		include: [],
		exclude: [],
	},
	updated_values: {},
	isMessageStarEnabled: false,
	messageStarRules: {
		individual_outgoing_messages: false,
		individual_incoming_messages: false,
		group_outgoing_messages: false,
		group_incoming_messages: false,
	},
};

const EnhancementsSlice = createSlice({
	name: 'enhancements',
	initialState: initState,
	reducers: {
		reset: (state) => {
			state.logger_prefs = initState.logger_prefs;
			state.message_logger = initState.message_logger;
		},
		setMessageLogger: (state, action: PayloadAction<boolean>) => {
			state.message_logger = action.payload;
		},
		setSavedText: (state, action: PayloadAction<boolean>) => {
			state.updated_values.individual_text = true;
			state.logger_prefs.individual_text.saved = action.payload;
		},
		setUnsavedText: (state, action: PayloadAction<boolean>) => {
			state.updated_values.individual_text = true;
			state.logger_prefs.individual_text.unsaved = action.payload;
		},
		setSavedMedia: (state, action: PayloadAction<boolean>) => {
			state.updated_values.individual_media = true;
			state.logger_prefs.individual_media.saved = action.payload;
		},
		setUnsavedMedia: (state, action: PayloadAction<boolean>) => {
			state.updated_values.individual_media = true;
			state.logger_prefs.individual_media.unsaved = action.payload;
		},
		setTextInclude: (state, action: PayloadAction<string[]>) => {
			state.updated_values.individual_text = true;
			state.logger_prefs.individual_text.include = action.payload;
		},
		setTextExclude: (state, action: PayloadAction<string[]>) => {
			state.updated_values.individual_text = true;
			state.logger_prefs.individual_text.exclude = action.payload;
		},
		setMediaInclude: (state, action: PayloadAction<string[]>) => {
			state.updated_values.individual_media = true;
			state.logger_prefs.individual_media.include = action.payload;
		},
		setMediaExclude: (state, action: PayloadAction<string[]>) => {
			state.updated_values.individual_media = true;
			state.logger_prefs.individual_media.exclude = action.payload;
		},
		setIndividualMediaLoggers: (
			state,
			action: PayloadAction<typeof state.logger_prefs.individual_media.loggers>
		) => {
			state.updated_values.media = true;
			state.logger_prefs.individual_media.loggers = action.payload;
		},
		setMessageLoggerSettings: (
			state,
			action: PayloadAction<{
				isLoggerEnabled: boolean;
				loggerRules: {
					individual_text: LoggerRule;
					individual_media: LoggerRule;
				} & { [key: string]: LoggerRule };
				isMessageStarEnabled: boolean;
				messageStarRules: {
					individual_outgoing_messages: boolean;
					individual_incoming_messages: boolean;
					group_outgoing_messages: boolean;
					group_incoming_messages: boolean;
				};
			}>
		) => {
			state.logger_prefs = action.payload.loggerRules;
			state.message_logger = action.payload.isLoggerEnabled;
			state.isMessageStarEnabled = action.payload.isMessageStarEnabled;
			state.messageStarRules = action.payload.messageStarRules;
		},
		setNewRuleDetails: (
			state,
			action: PayloadAction<{
				group_id: string[];
				loggers: string[];
				include: string[];
				exclude: string[];
			}>
		) => {
			state.newRuleDetails = action.payload;
		},
		setNewRuleGroup: (state, action: PayloadAction<string[]>) => {
			state.newRuleDetails.group_id = action.payload;
		},
		setNewRuleLoggers: (state, action: PayloadAction<string[]>) => {
			state.newRuleDetails.loggers = action.payload;
		},
		setNewRuleInclude: (state, action: PayloadAction<string[]>) => {
			state.newRuleDetails.include = action.payload;
		},
		setNewRuleExclude: (state, action: PayloadAction<string[]>) => {
			state.newRuleDetails.exclude = action.payload;
		},
		updateLoggerPrefs: (state, action: PayloadAction<LoggerRule>) => {
			state.updated_values[action.payload.id] = true;
			state.logger_prefs = { ...state.logger_prefs, [action.payload.id]: action.payload };
		},
		updateStarMessages: (
			state,
			action: PayloadAction<Partial<typeof initState.messageStarRules>>
		) => {
			if (action.payload.group_incoming_messages !== undefined) {
				state.messageStarRules.group_incoming_messages = action.payload.group_incoming_messages;
			}
			if (action.payload.group_outgoing_messages !== undefined) {
				state.messageStarRules.group_outgoing_messages = action.payload.group_outgoing_messages;
			}
			if (action.payload.individual_incoming_messages !== undefined) {
				state.messageStarRules.individual_incoming_messages =
					action.payload.individual_incoming_messages;
			}
			if (action.payload.individual_outgoing_messages !== undefined) {
				state.messageStarRules.individual_outgoing_messages =
					action.payload.individual_outgoing_messages;
			}
			if (
				!state.messageStarRules.group_incoming_messages &&
				!state.messageStarRules.group_outgoing_messages &&
				!state.messageStarRules.individual_incoming_messages &&
				!state.messageStarRules.individual_outgoing_messages
			) {
				state.isMessageStarEnabled = false;
			}
		},
		resetUpdatedValues: (state) => {
			state.updated_values = {};
		},
		resetNewRuleDetails: (state) => {
			state.newRuleDetails = initState.newRuleDetails;
		},
	},
});

export const {
	reset,
	setMessageLogger,
	setTextExclude,
	setTextInclude,
	setIndividualMediaLoggers,
	setMessageLoggerSettings,
	setNewRuleDetails,
	setNewRuleExclude,
	setNewRuleGroup,
	setNewRuleInclude,
	setNewRuleLoggers,
	updateLoggerPrefs,
	resetUpdatedValues,
	setSavedText,
	setUnsavedText,
	setSavedMedia,
	setUnsavedMedia,
	setMediaExclude,
	setMediaInclude,
	resetNewRuleDetails,
	updateStarMessages,
} = EnhancementsSlice.actions;

export default EnhancementsSlice.reducer;
