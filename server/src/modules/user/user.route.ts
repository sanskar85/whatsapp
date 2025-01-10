import express from 'express';
import { VerifyAdmin } from '../../middleware';
import { IDValidator } from '../../middleware/idValidator';
import UserController from './user.controller';
import { EmailValidator, PaymentRemainderValidator } from './user.validator';

const router = express.Router();

router
	.route('/:id/extend-expiry')
	.all(VerifyAdmin, IDValidator)
	.post(UserController.extendUserExpiry);

router
	.route('/:id/payment-remainder')
	.all(VerifyAdmin, IDValidator, PaymentRemainderValidator)
	.post(UserController.paymentRemainder);

router.route('/:id/logout').all(VerifyAdmin, IDValidator).post(UserController.logoutUsers);

router
	.route('/:id/share-log-file')
	.all(VerifyAdmin, IDValidator, EmailValidator)
	.post(UserController.shareLogFile);

router.route('/devices').all(VerifyAdmin).get(UserController.listDevices);
router.route('/').all(VerifyAdmin).get(UserController.listUsers);

export default router;
