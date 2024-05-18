import express from 'express';
import { VerifyClientID, VerifyUser } from '../../middleware';
import AuthController from './auth.controller';
import { LoginValidator } from './auth.validator';

const router = express.Router();

router.route('/validate').all(VerifyUser).get(AuthController.validateLogin);
router.route('/validate-client-id').all(VerifyUser).get(AuthController.validateClientID);

router.route('/login').all(LoginValidator).post(AuthController.login);
router.route('/register').all(LoginValidator).post(AuthController.register);
router.route('/forgot-password').post(AuthController.forgotPassword);

router.route('/initiate-client').all(VerifyUser).post(AuthController.initiateWhatsapp);
router.route('/reset-password/:id').get(AuthController.resetPassword);
router.route('/update-password').all(VerifyUser).patch(AuthController.updatePassword);
router
	.route('/logout-whatsapp')
	.all(VerifyUser, VerifyClientID)
	.patch(AuthController.logoutWhatsapp);
router.route('/logout').all(VerifyUser).post(AuthController.logout);

export default router;
