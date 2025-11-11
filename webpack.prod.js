const path = require('path');
const common = require('./webpack.common.js');
const { merge } = require('webpack-merge');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const WorkboxWebpackPlugin = require('workbox-webpack-plugin');

const packageJson = require('./package.json');
const homepage = packageJson.homepage;
const publicPath = homepage ? new URL(homepage).pathname : '/';

module.exports = merge(common, {
  mode: 'production',
  output: {
    publicPath: publicPath,
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        include: path.resolve(__dirname, 'src'),
        use: [MiniCssExtractPlugin.loader, 'css-loader'],
      },
      {
        test: /\.css$/,
        include: path.resolve(__dirname, 'node_modules'),
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-env'],
            },
          },
        ],
      },
    ],
  },
  plugins: [
    new MiniCssExtractPlugin(),
    new WorkboxWebpackPlugin.InjectManifest({
      swSrc: path.resolve(__dirname, 'src/sw.js'),
      swDest: 'sw.js',
    }),
  ],
});