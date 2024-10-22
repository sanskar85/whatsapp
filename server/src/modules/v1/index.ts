import express from 'express';
import VerifyAPIToken from '../../middleware/VerifyAPIToken';
import MessageRoute from './message/message.route';
import SessionRoute from './session/session.route';

const router = express.Router();

// Next routes will be webhooks routes

router.use('/session', VerifyAPIToken, SessionRoute);
router.use('/message', VerifyAPIToken, MessageRoute);

export default router;
