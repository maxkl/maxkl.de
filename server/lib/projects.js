/**
 * Copyright: (c) 2016 Max Klein
 * License: MIT
 */

const fs = require('fs');
const path = require('path');

const serveStatic = require('serve-static');

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
		static: 'public',
		index: 'index.js',
		route: name,
		hideEntry: false,
		section: 'Other',
		title: name.substr(0, 1).toUpperCase() + name.substr(1),
		href: '/' + name,
		source: null
	}, contents);
}

function useProject(project, app) {
	const route = project.route;
	const staticDir = project.staticDir;
	const indexFile = project.indexFile;

	if(staticDir) {
		app.use(route, serveStatic(staticDir));
	}

	if(indexFile) {
		try {
			var initProject = require(indexFile);
		} catch(err) {
			console.error(indexFile + ':', err.stack || err);
			return;
		}

		if(typeof initProject !== 'function') {
			console.error(indexFile + ':', 'module.exports is not a function');
			return;
		}

		try {
			var ret = initProject(app);
		} catch(err) {
			console.error(indexFile + ':', err.stack || err);
			return;
		}

		if(typeof ret === 'function') {
			app.use(route, ret);
		}
	}
}


function getProject(directory, name) {
	const config = readProjectConfig(directory, name);

	let entry = null;
	if(!config.hideEntry) {
		entry = {
			section: config.section,
			title: config.title,
			href: config.href,
			source: config.source
		}
	}

	const staticDir = path.join(directory, config.static);
	const indexFile = path.join(directory, config.index);

	const project = {
		staticDir: exists.dir(staticDir) ? staticDir : null,
		indexFile: exists.file(indexFile) ? indexFile : null,
		route: path.normalize('/' + config.route.replace(/[?+*()]/g, '\\$&'))
	};

	return {
		entry: entry,
		project: project
	};
}

function getProjects(dir) {

	const entries = {};
	const projects = [];

	if(exists.dir(dir)) {
		// Iterate over every file in projects/
		fs.readdirSync(dir).forEach(filename => {
			// Exclude hidden files & directories
			if(filename.startsWith('.')) return;

			// Get full path
			var projectPath = path.resolve(dir, filename);

			// Skip if project is not a directory
			if(!exists.dir(projectPath) || exists(path.join(projectPath, '.ignore'))) return;

			const result = getProject(projectPath, filename);
			projects.push(result.project);

			const entry = result.entry;
			if(entry) {
				if(!entries[entry.section]) {
					entries[entry.section] = [];
				}

				entries[entry.section].push({
					title: entry.title,
					href: entry.href,
					source: entry.source
				});
			}
		});
	}

	const sections = [];
	for(let section in entries) {
		if(entries.hasOwnProperty(section)) {
			sections.push({
				title: section,
				projects: entries[section]
			});
		}
	}

	return {
		projects: projects,
		sections: sections
	};
}

module.exports = {
	get: getProjects,
	use: useProject
};
