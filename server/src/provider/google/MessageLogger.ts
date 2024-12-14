import { google } from 'googleapis';
import MessageLoggerDB from '../../repository/message-logger';
import IMessageLogger from '../../types/messageLogger';
import { getAuthToken } from './Auth';
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
	link: string;
	isForwarded: boolean;
	isBroadcast: boolean;
};

export default class MessageLogger {
	private sheetId: string;

	constructor(sheetId: string) {
		this.sheetId = sheetId;
	}

	public async logMessage(messages: LogMessage | LogMessage[]) {
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

	public static async appendBulkMessages() {
		const docs = await MessageLoggerDB.find({});

		const groupedDocs: Record<string, IMessageLogger[]> = docs.reduce((acc, doc) => {
			if (!acc[doc.sheetId]) {
				acc[doc.sheetId] = [];
			}

			acc[doc.sheetId].push(doc);

			return acc;
		}, {} as Record<string, IMessageLogger[]>);

		const promises = Object.entries(groupedDocs).map(([sheetId, messages]) => {
			return new MessageLogger(sheetId).appendMessages(messages);
		});

		await Promise.all(promises);
	}

	public async appendMessages(messages: IMessageLogger[]) {
		try {
			await sheets.spreadsheets.values.append({
				auth: (await getAuthToken()) as any,
				spreadsheetId: this.sheetId,
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
			await MessageLoggerDB.deleteMany({ sheetId: this.sheetId });

			return true;
		} catch (err) {
			console.error((err as any).message);
			return false;
		}
	}
}
