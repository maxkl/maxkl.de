/**
 * Copyright: (c) 2015-2016 Max Klein
 * License: MIT
 */

module.exports = function (app, db, projectsData) {

	app.get('/', function (req, res) {
		res.renderMarko('index', {
            showcasedProjects: projectsData.showcased
        });
	});

	app.get('/projects', function (req, res) {
		res.renderMarko('projects', {
			showcasedProjects: projectsData.showcased,
            projectCategories: projectsData.categories
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
