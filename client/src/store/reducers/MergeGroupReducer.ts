import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import { StoreNames } from '..';
import { MergeGroupState } from '../types/MergeGroupState';

const initialState: MergeGroupState = {
	list: [],
	selectedGroups: [],
	editSelectedGroup: {
		id: '',
		name: '',
		groups: [],
		group_reply_saved: [],
		group_reply_unsaved: [],
		private_reply_saved: [],
		private_reply_unsaved: [],
		restricted_numbers: [],
		min_delay: 2,
		max_delay: 7,
		random_string: false,
		reply_business_only: false,
		active: true,
		canSendAdmin: false,
		multiple_responses: false,
		triggers: [],
		options: 'EXACT_MATCH_CASE',
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

const MergeGroupSlice = createSlice({
	name: StoreNames.MERGE_GROUP,
	initialState,
	reducers: {
		reset: (state) => {
			state.list = initialState.list;
			state.selectedGroups = initialState.selectedGroups;
			state.uiDetails = initialState.uiDetails;
		},
		setMergedGroupList: (state, action: PayloadAction<typeof initialState.list>) => {
			state.list = action.payload;
		},
		addMergedGroup: (state, action: PayloadAction<(typeof initialState.list)[0]>) => {
			state.list.push(action.payload);
			state.uiDetails.isSaving = false;
		},
		addSelectedGroups: (state, action: PayloadAction<string>) => {
			state.selectedGroups.push(action.payload);
		},
		addAllGroups: (state) => {
			state.selectedGroups = state.list.map((group) => group.id);
		},
		removeSelectedGroups: (state, action: PayloadAction<string>) => {
			state.selectedGroups = state.selectedGroups.filter((id) => id !== action.payload);
		},
		addSelectedGroup: (state, action: PayloadAction<string>) => {
			state.editSelectedGroup.groups.push(action.payload);
		},
		addMultipleSelectedGroup: (state, action: PayloadAction<string[]>) => {
			state.editSelectedGroup.groups = action.payload;
		},
		removeSelectedGroup: (state, action: PayloadAction<string>) => {
			state.editSelectedGroup.groups = state.editSelectedGroup.groups.filter(
				(id) => id !== action.payload
			);
		},
		clearSelectedGroup: (state) => {
			state.selectedGroups = [];
		},
		deleteMergedGroup: (state, action: PayloadAction<string>) => {
			state.list = state.list.filter((merged_group) => merged_group.id !== action.payload);
			state.selectedGroups = initialState.selectedGroups.filter((id) => id !== action.payload);
			state.uiDetails.isDeleting = false;
		},
		editSelectedGroup: (state, action: PayloadAction<string>) => {
			const group = state.list.find((g) => g.id === action.payload);
			if (group) {
				state.editSelectedGroup.id = group.id;
				state.editSelectedGroup.name = group.name;
				state.editSelectedGroup.groups = group.groups;
				state.editSelectedGroup.group_reply_saved = group.group_reply_saved;
				state.editSelectedGroup.group_reply_unsaved = group.group_reply_unsaved;
				state.editSelectedGroup.private_reply_saved = group.private_reply_saved;
				state.editSelectedGroup.private_reply_unsaved = group.private_reply_unsaved;
				state.editSelectedGroup.restricted_numbers = group.restricted_numbers;
				state.editSelectedGroup.min_delay = group.min_delay;
				state.editSelectedGroup.max_delay = group.max_delay;
				state.editSelectedGroup.reply_business_only = group.reply_business_only;
				state.editSelectedGroup.random_string = group.random_string;
				state.editSelectedGroup.canSendAdmin = group.canSendAdmin;
				state.editSelectedGroup.multiple_responses = group.multiple_responses;
				state.editSelectedGroup.triggers = group.triggers;
				state.editSelectedGroup.options = group.options;
			}
		},
		setActive: (
			state,
			action: PayloadAction<{
				id: string;
				active: boolean;
			}>
		) => {
			state.list = state.list.map((g) => {
				if (g.id === action.payload.id) {
					g.active = action.payload.active;
				}
				return g;
			});
		},
		updateMergeGroupsList: (state, action: PayloadAction<(typeof initialState.list)[0]>) => {
			const index = state.list.findIndex((group) => group.id === action.payload.id);
			state.list[index] = action.payload;
			state.uiDetails.isUpdating = false;
		},
		setName: (state, action: PayloadAction<string>) => {
			state.editSelectedGroup.name = action.payload;
		},
		setTriggerAtIndex: (state, action: PayloadAction<{ index: number; value: string }>) => {
			state.editSelectedGroup.triggers[action.payload.index] = action.payload.value;
		},
		addTrigger: (state) => {
			state.editSelectedGroup.triggers.push('');
		},
		removeTrigger: (state, action: PayloadAction<number>) => {
			state.editSelectedGroup.triggers.splice(action.payload, 1);
		},
		removeAllTriggers: (state) => {
			state.editSelectedGroup.triggers = [];
		},
		setOptions: (state, action: PayloadAction<typeof initialState.editSelectedGroup.options>) => {
			state.editSelectedGroup.options = action.payload;
		},
		setGroups: (state, action: PayloadAction<string>) => {
			state.editSelectedGroup.groups.push(action.payload);
		},
		addGroupReplySaved: (state) => {
			state.editSelectedGroup.group_reply_saved.push({
				text: '',
				shared_contact_cards: [],
				attachments: [],
				polls: [],
			});
		},
		addGroupReplyUnsaved: (state) => {
			state.editSelectedGroup.group_reply_unsaved.push({
				text: '',
				shared_contact_cards: [],
				attachments: [],
				polls: [],
			});
		},
		addPrivateReplySaved: (state) => {
			state.editSelectedGroup.private_reply_saved.push({
				text: '',
				shared_contact_cards: [],
				attachments: [],
				polls: [],
			});
		},
		addPrivateReplyUnsaved: (state) => {
			state.editSelectedGroup.private_reply_unsaved.push({
				text: '',
				shared_contact_cards: [],
				attachments: [],
				polls: [],
			});
		},
		removeGroupReplySaved: (state, action: PayloadAction<number>) => {
			state.editSelectedGroup.group_reply_saved.splice(action.payload, 1);
		},
		removeGroupReplyUnsaved: (state, action: PayloadAction<number>) => {
			state.editSelectedGroup.group_reply_unsaved.splice(action.payload, 1);
		},
		removePrivateReplySaved: (state, action: PayloadAction<number>) => {
			state.editSelectedGroup.private_reply_saved.splice(action.payload, 1);
		},
		removePrivateReplyUnsaved: (state, action: PayloadAction<number>) => {
			state.editSelectedGroup.private_reply_unsaved.splice(action.payload, 1);
		},
		setGroupReplySavedText: (state, action: PayloadAction<{ index: number; text: string }>) => {
			state.editSelectedGroup.group_reply_saved[action.payload.index].text = action.payload.text;
		},
		setGroupReplyUnsavedText: (state, action: PayloadAction<{ index: number; text: string }>) => {
			state.editSelectedGroup.group_reply_unsaved[action.payload.index].text = action.payload.text;
		},
		setPrivateReplySavedText: (state, action: PayloadAction<{ index: number; text: string }>) => {
			state.editSelectedGroup.private_reply_saved[action.payload.index].text = action.payload.text;
		},
		setPrivateReplyUnsavedText: (state, action: PayloadAction<{ index: number; text: string }>) => {
			state.editSelectedGroup.private_reply_unsaved[action.payload.index].text =
				action.payload.text;
		},
		setGroupReplySavedSharedContactCards: (
			state,
			action: PayloadAction<{ index: number; text: string[] }>
		) => {
			state.editSelectedGroup.group_reply_saved[action.payload.index].shared_contact_cards =
				action.payload.text;
		},
		setGroupReplyUnsavedSharedContactCards: (
			state,
			action: PayloadAction<{ index: number; text: string[] }>
		) => {
			state.editSelectedGroup.group_reply_unsaved[action.payload.index].shared_contact_cards =
				action.payload.text;
		},
		setPrivateReplySavedSharedContactCards: (
			state,
			action: PayloadAction<{ index: number; text: string[] }>
		) => {
			state.editSelectedGroup.private_reply_saved[action.payload.index].shared_contact_cards =
				action.payload.text;
		},
		setPrivateReplyUnsavedSharedContactCards: (
			state,
			action: PayloadAction<{ index: number; text: string[] }>
		) => {
			state.editSelectedGroup.private_reply_unsaved[action.payload.index].shared_contact_cards =
				action.payload.text;
		},
		setGroupReplySavedAttachments: (
			state,
			action: PayloadAction<{ index: number; text: string[] }>
		) => {
			state.editSelectedGroup.group_reply_saved[action.payload.index].attachments =
				action.payload.text;
		},
		setGroupReplyUnsavedAttachments: (
			state,
			action: PayloadAction<{ index: number; text: string[] }>
		) => {
			state.editSelectedGroup.group_reply_unsaved[action.payload.index].attachments =
				action.payload.text;
		},
		setPrivateReplySavedAttachments: (
			state,
			action: PayloadAction<{ index: number; text: string[] }>
		) => {
			state.editSelectedGroup.private_reply_saved[action.payload.index].attachments =
				action.payload.text;
		},
		setPrivateReplyUnsavedAttachments: (
			state,
			action: PayloadAction<{ index: number; text: string[] }>
		) => {
			state.editSelectedGroup.private_reply_unsaved[action.payload.index].attachments =
				action.payload.text;
		},
		setGroupReplySavedPolls: (
			state,
			action: PayloadAction<{
				index: number;
				polls: {
					title: string;
					options: string[];
					isMultiSelect: boolean;
				}[];
			}>
		) => {
			state.editSelectedGroup.group_reply_saved[action.payload.index].polls = action.payload.polls;
		},
		setGroupReplyUnsavedPolls: (
			state,
			action: PayloadAction<{
				index: number;
				polls: {
					title: string;
					options: string[];
					isMultiSelect: boolean;
				}[];
			}>
		) => {
			state.editSelectedGroup.group_reply_unsaved[action.payload.index].polls =
				action.payload.polls;
		},
		setPrivateReplySavedPolls: (
			state,
			action: PayloadAction<{
				index: number;
				polls: {
					title: string;
					options: string[];
					isMultiSelect: boolean;
				}[];
			}>
		) => {
			state.editSelectedGroup.private_reply_saved[action.payload.index].polls =
				action.payload.polls;
		},
		setPrivateReplyUnsavedPolls: (
			state,
			action: PayloadAction<{
				index: number;
				polls: {
					title: string;
					options: string[];
					isMultiSelect: boolean;
				}[];
			}>
		) => {
			state.editSelectedGroup.private_reply_unsaved[action.payload.index].polls =
				action.payload.polls;
		},
		clearEditMergeGroup: (state) => {
			state.editSelectedGroup = initialState.editSelectedGroup;
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
		setMinDelay: (
			state,
			action: PayloadAction<typeof initialState.editSelectedGroup.min_delay>
		) => {
			state.editSelectedGroup.min_delay = action.payload;
		},
		setMaxDelay: (
			state,
			action: PayloadAction<typeof initialState.editSelectedGroup.max_delay>
		) => {
			state.editSelectedGroup.max_delay = action.payload;
		},
		toggleRandomString: (state) => {
			state.editSelectedGroup.random_string = !state.editSelectedGroup.random_string;
		},
		toggleSendToAdmin: (state) => {
			state.editSelectedGroup.canSendAdmin = !state.editSelectedGroup.canSendAdmin;
		},
		toggleReplyBusinessOnly: (state) => {
			state.editSelectedGroup.reply_business_only = !state.editSelectedGroup.reply_business_only;
		},
		toggleMultipleResponses: (state) => {
			state.editSelectedGroup.multiple_responses = !state.editSelectedGroup.multiple_responses;
		},
		setRestrictedNumbers: (
			state,
			action: PayloadAction<typeof initialState.editSelectedGroup.restricted_numbers>
		) => {
			state.editSelectedGroup.restricted_numbers = action.payload;
		},
	},
});

export const {
	reset,
	setMergedGroupList,
	addMergedGroup,
	addSelectedGroups,
	addMultipleSelectedGroup,
	addAllGroups,
	removeSelectedGroups,
	clearSelectedGroup,
	addSelectedGroup,
	removeSelectedGroup,
	deleteMergedGroup,
	toggleSendToAdmin,
	editSelectedGroup,
	clearEditMergeGroup,
	updateMergeGroupsList,
	setName,
	setGroups,
	startSaving,
	stopSaving,
	setIsFetching,
	setIsDeleting,
	setIsCreating,
	setIsUpdating,
	setError,
	setGroupReplySavedText,
	setGroupReplyUnsavedText,
	setPrivateReplySavedText,
	setPrivateReplyUnsavedText,
	setGroupReplySavedSharedContactCards,
	setGroupReplyUnsavedSharedContactCards,
	setPrivateReplySavedSharedContactCards,
	setPrivateReplyUnsavedSharedContactCards,
	setGroupReplySavedAttachments,
	setGroupReplyUnsavedAttachments,
	setPrivateReplySavedAttachments,
	setPrivateReplyUnsavedAttachments,
	setGroupReplySavedPolls,
	setGroupReplyUnsavedPolls,
	setPrivateReplySavedPolls,
	setPrivateReplyUnsavedPolls,
	setMaxDelay,
	setMinDelay,
	toggleRandomString,
	toggleReplyBusinessOnly,
	setRestrictedNumbers,
	setActive,
	addGroupReplySaved,
	addGroupReplyUnsaved,
	addPrivateReplySaved,
	addPrivateReplyUnsaved,
	removeGroupReplySaved,
	removeGroupReplyUnsaved,
	removePrivateReplySaved,
	removePrivateReplyUnsaved,
	toggleMultipleResponses,
	addTrigger,
	removeAllTriggers,
	removeTrigger,
	setOptions,
	setTriggerAtIndex,
} = MergeGroupSlice.actions;

export default MergeGroupSlice.reducer;
