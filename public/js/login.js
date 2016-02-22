/**
 * Copyright: (c) 2016 Max Klein
 * License: MIT
 */

(function () {
	"use strict";

	var form = document.getElementById("login"),
		errorElem = document.getElementById("error"),
		usernameInput = document.getElementById("username"),
		passwordInput = document.getElementById("password"),
		submit = document.getElementById("submit"),
		usernameError = false,
		passwordError = false;

	function parseQueryString(queryString) {
		queryString = "" + (queryString || window.location.search);

		var params = {};

		if(queryString.length) {
			if(queryString[0] == "?") {
				queryString = queryString.substring(0);
			}

			var parts = queryString.split("&");

			for(var i = 0; i < parts.length; i++) {
				var part = parts[i],
					equalsSign = part.indexOf("=");

				if(equalsSign == -1) {
					params[part] = "";
				} else {
					params[part.substring(0, equalsSign)] = decodeURIComponent(part.substring(equalsSign + 1).replace(/\+/g, " "));
				}
			}
		}

		return params;
	}

	function login(username, password, callback) {
		var req = new XMLHttpRequest();

		req.addEventListener("load", function () {
			if(req.status == 200) {
				try {
					var data = JSON.parse(req.responseText);
					callback(!!data["success"]);
				} catch(e) {
					console.error(e);
					callback(false);
				}
			} else {
				console.error("Status code:", req.status);
				callback(false);
			}
		});

		req.addEventListener("error", function () {
			callback(false);
		});

		req.open("post", "?json");

		req.setRequestHeader("Content-Type", "application/json; charset=UTF-8");

		req.send(JSON.stringify({
			username: username,
			password: password
		}));
	}

	usernameInput.addEventListener("input", function () {
		if(usernameInput.value.trim()) {
			if(usernameError) {
				usernameError = false;
				usernameInput.classList.remove("error");
			}
		} else {
			if(!usernameError) {
				usernameError = true;
				usernameInput.classList.add("error");
			}
		}
	});

	passwordInput.addEventListener("input", function () {
		if(usernameInput.value) {
			if(passwordError) {
				passwordError = false;
				passwordInput.classList.remove("error");
			}
		} else {
			if(!passwordError) {
				passwordError = true;
				passwordInput.classList.add("error");
			}
		}
	});

	form.addEventListener("submit", function (evt) {
		evt.preventDefault();

		var username = usernameInput.value.trim(),
			password = passwordInput.value;

		if(!username) {
			usernameError = true;
			usernameInput.classList.add("error");
			return;
		}

		if(!password) {
			passwordError = true;
			passwordInput.classList.add("error");
			return;
		}

		submit.disabled = true;
		errorElem.style.display = "none";

		login(username, password, function (success) {
			if(success) {
				var query = parseQueryString();
				window.location.href = query["ret"] || "/";
			} else {
				submit.disabled = false;
				errorElem.style.display = "block";
			}
		});
	});

})();
