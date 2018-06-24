/**
 * Copyright: (c) 2016-2018 Max Klein
 * License: MIT
 */

const fs = require('fs');
const path = require('path');

const serveStatic = require('serve-static');

const exists = require('./exists');

function readSubpageConfig(dir, name) {
    const filename = path.join(dir, 'subpage.json');
	const oldFilename = path.join(dir, 'project.json');

    const rawContents = null;
    try {
        rawContents = fs.readFileSync(filename);
    } catch(e) {
        try {
            rawContents = fs.readFileSync(oldFilename);
        } catch(e) {
            //
        }
    }

	let contents = null;
	try {
		contents = JSON.parse(rawContents);
	} catch(e) {
        //
	}

	return Object.assign({}, {
        disabled: false,
		static: 'public',
		index: 'index.js',
		route: name
	}, contents);
}

function useSubpage(subpage, app) {
    const staticDir = subpage.staticDir;
    const indexFile = subpage.indexFile;
	const route = subpage.route;

	if(staticDir) {
		app.use(route, serveStatic(staticDir));
	}

	if(indexFile) {
        let initSubpage;
		try {
			initSubpage = require(indexFile);
		} catch(err) {
			console.error(indexFile + ':', err.stack || err);
			return;
		}

		if(typeof initSubpage !== 'function') {
			console.error(indexFile + ':', 'module.exports is not a function');
			return;
		}

        let ret;
		try {
			ret = initSubpage(app);
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

    if (config.disabled) {
        return null;
    }

	const staticDir = path.join(directory, config.static);
	const indexFile = path.join(directory, config.index);

	return {
        staticDir: exists.dir(staticDir) ? staticDir : null,
        indexFile: exists.file(indexFile) ? indexFile : null,
        route: path.normalize('/' + config.route.replace(/[?+*()]/g, '\\$&'))
    };
}

function getSubpages(dir) {
	const subpages = [];

	if(exists.dir(dir)) {
		// Iterate over every file in subpages/
		fs.readdirSync(dir).forEach(filename => {
			// Exclude hidden files & directories
			if(filename.startsWith('.')) {
                return;
            }

			// Get full path
			var subpagePath = path.resolve(dir, filename);

			// Skip if subpage is not a directory
			if(!exists.dir(subpagePath) || exists(path.join(subpagePath, '.ignore'))) {
                return;
            }

			const subpage = getSubpage(subpagePath, filename);

            if (subpage !== null) {
    			subpages.push(subpage);
            }
		});
	}

	return subpages;
}

module.exports = {
	get: getSubpages,
	use: useSubpage
};
