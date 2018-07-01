/**
 * Copyright: (c) 2016-2018 Max Klein
 * License: MIT
 */

const fs = require('fs');
const path = require('path');
const request = require('request');
const showdown = require('showdown');

const exists = require('./exists');

const showdownConverter = new showdown.Converter();
showdownConverter.setFlavor('github');

function readProjectConfig(dir, name) {
    const filename = path.join(dir, 'project.json');

    let contents;
    try {
        contents = JSON.parse(fs.readFileSync(filename));
    } catch(e) {
        contents = null;
    }

    return Object.assign({}, {
        hidden: false,
        fromGitLab: false,
        gitLabId: 0,
        title: null,
        category: 'Other',
        shortDesc: null,
        link: null,
        sourceLink: null,
        longDesc: null,
        longDescFile: null
    }, contents);
}

function getProject(directory, name) {
    const config = readProjectConfig(directory, name);

    if(config.hidden) {
        return null;
    }

    let title = config.title;
    if (title === null && !config.fromGitLab) {
        title = name.substr(0, 1).toUpperCase() + name.substr(1);
    }

    let longDesc = config.longDesc;
    if (config.longDescFile !== null) {
        const filename = path.join(directory, path.basename(config.longDescFile));

        let markdown;
        try {
            markdown = fs.readFileSync(filename);
        } catch (e) {
            markdown = null;
        }

        if (markdown !== null) {
            longDesc = showdownConverter.makeHtml(markdown);
        }
    }

    const staticDir = path.join(directory, 'static');

    let hasStatic = false;
    let hasThumbnail = false;
    let imageCount = 0;

    if (exists.dir(staticDir)) {
        hasStatic = true;

        if (exists.file(path.join(staticDir, 'thumbnail.jpg'))) {
            hasThumbnail = true;
        }

        while (exists.file(path.join(staticDir, 'image' + (imageCount + 1) + '.jpg'))) {
            imageCount++;
        }
    }

    return {
        name: name,
        fromGitLab: config.fromGitLab,
        gitLabId: config.gitLabId,
        title: title,
        category: config.category,
        shortDesc: config.shortDesc,
        link: config.link,
        sourceLink: config.sourceLink,
        longDesc: longDesc,
        hasStatic: hasStatic,
        staticDir: staticDir,
        hasThumbnail: hasThumbnail,
        imageCount: imageCount
    };
}

function prepareProject(project, callback) {
    if (project.fromGitLab) {
        let loadTitle = project.title === null;
        let loadShortDesc = project.shortDesc === null;
        let loadSourceLink = project.sourceLink === null;
        let loadLongDesc = project.longDesc === null;

        if (loadTitle || loadShortDesc || loadSourceLink || loadLongDesc) {
            const apiBaseUrl = 'https://gitlab.com/api/v4/projects/' + project.gitLabId;

            request({ url: apiBaseUrl, json: true }, function (err, res, body) {
                if (err) {
                    console.error(err);
                    callback();
                    return;
                }

                if (loadTitle) {
                    project.title = body.name;
                }

                if (loadShortDesc) {
                    project.shortDesc = body.description;
                }

                if (loadSourceLink) {
                    project.sourceLink = body.web_url;
                }

                if (loadLongDesc) {
                    const url = new URL(body.readme_url);
                    const pathParts = url.pathname.split(path.sep).filter(part => part.length > 0);

                    const readmeBranch = pathParts[3];
                    const readmeName = pathParts[4];

                    const readmeUrl = apiBaseUrl + '/repository/files/' + readmeName + '/raw?ref=' + readmeBranch;

                    request(readmeUrl, function (err, res, body) {
                        if (err) {
                            console.error(err);
                        } else {
                            const html = showdownConverter.makeHtml(body);
                            project.longDesc = html;
                        }

                        callback();
                    });
                } else {
                    callback();
                }
            });
        } else {
            callback();
        }
    } else {
        callback();
    }
}

function prepareAllProjects(projects, callback) {
    let projectsLeft = projects.length;

    for (let i = 0; i < projects.length; i++) {
        prepareProject(projects[i], function () {
            projectsLeft--;
            if (projectsLeft === 0) {
                callback();
            }
        });
    }
}

function readProjectsConfig(dir) {
    const filename = path.join(dir, 'projects.json');

    let contents;
    try {
        contents = JSON.parse(fs.readFileSync(filename));
    } catch (e) {
        console.error(e);
        contents = null;
    }

    return Object.assign({}, {
        showcased: [],
        categories: []
    }, contents);
}

function getProjects(dir) {
    const byName = {};
    const showcased = [];
    const categories = [];

    if(exists.dir(dir)) {
        // Read projects.json
        const projectsConfig = readProjectsConfig(dir);
        const showcasedNames = projectsConfig.showcased;
        const categoryNames = projectsConfig.categories;

        const byCategory = {};

        // Iterate over every file in projects/
        fs.readdirSync(dir).forEach(filename => {
            // Exclude hidden files & directories
            if(filename.startsWith('.')) {
                return;
            }

            // Get full path
            var projectPath = path.resolve(dir, filename);

            // Skip if project is not a directory
            if(!exists.dir(projectPath)) {
                return;
            }

            const project = getProject(projectPath, filename);

            if (project !== null) {
                byName[project.name] = project;

                if (!byCategory.hasOwnProperty(project.category)) {
                    byCategory[project.category] = [];
                }

                byCategory[project.category].push(project);
            }
        });

        showcasedNames.forEach(function (projectName) {
            if (byName.hasOwnProperty(projectName)) {
                showcased.push(byName[projectName]);
            }
        });

        // Add all categories for which the order was specified
        categoryNames.forEach(function (categoryName) {
            if (byCategory.hasOwnProperty(categoryName)) {
                categories.push({
                    name: categoryName,
                    projects: byCategory[categoryName]
                });

                byCategory[categoryName] = null;
            }
        });

        // Add remaining categories in no special order
        for (let categoryName in byCategory) {
            if (byCategory[categoryName] !== null) {
                categories.push({
                    name: categoryName,
                    projects: byCategory[categoryName]
                });
            }
        }
    }

    return {
        byName: byName,
        showcased: showcased,
        categories: categories
    };
}

module.exports = {
    get: getProjects,
    prepare: prepareProject,
    prepareAll: prepareAllProjects
};
