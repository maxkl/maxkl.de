/**
 * Copyright: (c) 2016 Max Klein
 * License: MIT
 */

var merge = require("./merge");

module.exports = function renderMarko(res, template, data, type) {
	res.type(type || "text/html");

	var app = res.app;
	data = data || {};
	var viewData = merge({}, app.locals, res.locals, data);
	viewData.$global = merge({}, app.locals.$global, res.locals.$global, data.$global);

	template.render(viewData, res);
};
