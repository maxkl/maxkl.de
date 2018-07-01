/**
 * Copyright: (c) 2015-2018 Max Klein
 * License: MIT
 */

const crypto = require('crypto');

const DEFAULT_SALT_LENGTH = 64;
const DEFAULT_ITERATIONS = 50000;
const DEFAULT_KEY_LENGTH = 512;
const DEFAULT_HASH_DIGEST = 'sha512';

const DEFAULT_USER_LEVEL = 0;

/**
 * Create a salt
 * @param {int} len
 * @return {Buffer}
 */
function createSalt(len) {
    return crypto.randomBytes(len);
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
        return key.toString('base64') === stored.key;
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
            return db.collection('users').createIndex({ expireAt: 1 }, { expireAfterSeconds: 0 }).then(resolve, reject);
        }

        // Ignore any errors while dropping the index
        db.collection('users').dropIndex({ expireAt: 1 }).then(createIndex, createIndex);
    });
}

/**
 * Find a user by his email in the database
 * @param db
 * @param email
 * @return {Promise}
 */
function findUser(db, email) {
    return db.collection('users').findOne({
        email: email
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
    return db.collection('users').insertOne({
        email: email,
        name: name,
        password: {
            key: key.toString('base64'),
            salt: salt,
            iterations: iterations,
            keyLength: keyLength,
            hashDigest: hashDigest
        }
    });
}

class User {
    static install(options) {
        if(!options)
            options = {};

        const db = options.db;

        return function userMiddleware(req, res, next) {
            req.user = new User(req, db);
            next();
        };
    }

    static requireSignedIn(redirect, minLevel) {
        return function requireSignedInMiddleware(req, res, next) {
            if(req.user.signedIn) {
                if(typeof minLevel !== 'undefined') {
                    if(req.user.level >= minLevel) {
                        next();
                    } else {
                        res.status(403).type('text/plain');
                        res.end('You do not have sufficient permissions to access this page');
                    }
                } else {
                    next();
                }
                return;
            }

            if(redirect === false) {
                res.status(403).type('text/plain');
                res.end('You must be signed in to view this page');
            } else if(redirect) {
                res.redirect(redirect);
            } else {
                res.redirect('/login?ret=' + encodeURIComponent(req.originalUrl));
            }
        };
    }

    static requireNotSignedIn(redirect) {
        return function requireNotSignedInMiddleware(req, res, next) {
            if(!req.user.signedIn) {
                next();
                return;
            }

            if(redirect === false) {
                res.status(403).type('text/plain');
                res.end('You must not be signed in to view this page');
            } else if(redirect) {
                res.redirect(redirect);
            } else {
                res.redirect(req.query['ret'] || req.headers['referer'] || '/');
            }
        };
    }

    constructor(req, db) {
        if(!req.session)
            throw new Error('User requires req.session');

        this._req = req;
        this._sess = req.session;
        this._db = db;

        this.signedIn = !!this._sess.user_id;
        this.id = this.signedIn ? this._sess.user_id : null;
        this.email = this.signedIn ? this._sess.user_email : null;
        this.name = this.signedIn ? this._sess.user_name : null;
        this.level = this.signedIn ? this._sess.user_level : DEFAULT_USER_LEVEL;
    }

    signIn(email, password) {
        const self = this;

        return findUser(this._db, email).then(function (doc) {
            if(!doc)
                return false;

            return checkPassword(password, doc.password).then(function (matches) {
                if(matches) {
                    self._sess.user_id = self.id = doc._id.toString();
                    self._sess.user_email = self.email = email;
                    self._sess.user_name = self.name = doc.name || null;
                    self._sess.user_level = self.level = doc.hasOwnProperty('level') ? doc.level : DEFAULT_USER_LEVEL;
                    self.signedIn = true;
                }

                return matches;
            });
        });
    }

    signOut() {
        this._sess.user_id = this.id = null;
        this._sess.user_email = this.email = null;
        this._sess.user_name = this.name = null;
        this.signedIn = false;
    }

    register(email, name, password) {
        const self = this;

        return findUser(this._db, email).then(function (doc) {
            if(doc)
                return false;

            const salt = createSalt(DEFAULT_SALT_LENGTH).toString('base64');
            const iterations = DEFAULT_ITERATIONS;
            const keyLength = DEFAULT_KEY_LENGTH;
            const hashDigest = DEFAULT_HASH_DIGEST;

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
    }
}

module.exports = User;
