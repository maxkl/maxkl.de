/**
 * Copyright: (c) 2016 Max Klein
 * License: MIT
 */

const path = require('path');
const marko = require('marko');

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

module.exports.install = function (app, viewsDir) {
	viewsDir = path.resolve(viewsDir);
	const templateCache = {};

	app.response.renderMarko = function renderMarko(name, locals, viewsDirOverride) {
		const templatePath = path.join(viewsDirOverride || viewsDir, name + '.marko');
		const template = getTemplate(templatePath, templateCache);
		doRender(template, this, locals);
	};
};
