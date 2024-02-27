import { exec } from 'child_process';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { Express, NextFunction, Request, Response } from 'express';
import fs from 'fs';
import cron from 'node-cron';
import routes from './modules';
import Shortner from './modules/shortner/shortner.controller';

import Logger from 'n23-logger';
import {
	ATTACHMENTS_PATH,
	CSV_PATH,
	INVOICE_PATH,
	IS_PRODUCTION,
	IS_WINDOWS,
	MISC_PATH,
	TASK_PATH,
	UPLOADS_PATH,
} from './config/const';
import APIError from './errors/api-errors';
import { WhatsappProvider } from './provider/whatsapp_provider';
import { MessageService } from './services/messenger';
import SchedulerService from './services/scheduler';
import WhatsappUtils from './utils/WhatsappUtils';

const allowlist = [
	'http://localhost:5173',
	'https://app.whatsleads.in',
	'https://admin.whatsleads.in',
];

const corsOptionsDelegate = (req: any, callback: any) => {
	let corsOptions;
	let isDomainAllowed = allowlist.indexOf(req.header('Origin')) !== -1;

	if (isDomainAllowed) {
		// Enable CORS for this request
		corsOptions = {
			origin: true,
			credentials: true,
			exposedHeaders: ['Content-Disposition'],
			methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
			optionsSuccessStatus: 204,
		};
	} else {
		// Disable CORS for this request
		corsOptions = { origin: false };
	}
	callback(null, corsOptions);
};

export default function (app: Express) {
	//Defines all global variables and constants
	let basedir = __dirname;
	basedir = basedir.slice(0, basedir.lastIndexOf(IS_WINDOWS ? '\\' : '/'));
	if (IS_PRODUCTION) {
		basedir = basedir.slice(0, basedir.lastIndexOf(IS_WINDOWS ? '\\' : '/'));
	}
	global.__basedir = basedir;

	//Initialize all the middleware
	app.use(cookieParser());
	app.use(express.urlencoded({ extended: true, limit: '2048mb' }));
	app.use(express.json({ limit: '2048mb' }));
	app.use(cors(corsOptionsDelegate));
	app.use(express.static(__basedir + 'static'));
	app.route('/open/:id').get(Shortner.open);
	app.route('/api-status').get((req, res) => {
		res.status(200).json({
			success: true,
			'active-instances-count': WhatsappProvider.getInstancesCount(),
		});
	});
	app.route('/clear-cached-ram').get((req, res) => {
		exec('pgrep chrome | xargs kill -9', (error, stdout, stderr) => {
			if (error) {
				Logger.error('CRON - Chrome', error);
				return;
			}
			Logger.info('CRON - Chrome', `All Chrome instances have been killed`);
			process.exit(0);
		});
	});
	app.use((req: Request, res: Response, next: NextFunction) => {
		req.locals = {
			...req.locals,
		};
		res.locals = {
			...res.locals,
		};
		const { headers, body, url } = req;

		Logger.http(url, {
			type: 'request',
			headers,
			body,
			label: headers['client-id'] as string,
			request_id: res.locals.request_id,
		});
		next();
	});
	app.use(routes);

	app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
		if (err instanceof APIError) {
			if (err.status === 500) {
				Logger.http(res.locals.url, {
					type: 'response-error',
					request_id: res.locals.request_id,
					status: 500,
					response: err.error || err,
					headers: req.headers,
					body: req.body,
					label: req.headers['client-id'] as string,
				});
			}

			return res.status(err.status).json({
				success: false,
				status: 'error',
				title: err.title,
				message: err.message,
			});
		}

		Logger.error(`Internal Server Error`, err, {
			type: 'error',
			request_id: res.locals.request_id,
		});
		res.status(500).json({
			success: false,
			status: 'error',
			title: 'Internal Server Error',
			message: err.message,
		});
		next();
	});

	createDir();
	WhatsappUtils.resumeSessions();

	//0 0 * * *
	cron.schedule('30 0 * * *', function () {
		SchedulerService.scheduleDailyMessages();
	});

	cron.schedule('0 */3 * * *', function () {
		WhatsappUtils.removeInactiveSessions();
		WhatsappUtils.removeUnwantedSessions();
	});
	cron.schedule('* * * * * *', function () {
		MessageService.sendScheduledMessage();
	});
	cron.schedule('30 3 * * *', function () {
		exec('pgrep chrome | xargs kill -9', (error, stdout, stderr) => {
			if (error) {
				Logger.error('CRON - Chrome', error);
				return;
			}
			Logger.info('CRON - Chrome', `All Chrome instances have been killed`);
			process.exit(0);
		});
	});
}

function createDir() {
	fs.mkdirSync(__basedir + ATTACHMENTS_PATH, { recursive: true });
	fs.mkdirSync(__basedir + CSV_PATH, { recursive: true });
	fs.mkdirSync(__basedir + UPLOADS_PATH, { recursive: true });
	fs.mkdirSync(__basedir + INVOICE_PATH, { recursive: true });
	fs.mkdirSync(__basedir + MISC_PATH, { recursive: true });
	fs.mkdirSync(__basedir + TASK_PATH, { recursive: true });
}
