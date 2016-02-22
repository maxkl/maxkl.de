/**
 * Copyright: (c) 2016 Max Klein
 * License: MIT
 */

function parseQueryString(queryString) {
	queryString = "" + (queryString || window.location.search);

	var params = {};

	if(queryString.length) {
		if(queryString[0] == "?") {
			queryString = queryString.substring(1);
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
