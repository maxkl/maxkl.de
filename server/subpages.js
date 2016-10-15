/**
 * Copyright: (c) 2016 Max Klein
 * License: MIT
 */

'use strict';

const fs = require('fs');
const path = require('path');

const serveStatic = require('serve-static');

const exists = require('./lib/exists');

function readSubpageConfig(dir, name) {
	const filename = path.join(dir, 'subpage.json');

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
		section: 'Misc',
		title: name.substr(0, 1).toUpperCase() + name.substr(1),
		href: '/' + name,
		external: false,
		source: null
	}, contents);
}

function useSubpage(subpage, app) {
	const route = subpage.route;
	const staticDir = subpage.staticDir;
	const indexFile = subpage.indexFile;

	if(staticDir) {
		app.use(route, serveStatic(staticDir));
	}

	if(indexFile) {
		try {
			var initSubpage = require(indexFile);
		} catch(err) {
			console.error(indexFile + ':', err.stack || err);
			return;
		}

		if(typeof initSubpage !== 'function') {
			console.error(indexFile + ':', 'module.exports is not a function');
			return;
		}

		try {
			var ret = initSubpage(app);
		} catch(err) {
			console.error(indexFile + ':', err.stack || err);
			return;
		}

		if(typeof ret === 'function') {
			app.use(route, ret);
		}
	}
}


function getSubpage(directory, name) {
	const config = readSubpageConfig(directory, name);

	let entry = null;
	if(!config.hideEntry) {
		entry = {
			section: config.section,
			title: config.title,
			href: config.href,
			external: config.external,
			source: config.source
		}
	}

	const staticDir = path.join(directory, config.static);
	const indexFile = path.join(directory, config.index);

	const subpage = {
		staticDir: exists.dir(staticDir) ? staticDir : null,
		indexFile: exists.file(indexFile) ? indexFile : null,
		route: path.normalize('/' + config.route.replace(/[?+*()]/g, '\\$&'))
	};

	return {
		entry: entry,
		subpage: subpage
	};
}

function getSubpages(dir) {

	const entries = {};
	const subpages = [];

	if(exists.dir(dir)) {
		// Iterate over every file in subpages/
		fs.readdirSync(dir).forEach(filename => {
			// Exclude hidden files & directories
			if(filename.startsWith('.')) return;

			// Get full path
			var subpagePath = path.resolve(dir, filename);

			// Skip if subpage is not a directory
			if(!exists.dir(subpagePath) || exists(path.join(subpagePath, '.ignore'))) return;

			const result = getSubpage(subpagePath, filename);
			subpages.push(result.subpage);

			const entry = result.entry;
			if(entry) {
				if(!entries[entry.section]) {
					entries[entry.section] = [];
				}

				entries[entry.section].push({
					title: entry.title,
					href: entry.href,
					external: entry.external,
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
				links: entries[section]
			});
		}
	}

	return {
		subpages: subpages,
		sections: sections
	};
}

module.exports = {
	get: getSubpages,
	use: useSubpage
};
