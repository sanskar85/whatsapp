import express from 'express';
import { VerifyClientID, VerifyUser } from '../../middleware';
import PaymentValidator from '../../middleware/VerifyPayment';
import MessageController from './message.controller';
import { ScheduleMessageValidator } from './message.validator';

const router = express.Router();

router
	.route('/')
	.all(VerifyUser, VerifyClientID, PaymentValidator.isPseudoSubscribed, ScheduleMessageValidator)
	.post(MessageController.scheduleMessage);

export default router;
