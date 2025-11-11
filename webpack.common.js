// src/webpack.common.js
// PERBAIKAN: Menghapus plugin yg konflik & menambah loader gambar

const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
// HAPUS: CleanWebpackPlugin (konflik dgn output.clean)
// HAPUS: Workbox & MiniCss (pindah ke prod.js)

module.exports = {
  entry: {
    app: path.resolve(__dirname, 'src/scripts/index.js'),
  },
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'dist'),
    clean: true, // <-- Ini adalah cara modern (menggantikan CleanWebpackPlugin)
    assetModuleFilename: 'assets/[name][ext]',
  },
  module: {
    rules: [
      // PERBAIKAN: Menambahkan loader untuk gambar (Memperbaiki error marker Leaflet)
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        type: 'asset/resource',
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      filename: 'index.html',
      template: path.resolve(__dirname, 'src/index.html'),
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: path.resolve(__dirname, 'src/public/'),
          to: path.resolve(__dirname, 'dist/'),
        },
      ],
    }),
  ],
};