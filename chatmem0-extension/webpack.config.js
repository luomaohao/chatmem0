const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
  entry: {
    background: './src/background/index.ts',
    'content/chatgpt': './src/content/chatgpt.ts',
    'content/claude': './src/content/claude.ts',
    'content/yiyan': './src/content/yiyan.ts',
    'content/tongyi': './src/content/tongyi.ts',
    popup: './src/popup/index.ts'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    clean: true
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      },
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, 'css-loader']
      }
    ]
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    alias: {
      '@common': path.resolve(__dirname, 'src/common'),
      '@types': path.resolve(__dirname, 'src/types')
    }
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: 'popup.css'
    }),
    new CopyWebpackPlugin({
      patterns: [
        { from: 'manifest.json', to: 'manifest.json' },
        { from: 'public', to: 'public' },
        { from: 'src/popup/popup.html', to: 'popup.html' }
      ]
    })
  ],
  devtool: 'inline-source-map'
};