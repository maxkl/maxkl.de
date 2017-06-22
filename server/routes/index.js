/**
 * Copyright: (c) 2015-2016 Max Klein
 * License: MIT
 */

module.exports = function (app, db) {

	app.get('/', function (req, res) {
		res.render('index');
	});

	app.get('/about', function (req, res) {
		res.render('about');
	});

	app.get('/privacy', function (req, res) {
		res.render('privacy');
	});

	require('./auth')(app, db);

};
