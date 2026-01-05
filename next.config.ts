import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

let nextConfig: NextConfig = {
  reactStrictMode: false,
  compress: true,
  bundlePagesRouterDependencies: false,
  reactCompiler: true,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains",
          },
        ],
      },
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
    qualities: [
      100, 90, 80, 75, 70, 65, 60, 55, 50, 45, 40, 35, 30, 25, 20, 15, 10, 5,
    ],
    domains: [
      "res.cloudinary.com",
      "example.com",
      "placehold.co",
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

  productionBrowserSourceMaps: true,
  // your config for other plugins or the general next.js here...
};

if (process.env.NODE_ENV !== "production") {
  const withBundleAnalyzer = require("@next/bundle-analyzer")({
    enabled: true,
  });
  const finalConfig = withBundleAnalyzer(nextConfig);
  module.exports = finalConfig;
  // module.exports = nextConfig;
} else {
  const withBundleAnalyzer = require("@next/bundle-analyzer")({
    enabled: true,
  });
  const finalConfig = withBundleAnalyzer(nextConfig);
  module.exports = finalConfig;
  // module.exports = nextConfig;
}

export default withSentryConfig(undefined, {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options
  org: "ramaaz-fm",
  project: "javascript-nextjs",
  silent: !process.env.CI,
  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/
  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,
  disableLogger: true,
  automaticVercelMonitors: true,
});
