/**
 * Copyright: (c) 2015-2016 Max Klein
 * License: MIT
 */

module.exports = function (app, db, projectSections) {

	app.get('/', function (req, res) {
		res.render('index');
	});

	app.get('/projects', function (req, res) {
		res.render('projects', {
			projectSections: projectSections
		});
	});

	app.get('/about', function (req, res) {
		res.render('about');
	});

	app.get('/privacy', function (req, res) {
		res.render('privacy');
	});

	require('./auth')(app, db);

	require('./mice')(app, db);

};
