import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { LoggerRule } from '../../services/enhancements.service';
import { EnhancementState } from '../types/Enhancements';

const initState: EnhancementState = {
	message_logger: false,
	logger_prefs: {
		saved: {
			exclude: [],
			include: [],
			id: 'saved',
			name: 'Saved',
			loggers: [],
		},
		unsaved: {
			exclude: [],
			include: [],
			id: 'unsaved',
			name: 'Unsaved',
			loggers: [],
		},
	},
	newRuleDetails: {
		group_id: [],
		loggers: [],
		include: [],
		exclude: [],
	},
	updated_values: new Set(),
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
		setSavedNumberInclude: (state, action: PayloadAction<string[]>) => {
			state.logger_prefs.saved.include = action.payload;
		},
		setSavedNumberExclude: (state, action: PayloadAction<string[]>) => {
			state.logger_prefs.saved.exclude = action.payload;
		},
		setUnsavedNumberInclude: (state, action: PayloadAction<string[]>) => {
			state.logger_prefs.unsaved.include = action.payload;
		},
		setUnsavedNumberExclude: (state, action: PayloadAction<string[]>) => {
			state.logger_prefs.unsaved.exclude = action.payload;
		},
		setSavedMimeType: (state, action: PayloadAction<typeof state.logger_prefs.saved.loggers>) => {
			state.logger_prefs.saved.loggers = action.payload;
		},
		setUnsavedMimeType: (
			state,
			action: PayloadAction<typeof state.logger_prefs.unsaved.loggers>
		) => {
			state.logger_prefs.unsaved.loggers = action.payload;
		},
		setMessageLoggerSettings: (
			state,
			action: PayloadAction<{
				isLoggerEnabled: boolean;
				loggerRules: {
					saved: LoggerRule;
					unsaved: LoggerRule;
				} & { [key: string]: LoggerRule };
			}>
		) => {
			state.logger_prefs = action.payload.loggerRules;
			state.message_logger = action.payload.isLoggerEnabled;
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
		updateLoggerPrefs: (
			state,
			action: PayloadAction<{
				[key: string]: LoggerRule;
			}>
		) => {
			state.updated_values.add(Object.keys(action.payload)[0]);
			state.logger_prefs = { ...state.logger_prefs, ...action.payload };
		},
	},
});

export const {
	reset,
	setMessageLogger,
	setSavedNumberExclude,
	setSavedNumberInclude,
	setUnsavedNumberExclude,
	setUnsavedNumberInclude,
	setSavedMimeType,
	setUnsavedMimeType,
	setMessageLoggerSettings,
	setNewRuleDetails,
	setNewRuleExclude,
	setNewRuleGroup,
	setNewRuleInclude,
	setNewRuleLoggers,
} = EnhancementsSlice.actions;

export default EnhancementsSlice.reducer;
