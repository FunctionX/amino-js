const path = require('path');

module.exports = {
	mode: 'production',
	entry: {
		aminojs: './src/index.js'
	},
	output: {
		filename: './[name].js',
		path: path.resolve(__dirname),
		library: ['[name]'],
		libraryTarget: 'umd',
	},
};
