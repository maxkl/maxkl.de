/**
 * Copyright: (c) 2015-2016 Max Klein
 * License: MIT
 */

var crypto = require("crypto");
var mongodb = require("mongodb");

var
	DEFAULT_SALT_LENGTH = 64,
	DEFAULT_ITERATIONS = 50000,
	DEFAULT_KEY_LENGTH = 512,
	DEFAULT_HASH_DIGEST = "sha512";

/**
 * Create a salt
 * @param {int} [len]
 * @return {Buffer}
 */
function createSalt(len) {
	return crypto.randomBytes(len || DEFAULT_SALT_LENGTH);
}

/**
 * Hash a password
 * @param {string} password
 * @param {string} salt
 * @param {int} iterations
 * @param {int} keyLength
 * @param {string} hashDigest
 * @return {Promise}
 */
function hashPassword(password, salt, iterations, keyLength, hashDigest) {
	return new Promise(function (resolve, reject) {
		crypto.pbkdf2(password, salt, iterations, keyLength, hashDigest, function (err, key) {
			if(err) {
				reject(err);
				return;
			}

			resolve(key);
		});
	});
}

/**
 * Check a password against a hash
 * @param {string} password
 * @param stored
 * @param {string} stored.salt
 * @param {int} stored.iterations
 * @param {int} stored.keyLength
 * @param {string} stored.hashDigest
 * @return {Promise}
 */
function checkPassword(password, stored) {
	return hashPassword(
		password,
		stored.salt,
		stored.iterations,
		stored.keyLength,
		stored.hashDigest
	).then(function (key) {
		return key.toString("base64") === stored.key;
	});
}

/**
 * Set the mongodb expiration index
 * @param {Db} db
 * @return {Promise}
 */
function setExpirationIndex(db) {
	return new Promise(function (resolve, reject) {
		function createIndex() {
			return db.collection("users").createIndex({ expireAt: 1 }, { expireAfterSeconds: 0 }).then(resolve, reject);
		}

		// Ignore any errors while dropping the index
		db.collection("users").dropIndex({ expireAt: 1 }).then(createIndex, createIndex);
	});
}

/**
 *
 * @param {*} req
 * @param {Db} db
 * @constructor
 */
function User(req, db) {
	if(!req.session) throw new Error("User requires req.session");

	this._req = req;
	this._sess = req.session;
	this._db = db;

	this.signedIn = !!this._sess.user_id;
	this.id = this.signedIn ? this._sess.user_id : null;
	this.email = this.signedIn ? this._sess.user_email : null;
	this.name = this.signedIn ? this._sess.user_name : null;
}

/**
 * Find a user by his email in the database
 * @param db
 * @param email
 * @return {Promise}
 */
function findUser(db, email) {
	return new Promise(function (resolve, reject) {
		db.collection("users").find({
			email: email
		}).limit(1).next(function (err, doc) {
			if(err) {
				reject(err);
				return;
			}

			resolve(doc);
		});
	});
}

/**
 * Insert a user into the database
 * @param {Db} db
 * @param {string} email
 * @param {string|null} name
 * @param {Buffer} key
 * @param {string} salt
 * @param {int} iterations
 * @param {int} keyLength
 * @param {string} hashDigest
 * @return {Promise}
 */
function storeUser(db, email, name, key, salt, iterations, keyLength, hashDigest) {
	return db.collection("users").insertOne({
		email: email,
		name: name,
		password: {
			key: key.toString("base64"),
			salt: salt,
			iterations: iterations,
			keyLength: keyLength,
			hashDigest: hashDigest
		}
	});
}

/**
 * Sign the user in
 * @param {string} email
 * @param {string} password
 * @return {Promise}
 */
User.prototype.signIn = function signIn(email, password) {
	var self = this;

	return findUser(this._db, email).then(function (doc) {
		if(!doc) return false;

		return checkPassword(password, doc.password).then(function (matches) {
			if(matches) {
				self._sess.user_id = self.id = doc._id.toString();
				self._sess.user_email = self.email = email;
				self._sess.user_name = self.name = doc.name || null;
				self.signedIn = true;
			}

			return matches;
		});
	});
};

/**
 * Sign the user out
 */
User.prototype.signOut = function signOut() {
	this._sess.user_id = this.id = null;
	this._sess.user_email = this.email = null;
	this._sess.user_name = this.name = null;
	this.signedIn = false;
};

/**
 * Register a new user
 * @param {string} email
 * @param {string} name
 * @param {string} password
 * @return {Promise}
 */
User.prototype.register = function register(email, name, password) {
	var self = this;

	return findUser(this._db, email).then(function (doc) {
		if(doc) return false;

		var salt = createSalt().toString("base64"),
			iterations = DEFAULT_ITERATIONS,
			keyLength = DEFAULT_KEY_LENGTH,
			hashDigest = DEFAULT_HASH_DIGEST;

		return hashPassword(
			password,
			salt,
			iterations,
			keyLength,
			hashDigest
		).then(function (key) {
			return storeUser(self._db, email, name, key, salt, iterations, keyLength, hashDigest);
		}).then(function () {
			return true;
		});
	});
};

/**
 * Create a middleware that assigns `req.user`
 * @param options
 * @return {function(req: Object, res: Object, next: function)}
 */
function createMiddleware(options) {
	if(!options) options = {};

	var db = options.db;

	return function middleware(req, res, next) {
		// Don't overwrite
		if(!req.user) {
			req.user = new User(req, db);
		}

		next();
	}
}

/**
 * Create a middleware that redirects/ends the request if the user is not signed in
 * @param {string} [redirect]
 * @return {function(req: Object, res: Object, next: function)}
 */
function requireSignedIn(redirect) {
	var shouldRedirect = !!redirect;

	return function requireSignedInMiddleware(req, res, next) {
		if(!req.user.signedIn) {
			if(shouldRedirect) {
				res.redirect(redirect);
			} else {
				res.status(403).setContentType("text/plain");
				res.end("You must be signed in to view this page");
			}

			return;
		}

		next();
	}
}

/**
 * Create a middleware that redirects/ends the request if the user is signed in
 * @param redirect
 * @return {function(req: Object, res: Object, next: function)}
 */
function requireNotSignedIn(redirect) {
	var shouldRedirect = !!redirect;

	return function requireNotSignedInMiddleware(req, res, next) {
		if(req.user.signedIn) {
			if(shouldRedirect) {
				res.redirect(redirect);
			} else {
				res.status(403).setContentType("text/plain");
				res.end("You must not be signed in to view this page");
			}

			return;
		}

		next();
	}
}

module.exports = exports = createMiddleware;

exports.requireSignedIn = requireSignedIn;
exports.requireNotSignedIn = requireNotSignedIn;
