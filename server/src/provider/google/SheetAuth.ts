import { google } from 'googleapis';
import { getAuthToken } from './Auth';
const sheets = google.sheets('v4');
const drive = google.drive('v3');

const HEADERS = [
	'Timestamp',
	'From',
	'To',
	'Saved Name',
	'Display Name',
	'Group Name',
	'Message',
	'Is Caption',
	'Link',
	'Is Forwarded',
	'Is Broadcast',
	'Is Forwarded Many Times',
];

export type HeaderType = typeof HEADERS;

export async function createSpreadSheet(title: string) {
	const res = await sheets.spreadsheets.create({
		auth: (await getAuthToken()) as any,
		requestBody: {
			properties: {
				title,
			},
		},
	});

	if (res.statusText !== 'OK') {
		throw new Error('Failed to create spreadsheet');
	}

	const fileId = res.data.spreadsheetId!;
	return fileId;
}

export async function addHeader(sheetId: string, headers: HeaderType = HEADERS) {
	await sheets.spreadsheets.values.append({
		auth: (await getAuthToken()) as any,
		spreadsheetId: sheetId,
		range: 'A1',
		valueInputOption: 'RAW',
		requestBody: {
			values: [headers],
		},
	});
}

export async function shareToDrive(fileId: string, email: string) {
	try {
		await drive.permissions.create({
			auth: (await getAuthToken()) as any,
			requestBody: {
				type: 'user',
				role: 'writer',
				emailAddress: email,
			},
			fileId: fileId,
			sendNotificationEmail: false,
		});
		return true;
	} catch (e) {
		return false;
	}
}

export async function getSpreadSheet(spreadsheetId: string) {
	const res = await sheets.spreadsheets.get({
		spreadsheetId,
		auth: (await getAuthToken()) as any,
	});
	return res;
}
