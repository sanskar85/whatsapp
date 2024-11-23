import express from 'express';
import { VerifyClientID, VerifyUser } from '../../middleware';
import PaymentValidator from '../../middleware/VerifyPayment';
import { IDValidator } from '../../middleware/idValidator';
import SchedulerController from './scheduler.controller';
import { CreateSchedulerValidator } from './scheduler.validator';

const router = express.Router();

router
	.route('/:id/report')
	.all(VerifyUser, IDValidator)
	.get(SchedulerController.downloadSchedulerReport);
router.route('/:id/reschedule').all(VerifyUser, IDValidator).put(SchedulerController.reschedule);

router
	.route('/:id')
	.all(VerifyUser, IDValidator)
	.get(SchedulerController.schedulerById)
	.delete(SchedulerController.deleteScheduler)
	.put(SchedulerController.toggleActive)
	.all(VerifyClientID, CreateSchedulerValidator, PaymentValidator.isPseudoSubscribed)
	.patch(SchedulerController.updateScheduler);

router
	.route('/')
	.all(VerifyUser)
	.get(SchedulerController.allSchedulers)
	.all(VerifyClientID, PaymentValidator.isPseudoSubscribed, CreateSchedulerValidator)
	.post(SchedulerController.createScheduler);

export default router;
