/**
 * Copyright: (c) 2016-2018 Max Klein
 * License: MIT
 */

const serveStatic = require('serve-static');

const projects = require('../lib/projects');

module.exports = function (app, db, projectsData) {

    app.get('/projects', function (req, res) {
        const allProjects = [];
        projectsData.categories.forEach(function (category) {
            for (let i = 0; i < category.projects.length; i++) {
                allProjects.push(category.projects[i]);
            }
        });

        projects.prepareAll(allProjects, function () {
            res.renderMarko('projects', {
                showcasedProjects: projectsData.showcased,
                projectCategories: projectsData.categories
            });
        });
    });

    app.get('/projects/:project', function (req, res, next) {
        const projectName = req.params['project'];

        if (!projectsData.byName.hasOwnProperty(projectName)) {
            next();
            return;
        }

        const project = projectsData.byName[projectName];

        projects.prepare(project, function () {
            res.renderMarko('project', {
                project: project
            });
        });
    });

    for (const projectName in projectsData.byName) {
        if (projectsData.byName.hasOwnProperty(projectName)) {
            const project = projectsData.byName[projectName];

            if (project.hasStatic) {
                app.use('/projects/' + projectName + '/static', serveStatic(project.staticDir));
            }
        }
    }

};
