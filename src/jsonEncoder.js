'use strict';

const Reflection = require('./reflect');
const { Types } = require('./types');
const bech32 = require('bech32');

const encodeJson = (instance, type) => {
	// retrieve the single property of the Registered AminoType
	if (type !== Types.Struct && type !== Types.Interface && type !== Types.Array) {
		// only get the first property with type != Struct
		const keys = Reflection.ownKeys(instance);
		// type of AminoType class with single property
		if (keys.length > 0) {
			const aminoType = instance.lookup(keys[0]);
			if (type !== aminoType) {
				throw new TypeError('Amino type does not match:' + aminoType.toString());
			}
			instance = instance[keys[0]];
		}
	}

	switch (type) {
		// fall-through
		case Types.Int8:
		case Types.Int16: {
			return instance;
		}
		case Types.Int32:
		case Types.Int64: {
			// https://github.com/tendermint/go-amino/blob/v0.14.1/json-encode.go#L99
			// TODO: In go-amino, (u)int64 is encoded by string, because some languages like JS can't handle (u)int64
			// So, It seemed that it is necessary to decode (u)int64 to library like bignumber.js?
			return instance.toString();
		}
		// TODO Boolean Time
		case Types.Hex: {
			return encodeJsonHex(instance);
		}
		case Types.Address: {
			return encodeJsonAddress(instance);
		}
		case Types.ByteSlice: {
			return encodeJsonSlice(instance);
		}
		case Types.String: {
			return instance;
		}
		case Types.Struct: {
			return encodeJsonStruct(instance);
		}
		case Types.ArrayStruct: {
			return encodeJsonArray(instance, Types.ArrayStruct);
		}
		case Types.Interface: {
			return encodeJsonInterface(instance);
		}
		case Types.ArrayInterface: {
			return encodeJsonArray(instance, Types.ArrayInterface);
		}
		default: {
			throw new Error('EncodeJSON: There is no data type to encode:' + type);
		}
	}
};

const encodeJsonHex = instance => {
	return '0x' + Buffer.from(instance).toString('hex');
};

const encodeJsonAddress = instance => {
	return bech32.encode(process.env.BECH32_PREFIX, bech32.toWords(instance));
};

const encodeJsonSlice = instance => {
	return Buffer.from(instance).toString('base64');
};

const encodeJsonField = (instance, type) => {
	if (type === Types.Array) {
		return encodeJsonArray(instance);
	} else {
		return encodeJson(instance, type);
	}
};

const encodeJsonStruct = instance => {
	const result = {};
	Reflection.ownKeys(instance).forEach(key => {
		const type = instance.lookup(key);
		result[key] = encodeJsonField(instance[key], type);
	});
	return result;
};

const encodeJsonInterface = instance => {
	const value = encodeJson(instance, instance.type);
	const type = instance.info.name;
	return { type: type, value: value };
};

const encodeJsonArray = (instance, arrayType) => {
	let result = [];
	const withPrefix = arrayType === Types.ArrayInterface;

	for (let i = 0; i < instance.length; ++i) {
		const item = instance[i];

		let type = item.type;
		if (withPrefix) {
			type = Types.Interface;
		}
		const data = encodeJson(item, type);
		if (data) {
			result = result.concat(data);
		}
	}

	return result;
};

module.exports = {
	encodeJson,
};
