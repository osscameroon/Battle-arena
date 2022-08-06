import webpack from "webpack";
import HtmlWebpackPlugin from "html-webpack-plugin";
import { CleanWebpackPlugin } from "clean-webpack-plugin";

export default {
  mode: "development",
  devtool: "eval-source-map",
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader"
        }
      },
      {
        test: [/\.vert$/, /\.frag$/],
        use: "raw-loader"
      },
      {
        test: /\.(gif|png|jpe?g|svg|xml|cur|mp3)$/i,
        use: "file-loader"
      }
    ]
  },
  entry: {
    app: ["./src/index.js"]
  },
  plugins: [
    new CleanWebpackPlugin({
      root: "./client/public"
    }),
    new webpack.DefinePlugin({
      CANVAS_RENDERER: JSON.stringify(true),
      WEBGL_RENDERER: JSON.stringify(true)
    }),
    new HtmlWebpackPlugin({
      template: "./src/index.html"
    })
  ]
};
