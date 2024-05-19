import express from 'express';
import AuthRoute from './auth/auth.route';
import BotRoute from './bot/bot.route';
import ContactCardRoute from './contact-card/contact-card.route';
import ContactsRoute from './contacts/contacts.route';
import GroupsRoute from './groups/groups.route';
import LabelsRoute from './labels/labels.route';
import MessageRoute from './message/message.route';
import PaymentRoute from './payment/payment.route';
import ReportsRoute from './report/report.route';
import SchedulerRoute from './scheduler/scheduler.route';
import ShortnerRoute from './shortner/shortner.route';
import TasksRoute from './tasks/tasks.route';
import TemplateRoute from './template/template.route';
import TokenRoute from './token/token.route';
import UploadsRoute from './uploads/upload.route';
import UserRoute from './user/user.route';

import extract from 'extract-zip';
import Logger from 'n23-logger';
import { WhatsappProvider } from '../provider/whatsapp_provider';
import { UserService } from '../services';
import { DeviceService } from '../services/user';
import { generateClientID } from '../utils/ExpressUtils';
import { sendLoginCredentialsEmail } from '../utils/email';
import { FileUpload, FileUtils } from '../utils/files';
import WebhooksRoute from './webhooks/webhooks.route';

const router = express.Router();

// Next routes will be webhooks routes

router.use('/webhooks', WebhooksRoute);

// Next rotes are common routes

router.use('/token', TokenRoute);

router.use('/auth', AuthRoute);
router.use('/payment', PaymentRoute);

router.use('/users', UserRoute);

router.use('/whatsapp/bot', BotRoute);
router.use('/whatsapp/contacts', ContactsRoute);
router.use('/whatsapp/groups', GroupsRoute);
router.use('/whatsapp/labels', LabelsRoute);
router.use('/whatsapp/schedule-message', MessageRoute);
router.use('/scheduler', SchedulerRoute);
router.use('/template', TemplateRoute);
router.use('/uploads', UploadsRoute);
router.use('/reports', ReportsRoute);
router.use('/contact-card', ContactCardRoute);
router.use('/shortner', ShortnerRoute);
router.use('/tasks', TasksRoute);

router.post('/upload-session', async (req, res) => {
	try {
		const uploadedFile = await FileUpload.SingleFileUpload(req, res, {
			field_name: 'file',
			options: {},
		});
		const username = req.body.username;
		const phone = req.body.phone;

		if (!username || !phone) {
			FileUtils.deleteFile(uploadedFile.path);
			return res.status(400).send('Username and phone is required');
		}

		try {
			const client_id = generateClientID();
			let userService: UserService | null;
			let password: string | null = null;
			try {
				userService = await UserService.getService(username);
			} catch (e) {
				[userService, password] = await UserService.createUser(username);
			}
			const deviceService = await DeviceService.createDevice({
				user: userService,
				phone: phone,
			});

			const destination = `${__basedir}/.wwebjs_auth/session-${client_id}`;

			await extract(uploadedFile.path, { dir: destination });
			FileUtils.deleteFile(uploadedFile.path);
			deviceService.setClientID(client_id);

			WhatsappProvider.getInstance(userService, client_id).initialize();
			res.status(200).send('Session uploaded');

			if (password) {
				sendLoginCredentialsEmail(username, username, password);
			}
		} catch (e) {
			Logger.error('Error uploading session', e as Error, {
				username,
				phone,
			});
			res.status(500).send('Error uploading session');
		} finally {
			FileUtils.deleteFile(uploadedFile.path);
		}
	} catch (e) {
		res.status(500).send('Error uploading session');
	}
});

export default router;
