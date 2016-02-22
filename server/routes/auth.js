/**
 * Copyright: (c) 2016 Max Klein
 * License: MIT
 */

var renderMarko = require("../lib/renderMarko"),
	user = require("../lib/user"),
	requireCookies = require("../lib/requireCookies");

var loginTemplate = require("../views/auth/login.marko"),
	registerTemplate = require("../views/auth/register.marko");

module.exports = function (app, db) {

	// TODO: legal notice

	app.get("/login", requireCookies(), function (req, res) {
		if(req.user.signedIn) {
			res.redirect(req.query["ret"] || "/");
			return;
		}

		renderMarko(res, loginTemplate);
	});

	app.post("/login", requireCookies(), function (req, res, next) {
		if(!req.body) return next(new Error("Invalid request body"));

		var useJson = req.query.hasOwnProperty("json"),
			returnUrl = req.query["ret"];

		function loginSuccess() {
			if(useJson) {
				res.json({
					success: true
				});
			} else {
				res.redirect(returnUrl || "/");
			}
		}

		if(req.user.signedIn) return loginSuccess();

		function loginError() {
			if(useJson) {
				res.json({
					success: false
				});
			} else {
				res.redirect("/login" + (returnUrl ? "?ret=" + encodeURIComponent(returnUrl) : ""));
			}
		}

		var email = req.body["email"],
			password = req.body["password"];

		if(!email || !password) return loginError();

		email = ("" + email).trim();
		password = "" + password;

		if(!email || !password) return loginError();

		req.user.signIn(email, password).then(function (success) {
			if(success) {
				loginSuccess();
			} else {
				loginError();
			}
		}).catch(function (err) {
			next(err || new Error("Server error"));
		});
	});

	app.get("/logout", requireCookies(), function (req, res) {
		var useJson = req.query.hasOwnProperty("json"),
			returnUrl = req.query["ret"];

		req.user.signOut();

		if(useJson) {
			res.json({
				success: true
			});
		} else {
			res.redirect(returnUrl || "/");
		}
	});

	app.get("/register", requireCookies(), function (req, res) {
		renderMarko(res, registerTemplate);
	});

	app.post("/register", requireCookies(), function (req, res, next) {
		if(!req.body) return next(new Error("Invalid request body"));

		var useJson = req.query.hasOwnProperty("json"),
			returnUrl = req.query["ret"];

		if(req.user.signedIn) {
			if(useJson) {
				res.json({
					success: true
				});
			} else {
				res.redirect(returnUrl || "/");
			}
			return;
		}

		function registrationError() {
			if(useJson) {
				res.json({
					success: false
				});
			} else {
				res.redirect("/register" + (returnUrl ? "?ret=" + encodeURIComponent(returnUrl) : ""));
			}
		}

		var email = req.body["email"],
			name = req.body["name"],
			password = req.body["password"];

		if(!email || !password) return registrationError();

		email = ("" + email).trim();
		name = ("" + name).trim();
		password = "" + password;

		if(!email || email.indexOf("@") === -1 || !password) return registrationError();

		req.user.register(email, name || null, password).then(function (success) {
			if(success) {
				if(useJson) {
					res.json({
						success: true
					});
				} else {
					// TODO: send verification email
					res.redirect("/login" + (returnUrl ? "?ret=" + encodeURIComponent(returnUrl) : ""));
				}
			} else {
				registrationError();
			}
		}).catch(function (err) {
			next(err || new Error("Server error"));
		})
	});

};
