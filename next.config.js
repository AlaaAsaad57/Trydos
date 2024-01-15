/** @type {import('next').NextConfig} */
const withSvgr = require("next-svgr");
const { withSentryConfig } = require("@sentry/nextjs");
const nextConfig = withSvgr({
  images: {
    domains: [
      "res.cloudinary.com",
      "eu.ui-avatars.com",
      "trydos.s3.ap-south-1.amazonaws.com",
      "market_staging.trydos.tech",
      "s3.ap-south-1.amazonaws.com",
    ],
  },
  experimental: { externalDir: true },
  webpack(config, options) {
    config.module.rules.push({
      test: /\.mp3$/,
      use: {
        loader: "file-loader",
      },
    });
    return config;
  },
  minify: true,
  // your config for other plugins or the general next.js here...
});
const sentryWebpackPluginOptions = {
  // Additional config options for the Sentry webpack plugin. Keep in mind that
  // the following options are set automatically, and overriding them is not
  // recommended:
  //   release, url, configFile, stripPrefix, urlPrefix, include, ignore
  // org: "example-org",
  // project: "duttip",
  // // An auth token is required for uploading source maps.
  // authToken: process.env.SENTRY_AUTH_TOKEN,
  // silent: true, // Suppresses all logs
  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options.
};

// Make sure adding Sentry options is the last code to run before exporting
module.exports = withSentryConfig(nextConfig, sentryWebpackPluginOptions);
