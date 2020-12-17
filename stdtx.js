'use strict';

const codec = require('./codec');
const { jsonSortByKey } = require('./src/utils');

class StdTx {
	constructor(msg, fee, signatures, memo) {
		this.msg = msg;
		this.fee = fee;
		this.signatures = signatures;
		this.memo = memo;
	}

	toAmino(msgInstance) {
		const stdTxData = { type: 'cosmos-sdk/StdTx', value: this }
		return codec.unmarshalStdTxJson(stdTxData, msgInstance);
	}

	marshalBinary(msgInstance) {
		return codec.marshalBinary(this.toAmino(msgInstance));
	}

	sortByKey() {
		return jsonSortByKey(this);
	}

}

module.exports = StdTx;
