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

	function reqNotSignedIn(req, res, next) {
		if(req.user.signedIn) {
			res.redirect(req.query["ret"] || "/");
			return;
		}

		next();
	}

	// TODO: link to /register on /login, link to /login on /register
	// TODO: User info on every page (name, email, profile link, /logout link)
	// TODO: profile page (edit email, name, password; delete)
	// TODO: user permission levels
	// TODO: admin page
	// TODO: legal notice

	app.get("/login", requireCookies(), reqNotSignedIn, function (req, res) {
		if(req.user.signedIn) {
			res.redirect(req.query["ret"] || "/");
			return;
		}

		renderMarko(res, loginTemplate, {
			registrationSuccessful: req.query.hasOwnProperty("registered")
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

	app.get("/logout", user.requireSignedIn(), function (req, res) {
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

	app.get("/register", requireCookies(), reqNotSignedIn, function (req, res) {
		renderMarko(res, registerTemplate);
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

	app.get("/user", requireCookies(), user.requireSignedIn("/login"), function (req, res) {
		renderMarko(res, userTemplate, {
			user: {
				id: req.user.id,
				email: req.user.email,
				name: req.user.name
			}
		});
	});

};
