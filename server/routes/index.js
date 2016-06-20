/**
 * Copyright: (c) 2015 Max Klein
 * License: MIT
 */

const renderMarko = require('../lib/renderMarko');

const indexTemplate = require('../views/index.marko');
const poweredByTemplate = require('../views/powered-by.marko');
const legalTemplate = require('../views/legal.marko');

module.exports = function (app, db, sites) {

	app.get('/', function (req, res) {
		renderMarko(res, indexTemplate, {
			sections: sites
		});
	});

	app.get('/powered-by', function (req, res) {
		renderMarko(res, poweredByTemplate);
	});

	app.get('/legal', function (req, res) {
		renderMarko(res, legalTemplate);
	});

	require('./auth')(app, db);

};
