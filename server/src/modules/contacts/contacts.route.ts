import express from 'express';
import { VerifyClientID } from '../../middleware';
import PaymentValidator from '../../middleware/VerifyPayment';
import ContactsController from './contacts.controller';
import { ValidateNumbersValidator } from './contacts.validator';

const router = express.Router();

router.route('/count').all(VerifyClientID).get(ContactsController.countContacts);
router
	.route('/validate')
	.all(VerifyClientID, ValidateNumbersValidator, PaymentValidator.isSubscribed)
	.post(ContactsController.validate);
router
	.route('/')
	.all(VerifyClientID, PaymentValidator.isSubscribed)
	.post(ContactsController.getContacts);

export default router;
