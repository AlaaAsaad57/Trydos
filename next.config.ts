import { withSentryConfig } from "@sentry/nextjs";
import withBundleAnalyzer from "@next/bundle-analyzer";
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

            // "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
            value: "index, follow",
            // value: "noindex, nofollow",
          },
          {
            key: "Cache-Control",
            value: "public, s-maxage=60, stale-while-revalidate=300",
          },
        ],
      },
      {
        source: "/api/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "private, no-store, no-cache, must-revalidate",
          },
        ],
      },
      {
        source: "/:file(sitemap.*\\.xml)",
        headers: [
          {
            key: "Content-Type",
            value: "application/xml",
          },
          {
            key: "Cache-Control",
            value:
              "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
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
            value:
              "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
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
            value: "public, no-cache, no-store, must-revalidate",
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
      "cdn.example.com",
      "res.cloudinary.com",
      "media_server.ramaaz.dev",
      "example.com",
      "media_server.ramaaz.dev",
      "placehold.co",
      "eu.ui-avatars.com",
      "trydos.s3.ap-south-1.amazonaws.com",
      "market_staging.trydos.tech",
      "s3.ap-south-1.amazonaws.com",
    ],
    minimumCacheTTL: 86400,
  },

  experimental: {
    serverActions: {
      bodySizeLimit: "5mb",
    },
    externalDir: true,
    webVitalsAttribution: ["CLS", "LCP", "FCP", "FID", "TTFB", "INP"],
    optimizeCss: true, // Disabled due to critters module error
    optimizeServerReact: true,
    staleTimes: {
      dynamic: 30,
      static: 180,
    },
  },

  productionBrowserSourceMaps: false,
};

const analyze = withBundleAnalyzer({ enabled: process.env.ANALYZE === "true" });

export default withSentryConfig(analyze(nextConfig), {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  org: "ramaaz-2x",

  project: "trydos",

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Uncomment to route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  // tunnelRoute: "/monitoring",

  webpack: {
    // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
    // See the following for more information:
    // https://docs.sentry.io/product/crons/
    // https://vercel.com/docs/cron-jobs
    automaticVercelMonitors: true,

    // Tree-shaking options for reducing bundle size
    treeshake: {
      // Automatically tree-shake Sentry logger statements to reduce bundle size
      removeDebugLogging: true,
    },
  },
});
