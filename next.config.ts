import { withSentryConfig } from "@sentry/nextjs";
import withBundleAnalyzer from "@next/bundle-analyzer";
import type { NextConfig } from "next";

// Crawl/index only on the real production domain (NEXT_PUBLIC_ALLOW_INDEXING=true).
// dev/preview deployments are themselves production Next builds, so without this
// they'd advertise `index, follow` and crawlers would hammer SSR across every
// locale — driving Vercel Function Duration up. Mirrors isIndexingAllowed().
const allowIndexing = process.env.NEXT_PUBLIC_ALLOW_INDEXING === "true";

// Local dev on constrained machines: skip prod-only compile passes that add no
// dev value but cost RAM/CPU. reactCompiler runs babel-plugin-react-compiler on
// every module (the slow Babel path under Turbopack) and only affects shipped
// runtime perf; optimizeCss (critters) and optimizeServerReact are prod-only
// optimizations. All stay ON for real builds (NODE_ENV=production).
const isDev = process.env.NODE_ENV === "development";

let nextConfig: NextConfig = {
  reactStrictMode: false,
  // Removes the `X-Powered-By: Next.js` header (security scan F-06 — tech
  // fingerprinting). `Server: Vercel` is platform-managed and can't be dropped.
  poweredByHeader: false,
  compress: true,
  bundlePagesRouterDependencies: false,
  reactCompiler: !isDev,
  // Reverse-proxy PostHog ingestion through our own domain so ad-blockers can't
  // drop events / session replays (utils/posthog.ts sets api_host: "/ingest").
  // The proxy itself is a route handler (app/ingest/[...path]/route.ts), NOT a
  // rewrite: it strips the Cookie header before forwarding, because our large
  // first-party cookies otherwise overflow PostHog's upstream header limit and
  // get a 400. The middleware (proxy.ts) excludes `ingest` from its matcher so
  // the route handler is reached untouched. skipTrailingSlashRedirect keeps
  // PostHog's trailing-slash endpoints intact.
  skipTrailingSlashRedirect: true,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains",
          },
          // Security-scan hardening (F-02..F-05). Deliberately excludes
          // Content-Security-Policy (F-01): a strict CSP would need every
          // third-party origin (GTM/GA, PostHog, Sentry, Firebase, Agora,
          // Cloudinary/S3) allowlisted plus nonces for Next.js inline scripts,
          // so it must roll out as Report-Only first — not added here.
          {
            // F-02 — SAMEORIGIN, not DENY: the only self-context needs framing
            // to stay possible; external payment iframes (Cart/ModalIframe) are
            // unaffected (that's us embedding them, not us being embedded).
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            // F-03 — stop MIME sniffing.
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            // F-04 — matches the modern browser default (no behavior change).
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            // F-05 — restrict to same-origin, NOT deny: camera/mic power Agora
            // calls, Stories, TryOn, QR scanner & voice search; geolocation
            // powers the cart delivery map. `()` here would break all of them.
            key: "Permissions-Policy",
            value: "camera=(self), microphone=(self), geolocation=(self)",
          },
          {
            // F-01 — minimal ENFORCED CSP, deliberately safe. It constrains only
            // directives this app never relies on, so it cannot block a
            // legitimate resource:
            //   object-src 'none'      — no <object>/<embed>/plugins in the app
            //   base-uri 'self'        — app never injects <base>; stops base-tag hijack
            //   frame-ancestors 'self' — anti-clickjacking (mirrors X-Frame-Options above)
            // IMPORTANT: there is intentionally NO `default-src` and NO
            // `script-src`, so scripts, styles, images, fonts, media and
            // XHR/WebSocket stay unrestricted — nothing the app loads is
            // affected. The full XSS-blocking script-src policy is deferred to a
            // Report-Only rollout; the real stored-XSS risk is already closed by
            // HTML sanitization (utils/sanitizeHtml.ts).
            // See docs/security/csp-decision.md.
            key: "Content-Security-Policy",
            value: "object-src 'none'; base-uri 'self'; frame-ancestors 'self'",
          },
        ],
      },
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Robots-Tag",
            // Gated on the indexing flag so only the real prod domain is
            // crawlable; everywhere else stays noindex (keeps bots from
            // triggering SSR renders we pay Function Duration for).
            value: allowIndexing ? "index, follow" : "noindex, nofollow",
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
    qualities: [100,90, 70, 65],
    domains: [
      "cdn.example.com",
      "res.cloudinary.com",
      "media_server.ramaaz.dev",
      "media.ramaaz.dev",
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
    serverActions: {
      bodySizeLimit: "5mb",
      // Server Actions (e.g. the OTP send action) are same-origin enforced by
      // Next.js: the Origin header must match an allowed host or the action is
      // rejected with 403. Same-origin is always allowed; these entries cover
      // trusted forwarded hosts behind the platform proxy. Wildcards supported.
      allowedOrigins: [
        "trydos.tech",
        "*.trydos.tech",
        "*.ramaaz.dev",
        "localhost:3000",
      ],
    },
    externalDir: true,
    webVitalsAttribution: ["CLS", "LCP", "FCP", "FID", "TTFB", "INP"],
    optimizeCss: !isDev,
    optimizeServerReact: !isDev,
    optimizePackageImports: [
      "embla-carousel-react",
      "embla-carousel-autoplay",
      "react-intersection-observer",
      "react-share",
      "firebase",
    ],
    staleTimes: {
      dynamic: 30,
      static: 180,
    },
  },

  productionBrowserSourceMaps: false,
};

const analyze = withBundleAnalyzer({ enabled: process.env.ANALYZE === "true" });

// The Sentry webpack wrapper adds OpenTelemetry instrumentation + source-map
// tooling that we never use locally. Source maps only upload on Vercel builds
// (VERCEL=1) anyway, so skip the wrapper entirely in local dev/build.
const configWithSentry = withSentryConfig(analyze(nextConfig), {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  // Org/project the source maps are uploaded to. Read from env so switching
  // Sentry accounts/projects is a Vercel env change, not a code change. The
  // Sentry plugin also picks up SENTRY_ORG/SENTRY_PROJECT/SENTRY_AUTH_TOKEN and
  // SENTRY_URL (region, e.g. https://de.sentry.io) from the environment.
  org: process.env.SENTRY_ORG,

  project: process.env.SENTRY_PROJECT,

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: false,
  sourcemaps: {
    // Upload source maps ONLY on Vercel builds. Local `pnpm build` sets no
    // VERCEL env var, so upload stays disabled there (no token needed, no maps
    // shipped). Vercel sets VERCEL=1 automatically on every build.
    disable: !process.env.VERCEL,
  },
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

// Vercel sets VERCEL=1 on every build; locally it's unset, so dev/local builds
// run without the Sentry wrapper's instrumentation overhead.
export default process.env.VERCEL ? configWithSentry : analyze(nextConfig);
