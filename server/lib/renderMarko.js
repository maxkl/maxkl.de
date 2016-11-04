/**
 * Copyright: (c) 2016 Max Klein
 * License: MIT
 */

const path = require('path');
const fs = require('fs');
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

function doRender(template, res, locals) {
	if(typeof locals !== 'object')
		locals = {};

	const app = res.app;
	const data = Object.assign({}, app.locals, res.locals, locals);
	data.$global = Object.assign({}, app.locals.$global, res.locals.$global, locals.$global);

	res.type('text/html');
	template.render(data, res);
}

class CachedTemplate {
	constructor(templatePath, template, readTime) {
		this.template = template;
		this.readTime = readTime;
	}

	hasChanged() {
		try {
			var stat = fs.statSync(this.templatePath);
			return stat.mtime().getTime() > this.readTime;
		} catch(e) {
			return true;
		}
	}
}

module.exports.install = function (viewsDir) {
	viewsDir = path.resolve(viewsDir);
	const templateCache = {};

	function loadAndCacheTemplate(templatePath) {
		const readTime = Date.now();
		try {
			const template = marko.load(templatePath, { writeToDisk: false });
			templateCache[templatePath] = new CachedTemplate(template, readTime);
			console.log('Loaded template from disk: ', templatePath);
			return template;
		} catch(e) {
			delete templateCache[templatePath];
			throw e;
		}
	}

	function getTemplate(templatePath) {
		if(templateCache.hasOwnProperty(templatePath)) {
			const cachedTemplate = templateCache[templatePath];

			if(cachedTemplate.hasChanged()) {
				return loadAndCacheTemplate(templatePath);
			} else {
				console.log('Loaded template from cache:', templatePath);
				return cachedTemplate.template;
			}
		} else {
			return loadAndCacheTemplate(templatePath);
		}
	}

	function render(res, name, locals) {
		const templatePath = path.join(viewsDir, name + '.marko');

		const template = getTemplate(templatePath);

		doRender(template, res, locals);
	}

	return function renderMarkoMiddleware(req, res, next) {
		res.render = render.bind(null, res);
		next();
	};
};
