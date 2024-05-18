import express from 'express';
import { VerifyClientID, VerifyUser } from '../../middleware';
import { IDValidator } from '../../middleware/idValidator';
import ContactCardController from './contact-card.controller';
import { CreateContactValidator } from './contact-card.validator';

const router = express.Router();

router
	.route('/:id')
	.all(VerifyUser, IDValidator)
	.delete(ContactCardController.deleteContactCard)
	.all(VerifyClientID, CreateContactValidator)
	.put(ContactCardController.updateContactCard);

router
	.route('/')
	.all(VerifyUser)
	.get(ContactCardController.listContactCards)
	.all(VerifyClientID, CreateContactValidator)
	.post(ContactCardController.createContactCard);

export default router;
