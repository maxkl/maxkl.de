/**
 * Copyright: (c) 2015-2018 Max Klein
 * License: MIT
 */

module.exports = function (file) {
    try {
        var config = require(file);

        config.port = config.port || 8080;
        config.dbUrl = config.dbUrl || 'mongodb://localhost/';
        config.sessionSecret = config.sessionSecret || "This is NOT a secure secret!";

        return config;
    } catch(e) {
        throw new Error('Failed to read config file:', e);
    }
};
