import Logger from 'n23-logger';
import { Chat, GroupChat, Message } from 'whatsapp-web.js';
import UserPreferencesService from '../user/userPreferences';

export const mimeTypes = [
	'image',
	'image/heif',
	'image/jpeg',
	'image/png',
	'image/gif',
	'image/webp',
	'video',
	'video/mp4',
	'video/x-matroska',
	'video/webm',
	'video/mpeg',
	'application/msword',
	'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
	'application/vnd.android.package-archive',
	'application/pdf',
	'text/plain',
	'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
	'application/vnd.ms-excel',
	'text/csv',
	'application/zip',
	'audio/mpeg',
];

export type LogMessage = {
	timestamp: string;
	from: string;
	to: string;
	savedName: string;
	displayName: string;
	groupName: string;
	message: string;
	isCaption: string;
	link: string | undefined;
	isForwarded: boolean;
	isForwardedManyTimes: boolean;
	isBroadcast: boolean;
};

export class MediaModerationService {
	private mediaModerationRules;

	constructor(userPrefService: UserPreferencesService) {
		this.mediaModerationRules = userPrefService.getMediaModerationRules();
	}

	async handleMessage({ chat, message }: { message: Message; chat: Chat | GroupChat }) {
		const isMedia = message.hasMedia;
		if (!isMedia) {
			return;
		}
		let is_restricted = false;

		const pref = this.mediaModerationRules[chat.id._serialized];

		if (!pref) {
			return;
		}

		let media;

		if (isMedia) {
			try {
				media = await message.downloadMedia();
			} catch (err) {}
		}

		if (!media) {
			return;
		}

		if (pref.restricted_medias.includes('all')) {
			is_restricted = true;
		} else if (pref.restricted_medias.includes('image') && media.mimetype.includes('image')) {
			is_restricted = true;
		} else if (pref.restricted_medias.includes('video') && media.mimetype.includes('video')) {
			is_restricted = true;
		} else if (pref.restricted_medias.includes(media.mimetype)) {
			is_restricted = true;
		} else if (pref.restricted_medias.includes('') && !mimeTypes.includes(media.mimetype)) {
			is_restricted = true;
		} else {
			is_restricted = false;
		}

		if (!is_restricted) {
			return;
		}

		await message.delete(true).catch((err) => {
			Logger.error('Unable to delete media.', err as Error);
		});
	}
}
