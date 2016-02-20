/**
 * Copyright: (c) 2016 Max Klein
 * License: MIT
 */

const hasOwnProperty = Object.prototype.hasOwnProperty;

/**
 * Merge (only!) object literals
 * @param {Object} target
 * @return {Object}
 */
function merge(target) {
	if(typeof target !== "undefined" && target !== null) {
		for(var i = 1; i < arguments.length; i++) {
			var source = arguments[i];
			if(typeof source !== "undefined" && source !== null) {
				for(var prop in source) {
					if(hasOwnProperty.call(source, prop)) {
						target[prop] = source[prop];
					}
				}
			}
		}
	}

	return target;
}

module.exports = merge;
