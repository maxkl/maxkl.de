/**
 * Copyright: (c) 2015-2016 Max Klein
 * License: MIT
 */

'use strict';

// Node core modules
const path = require('path');
const http = require('http');

// npm modules
const express = require('express');
const serveStatic = require('serve-static');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const MongoClient = require('mongodb').MongoClient;
const MongoStore = require('connect-mongo')(session);
const bodyParser = require('body-parser');

// Custom/local modules
const readConfig = require('./lib/readConfig');
const renderMarko = require('./lib/renderMarko');
const User = require('./lib/user');
const projects = require('./lib/projects');

// Configuration variables
const rootDir = path.join(__dirname, '..');
const viewsDir = path.join(rootDir, 'server/views');
const publicDir = path.join(rootDir, 'public');
const publicMetaDir = path.join(rootDir, 'public-meta');
const projectsDir = path.join(rootDir, 'projects');

const config = readConfig(path.join(rootDir, 'config.json'));

// Connect to mongodb database
MongoClient.connect(config.dbUrl).then(db => {

	const app = express();

	// The server runs on HTTPS only
	const server = http.createServer(app).listen(config.port, function () {
		const addr = server.address();
		const addrString = (addr.family == 'IPv6' ? '[' + addr.address + ']' : addr.address) + ':' + addr.port;

		console.log('Server listening on ' + addrString);
	});

	app.set('trust proxy', 1);

	// Assign to app so that subpages can access it
	app.set('db', db);
	app.set('server', server);

	app.disable('x-powered-by');

	// Global static files
	app.use('/', serveStatic(publicDir));

	// Meta files like favicon, robots.txt, ... (in separate dir to reduce clutter)
	app.use('/', serveStatic(publicMetaDir));

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

	app.use(User.install({
		db: db
	}));

	app.use(function (req, res, next) {
		var cookiesAccepted = !!req.cookies['a'];

		res.locals.cookiesAccepted = cookiesAccepted;
		res.locals.currentUrl = req.originalUrl;
		res.locals.user = req.user;

		next();
	});

	app.use(renderMarko.install(viewsDir));

	// Search for projects
	const projectsData = projects.get(projectsDir);

	// Global routes
	require('./routes/index')(app, db, projectsData.sections);

	// Include projects
	projectsData.projects.forEach(project => projects.use(project, app));

	// Error handlers
	require('./routes/errors')(app, db);

}).catch(err => console.error(err));
