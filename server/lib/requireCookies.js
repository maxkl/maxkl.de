/**
 * Copyright: (c) 2016 Max Klein
 * License: MIT
 */

/**
 * Create a middleware that redirects to a "Accept cookies" page if the user hasn't accepted cookies yet
 * @return {function(req: Object, res: Object, next: function)}
 */
module.exports = function requireCookies(returnUrl) {

	return function requireCookiesMiddleware(req, res, next) {
		if(!req.cookiesAccepted) {
			res.redirect("/accept-cookies" + (returnUrl ? "?cookies_ret=" + encodeURIComponent(returnUrl) : ""));
			return;
		}

		next();
	}
};
