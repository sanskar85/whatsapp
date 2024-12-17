import { LoggerRule } from '../../services/enhancements.service';

export type EnhancementState = {
	message_logger: boolean;
	logger_prefs: {
		saved: LoggerRule;
		unsaved: LoggerRule;
	} & { [key: string]: LoggerRule };
	newRuleDetails: {
		group_id: string[];
		loggers: string[];
		include: string[];
		exclude: string[];
	};
	updated_values: Set<string>;
};
