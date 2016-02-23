/**
 * Copyright: (c) 2016 Max Klein
 * License: MIT
 */

var renderMarko = require("../lib/renderMarko"),
	user = require("../lib/user"),
	requireCookies = require("../lib/requireCookies");

var loginTemplate = require("../views/auth/login.marko"),
	registerTemplate = require("../views/auth/register.marko"),
	userTemplate = require("../views/auth/user.marko");

module.exports = function (app, db) {

	// TODO: profile page (edit email, name, password; delete)
	// TODO: user permission levels
	// TODO: admin page
	// TODO: legal notice

	app.get("/login", requireCookies(), user.requireNotSignedIn(), function (req, res) {
		var returnUrl = req.query["ret"];

		renderMarko(res, loginTemplate, {
			registrationSuccessful: req.query.hasOwnProperty("registered"),
			registerLink: "/register" + (returnUrl ? "?ret=" + encodeURIComponent(returnUrl) : "")
		});
	});

	app.post("/login", function (req, res, next) {
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

	app.get("/logout", function (req, res) {
		var useJson = req.query.hasOwnProperty("json"),
			returnUrl = req.query["ret"];

		req.user.signOut();

		if(useJson) {
			res.json({
				success: true
			});
		} else {
			res.redirect(returnUrl || "/login");
		}
	});

	app.get("/register", requireCookies(), user.requireNotSignedIn(), function (req, res) {
		var returnUrl = req.query["ret"];

		renderMarko(res, registerTemplate, {
			loginLink: "/login" + (returnUrl ? "?ret=" + encodeURIComponent(returnUrl) : "")
		});
	});

	app.post("/register", function (req, res, next) {
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
					res.redirect("/login?registered" + (returnUrl ? "&ret=" + encodeURIComponent(returnUrl) : ""));
				}
			} else {
				registrationError();
			}
		}).catch(function (err) {
			next(err || new Error("Server error"));
		})
	});

	app.get("/user", requireCookies(), user.requireSignedIn(), function (req, res) {
		renderMarko(res, userTemplate, {
			user: {
				id: req.user.id,
				email: req.user.email,
				name: req.user.name
			}
		});
	});

};
