import { google } from 'googleapis';
import Logger from 'n23-logger';
import { Chat, Contact, GroupChat, Message } from 'whatsapp-web.js';
import { MISC_PATH } from '../../config/const';
import { getAuthToken } from '../../provider/google/Auth';
import { uploadSingleFile } from '../../provider/google/DriveService';
import MessageLoggerDB from '../../repository/message-logger';
import IMessageLogger from '../../types/messageLogger';
import DateUtils from '../../utils/DateUtils';
import { generateClientID } from '../../utils/ExpressUtils';
import { FileUtils } from '../../utils/files';
import UserPreferencesService from '../user/userPreferences';

const sheets = google.sheets('v4');

const mimeTypes = [
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

export class MessageLoggerService {
	private sheetId: string;
	private messageLoggerRules;
	private number: string;

	constructor(number: string, userPrefService: UserPreferencesService) {
		this.number = number;
		this.sheetId = userPrefService.getMessageLogSheetId();
		this.messageLoggerRules = userPrefService.getMessageLogRules();
	}

	async handleMessage({
		chat,
		contact,
		message,
	}: {
		message: Message;
		contact: Contact;
		chat: Chat | GroupChat;
	}) {
		let link: string | undefined = '';

		const loggedObj: LogMessage = {
			timestamp: DateUtils.getUnixMoment(message.timestamp).format('DD-MMM-YYYY HH:mm:ss'),
			from: contact.id.user,
			to: message.to.split('@')[0],
			savedName: contact.name || '',
			displayName: contact.pushname || '',
			groupName: chat.isGroup ? chat.name : '',
			message: message.body,
			isCaption: message.hasMedia && message.body ? 'Yes' : 'No',
			link: link,
			isForwarded: message.isForwarded,
			isForwardedManyTimes: (message.forwardingScore ?? 0) > 100,
			isBroadcast: message.broadcast,
		};

		const isSaved = !chat.isGroup && !!contact.name;
		const isMedia = message.hasMedia;

		let canLog = false;
		let pref;

		if (!chat.isGroup) {
			pref = this.messageLoggerRules[message.hasMedia ? 'individual_media' : 'individual_text'];
		} else {
			pref = this.messageLoggerRules[chat.id._serialized];
		}

		if (!pref) {
			Logger.info('No pref found for message logger', `${this.number} - ${contact.id.user}`);
			return;
		}

		let saveMediaFile = false;
		let media;

		if (isMedia) {
			try {
				media = await message.downloadMedia();
			} catch (err) {
				Logger.error('Unable to download image from whatsapp.', err as Error);
				canLog = true;
			} finally {
				if (!media) {
					link = 'Unable to download image from whatsapp.';
				}
			}
		}

		if (!chat.isGroup) {
			if (isSaved && !pref.saved) {
				return;
			} else if (!isSaved && !pref.unsaved) {
				return;
			} else if (pref.exclude.length > 0 && pref.exclude.includes(contact.id.user)) {
				return;
			} else if (pref.include.length > 0 && !pref.include.includes(contact.id.user)) {
				return;
			}

			if (isMedia) {
				if (media) {
					if (pref.loggers.includes('all')) {
						saveMediaFile = true;
						canLog = true;
					} else if (pref.loggers.includes('image') && media.mimetype.includes('image')) {
						saveMediaFile = true;
						canLog = true;
					} else if (pref.loggers.includes('video') && media.mimetype.includes('video')) {
						saveMediaFile = true;
						canLog = true;
					} else if (pref.loggers.includes(media.mimetype)) {
						saveMediaFile = true;
						canLog = true;
					} else if (pref.loggers.includes('') && !mimeTypes.includes(media.mimetype)) {
						saveMediaFile = true;
						canLog = true;
					} else {
						canLog = false;
					}
				} else {
					canLog = true;
				}
			} else {
				canLog = true;
			}
		} else {
			if (isMedia) {
				if (media) {
					if (pref.loggers.includes('all')) {
						saveMediaFile = true;
						canLog = true;
					} else if (pref.loggers.includes('image') && media.mimetype.includes('image')) {
						saveMediaFile = true;
						canLog = true;
					} else if (pref.loggers.includes('video') && media.mimetype.includes('video')) {
						saveMediaFile = true;
						canLog = true;
					} else if (pref.loggers.includes(media.mimetype)) {
						saveMediaFile = true;
						canLog = true;
					} else if (pref.loggers.includes('') && !mimeTypes.includes(media.mimetype)) {
						saveMediaFile = true;
						canLog = true;
					} else {
						canLog = false;
					}
				} else {
					canLog = true;
				}
			} else if (pref.loggers.includes('text') && message.body.length > 0) {
				canLog = true;
			}
		}

		if (!canLog) {
			return;
		}

		try {
			if (saveMediaFile && media) {
				const filename = `${contact.id.user}_${DateUtils.getMomentNow().format(
					'YYYY-MM-DD HH:mm:ss'
				)}_${generateClientID()}.${FileUtils.getExt(media.mimetype)}`;

				const dest = __basedir + MISC_PATH + filename;
				await FileUtils.createFileFromBase64(media.data, dest);
				const mid_name = chat.isGroup ? 'Group' : 'Individual';
				const folder_path = [
					this.number!,
					`${mid_name}_${this.number}`,
					`${FileUtils.getExt(media.mimetype)!}_${this.number}_${mid_name}`,
				];
				link = await uploadSingleFile(filename, folder_path, dest);
			}
		} catch (err) {
			Logger.debug(err as any);
			Logger.error('Unable to save image to google drive.', err as Error);
			link = 'Unable to save image to google drive.';
		}
		loggedObj.link = link;

		this.logMessageToDB(loggedObj);
	}

	private async logMessageToDB(messages: LogMessage | LogMessage[]) {
		try {
			messages = Array.isArray(messages) ? messages : [messages];

			await MessageLoggerDB.insertMany(
				messages.map((m) => ({
					...m,
					sheetId: this.sheetId,
				}))
			);

			return true;
		} catch (err) {
			console.error((err as any).message);
			return false;
		}
	}

	public static async processMessagesToLog() {
		const docs = await MessageLoggerDB.find({});

		const groupedDocs: Record<string, IMessageLogger[]> = docs.reduce((acc, doc) => {
			if (!acc[doc.sheetId]) {
				acc[doc.sheetId] = [];
			}

			acc[doc.sheetId].push(doc);

			return acc;
		}, {} as Record<string, IMessageLogger[]>);

		const promises = Object.entries(groupedDocs).map(([sheetId, messages]) => {
			return MessageLoggerService.logMessagesToSheets(sheetId, messages);
		});

		await Promise.all(promises);
	}

	public static async logMessagesToSheets(sheetId: string, messages: IMessageLogger[]) {
		try {
			await sheets.spreadsheets.values.append({
				auth: (await getAuthToken()) as any,
				spreadsheetId: sheetId,
				valueInputOption: 'RAW',
				requestBody: {
					values: messages.map((m) => {
						return [
							m.timestamp,
							m.from,
							m.to,
							m.savedName,
							m.displayName,
							m.groupName,
							m.message,
							m.isCaption,
							m.link,
							m.isForwarded ? 'Forwarded' : '',
							m.isBroadcast ? 'Broadcast' : '',
						];
					}),
				},
				range: 'Sheet1!A2',
				insertDataOption: 'INSERT_ROWS',
			});
			await MessageLoggerDB.deleteMany({ sheetId: sheetId });

			return true;
		} catch (err) {
			console.error((err as any).message);
			return false;
		}
	}
}
