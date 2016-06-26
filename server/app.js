/**
 * Copyright: (c) 2015 Max Klein
 * License: MIT
 */

'use strict';

// Node core modules
const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');

// npm modules
const express = require('express');
const serveStatic = require('serve-static');
const compress = require('compression');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const mongodb = require('mongodb');
const MongoStore = require('connect-mongo')(session);
const bodyParser = require('body-parser');
const MongoClient = mongodb.MongoClient;

// Custom/local modules
const readConfig = require('./lib/readConfig');
const exists = require('./lib/exists');
const renderMarko = require('./lib/renderMarko');
const user = require('./lib/user');
const subpages = require('./subpages');

// Register *.marko template file type
require('marko/node-require').install();

// Configuration variables
const rootDir = path.join(__dirname, '..');
const config = readConfig('config.json', rootDir);
const publicDir = path.join(rootDir, 'public');
const publicMetaDir = path.join(rootDir, 'public-meta');
const subpageDir = path.join(rootDir, 'subpages');

// SSL key & certificate for HTTPS
const options = {
	key: fs.readFileSync(config.sslKey),
	cert: fs.readFileSync(config.sslCert)
};

if(config.sslCa) {
	options.ca = config.sslCa.map(file => fs.readFileSync(file));
}

function connectDb() {
	return MongoClient.connect(config.dbUrl);
}

// Connect to mongodb database
connectDb().then(db => {

	const app = express();

	// The server runs on HTTPS only
	const httpsServer = https.createServer(options, app).listen(config.httpsPort, () => {
		const addr = httpsServer.address();
		const addrString = (addr.family == 'IPv6' ? '[' + addr.address + ']' : addr.address) + ':' + addr.port;

		console.log('HTTPS server listening on ' + addrString);
	});

	// Redirect all HTTP requests to HTTPS
	const httpServer = http.createServer((req, res) => {
		res.writeHead(301, {
			'Location': 'https://' + req.headers['host'] + req.url
		});
		res.end();
	}).listen(config.httpPort, () => {
		const addr = httpServer.address();
		const addrString = (addr.family == 'IPv6' ? '[' + addr.address + ']' : addr.address) + ':' + addr.port;

		console.log('HTTP server listening on ' + addrString);
	});

	// Assign to app so that subpages can access it
	app.set('db', db);
	app.set('server', httpsServer);

	app.disable('x-powered-by');

	app.use(compress({
		threshold: 0
	}));

	app.use(bodyParser.urlencoded({
		extended: false
	}));

	app.use(bodyParser.json());

	app.use(session({
		cookie: {
			secure: true
		},
		name: 'sid',
		resave: false,
		saveUninitialized: false,
		secret: config.sessionSecret,
		store: new MongoStore({
			db: db
		})
	}));

	app.use(cookieParser());

	app.use((req, res, next) => {
		var cookiesAccepted = !!req.cookies['a'];

		res.locals.cookiesAccepted = cookiesAccepted;
		req.cookiesAccepted = cookiesAccepted;

		if(!res.locals.$global) res.locals.$global = {};
		res.locals.$global.cookiesAccepted = cookiesAccepted;
		res.locals.$global.currentUrl = req.originalUrl;

		next();
	});

	app.use(user({
		db: db
	}));

	app.use((req, res, next) => {
		if(!res.locals.$global) res.locals.$global = {};
		res.locals.$global.user = req.user;
		next();
	});

	// Global static files
	app.use('/', serveStatic(publicDir));

	// Meta files like favicon, robots.txt, ... (in separate dir to reduce clutter)
	app.use('/', serveStatic(publicMetaDir));

	const subpageData = subpages.get(subpageDir);

	// Global routes
	require('./routes/index')(app, db, subpageData.sections);

	// Search for subpages
	subpageData.subpages.forEach(subpage => subpages.use(subpage, app));

	// Error handlers
	require('./routes/errors')(app, db);

}).catch(err => console.error(err));
