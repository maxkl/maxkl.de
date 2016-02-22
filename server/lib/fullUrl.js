/**
 * Copyright: (c) 2016 Max Klein
 * License: MIT
 */

module.exports = function fullUrlMiddleware(req, res, next) {
	req.fullUrl = req.protocol + "://" + req.get("host") + req.originalUrl;
};
