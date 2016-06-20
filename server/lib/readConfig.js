/**
 * Copyright: (c) 2015 Max Klein
 * License: MIT
 */

'use strict';

var path = require('path');

module.exports = function (file, root) {
	root = root || __dirname;

	file = path.resolve(root, file);
	
	try {
		var config = require(file);

		config.httpPort = config.httpPort || 8080;
		config.httpsPort = config.httpsPort || 8443;
		config.sslKey = path.resolve(root, config.sslKey);
		config.sslCert = path.resolve(root, config.sslCert);
		config.sslCa = config.sslCa && config.sslCa.map(file => path.resolve(root, file));
		config.dbUrl = config.dbUrl || 'mongodb://localhost/';
		config.siteTitle = config.siteTitle || 'maxkl.de';

		return config;
	} catch(e) {
		throw new Error('Failed to read config file:', e);
	}
};
