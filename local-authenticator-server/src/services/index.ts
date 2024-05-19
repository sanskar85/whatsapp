import archiver from 'archiver';
import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import { SERVER_URL } from '../config/const';

export function archiveFolder(srcPath: string, destPath: string) {
	const output = fs.createWriteStream(destPath);
	const archive = archiver('zip', {
		zlib: { level: 9 }, // Sets the compression level.
	});

	return new Promise<void>((resolve, reject) => {
		archive
			.directory(srcPath, false)
			.on('error', (err) => reject(err))
			.pipe(output);

		output.on('close', () => resolve());
		archive.finalize();
	});
}

export async function uploadToServer(username: string, phone: string, destPath: string) {
	// Send the zip file to the second server
	try {
		const form = new FormData();
		form.append('file', fs.createReadStream(destPath));
		form.append('username', username);
		form.append('phone', phone);

		await axios.post(`${SERVER_URL}/upload-session`, form, {
			headers: {
				'Content-Type': 'multipart/form-data',
			},
			maxContentLength: Infinity,
			maxBodyLength: Infinity,
		});
		return true;
	} catch (error: any) {
		return false;
	}
}
