const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const { ModuleFederationPlugin } = require("webpack").container;
const deps = require("./package.json").dependencies;

// ServiceExample_Events Plugin Configuration
const PLUGIN_NAME = "ServiceExample_Events";
const PLUGIN_PORT = 3004;

module.exports = {
  mode: "development",
  entry: "./src/index",
  output: {
    path: path.resolve(__dirname, '/home/hacker/BrainDriveDev/BrainDrive/backend/plugins/shared/ServiceExample_Events/v1.0.0/dist'),
    //path: path.resolve(__dirname, 'dist'),
    publicPath: "auto",
    clean: true,
    library: {
      type: 'var',
      name: PLUGIN_NAME
    }
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        use: "ts-loader",
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
  plugins: [
    new ModuleFederationPlugin({
      name: PLUGIN_NAME,
      library: { type: "var", name: PLUGIN_NAME },
      filename: "remoteEntry.js",
      exposes: {
        // Core chat modules
        "./LeftChat": "./src/components/LeftChat/LeftChat",
        "./RightChat": "./src/components/RightChat/RightChat",
        "./ChatHistory": "./src/components/ChatHistory/ChatHistory",
        
        // Advanced event service modules
        "./EventMonitor": "./src/components/EventMonitor/EventMonitor",
        "./MessageQueue": "./src/components/MessageQueue/MessageQueue",
        "./BroadcastCenter": "./src/components/BroadcastCenter/BroadcastCenter",
      },
      shared: {
        react: {
          singleton: true,
          requiredVersion: deps.react,
          eager: true
        },
        "react-dom": {
          singleton: true,
          requiredVersion: deps["react-dom"],
          eager: true
        }
      }
    }),
    new HtmlWebpackPlugin({
      template: "./public/index.html",
    }),
  ],
  devServer: {
    port: PLUGIN_PORT,
    static: {
      directory: path.join(__dirname, "public"),
    },
    hot: true,
  },
};