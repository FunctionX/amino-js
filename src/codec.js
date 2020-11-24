'use strict';

const RegisteredType = require('./registeredType');
const Reflection = require('./reflect');
const BinaryEncoder = require('./binaryEncoder');
const BinaryDecoder = require('./binaryDecoder');
const JsonEncoder = require('./jsonEncoder');
const JsonDecoder = require('./jsonDecoder');
const Encoder = require('./encoder');
const Decoder = require('./decoder');
const Utils = require('./utils');

class FieldOptions {
	constructor(opts = {}) {
		this.jsonName = opts.jsonName || '';
		this.jsonOmitEmpty = opts.jsonOmitEmpty || '';
		this.binFixed64 = opts.binFixed64 || false; // (Binary) Encode as fixed64
		this.binFixed32 = opts.binFixed32 || false; // (Binary) Encode as fixed32
		this.unsafe = opts.unsafe || false; // e.g. if this field is a float.
		this.writeEmpty = opts.writeEmpty || false; // write empty structs and lists (default false except for pointers)
		this.emptyElements = opts.emptyElements || false; // Slice and Array elements are never nil, decode 0x00 as empty struct.
	}
}

class Codec {
	constructor() {
		this.types = new Map();
	}

	lookup(typeName) {
		return this.types.get(typeName);
	}

	registerConcrete(instance, name) {
		const typeName = Reflection.typeOf(instance);
		if (this.lookup(typeName)) {
			throw new Error(`${typeName} was registered`);
		}
		instance.info = new RegisteredType(name);
		this.types.set(typeName, instance.info);
	}

	marshalJson(obj) {
		if (!obj) return null;

		const typeInfo = this.lookup(Reflection.typeOf(obj));
		let serializedObj = JsonEncoder.encodeJson(obj, obj.type);
		// if this object was registered with prefix
		if (typeInfo && typeInfo.name) {
			serializedObj = {
				type: typeInfo.name,
				value: serializedObj,
			};
		}
		return Utils.jsonSortByKey(serializedObj);
	}

	unmarshalJson(deserializedObj, instance) {
		const typeName = Reflection.typeOf(instance);
		if (!this.lookup(typeName)) {
			throw new Error(`No ${typeName} was registered`);
		}
		const typeInfo = this.lookup(Reflection.typeOf(instance));
		if (typeInfo && typeInfo.name) {
			if (deserializedObj.type !== typeInfo.name) {
				throw new Error(`Type not match. expected: ${typeInfo.name}, but: ${deserializedObj.type}`);
			}
			deserializedObj = deserializedObj.value;
		}
		JsonDecoder.decodeJson(deserializedObj, instance);
	}

	marshalBinary(instance, fieldOpts = new FieldOptions()) {
		if (!instance) return null;

		let encodedData = BinaryEncoder.encodeBinary(instance, instance.type, fieldOpts);
		// if this instance was registered with prefix
		if (instance.info && instance.info.registered) {
			encodedData = instance.info.prefix.concat(encodedData);
		}

		const lenBz = Encoder.encodeUVarint(encodedData.length);
		return lenBz.concat(encodedData);
	}

	unmarshalBinary(bz, instance, fieldOpts = new FieldOptions()) {
		if (bz.length === 0) throw new RangeError('UnmarshalBinary cannot decode empty bytes');
		if (!instance) throw new TypeError('UnmarshalBinary cannot decode to Null instance');

		const typeName = Reflection.typeOf(instance);
		const typeInfo = this.lookup(typeName);
		if (!typeInfo) throw new TypeError(`No ${typeName} was registered`);

		const { data, byteLength } = Decoder.decodeUVarint(bz);
		let realBz = bz.slice(byteLength);

		if (data !== realBz.length) throw new RangeError('Wrong length of Encoded Buffer');
		if (!Utils.isEqual(realBz.slice(0, 4), typeInfo.prefix)) {
			throw new TypeError('prefix not match');
		}
		realBz = bz.slice(byteLength + 4);
		BinaryDecoder.decodeBinary(realBz, instance, instance.type, fieldOpts, true);
	}
}

module.exports = {
	Codec,
	FieldOptions,
};
