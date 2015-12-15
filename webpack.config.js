var path = require('path');
var webpack = require('webpack');

module.exports = {
    entry: './js/index.js',
    output: {
        path: __dirname,
        filename: 'bundle.js'
    },
    module: {
        loaders: [
            {
                test: path.join(__dirname, 'js'),
                loader: "babel-loader",
                query: {
                    presets: ['es2015']
                }
            }
        ]
    }
};
