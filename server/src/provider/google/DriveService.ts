import fs from 'fs';
import { google } from 'googleapis';
import { DRIVE_FOLDER_ID } from '../../config/const';
import { FileUtils } from '../../utils/files';
import { getAuth } from './Auth';

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
];

export type HeaderType = typeof HEADERS;

export async function getDrive() {
	const auth = getAuth();
	return google.drive({ version: 'v3', auth });
}

export async function uploadSingleFile(fileName: string, folder_name: string, filePath: string) {
	const folder_id = await createOrGetFolder(folder_name);
	if (!folder_id) {
		console.error('Folder not found');
		return;
	}
	const { data } = await (
		await getDrive()
	).files.create({
		requestBody: {
			name: fileName,
			parents: [folder_id],
		},
		media: {
			mimeType: FileUtils.getMimeType(filePath)!,
			body: fs.createReadStream(filePath),
		},
		fields: 'id,name',
	});
	return `https://drive.google.com/file/d/${data.id}/view`;
}

export async function createOrGetFolder(folderName: string) {
	const { data } = await (
		await getDrive()
	).files.list({
		q: `mimeType='application/vnd.google-apps.folder' and name='${folderName}'`,
		fields: 'files(id, name)',
	});
	if (data.files?.length) {
		return data.files[0].id;
	}
	const { data: newFolder } = await (
		await getDrive()
	).files.create({
		requestBody: {
			name: folderName,
			mimeType: 'application/vnd.google-apps.folder',
			parents: [DRIVE_FOLDER_ID],
		},
		fields: 'id',
	});
	return newFolder.id;
}
