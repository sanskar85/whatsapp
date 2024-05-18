import express, { Express } from 'express';

import { IS_PRODUCTION, IS_WINDOWS } from './config/const';

export default function (app: Express) {
	//Defines all global variables and constants
	let basedir = __dirname;
	basedir = basedir.slice(0, basedir.lastIndexOf(IS_WINDOWS ? '\\' : '/'));
	if (IS_PRODUCTION) {
		basedir = basedir.slice(0, basedir.lastIndexOf(IS_WINDOWS ? '\\' : '/'));
	}
	global.__basedir = basedir;

	//Initialize all the middleware

	app.use(express.static(__basedir + 'static'));
	app.route('/api-status').get((req, res) => {
		res.status(200).json({
			success: true,
		});
	});
}
