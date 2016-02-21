/**
 * Copyright: (c) 2015 Max Klein
 * License: MIT
 */

var renderMarko = require("../lib/renderMarko");

// Load error templates
var error404Template = require("../views/errors/404.marko"),
	error500Template = require("../views/errors/500.marko");

module.exports = function (app) {

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
		renderMarko(res, error404Template);
	});

	// Assume all other errors to be server errors (500)
	app.use(function (err, req, res, next) {
		console.error("Internal server error:", err.stack || err);

		res.status(500);
		renderMarko(res, error500Template);
	});

};
