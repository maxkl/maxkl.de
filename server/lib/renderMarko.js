/**
 * Copyright: (c) 2016 Max Klein
 * License: MIT
 */

const path = require('path');
const fs = require('fs');
const marko = require('marko');

const merge = require("./merge");

module.exports = function renderMarko(res, template, data, type) {
	console.trace('renderMarko() is deprecated, use res.render() instead');

	res.type(type || "text/html");

	var app = res.app;
	data = data || {};
	var viewData = merge({}, app.locals, res.locals, data);
	viewData.$global = merge({}, app.locals.$global, res.locals.$global, data.$global);

	template.render(viewData, res);
};

function doRender(template, res, data) {
	data = data || {};
	data.$global = Object.assign({}, res.app.locals, res.locals, data.$global);

	res.type('text/html');
	template.render(data, res);
}

function loadAndCacheTemplate(templatePath, cache) {
	try {
		const template = marko.load(templatePath);
		cache[templatePath] = template;
		return template;
	} catch(e) {
		delete cache[templatePath];
		throw e;
	}
}

function getTemplate(templatePath, cache) {
	if(cache.hasOwnProperty(templatePath)) {
		return cache[templatePath];
	} else {
		return loadAndCacheTemplate(templatePath, cache);
	}
}

module.exports.install = function (viewsDir) {
	viewsDir = path.resolve(viewsDir);
	const templateCache = {};

	function render(res, name, locals, viewsDirOverride) {
		const templatePath = path.join(viewsDirOverride || viewsDir, name + '.marko');
		const template = getTemplate(templatePath, templateCache);
		doRender(template, res, locals);
	}

	return function renderMarkoMiddleware(req, res, next) {
		res.render = render.bind(null, res);
		next();
	};
};
