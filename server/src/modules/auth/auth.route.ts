import express from 'express';
import { VerifyUser } from '../../middleware';
import AuthController from './auth.controller';
import { LoginValidator } from './auth.validator';

const router = express.Router();

router.route('/validate').all(VerifyUser).get(AuthController.validateLogin);
router.route('/validate-client-id').all(VerifyUser).get(AuthController.validateClientID);
router.route('/login').all(LoginValidator).post(AuthController.login);
router.route('/initiate-client').all(VerifyUser).post(AuthController.initiateWhatsapp);
router.route('/logout').all(VerifyUser).post(AuthController.logout);

export default router;
