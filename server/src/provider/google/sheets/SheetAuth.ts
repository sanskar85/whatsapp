import { google } from 'googleapis';
const sheets = google.sheets('v4');
const drive = google.drive('v3');

const SERVICE_FILE_PATH = '/static/google-sheet-service-file.json';

const HEADERS = [
	'Timestamp',
	'From',
	'To',
	'Saved Name',
	'Display Name',
	'Group Name',
	'Message',
	'Is Caption',
];

export type HeaderType = typeof HEADERS;

export async function getAuthToken() {
	const oauth2Client = new google.auth.GoogleAuth({
		keyFilename: __basedir + SERVICE_FILE_PATH,
		scopes: [
			'https://www.googleapis.com/auth/spreadsheets',
			'https://www.googleapis.com/auth/drive',
		],
	});

	return await oauth2Client.getClient();
}

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
}

export async function getSpreadSheet(spreadsheetId: string) {
	const res = await sheets.spreadsheets.get({
		spreadsheetId,
		auth: (await getAuthToken()) as any,
	});
	return res;
}
