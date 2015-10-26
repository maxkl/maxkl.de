/**
 * Copyright: (c) 2015 Max Klein
 * License: MIT
 */

var path = require("path");
var express = require("express");
var sites = require("../sites.json");

var indexTemplate = require("../views/index.marko");

var model = {
	sections: sites
};

module.exports = function (app) {

	app.get("/", function (req, res) {
		indexTemplate.render(model, res);
		//res.render("index", model);
	});

	//app.use("/vp", require(extDir + "/vp")());

};
