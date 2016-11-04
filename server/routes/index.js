/**
 * Copyright: (c) 2015-2016 Max Klein
 * License: MIT
 */

module.exports = function (app, db, sites) {

	app.get('/', function (req, res) {
		res.render('index', {
			sections: sites
		});
	});

	app.get('/legal', function (req, res) {
		res.render('legal');
	});

	require('./auth')(app, db);

};
