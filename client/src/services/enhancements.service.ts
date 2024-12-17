import APIInstance from '../config/APIInstance';

export type LoggerRule = {
	id: string;
	name: string;
	saved: boolean;
	unsaved: boolean;
	include: string[];
	exclude: string[];
	loggers: string[];
};

export default class EnhancementService {
	static async getEnhancements() {
		try {
			const { data } = await APIInstance.get('/preferences');

			return {
				isLoggerEnabled: data.isLoggerEnabled ?? false,
				loggerRules: data.loggerRules as {
					individual_text: LoggerRule;
					individual_media: LoggerRule;
				} & { [key: string]: LoggerRule },
			} as {
				isLoggerEnabled: boolean;
				loggerRules: {
					individual_text: LoggerRule;
					individual_media: LoggerRule;
				} & { [key: string]: LoggerRule };
			};
		} catch (error) {
			//ignore
		}
	}

	static async updateMessageLoggerPreferences(details: {
		id: string;
		loggers: string[];
		include?: string[];
		exclude?: string[];
		saved: boolean;
		unsaved: boolean;
	}) {
		try {
			const { data } = await APIInstance.patch('/preferences/message-logger/rules', {
				id: details.id,
				loggers: details.loggers,
				include: details.include,
				exclude: details.exclude,
				saved: details.saved,
				unsaved: details.unsaved,
			});

			return data.success as boolean;
		} catch (error) {
			return false;
		}
	}

	static async enableMessageLogging() {
		try {
			const { data } = await APIInstance.post('/preferences/message-logger/enable');
			return data.success as boolean;
		} catch (err) {
			return false;
		}
	}

	static async disableMessageLogging() {
		try {
			const { data } = await APIInstance.post('/preferences/message-logger/disable');
			return data.success as boolean;
		} catch (err) {
			return false;
		}
	}

	static async createMessageLogRule(details: {
		group_id: string[];
		loggers: string[];
		include: string[];
		exclude: string[];
	}) {
		try {
			const { data } = await APIInstance.post('/preferences/message-logger/rules', details);

			return data.success as boolean;
		} catch (error) {
			return false;
		}
	}

	static async deleteLoggerRule(id: string) {
		try {
			const { data } = await APIInstance.delete(`/preferences/message-logger/rules/${id}`);
			return data.success as boolean;
		} catch (error) {
			return false;
		}
	}
}
