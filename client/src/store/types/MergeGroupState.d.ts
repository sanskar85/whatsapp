export type MergeGroupState = {
	list: MergedGroup[];
	selectedGroups: string[];
	editSelectedGroup: MergedGroup;
	uiDetails: {
		isSaving: boolean;
		isFetching: boolean;
		isDeleting: boolean;
		isCreating: boolean;
		isUpdating: boolean;
		error: string;
	};
};

type MergedGroup = {
	id: string;
	name: string;
	groups: string[];
	group_reply_saved: {
		text: string;
		shared_contact_cards: string[];
		attachments: string[];
		polls: {
			title: string;
			options: string[];
			isMultiSelect: boolean;
		}[];
	}[];
	group_reply_unsaved: {
		text: string;
		shared_contact_cards: string[];
		attachments: string[];
		polls: {
			title: string;
			options: string[];
			isMultiSelect: boolean;
		}[];
	}[];
	private_reply_saved: {
		text: string;
		shared_contact_cards: string[];
		attachments: string[];
		polls: {
			title: string;
			options: string[];
			isMultiSelect: boolean;
		}[];
	}[];
	private_reply_unsaved: {
		text: string;
		shared_contact_cards: string[];
		attachments: string[];
		polls: {
			title: string;
			options: string[];
			isMultiSelect: boolean;
		}[];
	}[];
	start_time: string;
	end_time: string;
	restricted_numbers: string[];
	min_delay: number;
	max_delay: number;
	reply_business_only: boolean;
	random_string: boolean;
	active: boolean;
	canSendAdmin: boolean;
	multiple_responses: boolean;
	triggers: string[];
	options: BOT_TRIGGER_OPTIONS;
	forward: {
		number: string;
		message: string;
	};
	allowed_country_codes: string[];
	moderator_rules: {
		group_rule: {
			message: string;
			shared_contact_cards: string[];
			attachments: string[];
			polls: {
				title: string;
				options: string[];
				isMultiSelect: boolean;
			}[];
		};
		admin_rule: {
			message: string;
			shared_contact_cards: string[];
			attachments: string[];
			polls: {
				title: string;
				options: string[];
				isMultiSelect: boolean;
			}[];
		};
		creator_rule: {
			message: string;
			shared_contact_cards: string[];
			attachments: string[];
			polls: {
				title: string;
				options: string[];
				isMultiSelect: boolean;
			}[];
		};
		file_types: string[];
	};
};
