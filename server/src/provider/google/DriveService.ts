import fs from 'fs';
import { google } from 'googleapis';
import Logger from 'n23-logger';
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

export async function uploadSingleFile(fileName: string, folder_path: string[], filePath: string) {
	const folder_id = await createNestedFolders(folder_path);
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

export async function createNestedFolders(folder_path: string[]) {
	let folder_id = DRIVE_FOLDER_ID;
	for (const folder of folder_path) {
		const id = await createOrGetFolder(folder, folder_id);
		if (!id) {
			return null;
		}
		folder_id = id;
	}
	return folder_id;
}

export async function createOrGetFolder(
	folderName: string,
	parent_folder_id: string = DRIVE_FOLDER_ID
) {
	const drive = await getDrive();
	console.log(`mimeType='application/vnd.google-apps.folder' and name='${folderName}'`);
	
	const { data } = await drive.files.list({
		q: `mimeType='application/vnd.google-apps.folder' and name='${folderName}'`,
		fields: 'files(id, name)',
	});
	if (data.files?.length) {
		console.log('Folder already exists', data.files);
		return data.files[0].id;
	}
	const { data: newFolder } = await drive.files.create({
		requestBody: {
			name: folderName,
			mimeType: 'application/vnd.google-apps.folder',
			parents: [parent_folder_id],
		},
		fields: 'id',
	});

	return newFolder.id;
}

export async function getFolder(folderName: string) {
	const { data } = await (
		await getDrive()
	).files.list({
		q: `mimeType='application/vnd.google-apps.folder' and name='${folderName}'`,
		fields: 'files(id, name)',
	});
	if (data.files?.length && data.files.length > 0) {
		return data.files[0].id;
	}
	return null;
}

export async function deleteFolder(id: string) {
	const drive = await getDrive();
	await drive.files.delete({
		fileId: id,
	});
	await drive.files.emptyTrash();
}

export async function deleteFile(id: string) {
	const drive = await getDrive();
	await drive.files.delete({
		fileId: id,
	});
}

export async function listFolders() {
	const { data } = await (
		await getDrive()
	).files.list({
		q: `mimeType='application/vnd.google-apps.folder' and '${DRIVE_FOLDER_ID}' in parents`,
		fields: 'files(id, name)',
	});
	return data.files;
}

export async function listAllFiles() {
	const { data } = await (
		await getDrive()
	).files.list({
		q: `'${DRIVE_FOLDER_ID}' in parents and mimeType != 'application/vnd.google-apps.folder'`,
		fields: 'files(id, name)',
	});
	return data.files;
}

export async function listFiles(folderID: string) {
	const { data } = await (
		await getDrive()
	).files.list({
		q: `'${folderID}' in parents`,
		fields: 'files(id, name)',
	});
	return data.files;
}

export async function checkStorageUsage() {
	const { data } = await (
		await getDrive()
	).about.get({
		fields: 'storageQuota',
	});
	return data.storageQuota;
}

export async function checkFileSize(fileId: string) {
	const { data } = await (
		await getDrive()
	).files.get({
		fileId,
		fields: 'size',
	});
	return data.size;
}

export async function checkFolderSize(folderId: string) {
	const { data } = await (
		await getDrive()
	).files.list({
		q: `'${folderId}' in parents`,
		fields: 'files(size)',
	});
	return data!.files!.reduce((acc, curr) => acc + Number(curr.size), 0);
}

export async function getFilesWithSizes() {
	const drive = await getDrive();
	const { data } = await drive.files.list({
		fields: 'files(id, name, size, parents)',
		pageSize: 5, // Adjust this as needed for large drives
	});

	// If you want to sort by size
	const files = data.files || [];
	files.sort((a, b) => (Number(b.size) || 0) - (Number(a.size) || 0));

	return files;
}
export async function getFileDetails(fileId: string) {
	const drive = await getDrive();
	const { data } = await drive.files.get({
		fileId,
		fields: 'id, name, size, mimeType, createdTime, modifiedTime, parents',
	});
	return data;
}

export async function getFolderDetails(folderId: string) {
	const drive = await getDrive();
	const { data } = await drive.files.get({
		fileId: folderId,
		fields: 'id, name, mimeType, createdTime, modifiedTime, parents',
	});
	return data;
}

export async function deleteNonCsvFiles() {
	const drive = await getDrive();

	// Query to find files that are not folders and do not end with .csv
	const query = "mimeType != 'application/vnd.google-apps.folder' and not name contains '.csv'";

	let pageToken = null;
	let count = 0;
	do {
		// List files matching the query
		const { data }: any = await drive.files.list({
			q: query,
			fields: 'nextPageToken, files(id, name)',
			pageToken: pageToken,
			pageSize: 1000, // Adjust this based on how many files you have
		});
		console.log(`Found ${data.files.length} files`);

		// Delete each file

		const promises = data.files.map(async (file: any) => {
			try {
				await drive.files.delete({
					fileId: file.id,
				});
				console.log(`Deleted file: ${file.name} (ID: ${file.id}) ${count++}`);
			} catch (error) {
				console.error(`Failed to delete file: ${file.name} (ID: ${file.id})`, error);
			}
		});

		await Promise.all(promises);
		// Update the page token to retrieve the next set of files
		pageToken = data.nextPageToken;
	} while (pageToken);
	Logger.info('Deleted non-csv files', `All non-csv files deleted ${count}`);
}
