export type SchedulerState = {
	details: SchedulerDetails;
	all_campaigns: ScheduledCampaign[];
	all_schedulers: {
		id: string;
		title: string;
		end_at: string;
		start_from: string;
		isActive: boolean;
		polls: {
			title: string;
			options: string[];
			isMultiSelect: boolean;
		}[];
		attachments: string[];
		shared_contact_cards: string[];
		message: string;
		csv: string;
	}[];
	recipients: {
		fileName?: string;
		name: string;
		headers?: string[];
		id: string;
	}[];
	isRecipientsLoading: boolean;
	isBusinessAccount: boolean;
	ui: {
		campaignLoading: boolean;
		exportingCampaign: boolean;
		deletingCampaign: boolean;
		messageError: boolean;
		campaignNameError: boolean;
		recipientsError: boolean;
		apiError: string;
		editingMessage: boolean;
		minDelayError: boolean;
		maxDelayError: boolean;
		batchSizeError: boolean;
		batchDelayError: boolean;
	};
};

export type ScheduledCampaign = {
	campaign_id: string;
	campaignName: string;
	sent: number;
	failed: number;
	pending: number;
	isPaused: boolean;
	createdAt: string;
	description: string;
	startDate: string;
};

export type SchedulerDetails = {
	message_scheduler_id: string;
	type:
		| 'NUMBERS'
		| 'CSV'
		| 'GROUP'
		| 'SAVED'
		| 'UNSAVED'
		| 'LABEL'
		| 'GROUP_INDIVIDUAL'
		| 'GROUP_INDIVIDUAL_WITHOUT_ADMINS';
	numbers?: string[];
	csv_file: string;
	group_ids: string[];
	label_ids: string[];
	message: string;
	random_string: boolean;
	variables: string[];
	shared_contact_cards: string[];
	attachments: string[];
	campaign_name: string;
	min_delay: number;
	max_delay: number;
	startDate: string;
	startTime: string;
	endTime: string;
	batch_delay: number;
	batch_size: number;
	polls: {
		title: string;
		options: string[];
		isMultiSelect: boolean;
	}[];
	description: string;
};

export default UserState;
