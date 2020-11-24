'use strict';

const { describe, it, before } = require('mocha');
const assert = require('assert');
const { Types } = require('./types');
const TypeFactory = require('./typeFactory');

describe('typeFactory create', () => {

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

	it('should new Fee', function () {
		const fee1 = new Fee(new Coin(Types.String, Types.String), Types.Int64);

		const fee2 = new Fee();

		assert.deepStrictEqual(fee1, fee2);
	});
});
