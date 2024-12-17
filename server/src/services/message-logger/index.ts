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
				console.log(media.mimetype);
			} catch (err) {
				Logger.error('Error while saving media message', err as Error);
				canLog = true;
				link = 'Unable to generate link';
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
					if (pref.loggers.includes('image') && media.mimetype.includes('image')) {
						saveMediaFile = true;
						canLog = true;
					} else if (pref.loggers.includes('video') && media.mimetype.includes('video')) {
						saveMediaFile = true;
						canLog = true;
					} else if (pref.loggers.includes(media.mimetype)) {
						saveMediaFile = true;
						canLog = true;
					} else {
						canLog = false;
					}
				} else {
					canLog = true;
					link = 'Unable to generate link';
				}
			} else {
				canLog = true;
			}
		} else {
			if (isMedia) {
				if (media) {
					if (pref.loggers.includes('image') && media.mimetype.includes('image')) {
						saveMediaFile = true;
						canLog = true;
					} else if (pref.loggers.includes('video') && media.mimetype.includes('video')) {
						saveMediaFile = true;
						canLog = true;
					} else if (pref.loggers.includes(media.mimetype)) {
						saveMediaFile = true;
						canLog = true;
					} else {
						canLog = false;
					}
				} else {
					canLog = true;
					link = 'Unable to generate link';
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
				const filename = generateClientID() + '.' + FileUtils.getExt(media.mimetype);
				const dest = __basedir + MISC_PATH + filename;
				await FileUtils.createFileFromBase64(media.data, dest);
				const folder_path = [
					this.number!,
					chat.isGroup ? 'Group' : 'Individual',
					FileUtils.getExt(media.mimetype)!,
				];
				link = await uploadSingleFile(filename, folder_path, dest);
			}
		} catch (err) {
			Logger.error('Error while saving image message', err as Error);
			link = 'Unable to generate link';
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
