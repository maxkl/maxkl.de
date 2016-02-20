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
	session = require("express-session"),
	cookieParser = require("cookie-parser"),
	mongodb = require("mongodb"),
	MongoStore = require("connect-mongo")(session),
	bodyParser = require("body-parser"),
	MongoClient = mongodb.MongoClient;

// Custom/local modules
var readConfig = require("./lib/readConfig"),
	merge = require("./lib/merge"),
	user = require("./lib/user");

// Register *.marko template file type
require("marko/node-require").install();

// Load error templates
var error404Template = require("./views/errors/404.marko"),
	error500Template = require("./views/errors/500.marko");

// Configuration variables
var config = readConfig("../config.json", __dirname),
	subpageDir = path.join(__dirname, "../subpages");

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

//region *exists* functions

function exists(path) {
	try {
		fs.statSync(path);
		return true;
	} catch(e) {
		return false;
	}
}

function lexists(path) {
	try {
		fs.lstatSync(path);
		return true;
	} catch(e) {
		return false;
	}
}

function fileExists(path) {
	try {
		return fs.statSync(path).isFile();
	} catch(e) {
		return false;
	}
}

function lfileExists(path) {
	try {
		return fs.lstatSync(path).isFile();
	} catch(e) {
		return false;
	}
}

function directoryExists(path) {
	try {
		return fs.statSync(path).isDirectory();
	} catch(e) {
		return false;
	}
}

function ldirectoryExists(path) {
	try {
		return fs.lstatSync(path).isDirectory();
	} catch(e) {
		return false;
	}
}

//endregion

function includeSubpage(app, directory, name) {
	var publicDir = path.join(directory, config.publicDir),
		indexFile = path.join(directory, config.indexFile),
		// Escape all characters that have a special meaning in express route names
		route = "/" + name.replace(/[?+*()]/g, "\\$&");

	// Public/static files (html, css, js, ...)
	if(directoryExists(publicDir)) {
		app.use(route, serveStatic(publicDir));
	}

	// include index file (for page-specific logic)
	if(fileExists(indexFile)) {
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
	if(!directoryExists(subpageDir)) {
		console.log(subpageDir + ":", "not a directory");
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
		if(!directoryExists(subpagePath)) {
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

	// Assign db to app so that subpages can access it
	app.set("db", db);

	app.use(bodyParser.urlencoded({
		extended: false
	}));

	//app.use(bodyParser.json());

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
		console.log("req.cookies", req.cookies);
		res.locals.cookiesAccepted = !!req.cookies["a"];
		console.log("Cookies accepted:", res.locals.cookiesAccepted);
		next();
	});

	app.use(user({
		db: db
	}));

	// Global static files
	app.use("/", serveStatic("./public"));

	// TODO login/register/logout pages, cookie message, js message

	// Global routes
	require("./routes/index")(app, db);

	// Search for subpages
	includeSubpages(app);

	// Catch-all middleware to display 404 errors
	app.use(function (req, res, next) {
		var err = new Error("Not Found");
		err.status = 404;
		next(err);
	});

	// Error handler for 404 errors
	app.use(function (err, req, res, next) {
		// Skip not a 404 error
		if(err.status !== 404) return next(err);

		res.status(404);
		error404Template.render(merge({}, app.locals, res.locals), res);
	});

	// Assume all other errors to be server errors (500)
	app.use(function (err, req, res, next) {
		console.error("Internal server error:", err.stack || err);

		res.status(500);
		error500Template.render(merge({}, app.locals, res.locals), res);
	});

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
