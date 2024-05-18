import csv from 'csvtojson/v2';
import { NextFunction, Request, Response } from 'express';
import { ATTACHMENTS_PATH, CSV_PATH } from '../../config/const';
import APIError, { API_ERRORS } from '../../errors/api-errors';
import InternalError, { INTERNAL_ERRORS } from '../../errors/internal-errors';
import { MessageService } from '../../services/messenger';
import UploadService from '../../services/uploads';
import { Respond, RespondFile, idValidator } from '../../utils/ExpressUtils';
import { FileUtils, SingleFileUploadOptions } from '../../utils/files';
import FileUpload, { ONLY_CSV_ALLOWED } from '../../utils/files/FileUpload';

export async function saveCSV(req: Request, res: Response, next: NextFunction) {
	const fileUploadOptions: SingleFileUploadOptions = {
		field_name: 'file',
		options: {
			fileFilter: ONLY_CSV_ALLOWED,
		},
	};

	let destination = '';

	try {
		const uploadedFile = await FileUpload.SingleFileUpload(req, res, fileUploadOptions);
		destination = __basedir + CSV_PATH + uploadedFile.filename;
		FileUtils.moveFile(uploadedFile.path, destination);
		const parsed_csv = await csv().fromFile(destination);

		if (!parsed_csv) {
			return next(new APIError(API_ERRORS.COMMON_ERRORS.ERROR_PARSING_CSV));
		}

		const headers: string[] = Object.keys(parsed_csv[0]) ?? [];
		if (!headers.includes('number')) {
			return next(new APIError(API_ERRORS.COMMON_ERRORS.INVALID_FIELDS));
		}

		const name = req.body.name;

		const { id } = await new UploadService(req.locals.user.getUser()).addCSV(
			name,
			uploadedFile.filename,
			headers
		);
		return Respond({
			res,
			status: 200,
			data: {
				id,
				name: name,
				filename: uploadedFile.filename,
				headers,
			},
		});
	} catch (err: unknown) {
		if (err instanceof InternalError) {
			if (err.isSameInstanceof(INTERNAL_ERRORS.COMMON_ERRORS.ALREADY_EXISTS)) {
				FileUtils.deleteFile(destination);
				return next(new APIError(API_ERRORS.COMMON_ERRORS.ALREADY_EXISTS));
			}
		}
		return next(new APIError(API_ERRORS.COMMON_ERRORS.FILE_UPLOAD_ERROR, err));
	}
}

export async function listCSV(req: Request, res: Response, next: NextFunction) {
	const csv_docs = await new UploadService(req.locals.user.getUser()).listCSVs();
	return Respond({
		res,
		status: 200,
		data: {
			csv_list: csv_docs,
		},
	});
}
export async function deleteCSV(req: Request, res: Response, next: NextFunction) {
	const [isIDValid, id] = idValidator(req.params.id);

	if (!isIDValid) {
		return next(new APIError(API_ERRORS.COMMON_ERRORS.INVALID_FIELDS));
	}
	try {
		const filename = await new UploadService(req.locals.user.getUser()).delete(id);
		const path = __basedir + CSV_PATH + filename;
		FileUtils.deleteFile(path);

		return Respond({
			res,
			status: 200,
			data: {},
		});
	} catch (err: unknown) {
		if (err instanceof InternalError) {
			if (err.isSameInstanceof(INTERNAL_ERRORS.COMMON_ERRORS.NOT_FOUND)) {
				return next(new APIError(API_ERRORS.COMMON_ERRORS.NOT_FOUND));
			}
		}
		return next(new APIError(API_ERRORS.COMMON_ERRORS.INTERNAL_SERVER_ERROR));
	}
}

export async function addAttachment(req: Request, res: Response, next: NextFunction) {
	const fileUploadOptions: SingleFileUploadOptions = {
		field_name: 'file',
		options: {},
	};

	try {
		const uploadedFile = await FileUpload.SingleFileUpload(req, res, fileUploadOptions);
		const destination = __basedir + ATTACHMENTS_PATH + uploadedFile.filename;
		FileUtils.moveFile(uploadedFile.path, destination);

		const name = req.body.name as string;
		const caption = req.body.caption as string;
		const custom_caption = req.body.custom_caption as boolean;

		const attachment = new UploadService(req.locals.user.getUser()).addAttachment(
			name,
			caption,
			uploadedFile.filename,
			custom_caption
		);

		return Respond({
			res,
			status: 200,
			data: {
				attachment,
			},
		});
	} catch (err: unknown) {
		return next(new APIError(API_ERRORS.COMMON_ERRORS.FILE_UPLOAD_ERROR));
	}
}

