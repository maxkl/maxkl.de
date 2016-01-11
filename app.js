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
	subpageDir = path.join(__dirname, "subpages");

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

/**
 * TODO: async
 */
function includeSubpages(app) {
	// subpages/ has to exist and be a directory
	if(!directoryExists(subpageDir)) {
		console.log(subpageDir + ":", "not a directory");
		return;
	}

	// Iterate over every file in subpages/
	fs.readdirSync(subpageDir).forEach(function (file) {
		var name = file;

		// Get full path
		file = path.resolve(subpageDir, name);

		// Skip if file is not a directory
		if(!directoryExists(file)) {
			console.error(file + ":", "not a directory");
			return;
		}

		/*
		 public/    Static files
		 index.js   Index file
		 */
		var publicDir = path.join(file, "public"),
			indexFile = path.join(file, "index.js"),
			route = "/" + name;

		// Public/static files (html, css, js, ...)
		if(directoryExists(publicDir)) {
			app.use(route, serveStatic(publicDir));
		}

		// include index.js file (for page-specific logic)
		if(fileExists(indexFile)) {
			var initSubpage;
			try {
				initSubpage = require(indexFile);
			} catch(e) {
				// An error occured while parsing/executing the file
				console.error(indexFile + ":", e);
				return;
			}

			// initSubpage has to be a function
			if(typeof initSubpage !== "function") {
				console.error(indexFile + ":", "module.exports is not a function");
				return;
			}

			var ret;
			try {
				ret = initSubpage(app);
			} catch(e) {
				// An error occured in the initSubpage function
				console.error(indexFile + ":", e);
				return;
			}

			// If initSubpage returned a function, use it as middleware
			if(typeof ret === "function") {
				// Mount the middleware
				app.use(route, ret);
			}
		}
	});
}

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
	includeSubpages(app);

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
