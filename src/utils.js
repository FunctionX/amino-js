'use strict';

const jsonSortByKey = obj => {
	if (obj === null || typeof obj !== 'object') return obj;
	if (Array.isArray(obj)) return obj.map(jsonSortByKey);
	const result = {};
	Object.keys(obj)
		.sort()
		.forEach(key => {
			result[key] = jsonSortByKey(obj[key]);
		});
	return result;
};

const getHash256 = input => {
	const sha256 = require('js-sha256');
	const hash2 = sha256.update(input);
	return hash2.array();
};

const isEqual = (value, other) => {
	// Get the value type
	const type = Object.prototype.toString.call(value);

	// If the two objects are not the same type, return false
	if (type !== Object.prototype.toString.call(other)) return false;

	// If items are not an object or array, return false
	if (['[object Array]', '[object Object]'].indexOf(type) < 0) return false;

	// Compare the length of the length of the two items
	const valueLen = type === '[object Array]' ? value.length : Object.keys(value).length;
	const otherLen = type === '[object Array]' ? other.length : Object.keys(other).length;
	if (valueLen !== otherLen) return false;

	// Compare two items
	const compare = function(item1, item2) {
		// Get the object type
		const itemType = Object.prototype.toString.call(item1);

		// If an object or array, compare recursively
		if (['[object Array]', '[object Object]'].indexOf(itemType) >= 0) {
			if (!isEqual(item1, item2)) return false;
		}

		// Otherwise, do a simple comparison
		else {
			// If the two items are not the same type, return false
			if (itemType !== Object.prototype.toString.call(item2)) return false;

			// Else if it's a function, convert to a string and compare
			// Otherwise, just compare
			if (itemType === '[object Function]') {
				if (item1.toString() !== item2.toString()) return false;
			} else {
				if (item1 !== item2) return false;
			}
		}
	};

	// Compare properties
	if (type === '[object Array]') {
		for (let i = 0; i < valueLen; i++) {
			if (compare(value[i], other[i]) === false) return false;
		}
	} else {
		for (const key in value) {
			if (value.hasOwnProperty(key)) {
				if (compare(value[key], other[key]) === false) return false;
			}
		}
	}

	// If nothing failed, return true
	return true;
};

// extension for Number global type
Number.MaxInt8 = (1 << 7) - 1;
Number.MaxInt16 = (1 << 15) - 1;

const MinSecond = -62135596800; // seconds of 01-01-0001
const MaxSecond = 253402300800; // seconds of 10000-01-01
const MaxNano = 999999999; // nanos have to be in interval: [0, 999999999]

module.exports = {
	jsonSortByKey,
	getHash256,
	isEqual,
	MinSecond,
	MaxSecond,
	MaxNano,
};