export async function updateAttachmentFile(req: Request, res: Response, next: NextFunction) {
	const [isIDValid, id] = idValidator(req.params.id);

	if (!isIDValid) {
		return next(new APIError(API_ERRORS.COMMON_ERRORS.INVALID_FIELDS));
	}
	const fileUploadOptions: SingleFileUploadOptions = {
		field_name: 'file',
		options: {},
	};

	try {
		const uploadedFile = await FileUpload.SingleFileUpload(req, res, fileUploadOptions);
		const destination = __basedir + ATTACHMENTS_PATH + uploadedFile.filename;
		FileUtils.moveFile(uploadedFile.path, destination);

		const { previous } = await new UploadService(req.locals.user.getUser()).updateAttachmentFile(
			id,
			uploadedFile.filename
		);
		const path = __basedir + ATTACHMENTS_PATH + previous;
		FileUtils.deleteFile(path);

		return Respond({
			res,
			status: 200,
			data: {},
		});
	} catch (err: unknown) {
		return next(new APIError(API_ERRORS.COMMON_ERRORS.FILE_UPLOAD_ERROR));
	}
}

export async function updateAttachment(req: Request, res: Response, next: NextFunction) {
	const [isIDValid, id] = idValidator(req.params.id);

	if (!isIDValid) {
		return next(new APIError(API_ERRORS.COMMON_ERRORS.INVALID_FIELDS));
	}

	try {
		const name = req.body.name as string;
		const caption = req.body.caption as string;
		const custom_caption = req.body.custom_caption as boolean;

		const attachment = await new UploadService(req.locals.user.getUser()).updateAttachment(id, {
			name,
			caption,
			custom_caption,
		});

		return Respond({
			res,
			status: 200,
			data: {
				attachment,
			},
		});
	} catch (err: unknown) {
		return next(new APIError(API_ERRORS.COMMON_ERRORS.FILE_UPLOAD_ERROR));
	}
}

export async function downloadCSV(req: Request, res: Response, next: NextFunction) {
	const [isIDValid, id] = idValidator(req.params.id);

	if (!isIDValid) {
		return next(new APIError(API_ERRORS.COMMON_ERRORS.INVALID_FIELDS));
	}
	try {
		const attachment = await new UploadService(req.locals.user.getUser()).getAttachment(id);
		const path = __basedir + CSV_PATH + attachment.filename;
		return RespondFile({
			res,
			filename: attachment.name,
			filepath: path,
		});
	} catch (err: unknown) {
		return next(new APIError(API_ERRORS.COMMON_ERRORS.NOT_FOUND));
	}
}
export async function downloadAttachment(req: Request, res: Response, next: NextFunction) {
	const [isIDValid, id] = idValidator(req.params.id);

	if (!isIDValid) {
		return next(new APIError(API_ERRORS.COMMON_ERRORS.INVALID_FIELDS));
	}
	try {
		const attachment = await new UploadService(req.locals.user.getUser()).getAttachment(id);
		const path = __basedir + ATTACHMENTS_PATH + attachment.filename;
		return RespondFile({
			res,
			filename: attachment.name,
			filepath: path,
		});
	} catch (err: unknown) {
		return next(new APIError(API_ERRORS.COMMON_ERRORS.NOT_FOUND));
	}
}

export async function deleteAttachment(req: Request, res: Response, next: NextFunction) {
	const [isIDValid, id] = idValidator(req.params.id);

	if (!isIDValid) {
		return next(new APIError(API_ERRORS.COMMON_ERRORS.INVALID_FIELDS));
	}
	try {
		const inUse = await MessageService.isAttachmentInUse(id);
		if (inUse) {
			return next(new APIError(API_ERRORS.USER_ERRORS.ATTACHMENT_IN_USE));
		}
		const attachment = await new UploadService(req.locals.user.getUser()).delete(id);
		const path = __basedir + ATTACHMENTS_PATH + attachment;
		FileUtils.deleteFile(path);
		return Respond({
			res,
			status: 200,
			data: {},
		});
	} catch (err: unknown) {
		return next(new APIError(API_ERRORS.COMMON_ERRORS.FILE_UPLOAD_ERROR));
	}
}

export async function attachmentById(req: Request, res: Response, next: NextFunction) {
	const [isIDValid, id] = idValidator(req.params.id);

	if (!isIDValid) {
		return next(new APIError(API_ERRORS.COMMON_ERRORS.INVALID_FIELDS));
	}
	try {
		const attachment = await new UploadService(req.locals.user.getUser()).getAttachment(id);
		return Respond({
			res,
			status: 200,
			data: {
				attachment,
			},
		});
	} catch (err: unknown) {
		return next(new APIError(API_ERRORS.COMMON_ERRORS.NOT_FOUND));
	}
}

export async function listAttachments(req: Request, res: Response, next: NextFunction) {
	const [attachments] = await new UploadService(req.locals.user.getUser()).listAttachments();
	return Respond({
		res,
		status: 200,
		data: {
			attachments,
		},
	});
}

const UploadsController = {
	saveCSV,
	listCSV,
	deleteCSV,
	addAttachment,
	listAttachments,
	attachmentById,
	deleteAttachment,
	updateAttachment,
	updateAttachmentFile,
	downloadCSV,
	downloadAttachment,
};

export default UploadsController;
