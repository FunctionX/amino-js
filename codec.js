'use strict';

const bech32 = require('bech32');
const { Codec } = require('./src');
const types = require('./types');
const {
	StdTx, MsgSend, PubKeySecp256k1,
	Fee, Coin, Signature,
	MsgEthBridgeBurn,
} = types

const codec = new Codec();
codec.registerConcrete(new StdTx(), 'cosmos-sdk/StdTx');
codec.registerConcrete(new PubKeySecp256k1(), 'tendermint/PubKeySecp256k1');
codec.registerConcrete(new MsgSend(), 'cosmos-sdk/MsgSend');
codec.registerConcrete(new MsgEthBridgeBurn(), 'ethbridge/MsgBurn');

function newStdTxFromJson(obj, msgInstance) {
	const feeAmount = obj.fee.amount.reduce((pre, cur) => {
		return pre.concat(new Coin(cur.denom, cur.amount));
	}, []);
	const fee = new Fee(feeAmount, obj.fee.gas);
	const signs = obj.signatures.reduce((pre, cur) => {
		const pubKey = new PubKeySecp256k1(Array.from(Buffer.from(cur.pub_key.value, 'base64')));
		return pre.concat(new Signature(pubKey, Array.from(Buffer.from(cur.signature, 'base64'))));
	}, []);
	const msgs =
		msgInstance ||
		obj.msg.reduce((pre, { value }) => {
			const sendAmount = value.amount.reduce((pre, cur) => {
				return pre.concat(new Coin(cur.denom, cur.amount));
			}, []);
			return pre.concat(
				new MsgSend(
					bech32.fromWords(bech32.decode(value.from_address).words),
					bech32.fromWords(bech32.decode(value.to_address).words),
					sendAmount
				)
			);
		}, []);
	return new StdTx(msgs, fee, signs, obj.memo);
}

function marshalBinary(obj) {
	return codec.marshalBinary(obj);
}

function unmarshalStdTxBinary(data, msgInstance) {
	const stdTx = new StdTx(msgInstance || new types.MsgSend());
	codec.unmarshalBinary(data, stdTx);
	return stdTx;
}

function marshalJson(obj) {
	return codec.marshalJson(obj);
}

function unmarshalStdTxJson(data, msgInstance) {
	const stdTx = new StdTx(msgInstance || new types.MsgSend());
	codec.unmarshalJson(data, stdTx);
	return stdTx;
}

module.exports = {
	newStdTxFromJson,
	marshalBinary,
	unmarshalStdTxBinary,
	marshalJson,
	unmarshalStdTxJson,
};
