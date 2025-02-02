/** @type {import('next').NextConfig} */
const withSvgr = require("next-svgr");

let nextConfig = withSvgr({
  swcMinify: true,
  reactStrictMode: false,
  compress: true,
  logging: {
    fetches: {
      hmrRefreshes: true,
      fullUrl: true,
    },
  },
  async headers() {
    return [
      {
        source: "/:lang",
        headers: [
          {
            key: "Cache-Control",
            value: "s-maxage=36000, stale-while-revalidate=36000",
          },
        ],
      },
      {
        source: "/:lang/boutiques/:productCategory",
        headers: [
          {
            key: "Cache-Control",
            value: "s-maxage=36000, stale-while-revalidate=36000",
          },
        ],
      },
      {
        source: "/:lang/products/:productId",
        headers: [
          {
            key: "Cache-Control",
            value: "s-maxage=36000, stale-while-revalidate=36000",
          },
        ],
      },
    ];
  },
  images: {
    domains: [
      "res.cloudinary.com",
      "eu.ui-avatars.com",
      "trydos.s3.ap-south-1.amazonaws.com",
      "market_staging.trydos.tech",
      "s3.ap-south-1.amazonaws.com",
    ],
    minimumCacheTTL: 300,
  },
  experimental: {
    instrumentationHook: true,
    externalDir: true,
    webVitalsAttribution: ["CLS", "LCP", "FCP", "FID", "TTFB", "INP"],
    staleTimes: {
      dynamic: 36000,
      static: 36000,
    },
  },
  webpack(config, { dev }) {
    config.module.rules.push({
      test: /\.mp3$/,
      use: {
        loader: "file-loader",
      },
    });
    if (!dev) {
      config.devtool = false;
    }
    return config;
  },
  // your config for other plugins or the general next.js here...
});

const sentryWebpackPluginOptions = {
  // Additional config options for the Sentry webpack plugin. Keep in mind that
  // the following options are set automatically, and overriding them is not
  // recommended:
  //   release, url, configFile, stripPrefix, urlPrefix, include, ignore
  org: "ramaaz-fm",
  project: "javascript-nextjs",
  // // An auth token is required for uploading source maps.
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: true, // Suppresses all logs
  // include: "./.next", // The build output directory
  ignore: [
    "node_modules", // Ignore node_modules
    ".next/cache", // Explicitly ignore the cache folder
    ".next/server/chunks", // Optional: Ignore server-side chunks
  ],
  sentry: {
    disableSourceMaps: true, // Disables uploading of source maps to Sentry
  },
  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options.
};

// Make sure adding Sentry options is the last code to run before exporting
// module.exports = ;
if (process.env.ENABLE_SENTRY === "false") {
  const withBundleAnalyzer = require("@next/bundle-analyzer")({
    enabled: false,
  });
  module.exports = withBundleAnalyzer(nextConfig);
} else {
  const { withSentryConfig } = require("@sentry/nextjs");
  module.exports = withSentryConfig(
    nextConfig,
    { sentryWebpackPluginOptions },
    {
      hideSourceMaps: true,
    }
  );
}
