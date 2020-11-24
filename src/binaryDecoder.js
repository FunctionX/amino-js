'use strict';

const Reflection = require('./reflect');
const Decoder = require('./decoder');
const Utils = require('./utils');
const { Types } = require('./types');

const decodeBinary = (bz, instance, type, opts, isBare, idx = 0) => {
	switch (type) {
		case Types.Int8: {
			return Decoder.decodeInt8(bz);
		}
		case Types.Int16: {
			return Decoder.decodeInt16(bz);
		}
		case Types.Int32:
		case Types.Int64: {
			return Decoder.decodeInt64(bz);
		}
		// TODO Boolean Time
		case Types.Hex:
		case Types.Address: {
			return Decoder.decodeTypeSlice(bz);
		}
		case Types.ByteSlice: {
			return Decoder.decodeSlice(bz);
		}
		case Types.String: {
			return Decoder.decodeString(bz);
		}
		case Types.Struct: {
			return decodeBinaryStruct(bz, instance, opts, isBare);
		}
		case Types.ArrayStruct: {
			return decodeBinaryArray(bz, Types.ArrayStruct, instance, opts, isBare, idx);
		}
		case Types.Interface: {
			return decodeInterface(bz, instance, instance.type, opts, isBare);
		}
		case Types.ArrayInterface: {
			return decodeBinaryArray(bz, Types.ArrayInterface, instance, opts, isBare, idx);
		}
		default: {
			throw new Error('There is no data type to decode:' + type);
		}
	}
};

const decodeBinaryStruct = (bz, instance, opts, isBare) => {
	let totalLength = 0;

	if (!isBare) {
		// Read byte-length prefixed byteslice.
		const prefixSlice = Decoder.decodeUVarint(bz);
		// console.debug('decodeBinaryStruct decodeUVarint', prefixSlice);
		bz = bz.slice(prefixSlice.byteLength);
		if (bz.length < prefixSlice.data) {
			throw new RangeError('Wrong length prefix for Struct');
		}
		totalLength += prefixSlice.byteLength;
	}

	Reflection.ownKeys(instance).forEach((key, idx) => {
		const type = instance.lookup(key);
		// console.debug('decodeBinaryStruct', key, type, bz.toString());

		if (type === Types.Interface || type === Types.ByteSlice) {
			const decodedFieldType = Decoder.decodeFieldNumberAndType(bz);
			bz = bz.slice(decodedFieldType.byteLength);
		}
		const decodedData = decodeBinary(bz, instance[key], type, opts, isBare, idx);

		instance[key] = decodedData.data;
		totalLength += decodedData.byteLength;
		bz = bz.slice(decodedData.byteLength);
	});

	return {
		data: instance,
		byteLength: totalLength,
	};
};

const decodeBinaryArray = (bz, arrayType, instance, opts, isBare, idx) => {
	let totalLength = 0;
	const items = [];
	if (!isBare) {
		// Read byte-length prefixed byteslice.
		const prefixSlice = Decoder.decodeUVarint(bz);
		// console.debug('decodeBinaryArray decodeUVarint', prefixSlice);
		bz = bz.slice(prefixSlice.byteLength);
		if (bz.length < prefixSlice.data) throw new RangeError('Wrong length prefix for Binary Array');
		totalLength += prefixSlice.byteLength;
	}
	const itemType = arrayType === Types.ArrayInterface ? Types.Interface : Types.Struct;

	while (true) {
		const decodedFieldType = Decoder.decodeFieldNumberAndType(bz);
		if (decodedFieldType.idx !== idx + 1) {
			break;
		}
		bz = bz.slice(decodedFieldType.byteLength);
		// console.debug('decodeBinaryArray', itemType, idx, decodedFieldType);

		const decodedData = decodeBinary(bz, instance, itemType, opts, false);
		bz = bz.slice(decodedData.byteLength);
		items.push(decodedData.data);

		totalLength += decodedFieldType.byteLength;
		totalLength += decodedData.byteLength;
	}

	return {
		data: items,
		byteLength: totalLength,
	};
};

const decodeInterface = (bz, instance, type, opts, isBare) => {
	let totalLength = 0;

	if (!isBare) {
		// Read byte-length prefixed byteslice.
		const prefixSlice = Decoder.decodeUVarint(bz);
		// console.debug('decodeInterface decodeUVarint', prefixSlice);
		bz = bz.slice(prefixSlice.byteLength);
		if (bz.length < prefixSlice.data) throw new RangeError('Wrong length prefix for Interface');
		totalLength += prefixSlice.byteLength;
	}
	// console.debug('decodeInterface', type, isBare);

	const shiftedByte = verifyPrefix(bz, instance);
	if (shiftedByte > 0) bz = bz.slice(shiftedByte);
	totalLength += shiftedByte;

	const decodedData = decodeBinary(bz, instance, type, opts, true);
	totalLength += decodedData.byteLength;

	if (type === Types.ByteSlice) {
		Object.keys(instance).forEach(value => {
			instance[value] = decodedData.data;
		});
		decodedData.data = instance;
	}

	return {
		data: decodedData.data,
		byteLength: totalLength,
	};
};

const verifyPrefix = (bz, instance) => {
	let shiftedPrefixByte = 0;
	if (instance.info) {
		if (instance.info.registered) {
			if (!Utils.isEqual(bz.slice(0, 4), instance.info.prefix)) {
				throw new TypeError('prefix not match');
			}
			shiftedPrefixByte = 4;
		}
	}
	return shiftedPrefixByte;
};

module.exports = {
	decodeBinary,
};
