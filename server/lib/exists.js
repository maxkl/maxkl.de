/**
 * Copyright: (c) 2016-2018 Max Klein
 * License: MIT
 */

var fs = require("fs");

module.exports = exports = exists;

function exists(path) {
    try {
        fs.statSync(path);
        return true;
    } catch(e) {
        return false;
    }
}

exports.l = function lexists(path) {
    try {
        fs.lstatSync(path);
        return true;
    } catch(e) {
        return false;
    }
};

exports.file = function fileExists(path) {
    try {
        return fs.statSync(path).isFile();
    } catch(e) {
        return false;
    }
};

exports.lfile = function lfileExists(path) {
    try {
        return fs.lstatSync(path).isFile();
    } catch(e) {
        return false;
    }
};

exports.dir = function directoryExists(path) {
    try {
        return fs.statSync(path).isDirectory();
    } catch(e) {
        return false;
    }
};

exports.ldir = function ldirectoryExists(path) {
    try {
        return fs.lstatSync(path).isDirectory();
    } catch(e) {
        return false;
    }
};
