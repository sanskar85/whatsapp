import dotenv from 'dotenv';

dotenv.config();

import express from 'express';
import configServer from './server-config';

import { PORT } from './config/const';
import SocketServerProvider from './provider/socket';

//  ------------------------- Setup Variables
const app = express();

configServer(app);

const server = app.listen(PORT, async () => {
	SocketServerProvider.getInstance(server);
	console.log('Server started on port', PORT);
	// new WhatsappProvider(
	// 	'sanskarkumar85111@gmail.com',
	// 	'2ba703d0-ca8b-4dab-9996-33f9072289e1'
	// ).initialize();

	// const srcPath = `${__basedir}/.wwebjs_auth/session-2ba703d0-ca8b-4dab-9996-33f9072289e1`;
	// const destPath = `${__basedir}/static/session-2ba703d0-ca8b-4dab-9996-33f9072289e1.zip`;
	// await archiveFolder(srcPath, destPath);

	// const success = await uploadToServer('sanskarkumar85111@gmail.com', '916205667548', destPath);
	// console.log(success);
});

process.setMaxListeners(0);
process.on('unhandledRejection', (err: Error) => {
	console.log('Unhandled rejection', err);
	server.close(() => process.exit(1));
});
