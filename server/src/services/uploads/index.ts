import { Types } from 'mongoose';
import InternalError, { INTERNAL_ERRORS } from '../../errors/internal-errors';
import UploadDB from '../../repository/uploads';
import IUpload from '../../types/uploads';
import { IUser } from '../../types/users';

export default class UploadService {
	private user: IUser;

	public constructor(user: IUser) {
		this.user = user;
	}

	async listCSVs() {
		const csv_docs = await UploadDB.find({ user: this.user, type: 'NUMBERS' });
		return csv_docs.map((csv) => ({
			id: csv._id as string,
			name: csv.name,
			filename: csv.filename,
			headers: csv.headers,
		}));
	}

	async getCSVFile(id: Types.ObjectId) {
		const csv_docs = await UploadDB.findById(id);
		return csv_docs?.filename || null;
	}

	async addCSV(name: string, filename: string, headers: string[]) {
		const exists = await UploadDB.exists({ name, user: this.user, type: 'NUMBERS' });
		if (exists) {
			throw new InternalError(INTERNAL_ERRORS.COMMON_ERRORS.ALREADY_EXISTS);
		}
		const csv_doc = new UploadDB({
			user: this.user,
			name,
			filename,
			type: 'NUMBERS',
			headers,
		});
		csv_doc.save();
		return {
			id: csv_doc._id as string,
			name: csv_doc.name,
			filename: csv_doc.filename,
			headers: csv_doc.headers,
		};
	}

	async getCSV(id: Types.ObjectId) {
		const csv_doc = await UploadDB.findById(id);
		if (!csv_doc) {
			throw new InternalError(INTERNAL_ERRORS.COMMON_ERRORS.NOT_FOUND);
		}
		return {
			id: csv_doc._id as string,
			name: csv_doc.name,
			filename: csv_doc.filename,
			headers: csv_doc.headers,
		};
	}

	async delete(id: Types.ObjectId) {
		const doc = await UploadDB.findById(id);
		if (!doc) {
			throw new InternalError(INTERNAL_ERRORS.COMMON_ERRORS.NOT_FOUND);
		}
		doc.remove();
		return doc.filename;
	}

	async listAttachments(ids?: Types.ObjectId[]) {
		const attachments = await UploadDB.find({
			user: this.user,
			type: 'ATTACHMENT',
			...(ids ? { _id: { $in: ids } } : {}),
		});
		return [
			attachments.map((attachment) => ({
				id: attachment._id as string,
				caption: attachment.caption,
				filename: attachment.filename,
				name: attachment.name ?? '',
				custom_caption: attachment.custom_caption ?? false,
			})),
			attachments,
		] as [{ id: string; caption: string; filename: string; name: string }[], IUpload[]];
	}

	async getAttachment(id: Types.ObjectId) {
		const attachment = await UploadDB.findById(id);
		if (!attachment) {
			throw new InternalError(INTERNAL_ERRORS.COMMON_ERRORS.NOT_FOUND);
		}
		return {
			id: attachment._id as string,
			name: attachment.name,
			filename: attachment.filename,
			caption: attachment.caption,
			custom_caption: attachment.custom_caption ?? false,
		};
	}

	addAttachment(name: string, caption: string, filename: string, custom_caption: boolean = false) {
		const attachment = new UploadDB({
			user: this.user,
			name,
			filename,
			type: 'ATTACHMENT',
			caption,
			custom_caption,
		});
		attachment.save();
		return {
			id: attachment._id as string,
			name: attachment.name,
			filename: attachment.filename,
			caption: attachment.caption,
			custom_caption: attachment.custom_caption ?? false,
		};
	}

	async updateAttachmentFile(id: Types.ObjectId, filename: string) {
		const attachment = await UploadDB.findById(id);
		if (!attachment) {
			throw new InternalError(INTERNAL_ERRORS.COMMON_ERRORS.NOT_FOUND);
		}
		const prev_name = attachment.filename;
		attachment.filename = filename;
		await attachment.save();
		return { previous: prev_name, current: filename };
	}

	async updateAttachment(
		id: Types.ObjectId,
		data: { name?: string; caption?: string; custom_caption?: boolean }
	) {
		const attachment = await UploadDB.findById(id);
		if (!attachment) {
			throw new InternalError(INTERNAL_ERRORS.COMMON_ERRORS.NOT_FOUND);
		}
		if (data.name !== undefined) {
			attachment.name = data.name;
		}
		if (data.caption !== undefined) {
			attachment.caption = data.caption;
		}
		if (data.custom_caption !== undefined) {
			attachment.custom_caption = data.custom_caption;
		}

		await attachment.save();
		return {
			id: attachment._id as string,
			name: attachment.name,
			filename: attachment.filename,
			caption: attachment.caption,
			custom_caption: attachment.custom_caption ?? false,
		};
	}
}
