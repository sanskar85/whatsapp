import express from 'express';
import { VerifyAdmin, VerifyUser } from '../../middleware';
import { IDValidator } from '../../middleware/idValidator';
import UserController from './user.controller';
import {
	EmailValidator,
	PaymentRemainderValidator,
	UserPreferencesValidator,
} from './user.validator';

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
	.route('/enable-message-star')
	.all(VerifyUser, UserPreferencesValidator)
	.post(UserController.enableMessageStar);
router.route('/disable-message-star').all(VerifyUser).post(UserController.disableMessageStar);

router
	.route('/enable-message-logger')
	.all(VerifyUser, UserPreferencesValidator)
	.post(UserController.enableMessageLogger);
router.route('/disable-message-logger').all(VerifyUser).post(UserController.disableMessageLogger);
router.route('/preferences').all(VerifyUser).get(UserController.getPreferences);

router
	.route('/:id/share-log-file')
	.all(VerifyAdmin, IDValidator, EmailValidator)
	.post(UserController.shareLogFile);

router.route('/').all(VerifyAdmin).get(UserController.listUsers);

export default router;
