import express from 'express';
import { VerifyClientID, VerifyUser } from '../../middleware';
import UserController from './preferences.controller';
import {
	CreateMessageLogRuleValidator,
	UpdateMessageLogRuleValidator,
} from './preferences.validator';

const router = express.Router();

router.route('/message-logger/disable').all(VerifyUser).post(UserController.disableMessageLogger);
router.route('/message-logger/enable').all(VerifyUser).post(UserController.enableMessageLogger);
router
	.route('/message-logger/rules/:id')
	.all(VerifyUser)
	.delete(UserController.deleteMessageLogRule);
router
	.route('/message-logger/rules')
	.all(VerifyUser)
	.get(UserController.getMessageLogRules)
	.post(CreateMessageLogRuleValidator, VerifyClientID, UserController.addMessageLogRule)
	.patch(UpdateMessageLogRuleValidator, UserController.updateMessageLogRule);

router.route('/').all(VerifyUser).get(UserController.getPreferences);

export default router;
