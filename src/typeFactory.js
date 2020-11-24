'use strict';

const { Types } = require('./types');

const privTypeMap = Symbol('privateTypeMap');

const aminoTypes = [];

const isExisted = name => {
	return aminoTypes.includes(name);
};

class BaseAminoType {
	constructor() {
		this[privTypeMap] = new Map();
	}

	set(name, type) {
		if (this[privTypeMap].has(name)) throw new RangeError(`property '${name}' existed`);
		this[privTypeMap].set(name, type);
	}

	lookup(name) {
		return this[privTypeMap].get(name);
	}
}

const create = (className, properties, type = Types.Struct) => {
	if (!properties) {
		throw new Error('Type List can not be empty');
	}
	if (!properties.length) {
		throw new Error('Need to provide TypeList');
	}

	/* AminoType */
	const objAmino = {
		[className]: class extends BaseAminoType {
			constructor(...args) {
				super();
				properties.forEach((prop, index) => {
					this.set(prop.name, prop.type);
					if (args[index] !== undefined) {
						this[prop.name] = args[index];
						if (objAmino[className].prototype.defaultMap.get(prop.name) === undefined) {
							objAmino[className].prototype.defaultMap.set(prop.name, args[index]);
						}
					} else {
						this[prop.name] = objAmino[className].prototype.defaultMap.get(prop.name);
					}
				});
			}

			typeName() {
				return className;
			}

			get info() {
				return objAmino[className].prototype.privateInfo;
			}

			set info(_info) {
				objAmino[className].prototype.privateInfo = _info;
			}

			get type() {
				// return objAmino[className].prototype.privateType;
				return type;
			}
		},
	};

	aminoTypes.push(className);
	objAmino[className].prototype.defaultMap = new Map()
	objAmino[className].prototype.privateInfo = null;
	// objAmino[className].prototype.privateType = type;
	return objAmino[className];
};

module.exports = {
	create,
	isExisted,
};
