'use strict';

const Types = {
	Int8: Symbol('Int8'),
	Int16: Symbol('Int16'),
	Int32: Symbol('Int32'),
	Int64: Symbol('Int64'),
	Boolean: Symbol('Boolean'),
	Time: Symbol('Time'),
	Hex: Symbol('Hex'),
	Address: Symbol('Address'),
	ByteSlice: Symbol('ByteSlice'),
	String: Symbol('String'),
	Struct: Symbol('Struct'),
	ArrayStruct: Symbol('ArrayStruct'),
	Interface: Symbol('Interface'),
	ArrayInterface: Symbol('ArrayInterface'),

};

// reference : https://developers.google.com/protocol-buffers/docs/encoding
const WireType = {
	Varint: 0, // int32, int64, uint32, uint64, sint32, sint64, bool, enum
	Type8Byte: 1, // fixed64, sfixed64, double
	ByteLength: 2, // string, bytes, embedded messages, packed repeated fields
	Type4Byte: 5, // fixed32, sfixed32, float
};

const WireMap = {
	[Types.Int8]: WireType.Varint,
	[Types.Int16]: WireType.Varint,
	[Types.Int32]: WireType.Varint,
	[Types.Int64]: WireType.Varint,
	[Types.Boolean]: WireType.Varint,
	[Types.Time]: WireType.Varint,
	[Types.Hex]: WireType.ByteLength,
	[Types.Address]: WireType.ByteLength,
	[Types.ByteSlice]: WireType.ByteLength,
	[Types.String]: WireType.ByteLength,
	[Types.Struct]: WireType.ByteLength,
	[Types.ArrayStruct]: WireType.ByteLength,
	[Types.Interface]: WireType.ByteLength,
	[Types.ArrayInterface]: WireType.ByteLength,
};

WireType.keysOf = types => {
	Object.keys(WireType).forEach(key => {
		if (WireType[key] === types) {
			return key;
		}
	});
};

WireMap.keysOf = wireType => {
	Object.keys(WireMap).forEach(key => {
		if (WireMap[key] === wireType) {
			return key;
		}
	});
};

module.exports = {
	Types,
	WireType,
	WireMap,
};
