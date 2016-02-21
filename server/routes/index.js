/**
 * Copyright: (c) 2015 Max Klein
 * License: MIT
 */

var renderMarko = require("../lib/renderMarko");
var sites = require("../../sites.json");

var indexTemplate = require("../views/index.marko"),
	poweredByTemplate = require("../views/powered-by.marko"),
	legalTemplate = require("../views/legal.marko");

module.exports = function (app, db) {

	app.get("/", function (req, res) {
		renderMarko(res, indexTemplate, {
			sections: sites
		});
	});

	app.get("/powered-by", function (req, res) {
		renderMarko(res, poweredByTemplate);
	});

	app.get("/legal", function (req, res) {
		renderMarko(res, legalTemplate);
	});

	app.get("/accept-cookies", function (req, res) {
		res.cookie("a", "1", {
			path: "/",
			domain: ".maxkl.de",
			maxAge: 60 * 60 * 24 * 365 * 25
		});

		res.redirect(req.header("referer"));
	});

	require("./auth")(app, db);

};
