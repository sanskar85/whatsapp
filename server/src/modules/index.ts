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

export default router;
