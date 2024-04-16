import Jimp from 'jimp';
import Logger from 'n23-logger';
import qr from 'qrcode';
import { LOGO_PATH } from '../config/const';

const generateQR = async (text: string, remove_promotion = false) => {
	try {
		// Generate QR code
		const qrImage = await qr.toDataURL(text);

		// Load QR code image using Jimp
		const qrJimp = await Jimp.read(Buffer.from(qrImage.split('base64,')[1], 'base64'));
		qrJimp.resize(1024, 1024);

		if (remove_promotion) {
			return await qrJimp.getBufferAsync(Jimp.MIME_PNG);
		}

		// Load the image to be placed in the center
		let image = await Jimp.read(__basedir + LOGO_PATH);

		image = image.resize(qrJimp.bitmap.width / 2, qrJimp.bitmap.width / 10);

		// Calculate the position to center the image on the QR code
		const x = (qrJimp.bitmap.width - image.bitmap.width) / 2;
		const y = (qrJimp.bitmap.height - image.bitmap.height) / 2;

		// Composite the image onto the QR code
		qrJimp.composite(image, x, y);

		return await qrJimp.getBufferAsync(Jimp.MIME_PNG);
	} catch (error: any) {
		Logger.error('Generate Contact QR', error);
		return null;
	}
};

const QRUtils = {
	generateQR,
};

export default QRUtils;
