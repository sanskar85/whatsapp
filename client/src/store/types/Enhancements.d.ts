import { LoggerRule } from '../../services/enhancements.service';

export type EnhancementState = {
	message_logger: boolean;
	logger_prefs: {
		individual_text: LoggerRule;
		individual_media: LoggerRule;
	} & { [key: string]: LoggerRule };
	newRuleDetails: {
		group_id: string[];
		loggers: string[];
		include: string[];
		exclude: string[];
	};
	updated_values: {
		[key: string]: boolean;
	};
	isMessageStarEnabled: boolean;
	messageStarRules: {
		individual_outgoing_messages: boolean;
		individual_incoming_messages: boolean;
		group_outgoing_messages: boolean;
		group_incoming_messages: boolean;
	};
};
