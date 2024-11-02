import express from 'express';
import Controller from './message.controller';
import { SendMessageValidator } from './message.validator';

const router = express.Router();

router.route('/send-message').all(SendMessageValidator).post(Controller.sendMessage);

export default router;
