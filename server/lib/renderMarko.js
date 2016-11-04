/**
 * Copyright: (c) 2016 Max Klein
 * License: MIT
 */

const path = require('path');
const marko = require('marko');

const merge = require("./merge");

module.exports = function renderMarko(res, template, data, type) {
	res.type(type || "text/html");

	var app = res.app;
	data = data || {};
	var viewData = merge({}, app.locals, res.locals, data);
	viewData.$global = merge({}, app.locals.$global, res.locals.$global, data.$global);

	template.render(viewData, res);
};

module.exports.install = function (viewsDir) {
	viewsDir = path.resolve(viewsDir);
	const templateCache = {};

	function render(res, name, locals) {
		const templatePath = path.join(viewsDir, name + '.marko');

		let template;
		if(templateCache.hasOwnProperty(templatePath)) {
			template = templateCache[templatePath];
		} else {
			try {
				template = marko.load(templatePath, { writeToDisk: false });
				templateCache[templatePath] = template;
			} catch(e) {
				console.error(e);
				return;
			}
		}

		if(typeof locals !== 'object')
			locals = {};

		const app = res.app;
		const data = Object.assign({}, app.locals, res.locals, locals);
		data.$global = Object.assign({}, app.locals.$global, res.locals.$global, locals.$global);

		res.type('text/html');
		template.render(data, res);
	}

	return function renderMarkoMiddleware(req, res, next) {
		res.render = render.bind(null, res);
		next();
	};
};
