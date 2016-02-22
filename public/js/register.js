/**
 * Copyright: (c) 2016 Max Klein
 * License: MIT
 */

(function () {
	"use strict";

	var form = document.getElementById("register"),
		errorElem = document.getElementById("error"),
		emailInput = document.getElementById("email"),
		nameInput = document.getElementById("name"),
		passwordInput = document.getElementById("password"), password2Input = document.getElementById("password2"),
		submit = document.getElementById("submit"),
		emailError = false,
		passwordError = false, password2Error = false;

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

	function register(email, name, password, callback) {
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
			email: email,
			name: name,
			password: password
		}));
	}

	emailInput.addEventListener("input", function () {
		if(emailInput.value.trim() && emailInput.value.indexOf("@") !== -1) {
			if(emailError) {
				emailError = false;
				emailInput.classList.remove("error");
			}
		} else {
			if(!emailError) {
				emailError = true;
				emailInput.classList.add("error");
			}
		}
	});

	passwordInput.addEventListener("input", function () {
		if(passwordInput.value) {
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

	password2Input.addEventListener("input", function () {
		if(password2Input.value === passwordInput.value) {
			if(password2Error) {
				password2Error = false;
				password2Input.classList.remove("error");
			}
		} else {
			if(!password2Error) {
				password2Error = true;
				password2Input.classList.add("error");
			}
		}
	});

	form.addEventListener("submit", function (evt) {
		evt.preventDefault();

		var email = emailInput.value.trim(),
			name = nameInput.value.trim(),
			password = passwordInput.value,
			password2 = password2Input.value;

		if(!email || email.indexOf("@") === -1) {
			emailError = true;
			emailInput.classList.add("error");
		} else {
			emailError = false;
			emailInput.classList.remove("error");
		}

		if(!password) {
			passwordError = true;
			passwordInput.classList.add("error");
		} else {
			passwordError = false;
			passwordInput.classList.remove("error");
		}

		if(password2 !== password) {
			password2Error = true;
			password2Input.classList.add("error");
		} else {
			password2Error = false;
			password2Input.classList.remove("error");
		}

		if(emailError || passwordError || password2Error) {
			return;
		}

		submit.disabled = true;
		errorElem.style.display = "none";

		register(email, name, password, function (success) {
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
