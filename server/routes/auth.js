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

	app.post("/login", function (req, res, next) {
		if(!req.body) return next(new Error("Invalid request body"));

		var useJson = req.query.hasOwnProperty("json");

		var username = req.body["username"],
			password = req.body["password"];

		if(!username || !password) {
			if(useJson) {
				res.json({
					success: false
				});
			} else {
				res.redirect("/login");
			}
			return;
		}

		username = ("" + username).trim();
		password = "" + password;

		if(!username || !password) {
			if(useJson) {
				res.json({
					success: false
				});
			} else {
				res.redirect("/login");
			}
			return;
		}

		req.user.signIn(username, password).then(function (success) {
			if(useJson) {
				res.json({ success: success });
			} else {
				res.redirect(req.query["ret"] || "/");
			}
		}).catch(function (err) {
			next(err || new Error("Error"));
		});
	});

};
