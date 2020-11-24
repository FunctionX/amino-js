'use strict';

const Reflection = require('./reflect');
const Encoder = require('./encoder');
const { Types, WireMap } = require('./types');

const compositionTypes = [Types.Struct, Types.Interface, Types.ArrayStruct, Types.Interface];

const encodeBinary = (instance, type, opts, isBare = true) => {
	/*
  This condition checking is for the type is not compositionTypes but wants to encode
  Example:
  let PubSecp256k1 = TypeFactory.create('PubSecp256k1', [{
           name: "bytes",
           type: Types.ByteSlice
           }],Types.ByteSlice) -> encode single property not compositionTypes
  */
	if (!compositionTypes.includes(type)) {
		// if type is not composite
		const keys = Reflection.ownKeys(instance);
		if (keys.length > 1) {
			throw new Error(`${instance} should have only one property`);
		}
		if (keys.length > 0) {
			// type of AminoType class with single property
			const aminoType = instance.lookup(keys[0]);
			if (type !== aminoType)
				throw new TypeError(`Amino type does not match. Expect:${aminoType} but got:${type}`);
			instance = instance[keys[0]]; // get that single property
		}
	}

	switch (type) {
		case Types.Int8:
		case Types.Int16: {
			return Encoder.encodeSignedVarint(instance);
		}
		case Types.Int32: {
			if (opts.binFixed32) {
				return Encoder.encodeInt32(instance);
			} else {
				return Encoder.encodeUVarint(instance);
			}
		}
		case Types.Int64: {
			if (opts.binFixed64) {
				return Encoder.encodeInt64(instance);
			} else {
				return Encoder.encodeUVarint(instance);
			}
		}
		case Types.Boolean: {
			return Encoder.encodeBoolean(instance);
		}
		case Types.Time: {
			return encodeTime(instance, isBare);
		}
		case Types.Hex:
		case Types.Address:
		case Types.ByteSlice: {
			return Encoder.encodeSlice(instance);
		}
		case Types.String: {
			return Encoder.encodeString(instance);
		}
		case Types.Struct: {
			return encodeBinaryStruct(instance, opts, isBare);
		}
		case Types.ArrayStruct: {
			return encodeBinaryArray(instance, Types.ArrayStruct, opts, isBare);
		}
		case Types.Interface: {
			return encodeBinaryInterface(instance, opts, isBare);
		}
		case Types.ArrayInterface: {
			return encodeBinaryArray(instance, Types.ArrayInterface, opts, isBare);
		}
		default: {
			throw new Error('EncodeBinary: There is no data type to encode:' + type);
		}
	}
};

const encodeBinaryField = (typeInstance, idx, type, opts) => {
	let encodeData;
	if (type === Types.ArrayStruct || type === Types.ArrayInterface) {
		encodeData = encodeBinaryArray(typeInstance, type, opts, true, idx);
	} else if (type === Types.Time) {
		encodeData = encodeTime(typeInstance, idx, opts, false);
	} else {
		encodeData = encodeBinary(typeInstance, type, opts, false);
		if (encodeData === [0]) return [];
		const encodeField = Encoder.encodeFieldNumberAndType(idx + 1, WireMap[type]);
		encodeData = encodeField.concat(encodeData);
	}
	return encodeData;
};


const encodeBinaryStruct = (instance, opts, isBare = true) => {
	let result = [];
	Reflection.ownKeys(instance).forEach((key, idx) => {
		const type = instance.lookup(key);
		const encodeData = encodeBinaryField(instance[key], idx, type, opts);
		if (encodeData) {
			result = result.concat(encodeData);
		}
	});
	if (!isBare) {
		result = Encoder.encodeUVarint(result.length).concat(result);
	}
	return result;
};

const encodeBinaryInterface = (instance, opts, isBare) => {
	let data = encodeBinary(instance, instance.type, opts, true);
	data = instance.info.prefix.concat(data);
	if (!isBare) {
		data = Encoder.encodeUVarint(data.length).concat(data);
	}
	return data;
};

const encodeBinaryArray = (instance, arrayType, opts, isBare = true, idx = 0) => {
	let result = [];

	for (let i = 0; i < instance.length; ++i) {
		const item = instance[i];
		const encodeField = Encoder.encodeFieldNumberAndType(idx + 1, WireMap[Types.ArrayStruct]);
		const itemType = arrayType === Types.ArrayInterface ? Types.Interface : Types.Struct;
		let data = encodeBinary(item, itemType, opts, false);
		if (data) {
			data = encodeField.concat(data);
			result = result.concat(data);
		}
	}
	if (!isBare) {
		result = Encoder.encodeUVarint(result.length).concat(result);
	}
	return result;
};

const encodeTime = (time, idx, opts, isBare) => {
	let result = [];
	const encodeData = Encoder.encodeTime(time);
	result = result.concat(encodeData);

	if (!isBare) {
		result = Encoder.encodeUVarint(result.length).concat(result);
	}
	const encodeField = Encoder.encodeFieldNumberAndType(idx + 1, WireMap[Types.Struct]); // notice: use Types.Struct -> Time is a special of Struct
	result = encodeField.concat(result);
	return result;
};

module.exports = {
	encodeBinary,
};
