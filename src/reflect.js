'use strict';

const Factory = require('./typeFactory');

const typeOf = instance => {
	if (typeof instance === 'undefined') {
		throw new Error('Undefined Type');
	}
	try {
		return instance.typeName()
	} catch (err) {
		return instance.constructor.name
	}
};

const ownKeys = instance => {
	if (Factory.isExisted(typeOf(instance))) {
		return Object.keys(instance).filter(key => {
			const val = instance.lookup(key);
			return val != null || val !== undefined;
		});
	}
	return [];
};

module.exports = {
	typeOf,
	ownKeys,
};
