/**
 * Copyright: (c) 2016-2018 Max Klein
 * License: MIT
 */

const serveStatic = require('serve-static');

module.exports = function (app, db, projectsData) {

	app.get('/projects', function (req, res) {
        res.renderMarko('projects', {
            showcasedProjects: projectsData.showcased,
            projectCategories: projectsData.categories
        });
    });

    app.get('/projects/:project', function (req, res, next) {
        const projectName = req.params['project'];

        if (!projectsData.byName.hasOwnProperty(projectName)) {
            next();
            return;
        }

        const project = projectsData.byName[projectName];

        res.renderMarko('project', {
            project: project
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
