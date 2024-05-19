import express, { Express } from 'express';

export default function (app: Express) {
	//Defines all global variables and constants
	let basedir = __dirname;
	basedir = basedir.slice(0, basedir.length - 4);
	global.__basedir = basedir;

	//Initialize all the middleware

	app.use(express.static(__basedir + 'static'));
	app.route('/api-status').get((req, res) => {
		res.status(200).json({
			success: true,
		});
	});
}
