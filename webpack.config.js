const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
  mode: "development",
  entry: {
    index: "./src/index.tsx",
  },
  module: {
    rules: [
      // 解析 TS
      {
        test: /\.(tsx?|jsx?)$/,
        use: "ts-loader",
        exclude: /(node_modules|tests)/,
      },
      // 解析 CSS
      {
        test: /\.css$/i,
        use: [{ loader: "style-loader" }, { loader: "css-loader" }],
      },
      // 解析 Less
      {
        test: /\.less$/i,
        use: [
          { loader: "style-loader" },
          {
            loader: "css-loader",
            options: {
              modules: {
                mode: (resourcePath) => {
                  if (/pure.css$/i.test(resourcePath)) {
                    return "pure";
                  }
                  if (/global.css$/i.test(resourcePath)) {
                    return "global";
                  }
                  return "local";
                },
              },
            },
          },
          { loader: "less-loader" },
        ],
      },
    ],
  },
  resolve: {
    // 如果不指定后缀名，会尝试按如下顺序解析该文件
    extensions: [".tsx", ".ts", ".js", ".less", "css"],
    // 设置import或require别名
    alias: {
      utils: path.join(__dirname, "src/utils/"),
      components: path.join(__dirname, "src/components/"),
      apis: path.join(__dirname, "src/apis/"),
      hooks: path.join(__dirname, "src/hooks/"),
      store: path.join(__dirname, "src/store/"),
    },
  },
  // 选择一种 source map 风格来增强调试过程。不同的值会明显影响到构建(build)和重新构建(rebuild)的速度。
  devtool: "inline-source-map",
  // 3000 端口打开网页
  devServer: {
    static: { directory: path.join(__dirname, "public") },
    port: 3000,
    hot: true,
  },
  // 默认输出
  output: {
    filename: "index.js",
    path: path.resolve(__dirname, "dist"),
    clean: true,
  },
  // 指定模板 html
  plugins: [
    new HtmlWebpackPlugin({
      template: "./public/index.html",
    }),
  ],
};
