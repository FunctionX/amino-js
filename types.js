'use strict';

const {TypeFactory, Types} = require('./src');

const Fee = TypeFactory.create('Fee', [
    {
        name: 'amount',
        type: Types.ArrayStruct,
    },
    {
        name: 'gas',
        type: Types.Int64,
    },
]);

const Coin = TypeFactory.create('Coin', [
    {
        name: 'denom',
        type: Types.String,
    },
    {
        name: 'amount',
        type: Types.String,
    },
]);

const PubKeySecp256k1 = TypeFactory.create(
    'PubKeySecp256k1',
    [
        {
            name: 'amino',
            type: Types.ByteSlice,
        },
    ],
    Types.ByteSlice
);

const Signature = TypeFactory.create('Signature', [
    {
        name: 'pub_key',
        type: Types.Interface,
    },
    {
        name: 'signature',
        type: Types.ByteSlice,
    },
]);

const StdTx = TypeFactory.create('StdTx', [
	{
		name: 'msg',
		type: Types.ArrayInterface,
	},
	{
		name: 'fee',
		type: Types.Struct,
	},
	{
		name: 'signatures',
		type: Types.ArrayStruct,
	},
	{
		name: 'memo',
		type: Types.String,
	},
]);

new StdTx(undefined, new Fee(new Coin(Types.String, Types.String), Types.Int64),
	new Signature(new PubKeySecp256k1(Types.ByteSlice), Types.ByteSlice),
	Types.String
);

const MsgSend = TypeFactory.create('MsgSend', [
    {
        name: 'from_address',
        type: Types.Address,
    },
    {
        name: 'to_address',
        type: Types.Address,
    },
    {
        name: 'amount',
        type: Types.ArrayStruct,
    },
]);

new MsgSend(Types.ByteSlice, Types.ByteSlice, new Coin(Types.String, Types.String));

const MsgEthBridgeBurn = TypeFactory.create('MsgEthBridgeBurn', [
    {
        name: 'acc_nonce',
        type: Types.Int64,
    },
    {
        name: 'fx_sender',
        type: Types.Address,
    },
    {
        name: 'amount',
        type: Types.Struct,
    },
    {
        name: 'ethereum_chain_id',
        type: Types.Int32,
    },
    {
        name: 'token_contract',
        type: Types.Hex,
    },
    {
        name: 'ethereum_receiver',
        type: Types.Hex,
    },
]);

new MsgEthBridgeBurn(Types.Int64, Types.Address, new Coin(Types.String, Types.String), Types.Int32, Types.Hex, Types.Hex);

module.exports = {
    StdTx,
    Fee,
    Coin,
    Signature,
    PubKeySecp256k1,
    MsgSend,
    MsgEthBridgeBurn,
};
