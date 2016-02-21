/**
 * Copyright: (c) 2016 Max Klein
 * License: MIT
 */

(function () {
	"use strict";

	document.getElementById("accept-cookies").addEventListener("click", function (evt) {
		evt.preventDefault();

		document.cookie = "a=1"
			+ "; expires=" + new Date(Date.now() + 1000 * 60 * 60 * 24 * 365 * 25)
			+ "; path=/"
			+ "; domain=.maxkl.de";

		document.getElementById("cookie-message").style.display = "none";
	});
})();