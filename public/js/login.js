/**
 * Copyright: (c) 2016 Max Klein
 * License: MIT
 */

(function () {
	"use strict";

	var form = document.getElementById("login"),
		errorElem = document.getElementById("error"),
		emailInput = document.getElementById("email"),
		passwordInput = document.getElementById("password"),
		submit = document.getElementById("submit"),
		emailError = false,
		passwordError = false;

	function login(email, password, callback) {
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
			password: password
		}));
	}

	emailInput.addEventListener("input", function () {
		if(emailInput.value.trim()) {
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

	form.addEventListener("submit", function (evt) {
		evt.preventDefault();

		var email = emailInput.value.trim(),
			password = passwordInput.value;

		if(!email) {
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

		if(emailError || passwordError) {
			return;
		}

		submit.disabled = true;
		errorElem.style.display = "none";

		login(email, password, function (success) {
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
