/**
 * Copyright: (c) 2015 Max Klein
 * License: MIT
 */

var path = require("path");
var express = require("express");
var merge = require("../lib/merge"),
	getViewData = require("../lib/getViewData");
var sites = require("../../sites.json");

var indexTemplate = require("../views/index.marko");

module.exports = function (app) {

	app.get("/", function (req, res) {
		indexTemplate.render(getViewData(res, {
			sections: sites
		}), res);
	});

};
