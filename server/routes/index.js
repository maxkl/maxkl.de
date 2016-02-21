/**
 * Copyright: (c) 2015 Max Klein
 * License: MIT
 */

var path = require("path");
var express = require("express");
var merge = require("../lib/merge"),
	getViewData = require("../lib/getViewData"),
	renderMarko = require("../lib/renderMarko");
var sites = require("../../sites.json");

var indexTemplate = require("../views/index.marko"),
	poweredByTemplate = require("../views/powered-by.marko"),
	legalTemplate = require("../views/legal.marko");

const chars = "abcdefghijklmnopqrstuvwxyz";

module.exports = function (app) {

	app.get("/", function (req, res) {
		//res.type("html");
		//
		//indexTemplate.render(getViewData(res, {
		//	sections: sites
		//}), res);

		renderMarko(res, indexTemplate, {
			sections: sites
		});
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

	app.get("/gzipped", function (req, res) {
		res.type("html");

		for(var i = 0; i < 200; i++) {
			var chunk = "";

			for(var j = 0; j < 100; j++) {
				chunk += chars[Math.round(Math.random() * (chars.length - 1))];
			}

			res.write(chunk);
		}

		res.end();
	});

};
