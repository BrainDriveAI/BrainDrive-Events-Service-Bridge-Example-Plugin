const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const { ModuleFederationPlugin } = require("webpack").container;
const deps = require("./package.json").dependencies;

module.exports = {
  mode: "production",
  entry: "./src/index",
  output: {
    path: path.resolve(__dirname, 'dist'),
    publicPath: "auto",
    clean: true,
    library: {
      type: 'var',
      name: 'ServiceExampleEvents'
    }
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        use: {
          loader: "ts-loader",
          options: {
            compilerOptions: {
              declaration: false,
              declarationMap: false,
              sourceMap: false
            }
          }
        },
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: [
          'style-loader',
          'css-loader'
        ]
      }
    ],
  },
  optimization: {
    minimize: true,
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        default: false,
        vendors: false,
        // Only create chunks for shared dependencies
        react: {
          name: 'react-vendors',
          test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
          chunks: 'all',
          priority: 20
        }
      }
    }
  },
  plugins: [
    new ModuleFederationPlugin({
      name: "ServiceExampleEvents",
      library: { type: "var", name: "ServiceExampleEvents" },
      filename: "remoteEntry.js",
      exposes: {
        "./EventSender": "./src/components/EventSender",
        "./EventReceiver": "./src/components/EventReceiver",
        "./EventDisplay": "./src/components/EventDisplay"
      },
      shared: {
        react: {
          singleton: true,
          strictVersion: false,
          requiredVersion: false,
          eager: false
        },
        "react-dom": {
          singleton: true,
          strictVersion: false,
          requiredVersion: false,
          eager: false
        }
      }
    }),
    new HtmlWebpackPlugin({
      template: "./public/index.html",
    }),
  ],
  devServer: {
    port: 9007,
    static: {
      directory: path.join(__dirname, "public"),
    },
    hot: true,
  },
};