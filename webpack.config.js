module.exports = {
  // ...其他配置...
  module: {
    rules: [
      // ...其他规则...
      {
        test: /\.ttf$/,
        use: [
          {
            loader: 'url-loader',
            options: {
              // 配置 options
              limit: 10000,
              mimetype: 'application/octet-stream',
              name: 'fonts/[name].[ext]',
            },
          },
        ],
      },
    ],
  },
};