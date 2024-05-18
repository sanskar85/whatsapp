import express from 'express';
import { VerifyClientID, VerifyUser } from '../../middleware';
import PaymentValidator from '../../middleware/VerifyPayment';
import { IDValidator } from '../../middleware/idValidator';
import BotController from './bot.controller';
import { CreateBotValidator } from './bot.validator';

const router = express.Router();

router
	.route('/:id/responses')
	.all(VerifyUser, VerifyClientID, PaymentValidator.isPseudoSubscribed, IDValidator)
	.get(BotController.downloadResponses);

router
	.route('/:id')
	.all(VerifyUser, VerifyClientID, PaymentValidator.isPseudoSubscribed, IDValidator)
	.get(BotController.botById)
	.delete(BotController.deleteBot)
	.put(BotController.toggleActive)
	.all(CreateBotValidator)
	.patch(BotController.updateBot);

router
	.route('/')
	.all(VerifyUser)
	.get(BotController.allBots)
	.all(VerifyClientID, PaymentValidator.isPseudoSubscribed, CreateBotValidator)
	.post(BotController.createBot);

export default router;
