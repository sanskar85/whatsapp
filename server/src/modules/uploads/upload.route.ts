import express from 'express';
import { VerifyUser } from '../../middleware';
import UploadsController from './upload.controllers';

const router = express.Router();

router.route('/csv/:id/download').all(VerifyUser).get(UploadsController.downloadCSV);
router.route('/csv/:id').all(VerifyUser).delete(UploadsController.deleteCSV);
router.route('/csv').all(VerifyUser).post(UploadsController.saveCSV).get(UploadsController.listCSV);

router.route('/attachment/:id/download').all(VerifyUser).get(UploadsController.downloadAttachment);

router
	.route('/attachment/:id')
	.all(VerifyUser)
	.get(UploadsController.attachmentById)
	.put(UploadsController.updateAttachmentFile)
	.patch(UploadsController.updateAttachment)
	.delete(UploadsController.deleteAttachment);

router
	.route('/attachment')
	.all(VerifyUser)
	.post(UploadsController.addAttachment)
	.get(UploadsController.listAttachments);

export default router;
