/**
 * Copyright: (c) 2015-2016 Max Klein
 * License: MIT
 */

const express = require('express');

const projects = require('../lib/projects');

// These will be initialized in `init`
let projectsDir;
let app;

// These are changed each time `loadProjects` is called
// This way the projects can be reloaded without restarting the complete website
let projectSections;
let router;

function loadProjects() {
	// Search for projects
	const projectsData = projects.get(projectsDir);

	projectSections = projectsData.sections;

	router = new express.Router();

	// Include projects
	projectsData.projects.forEach(project => projects.use(project, app, router));
}

exports.init = function (_app, _projectsDir) {
	app = _app;
	projectsDir = _projectsDir;

	loadProjects();

	app.get('/projects', function (req, res) {
		res.render('projects', {
			projectSections: projectSections
		});
	});

	app.use(function (req, res, next) {
		// This way `router` can be replaced to change the projects' routes
		router(req, res, next);
	});

};

exports.reload = function () {
	loadProjects();
};
