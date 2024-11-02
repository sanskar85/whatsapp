import express from 'express';
import Controller from './session.controller';

const router = express.Router();

router.route('/validate-token').post(Controller.validateToken);
router.route('/device-ready').post(Controller.deviceReady);

export default router;
