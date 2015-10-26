
var fs = require("fs"),
	path = require("path");
var express = require("express"),
	serveStatic = require("serve-static");
var readConfig = require("./lib/readConfig");

require("marko/node-require").install();

var config = readConfig("./config.json", __dirname),
	subpageDir = path.resolve("subpages");

var app = express();

var dirs = fs.readdirSync(subpageDir);

dirs.forEach(function (file) {
	var name = file;
	file = path.resolve(subpageDir, file);
	
	if(!fs.lstatSync(file).isDirectory()) return;
	
	console.log(name, file);
	
	var publicDir = path.join(file, "public"),
		//viewsDir = path.join(file, "views"),
		indexFile = path.join(file, "index.js"),
		route = "/" + name;
	
	//var render = function () { throw new Error("No views directory"); };
	
	try {
		// throws an error if publicDir does not exist
		stat = fs.lstatSync(publicDir);
		
		// We can only serve from a directory
		if(stat.isDirectory()) {
			app.use(route, serveStatic(publicDir));
			console.log(name, "static", publicDir);
		}
	} catch(e) {
		// Ignore (publicDir does not exist or is not a directory)
	}
	
	/*try {
		// throws an error if viewsDir does not exist
		stat = fs.lstatSync(viewsDir);
		
		// We can only serve from a directory
		if(stat.isDirectory()) {
			app.use(route, serveStatic(publicDir));
		}
	} catch(e) {
		// Ignore (viewsDir does not exist or is not a directory)
	}*/
	
	try {
		// require() throws an error if the file does not exist or can not be read
		var createRouter = require(indexFile);
		
		// This throws an error if createRouter is not a function
		app.use(route, createRouter(express)); // TODO: params
		console.log(name, "index.js", indexFile);
	} catch(e) {
		// Ignore (The subpage has no custom logic)
		console.error(e);
	}
	
	// http://stackoverflow.com/q/33334080/3593126
});

app.listen(8080);
