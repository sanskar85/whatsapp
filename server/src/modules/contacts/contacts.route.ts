import express from 'express';
import { VerifyClientID, VerifyUser } from '../../middleware';
import PaymentValidator from '../../middleware/VerifyPayment';
import ContactsController from './contacts.controller';
import { ValidateNumbersValidator } from './contacts.validator';

const router = express.Router();

router.route('/count').all(VerifyUser, VerifyClientID).get(ContactsController.countContacts);
router
	.route('/validate')
	.all(VerifyUser, VerifyClientID, ValidateNumbersValidator, PaymentValidator.isSubscribed)
	.post(ContactsController.validate);
router
	.route('/')
	.all(VerifyUser, VerifyClientID, PaymentValidator.isSubscribed)
	.post(ContactsController.getContacts);

export default router;
