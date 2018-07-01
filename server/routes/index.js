/**
 * Copyright: (c) 2015-2018 Max Klein
 * License: MIT
 */

const projects = require('../lib/projects');

module.exports = function (app, db, projectsData) {

    app.get('/', function (req, res) {
        projects.prepareAll(projectsData.showcased, function () {
            res.renderMarko('index', {
                showcasedProjects: projectsData.showcased
            });
        });
    });

    require('./projects')(app, db, projectsData);

    app.get('/about', function (req, res) {
        res.renderMarko('about');
    });

    app.get('/privacy', function (req, res) {
        res.renderMarko('privacy');
    });

    require('./auth')(app, db);

};
