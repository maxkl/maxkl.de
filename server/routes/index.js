/**
 * Copyright: (c) 2015-2016 Max Klein
 * License: MIT
 */

module.exports = function (app, db, projectSections) {

	app.get('/', function (req, res) {
		res.renderMarko('index');
	});

	app.get('/projects', function (req, res) {
		res.renderMarko('projects', {
			projectSections: projectSections
		});
	});

	app.get('/about', function (req, res) {
		res.renderMarko('about');
	});

	app.get('/privacy', function (req, res) {
		res.renderMarko('privacy');
	});

	require('./auth')(app, db);

};
