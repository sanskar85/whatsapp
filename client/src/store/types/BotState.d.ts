import { Poll } from './PollState';

export type BotState = {
	all_bots: Bot[];
	details: Bot;
	ui: {
		isAddingBot: boolean;
		isEditingBot: boolean;
		triggerError: string;
		messageError: string;
		respondToError: string;
		optionsError: string;
		contactCardsError: string;
		attachmentError: string;
		triggerGapError: string;
		responseGapError: string;
	};
	trigger_gap: {
		time: number;
		type: string;
	};
	response_delay: {
		time: number;
		type: string;
	};
};

export type Bot = {
	bot_id: string;
	respond_to: string;
	trigger: string[];
	trigger_gap_seconds: number;
	response_delay_seconds: number;
	options: string;
	startAt: string;
	endAt: string;
	message: string;
	random_string: boolean;
	attachments: string[];
	shared_contact_cards: string[];
	isActive: boolean;
	polls: {
		title: string;
		options: string[];
		isMultiSelect: boolean;
	}[];
	forward: {
		number: string;
		message: string;
	};
	nurturing: {
		message: string;
		after: number;
		start_from: string;
		end_at: string;
		shared_contact_cards: string[];
		attachments: string[];
		polls: Poll[];
		random_string: boolean;
	}[];
	allowed_country_codes: string[];
};
