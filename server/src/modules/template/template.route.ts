import express from 'express';
import { VerifyUser } from '../../middleware';
import { IDValidator } from '../../middleware/idValidator';
import TemplateController from './template.controller';
import { MessageTemplateValidator, PollTemplateValidator } from './template.validator';

const router = express.Router();

router
	.route('/poll/:id')
	.all(VerifyUser, IDValidator)
	.delete(TemplateController.deleteTemplate)
	.all(PollTemplateValidator)
	.put(TemplateController.updatePollTemplate);

router
	.route('/poll')
	.all(VerifyUser)
	.get(TemplateController.listPollTemplates)
	.all(PollTemplateValidator)
	.post(TemplateController.addPollTemplate);

router
	.route('/message/:id')
	.all(VerifyUser, IDValidator)
	.delete(TemplateController.deleteTemplate)
	.all(MessageTemplateValidator)
	.put(TemplateController.updateMessageTemplate);

router
	.route('/message/')
	.all(VerifyUser)
	.get(TemplateController.listMessageTemplates)
	.all(MessageTemplateValidator)
	.post(TemplateController.addMessageTemplate);

export default router;
