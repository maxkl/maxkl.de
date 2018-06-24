/**
 * Copyright: (c) 2016-2018 Max Klein
 * License: MIT
 */

const fs = require('fs');
const path = require('path');

const exists = require('./exists');

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
		title: name.substr(0, 1).toUpperCase() + name.substr(1),
        category: 'Other',
        shortDesc: '',
        link: null,
        sourceLink: null
	}, contents);
}

function getProject(directory, name) {
	const config = readProjectConfig(directory, name);

	if(config.hidden) {
		return null;
	}

    // TODO: thumbnail, pictures, long description

	return {
        name: name
        title: config.title,
        category: config.category,
        shortDesc: config.shortDesc,
        link: config.link,
        sourceLink: config.sourceLink
    };
}

function readProjectsConfig(dir) {
    const filename = path.join(dir, 'projects.json');

    let contents;
    try {
        contents = JSON.parse(fs.readFileSync(filename));
    } catch(e) {
        contents = null;
    }

    return Object.assign({}, {
        showcased: [],
        categories: []
    }, contents);
}

function getProjects(dir) {
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
                if (showcasedNames.includes(project.name)) {
        			showcased.push(project);
                }

    			if (!byCategory.hasOwnProperty(project.category)) {
                    byCategory[project.category] = [];
                }

                byCategory[project.category].push(project);
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
		showcased: showcased,
        categories: categories
	};
}

module.exports = {
	get: getProjects
};
