'use strict';

const varint = require('varint');
const svarint = require('signed-varint');
const Int53 = require('int53');
const Utils = require('./utils');
const { Types, WireMap } = require('./types');

const encodeSignedVarint = input => {
	return svarint.encode(input);
};

const encodeUVarint = input => {
	return varint.encode(input);
};

const encodeInt32 = input => {
	const buffer = new ArrayBuffer(4); // 4 byte
	const view = new DataView(buffer);
	view.setUint32(0, input, true); // little endiant
	return Array.from(new Uint8Array(buffer));
};

const encodeInt64 = input => {
	const buff = Buffer.alloc(8);
	Int53.writeInt64LE(input, buff, 0);
	return Array.from(new Int32Array(buff));
};

const encodeBoolean = input => {
	if (input) return encodeUVarint(1);
	return encodeUVarint(0);
};

const encodeSlice = input => {
	return encodeUVarint(input.length).concat(input.slice());
};

const encodeString = input => {
	return encodeSlice(Array.from(Buffer.from(input)));
};

const encodeTime = time => {
	let data = [];
	const s = time.getTime() / 1000; // get the second

	if (s !== 0) {
		if (s < Utils.MinSecond && s >= Utils.MaxSecond) {
			throw new RangeError(`Second have to be >= ${Utils.MinSecond}, and <: ${Utils.MaxSecond}`);
		}
		const encodeField = encodeFieldNumberAndType(1, WireMap[Types.Time]);
		data = encodeField.concat(encodeUVarint(s));
	}
	return data;
};

const encodeFieldNumberAndType = (num, type) => {
	// reference:https://developers.google.com/protocol-buffers/docs/encoding
	const encodedVal = (num << 3) | type;
	return varint.encode(encodedVal);
};

module.exports = {
	encodeFieldNumberAndType,
	encodeSignedVarint,
	encodeUVarint,
	encodeInt32,
	encodeInt64,
	encodeBoolean,
	encodeTime,
	encodeSlice,
	encodeString,
};
