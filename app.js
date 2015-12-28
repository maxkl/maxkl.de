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
	mongodb = require("mongodb"),
	MongoClient = mongodb.MongoClient;

// Custom/local modules
var readConfig = require("./lib/readConfig");

// Register .marko template file type
require("marko/node-require").install();

// Load error templates
var error404Template = require("./views/errors/404.marko"),
	error500Template = require("./views/errors/500.marko");

// Configuration variables
var config = readConfig("./config.json", __dirname),
	subpageDir = path.resolve("subpages");

// SSL key & certificate for HTTPS
var options = {
	key: fs.readFileSync(config.sslKey),
	cert: fs.readFileSync(config.sslCert)
};

// Connect to mongodb database
MongoClient.connect(config.dbUrl, options, function (err, db) {
	if(err) {
		console.error(err);
		return;
	}

	// Create app
	var app = express();

	app.set("db", db);

	// Global static files
	app.use("/", serveStatic("./public"));

	// Global routes
	require("./routes/index")(app, db);

	// Search for subpages
	try {
		// TODO: async, better error handling

		// This throws an error if subpages/ does not exist
		fs.lstat(subpageDir);

		// Iterate over every file in subpages/
		fs.readdirSync(subpageDir).forEach(function (file) {
			var name = file;

			// Get full path
			file = path.resolve(subpageDir, file);

			// Skip if file is not a directory
			if(!fs.lstatSync(file).isDirectory()) return;

			var publicDir = path.join(file, "public"),
				indexFile = path.join(file, "index.js"),
				route = "/" + name;

			// Public/static files (html, css, js, ...)
			try {
				// throws an error if publicDir does not exist
				var stat = fs.lstatSync(publicDir);

				// We can only serve from a directory
				if(stat.isDirectory()) {
					app.use(route, serveStatic(publicDir));
				}
			} catch(e) {
				// Ignore (publicDir does not exist or is not a directory)
			}

			// index.js file (for page-specific logic)
			try {
				// require() throws an error if the file does not exist or can not be read
				// TODO: check if file exists, then require and log errors (e.g. modules not found, syntax errors, ...)
				var createMiddleware = require(indexFile);

				// This throws an error if createMiddleware is not a function
				var middleware = createMiddleware(app);

				// Check if middleware is valid
				if(typeof middleware === "function") {
					// Mount the middleware
					app.use(route, middleware);
				}
			} catch(e) {
				// Ignore (The subpage has no custom logic)
				console.error(e);
			}
		});
	} catch(e) {
		// Ignore (No subpages/ directory available)
	}

	// Catch-all middleware to display 404 errors
	app.use(function (req, res, next) {
		var err = new Error();
		err.status = 404;
		next(err);
	});

	// Error handler for 404 errors
	app.use(function (err, req, res, next) {
		if(err.status === 404) {
			res.status(404);

			error404Template.render({}, res);
		} else {
			next(err);
		}
	});

	// Assume all other errors to be server errors (500)
	app.use(function (err, req, res, next) {
		console.error("Internal server error", err);

		res.status(500);

		error500Template.render({}, res);
	});

	// The server runs on HTTPS only
	https.createServer(options, app).listen(config.httpsPort);

	// Redirect all HTTP requests to HTTPS
	http.createServer(function (req, res) {
		res.writeHead(301, {
			"Location": "https://" + req.headers["host"] + req.url
		});
		res.end();
	}).listen(config.httpPort);

});
