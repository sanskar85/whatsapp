export type SchedulerByDateState = {
	details: SchedulerByDateDetails;
	all_schedulers: (SchedulerByDateDetails & { active: boolean })[];
	recipients: {
		fileName?: string;
		name: string;
		headers?: string[];
		id: string;
	}[];
	variables: string[];
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
		dateError: boolean;
		dailyCountError: boolean;
	};
};

export type SchedulerByDateDetails = {
	id: string;
	recipient_from: 'NUMBERS' | 'CSV' | 'GROUP' | 'LABEL' | 'GROUP_INDIVIDUAL';
	recipient_data: string[] | string;
	message: string;
	random_string: boolean;
	shared_contact_cards: string[];
	attachments: string[];
	title: string;
	start_time: string;
	end_time: string;
	dates: string[];
	daily_count: string;
	polls: {
		title: string;
		options: string[];
		isMultiSelect: boolean;
	}[];
	description: string;
};
