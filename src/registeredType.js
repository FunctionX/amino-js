'use strict';

const Utils = require('./utils');

const PrefixBytesLen = 4;
const DisambBytesLen = 3;
const DelimiterValue = 0x00;

function calculateDisambAndPrefix(name) {
	let nameHash = Utils.getHash256(name);
	nameHash = dropLeadingZeroByte(nameHash);
	const disamb = nameHash.slice(0, DisambBytesLen);
	nameHash = dropLeadingZeroByte(nameHash.slice(3));
	const prefix = nameHash.slice(0, PrefixBytesLen);
	return { disamb, prefix };
}

function dropLeadingZeroByte(hash) {
	while (hash[0] === DelimiterValue) {
		hash = hash.slice(1);
	}
	return hash;
}

class RegisteredType {
	constructor(name) {
		this.name = name;
		this.registered = true;
		const { disamb, prefix } = calculateDisambAndPrefix(name);
		this.disamb = disamb;
		this.prefix = prefix;
	}

	get disfix() {
		return this.disamb.concat(this.prefix);
	}
}

module.exports = RegisteredType;
