import express from 'express';
import { VerifyClientID, VerifyUser } from '../../middleware';
import PaymentValidator from '../../middleware/VerifyPayment';
import LabelsController from './labels.controller';
import { AssignLabelValidator } from './labels.validator';

const router = express.Router();

router
	.route('/export')
	.all(VerifyUser, VerifyClientID, PaymentValidator.isSubscribed)
	.post(LabelsController.exportLabels);

router
	.route('/assign')
	.all(VerifyUser, VerifyClientID, AssignLabelValidator)
	.post(LabelsController.addLabel);

router
	.route('/remove')
	.all(VerifyUser, VerifyClientID, AssignLabelValidator)
	.post(LabelsController.removeLabel);

router.route('/').get(VerifyUser, VerifyClientID, LabelsController.labels);

export default router;
