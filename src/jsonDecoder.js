'use strict';

const Reflection = require('./reflect');
const { Types } = require('./types');
const bech32 = require('bech32');

const decodeJson = (value, instance) => {
	Reflection.ownKeys(instance).forEach((key, idx) => {
		const type = instance.lookup(key);
		instance[key] = decodeJsonField(value[key], idx, type, instance[key]);
	});
};

const decodeJsonField = (value, idx, type, instance) => {
	switch (type) {
		case Types.Int8:
		case Types.Int16:
		case Types.Int32:
		case Types.Int64: {
			return parseInt(value);
		}
		// TODO Boolean Time
		case Types.Hex: {
			return decodeJsonHex(value);
		}
		case Types.Address: {
			return decodeJsonAddress(value);
		}
		case Types.ByteSlice: {
			return decodeJsonSlice(value);
		}
		case Types.String: {
			return value;
		}
		case Types.Struct: {
			return decodeJsonStruct(value, instance);
		}
		case Types.ArrayStruct: {
			return decodeJsonArray(value, instance, Types.ArrayStruct);
		}
		case Types.Interface: {
			return decodeJsonInterface(value, instance);
		}
		case Types.ArrayInterface: {
			return decodeJsonArray(value, instance, Types.ArrayInterface);
		}
		default: {
			throw new Error('There is no data type to decode:' + type);
		}
	}
};

const decodeJsonHex = value => {
	if (value.startsWith('0x')) {
		return Array.from(Buffer.from(value.slice(2), 'hex'));
	}
	return Array.from(Buffer.from(value, 'hex'));
};

const decodeJsonAddress = value => {
	return bech32.fromWords(bech32.decode(value).words);
};

const decodeJsonSlice = value => {
	return Array.from(Buffer.from(value, 'base64'));
};

const decodeJsonStruct = (value, instance) => {
	Reflection.ownKeys(instance).forEach((key, idx) => {
		const type = instance.lookup(key);
		instance[key] = decodeJsonField(value[key], idx, type, instance[key]);
	});
	return instance;
};

const decodeJsonInterface = (value, instance) => {
	const keys = Reflection.ownKeys(instance);
	if (keys.length === 1) {
		decodeJson({ [keys[0]]: value.value }, instance);
		return instance;
	}
	decodeJson(value.value, instance);
	return instance;
};

const decodeJsonArray = (value, instance, arrayType) => {
	let result = [];
	const withPrefix = arrayType === Types.ArrayInterface;
	for (let i = 0; i < value.length; i++) {
		decodeJson(withPrefix ? value[i].value : value[i], instance);
		result = result.concat(instance);
	}
	return result;
};

module.exports = {
	decodeJson,
};
