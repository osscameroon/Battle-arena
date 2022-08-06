import TerserPlugin from "terser-webpack-plugin";
import merge from "webpack-merge"

export default merge(base, {
  mode: "production",
  entry: "./client/src/index.js",
    output: {
      path: "../client/public/",
      filename: "bundle.min.js"
  },
  devtool: false,
  performance: {
    maxEntrypointSize: 900000,
    maxAssetSize: 900000
  },
  optimization: {
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          output: {
            comments: false
          }
        }
      })
    ]
  }
});
