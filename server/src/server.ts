import dotenv from 'dotenv';

dotenv.config();

import express from 'express';
import configServer from './server-config';

import Logger from 'n23-logger';
import connectDB from './config/DB';
import cache from './config/cache';
import { PORT } from './config/const';
import SocketServerProvider from './provider/socket';

//  ------------------------- Setup Variables
const app = express();

configServer(app);

connectDB()
	.then(() => {
		Logger.info('Running Status', 'Database connected');
	})
	.catch((err) => {
		Logger.critical('Database Connection Failed', err);
		process.exit();
	});

const server = app.listen(PORT, async () => {
	SocketServerProvider.getInstance(server);
	await cache.connect();
	Logger.info('Running Status', `Server started on port ${PORT}`);
});

process.setMaxListeners(0);
process.on('unhandledRejection', (err: Error) => {
	Logger.critical('Unhandled rejection', err);
	server.close(() => process.exit(1));
});
