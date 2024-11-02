import axios from 'axios';
import csv from 'csvtojson/v2';
import fs from 'fs';
import mime from 'mime';
import { CSV_PATH } from '../../config/const';
import { generateRandomText } from '../ExpressUtils';

const moveFile = (from: string, to: string) => {
	try {
		fs.renameSync(from, to);
		return true;
	} catch (err) {
		return false;
	}
};
const deleteFile = (path: string) => {
	try {
		fs.unlinkSync(path);
	} catch (err) {
		/* empty */
	}
};
const exists = (path: string) => {
	return fs.existsSync(path);
};

const base64removeHeader = (base64: string) => {
	return base64
		.replace(/^data:image\/(png|jpg|jpeg);base64,/, '')
		.replace(/^data:application\/pdf;base64,/, '');
};

const base64ToPDF = async (base64: string, path: string) => {
	const base64Data = base64removeHeader(base64);
	fs.writeFileSync(path, base64Data, 'base64');
};

const base64ToJPG = async (base64: string, path: string) => {
	const base64Data = base64removeHeader(base64);
	fs.writeFileSync(path, base64Data, 'base64');
};

async function readCSV<
	T extends {
		[key: string]: string;
		number: string;
	}[]
>(path: string): Promise<T | null> {
	const csvFilePath = __basedir + CSV_PATH + path;
	if (!fs.existsSync(csvFilePath)) {
		return null;
	}
	const parsed_csv = await csv().fromFile(csvFilePath);

	if (!parsed_csv) {
		return null;
	}
	return parsed_csv as T;
}

async function readFile(path: string) {
	return new Promise<string>((resolve, reject) => {
		fs.readFile(path, 'utf8', function (err, data) {
			if (err) {
				reject(err);
			} else {
				resolve(data);
			}
		});
	});
}

async function writeFile(path: string, data: string) {
	return new Promise<void>((resolve, reject) => {
		fs.writeFile(path, data, 'utf8', function (err) {
			if (err) {
				reject(err);
			} else {
				resolve();
			}
		});
	});
}

function getMimeType(path: string) {
	return mime.getType(path);
}
function getExt(mime_type: string) {
	return mime.getExtension(mime_type);
}

async function createImageFile(base64WithoutHeader: string, path: string) {
	return new Promise<void>((resolve, reject) => {
		fs.writeFile(path, base64WithoutHeader, 'base64', function (err) {
			if (err) {
				reject(err);
			} else {
				resolve();
			}
		});
	});
}

async function downloadFile(url: string, path: string) {
	return new Promise<string>(async (resolve, reject) => {
		try {
			// Fetch the file
			const response = await axios({
				url: url,
				method: 'GET',
				responseType: 'stream',
			});

			// Check if the response is OK
			if (response.status !== 200 || !response.data) {
				return null;
			}

			// Extract the MIME type from the response
			const contentType = response.headers['content-type'];
			const extension = getExt(contentType ?? 'text/plain');

			// Generate a filename with the appropriate extension
			const dest = path + generateRandomText(10) + '.' + extension;
			const fileStream = fs.createWriteStream(dest);

			// Pipe the response data to the file stream
			response.data.pipe(fileStream);

			// Handle the end of the download process
			fileStream.on('finish', () => {
				resolve(dest);
			});

			// Handle errors
			fileStream.on('error', (err) => {
				reject(err);
			});
		} catch (error) {
			console.error('Error:', error);
			reject(error);
		}
	});
}

export default {
	moveFile,
	deleteFile,
	exists,
	base64ToJPG,
	base64ToPDF,
	readCSV,
	readFile,
	writeFile,
	getExt,
	getMimeType,
	createImageFile,
	downloadFile,
};
