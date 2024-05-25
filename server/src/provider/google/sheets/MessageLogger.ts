import { google } from 'googleapis';
import { getAuthToken } from './SheetAuth';
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
};

export default class MessageLogger {
	private sheetId: string;

	constructor(sheetId: string) {
		this.sheetId = sheetId;
	}

	public async appendMessage(message: LogMessage | LogMessage[]) {
		try {
			await sheets.spreadsheets.values.append({
				auth: (await getAuthToken()) as any,
				spreadsheetId: this.sheetId,
				valueInputOption: 'RAW',
				requestBody: {
					values: Array.isArray(message)
						? message.map((m) => Object.values(m))
						: [Object.values(message)],
				},
				range: 'Sheet1!A2',
				insertDataOption: 'INSERT_ROWS',
			});
			return true;
		} catch (err) {
			return false;
		}
	}
}
