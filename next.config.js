/** @type {import('next').NextConfig} */

const path = require("path");
let nextConfig = {
  swcMinify: true,
  reactStrictMode: false,
  compress: true,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Robots-Tag",
            value:
              "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
          },
          {
            key: "Cache-Control",
            value: "s-maxage=86400, stale-while-revalidate=86400",
          },
        ],
      },
      {
        source: "/sitemap.xml",
        headers: [
          {
            key: "Content-Type",
            value: "application/xml",
          },
          {
            key: "Cache-Control",
            value: "public, max-age=36000, stale-while-revalidate=7200",
          },
        ],
      },
      {
        source: "/robots.txt",
        headers: [
          {
            key: "Content-Type",
            value: "text/plain",
          },
          {
            key: "Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=86400",
          },
        ],
      },
      {
        source:
          "/:all*(css|png|jpg|svg|gif|woff2|woff|ttf|eot|otf|ico|webp|avif|mp3|mp4|webm|ogg|wav|flac|aac|m4a|ogg|opus|webp|avif|mp3|mp4|webm|ogg|wav|flac|aac|m4a|ogg|opus)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
  images: {
    unoptimized: false,
    domains: [
      "res.cloudinary.com",
      "eu.ui-avatars.com",
      "trydos.s3.ap-south-1.amazonaws.com",
      "market_staging.trydos.tech",
      "s3.ap-south-1.amazonaws.com",
    ],
    minimumCacheTTL: 86400,
  },
  experimental: {
    externalDir: true,
    webVitalsAttribution: ["CLS", "LCP", "FCP", "FID", "TTFB", "INP"],
    optimizeCss: true, // Disabled due to critters module error
    optimizeServerReact: true,
    staleTimes: {
      dynamic: 86400,
      static: 86400,
    },
  },
  // Alternative CSS optimization
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
  webpack(config, { dev, isServer }) {
    const fileLoaderRule = config.module.rules.find((rule) =>
      rule.test?.test?.(".svg")
    );

    config.module.rules.push(
      // Reapply the existing rule, but only for svg imports ending in ?url
      {
        ...fileLoaderRule,
        test: /\.svg$/i,
        resourceQuery: /url/, // *.svg?url
      },
      // Convert all other *.svg imports to React components
      {
        test: /\.svg$/i,
        issuer: fileLoaderRule.issuer,
        resourceQuery: { not: [...fileLoaderRule.resourceQuery.not, /url/] }, // exclude if *.svg?url
        use: ["@svgr/webpack"],
      }
    );

    // Modify the file loader rule to ignore *.svg, since we have it handled now.
    fileLoaderRule.exclude = /\.svg$/i;
    config.module.rules.push({
      test: /\.mp3$/,
      use: {
        loader: "file-loader",
      },
    });
    if (!isServer && !dev && process.env.NODE_ENV !== "production") {
      config.module.rules.push({
        test: /\.(js|jsx|ts|tsx)$/,
        enforce: "post",
        use: [
          {
            loader: "istanbul-instrumenter-loader",
            options: {
              esModules: true,
            },
          },
        ],
        include: [
          path.resolve(__dirname, "store"),
          path.resolve(__dirname, "components"),
          path.resolve(__dirname, "services"),
          path.resolve(__dirname, "utils"),
        ],
        exclude: [
          // Exclude specific components
          path.resolve(__dirname, "components/global/webViewActions"),
          path.resolve(__dirname, "components/global/WebViewVideoCall"),
          path.resolve(__dirname, "components/global/WebViewVoiceCall"),
          // Exclude utils/libs
          path.resolve(__dirname, "utils/libs"),
          // Exclude specific store actions
          path.resolve(__dirname, "store/chat/callActions"),
        ],
      });
    }
    if (!dev) {
      config.devtool = false;
    }
    return config;
  },
  productionBrowserSourceMaps: true,
  // your config for other plugins or the general next.js here...
};

// const sentryWebpackPluginOptions = {
//   // Additional config options for the Sentry webpack plugin. Keep in mind that
//   // the following options are set automatically, and overriding them is not
//   // recommended:
//   //   release, url, configFile, stripPrefix, urlPrefix, include, ignore
//   org: process.env.SENTRY_ORG,
//   project: process.env.SENTRY_PROJECT,

//   // // An auth token is required for uploading source maps.
//   // authToken: process.env.SENTRY_AUTH_TOKEN,
//   silent: true,
//   disableLogger: true,

//   ignore: [
//     "node_modules", // Ignore node_modules
//     ".next/cache", // Explicitly ignore the cache folder
//     ".next/server/chunks", // Optional: Ignore server-side chunks
//   ],
//   sentry: {
//     disableSourceMaps: true,

//     // Disables uploading of source maps to Sentry
//   },
//   // For all available options, see:
//   // https://github.com/getsentry/sentry-webpack-plugin#options.
// };

// Make sure adding Sentry options is the last code to run before exporting
// module.exports = ;
if (process.env.NODE_ENV !== "production") {
  // const withBundleAnalyzer = require("@next/bundle-analyzer")({
  //   enabled: true,
  // });
  // const finalConfig = withBundleAnalyzer(nextConfig);
  module.exports = nextConfig;
} else {
  // We'll keep Sentry webpack plugin for server-side source maps
  // but disable client-side by renaming sentry.client.config.js
  // const withBundleAnalyzer = require("@next/bundle-analyzer")({
  //   enabled: true,
  // });
  // const finalConfig = withBundleAnalyzer(nextConfig);
  module.exports = nextConfig;
}
