'use strict';

const uVarint = require('varint');
const sVarint = require('signed-varint');
// const Int53 = require('int53');

const decodeSignedVarint = input => {
	if (!input) {
		throw new TypeError('Can not decodeSignedVarint invalid input');
	}
	if (!input.length) {
		throw new TypeError('Can not decodeSignedVarint invalid input length');
	}
	// console.debug('decodeSignedVarint', sVarint.decode(input));
	return {
		data: sVarint.decode(input),
		byteLength: sVarint.decode.bytes,
	};
};

const decodeUVarint = input => {
	if (!input || !Array.isArray(input)) {
		throw new TypeError('Can not decodeUVarint invalid input');
	}
	if (!input.length) {
		throw new TypeError('Can not decodeUVarint invalid input length');
	}
	return {
		data: uVarint.decode(input, 0),
		byteLength: uVarint.decode.bytes,
	};
};

const decodeInt8 = input => {
	const result = decodeSignedVarint(input);
	if (result.data > Number.MaxInt8) {
		throw new TypeError('EOF decoding int8');
	}
	const int8Buffer = Int8Array.from([result.data]);

	return {
		data: int8Buffer[0],
		byteLength: result.byteLength,
	};
};

const decodeInt16 = input => {
	const result = decodeSignedVarint(input);
	if (result.data > Number.MaxInt16) {
		throw new TypeError('EOF decoding int8');
	}
	const int16Buffer = Int16Array.from([result.data]);

	return {
		data: int16Buffer[0],
		byteLength: result.byteLength,
	};
};


const decodeInt64 = input => {
	const decodedFieldType = decodeFieldNumberAndType(input);
	input = input.slice(decodedFieldType.byteLength);
	// TODO
	// const decoded = decodeUVarint(input);
	// input = input.slice(decoded.byteLength);
	// console.log(decoded, input.toString());
	const { data, byteLength } = decodeUVarint(input.slice(2));
	return {
		data: data,
		byteLength: decodedFieldType.byteLength + 2 + byteLength,
	};
};

const decodeFieldNumberAndType = bz => {
	const { data, byteLength } = decodeUVarint(bz);
	const type = data & 0x07;

	const idx = data >> 3;
	if (idx > (1 << 29) - 1) {
		throw new RangeError(`Invalid Field Num: ${idx}`);
	}

	return {
		type: type,
		idx: idx,
		byteLength: byteLength,
	};
};

const decodeSlice = input => {
	const { data, byteLength } = decodeUVarint(input);
	input = input.slice(byteLength);
	// console.debug('decodeSlice', data, byteLength);

	if (input.length < data) {
		throw new RangeError(`insufficient bytes decoding string of length ${data}`);
	}
	return {
		data: input.slice(0, data),
		byteLength: byteLength + data,
	};
};

const decodeTypeSlice = input => {
	const decodedFieldType = decodeFieldNumberAndType(input);
	const { data, byteLength } = decodeSlice(input.slice(decodedFieldType.byteLength));
	return {
		data: data,
		byteLength: decodedFieldType.byteLength + byteLength,
	};
};

const decodeString = input => {
	const { data, byteLength } = decodeTypeSlice(input)
	return {
		data: Buffer.from(data).toString('utf8'),
		byteLength: byteLength,
	};
};

module.exports = {
	decodeFieldNumberAndType,
	decodeUVarint,
	decodeInt8,
	decodeInt16,
	decodeInt64,
	decodeSlice,
	decodeTypeSlice,
	decodeString,
};
