import express from 'express';
import { IDValidator } from '../../middleware/idValidator';
import Controller from './keys.controller';
import { CreateAPIKeyValidator, WebhookValidator } from './keys.validator';

const router = express.Router();

router.route('/webhooks/:id/validate').all(IDValidator).post(Controller.validateWebhook);
router.route('/webhooks/:id').all(IDValidator).delete(Controller.deleteWebhook);
router
	.route('/webhooks')
	.get(Controller.listWebhooks)
	.post(WebhookValidator, Controller.createWebhook);

router.route('/:id/regenerate-token').all(IDValidator).post(Controller.regenerateToken);
router.route('/:id').all(IDValidator).delete(Controller.deleteAPIKey);
router.route('/').get(Controller.listKeys).post(CreateAPIKeyValidator, Controller.createAPIKey);

export default router;
