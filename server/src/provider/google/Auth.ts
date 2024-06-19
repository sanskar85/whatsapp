import { google } from 'googleapis';

const SERVICE_FILE_PATH = '/static/google-sheet-service-file.json';

export function getAuth() {
	const oauth2Client = new google.auth.GoogleAuth({
		keyFilename: __basedir + SERVICE_FILE_PATH,
		scopes: [
			'https://www.googleapis.com/auth/spreadsheets',
			'https://www.googleapis.com/auth/drive',
		],
	});

	return oauth2Client;
}

export async function getAuthToken() {
	return await getAuth().getClient();
}
