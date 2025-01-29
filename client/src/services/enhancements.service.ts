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
				isMessageStarEnabled: data.isMessageStarEnabled ?? false,
				messageStarRules: {
					individual_outgoing_messages: data.messageStarRules.individual_outgoing_messages ?? false,
					individual_incoming_messages: data.messageStarRules.individual_incoming_messages ?? false,
					group_outgoing_messages: data.messageStarRules.group_outgoing_messages ?? false,
					group_incoming_messages: data.messageStarRules.group_incoming_messages ?? false,
				},
			} as {
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
			};
		} catch (error) {
			//ignore
		}
	}

	static async getMediaModerationRules() {
		try {
			const { data } = await APIInstance.get('/preferences/media-moderation/rules');

			return data.media_moderation_rules as {
				[key: string]: {
					id: string;
					name: string;
					restricted_medias: string[];
				};
			};
		} catch (error) {
			return {};
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

	static async updateStarMessagesPreferences(details: {
		individual_outgoing_messages: boolean;
		individual_incoming_messages: boolean;
		group_outgoing_messages: boolean;
		group_incoming_messages: boolean;
	}) {
		try {
			const { data } = await APIInstance.post('/preferences/message-star-rules', {
				individual_outgoing_messages: details.individual_outgoing_messages,
				individual_incoming_messages: details.individual_incoming_messages,
				group_outgoing_messages: details.group_outgoing_messages,
				group_incoming_messages: details.group_incoming_messages,
			});
			return data as {
				individual_outgoing_messages: boolean;
				individual_incoming_messages: boolean;
				group_outgoing_messages: boolean;
				group_incoming_messages: boolean;
			};
		} catch (error) {
			return {
				individual_outgoing_messages: false,
				individual_incoming_messages: false,
				group_outgoing_messages: false,
				group_incoming_messages: false,
			};
		}
	}

	static async createMediaModerationPreference(details: {
		group_id: string[];
		restricted_medias: string[];
	}) {
		try {
			const { data } = await APIInstance.post('/preferences/media-moderation/rules', {
				group_id: details.group_id,
				restricted_medias: details.restricted_medias,
			});
			return data.success as boolean;
		} catch (error) {
			throw new Error('Failed to create media moderation rule');
		}
	}

	static async updateMediaModerationPreference(details: {
		id: string;
		restricted_medias: string[];
	}) {
		try {
			const { data } = await APIInstance.patch(`/preferences/media-moderation/rules`, {
				id: details.id,
				restricted_medias: details.restricted_medias,
			});
			return data.success as boolean;
		} catch (error) {
			throw new Error('Failed to update media moderation rule');
		}
	}

	static async deleteMediaModerationRule(id: string) {
		try {
			const { data } = await APIInstance.delete(`/preferences/media-moderation/rules/${id}`);
			return data.success as boolean;
		} catch (error) {
			throw new Error('Failed to delete media moderation rule');
		}
	}
}
