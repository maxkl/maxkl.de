/**
 * Copyright: (c) 2016-2018 Max Klein
 * License: MIT
 */

const serveStatic = require('serve-static');
const request = require('request');
const showdown = require('showdown');

module.exports = function (app, db, projectsData) {

    const showdownConverter = new showdown.Converter();
    showdownConverter.setFlavor('github');

    function prepareProject(project, callback) {
        if (project.fromGitLab) {
            let loadLongDesc = false;

            if (project.longDesc === null) {
                loadLongDesc = true;
            }

            if (loadLongDesc) {
                request.get(project.sourceLink + '/raw/master/README.md', function (err, res, body) {
                    if (!err) {
                        const html = showdownConverter.makeHtml(body);
                        project.longDesc = html;
                    }

                    callback();
                });
            } else {
                callback();
            }
        } else {
            callback();
        }
    }

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

        prepareProject(project, function () {
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
