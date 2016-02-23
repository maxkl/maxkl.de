/**
 * Copyright: (c) 2015 Max Klein
 * License: MIT
 */

// Node core modules
var fs = require("fs"),
	path = require("path"),
	http = require("http"),
	https = require("https");

// npm modules
var express = require("express"),
	serveStatic = require("serve-static"),
	compress = require("compression"),
	session = require("express-session"),
	cookieParser = require("cookie-parser"),
	mongodb = require("mongodb"),
	MongoStore = require("connect-mongo")(session),
	bodyParser = require("body-parser"),
	MongoClient = mongodb.MongoClient;

// Custom/local modules
var readConfig = require("./lib/readConfig"),
	exists = require("./lib/exists"),
	renderMarko = require("./lib/renderMarko"),
	user = require("./lib/user");

// Register *.marko template file type
require("marko/node-require").install();

// Configuration variables
var rootDir = path.join(__dirname, ".."),
	config = readConfig("config.json", rootDir),
	publicDir = path.join(rootDir, "public"),
	publicMetaDir = path.join(rootDir, "public-meta"),
	subpageDir = path.join(rootDir, "subpages");

// SSL key & certificate for HTTPS
var options = {
	key: fs.readFileSync(config.sslKey),
	cert: fs.readFileSync(config.sslCert)
};

if(config.sslCa) {
	options.ca = config.sslCa.map(function (file) {
		return fs.readFileSync(file);
	});
}

function includeSubpage(app, directory, name) {
	var publicDir = path.join(directory, config.publicDir),
		indexFile = path.join(directory, config.indexFile),
		// Escape all characters that have a special meaning in express route names
		route = "/" + name.replace(/[?+*()]/g, "\\$&");

	// Public/static files (html, css, js, ...)
	if(exists.dir(publicDir)) {
		app.use(route, serveStatic(publicDir));
	}

	// include index file (for page-specific logic)
	if(exists.file(indexFile)) {
		try {
			var initSubpage = require(indexFile);
		} catch(err) {
			// An error occured while parsing/executing the file
			console.error(indexFile + ":", err.stack || err);
			return;
		}

		// initSubpage has to be a function
		if(typeof initSubpage !== "function") {
			console.error(indexFile + ":", "module.exports is not a function");
			return;
		}

		try {
			var ret = initSubpage(app);
		} catch(err) {
			// An error occured in the initSubpage function
			console.error(indexFile + ":", err.stack || err);
			return;
		}

		// If initSubpage returned a function, use it as middleware
		if(typeof ret === "function") {
			// Mount the middleware
			app.use(route, ret);
		}
	}
}

function includeSubpages(app) {
	// subpages/ must exist and must be a directory
	if(!exists.dir(subpageDir)) {
		console.error(subpageDir + ":", "not a directory");
		return;
	}

	// Iterate over every file in subpages/
	fs.readdirSync(subpageDir).forEach(function (filename) {
		// Exclude hidden files & directories
		if(filename[0] == ".") {
			console.log("Excluding hidden file " + filename);
			return;
		}

		// Get full path
		var subpagePath = path.resolve(subpageDir, filename);

		// Warn & skip if subpage is not a directory
		if(!exists.dir(subpagePath)) {
			console.warn(subpagePath + ":", "not a directory");
			return;
		}

		includeSubpage(app, subpagePath, filename);
	});
}

// Connect to mongodb database
MongoClient.connect(config.dbUrl).then(function (db) {

	var app = express();

	app.locals.site = {
		title: config.site.title
	};

	app.locals.$global = {
		site: app.locals.site
	};

	// Assign db to app so that subpages can access it
	app.set("db", db);

	app.disable("x-powered-by");

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
		name: "sid",
		resave: false,
		saveUninitialized: false,
		secret: "Magic is magnificient! Ministry of mediocre mangos! Is this true?",
		store: new MongoStore({
			db: db
		})
	}));

	app.use(cookieParser());

	app.use(function (req, res, next) {
		var cookiesAccepted = !!req.cookies["a"];

		res.locals.cookiesAccepted = cookiesAccepted;
		req.cookiesAccepted = cookiesAccepted;

		if(!res.locals.$global) res.locals.$global = {};
		res.locals.$global.cookiesAccepted = cookiesAccepted;

		next();
	});

	app.use(user({
		db: db
	}));

	app.use(function (req, res) {
		if(!res.locals.$global) res.locals.$global = {};
		res.locals.$global.user = req.user;
	});

	// Global static files
	app.use("/", serveStatic(publicDir));

	// Meta files like favicon, robots.txt, ... (in separate dir to reduce clutter)
	app.use("/", serveStatic(publicMetaDir));

	// Global routes
	require("./routes/index")(app, db);

	// Search for subpages
	includeSubpages(app);

	// Error handlers
	require("./routes/errors")(app, db);

	// The server runs on HTTPS only
	var httpsServer = https.createServer(options, app).listen(config.httpsPort, function () {
		var addr = httpsServer.address(),
			addrString = (addr.family == "IPv6" ? "[" + addr.address + "]" : addr.address) + ":" + addr.port;

		console.log("HTTPS server listening on " + addrString);
	});

	// Redirect all HTTP requests to HTTPS
	var httpServer = http.createServer(function (req, res) {
		res.writeHead(301, {
			"Location": "https://" + req.headers["host"] + req.url
		});
		res.end();
	}).listen(config.httpPort, function () {
		var addr = httpServer.address(),
			addrString = (addr.family == "IPv6" ? "[" + addr.address + "]" : addr.address) + ":" + addr.port;

		console.log("HTTP server listening on " + addrString);
	});

}).catch(function (err) {
	console.error(err);
});
