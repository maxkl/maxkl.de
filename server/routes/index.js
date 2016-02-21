/**
 * Copyright: (c) 2015 Max Klein
 * License: MIT
 */

var path = require("path");
var express = require("express");
var merge = require("../lib/merge"),
	getViewData = require("../lib/getViewData");
var sites = require("../../sites.json");

var indexTemplate = require("../views/index.marko"),
	poweredByTemplate = require("../views/powered-by.marko"),
	legalTemplate = require("../views/legal.marko");

module.exports = function (app) {

	app.get("/", function (req, res) {
		indexTemplate.render(getViewData(res, {
			sections: sites
		}), res);
	});

	app.get("/powered-by", function (req, res) {
		poweredByTemplate.render(getViewData(res, {
			sections: sites
		}), res);
	});

	app.get("/legal", function (req, res) {
		legalTemplate.render(getViewData(res, {
			sections: sites
		}), res);
	});

	app.get("/accept-cookies", function (req, res) {
		res.cookie("a", "1", {
			path: "/",
			domain: ".maxkl.de",
			maxAge: 60 * 60 * 24 * 365 * 25
		});

		res.redirect(req.header("referer"));
	});

};
