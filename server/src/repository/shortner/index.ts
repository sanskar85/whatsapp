import mongoose, { Types } from 'mongoose';
import { nanoid } from 'nanoid';
import IShortner from '../../types/shortner';
import QRUtils from '../../utils/QRUtils';

const ShortnerSchema = new mongoose.Schema<IShortner>({
	user: {
		type: Types.ObjectId,
		ref: 'User',
	},
	key: {
		type: String,
		unique: true,
	},
	title: {
		type: String,
	},
	link: {
		type: String,
	},
	qrString: String,
});

ShortnerSchema.pre('save', async function (next) {
	if (!this.key) {
		this.key = nanoid(6);
	}
	if (!this.qrString) {
		const qrCodeBuffer = await QRUtils.generateQR(`https://open.whatsleads.in/${this.key}`, true);
		if (qrCodeBuffer) {
			this.qrString = `data:image/png;base64,${qrCodeBuffer.toString('base64')}`;
		}
	}
	next();
});

const ShortnerDB = mongoose.model<IShortner>('Shortner', ShortnerSchema);

export default ShortnerDB;
