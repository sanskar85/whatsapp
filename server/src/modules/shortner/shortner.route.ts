import express from 'express';
import { VerifyUser } from '../../middleware';
import { IDValidator } from '../../middleware/idValidator';
import Shortner from './shortner.controller';
import { LinkValidator, UpdateLinkValidator, WhatsappLinkValidator } from './shortner.validator';

const router = express.Router();

router.route('/open/:id').get(Shortner.open);

router.route('/create-link').all(VerifyUser, LinkValidator).post(Shortner.createLink);

router
	.route('/create-whatsapp-link')
	.all(VerifyUser, WhatsappLinkValidator)
	.post(Shortner.createWhatsappLink);

router
	.route('/:id')
	.all(VerifyUser, IDValidator, UpdateLinkValidator)
	.patch(Shortner.updateLink)
	.delete(Shortner.deleteLink);

router.route('/').all(VerifyUser).get(Shortner.listAll);

export default router;
