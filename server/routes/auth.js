/**
 * Copyright: (c) 2015 Max Klein
 * License: MIT
 */

var renderMarko = require("../lib/renderMarko");

var loginTemplate = require("../views/auth/login.marko");

module.exports = function (app, db) {

	// TODO: legal notice
	// TODO: requireCookies middleware, login/logout/register/

	app.get("/login", function (req, res) {
		renderMarko(res, loginTemplate);
	});

};
