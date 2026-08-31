import "styles/globals.css";
import { Suspense } from "react";
import "styles/home.css";

import localFont from "next/font/local";
import { notFound } from "next/navigation";
import { lang as langParam } from "next/root-params";
import { SpeedInsights } from "@vercel/speed-insights/next";
import Script from "next/script";
import { GA_MEASUREMENT_ID } from "utils/gtag";
import { IMAGE_FALLBACK_SCRIPT } from "utils/imageFallback";
import RedeemedLuckScript from "components/Home/RedeemedLuckScript";
import { isSupportedLocaleSegment } from "utils/locale";
import CartProvider from "components/Cart/CartProvider";
import Init from "components/Home/Init";
import AuthNavContainer from "components/Home/AuthNavContainer";
import AuthNavSkeleton from "components/Home/AuthNavSkeleton";
import NavbarClient from "components/Home/NavbarClient";
import NavigationLoaderSafetyNet from "components/global/NavigationLoaderSafetyNet";
import Organaization from "serverRequests/meta/StructuredData/Organaization";
import Website from "serverRequests/meta/StructuredData/Website";
import { General_Site_Data } from "serverRequests/meta/StructuredData/Constants";
import { mapLocaleToBCP47 } from "serverRequests/meta/StructuredData/utils";
import PathTracker from "components/PathTracker";
import ModalSlot from "components/ModalRoute/ModalSlot";
import {
  OverlayVisibilityProvider,
  MainContent,
} from "components/ModalRoute/OverlayVisibility";
import NavigationLoaderGate from "components/global/NavigationLoaderGate";
// Non-critical, render-null / post-hydration client components — code-split and
// loaded after hydration (ssr:false) to trim main-thread hydration cost.
import DeferredLayoutClients from "components/global/DeferredLayoutClients";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export const metadata = {
  title: "TryDos",
  description: "TryDos E-Commerce Website",
  metadataBase: new URL(General_Site_Data.url),
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
  },
  verification: {
    google: [
      "iANrHdX9P3YTSLpnXZYxSv3Zlk9s0Vy9Oiympeu25oE",
      "t3AmV4IAkGgEHviuLtG_c1OI3Dlo7OlcM1TWPwx7OVk",
    ],
  },
  other: {
    google: "notranslate",
  },
};
export const viewport = {
  width: "device-width",
  initialScale: 1.0,
  maximumScale: 1.0,
  userScalable: false,
};
// All five faces come from ONE variable Quicksand file (wght 300–700) — the same
// font binary the rdb app uses. The previous five static per-weight woff2 files
// rendered noticeably softer at dpr:1; the variable build carries the hinting
// (gasp/fvar/gvar) that keeps stems crisp. Because every declaration shares the
// same src, the browser downloads the file once and instances it per weight.
//
// Each weight still gets its own CSS variable so existing CSS
// (font-family: var(--Quicksand-*)) keeps working unchanged.
// Next.js injects these variables onto <html> via the className applied below.
//
// `weight` is REQUIRED on every one of these. Without it next/font emits an
// @font-face with no font-weight descriptor, which CSS defaults to 400 — so a
// `font-weight: 700` on any of these families finds no matching face and the
// browser fakes bold by smearing the outlines. Synthetic bold renders soft and
// blurry. Declaring the real weight pins the variable axis and gives an exact match.
const quicksand_regular = localFont({
  src: "../../../public/fonts/quicksand-variable.ttf",
  variable: "--Quicksand-Regular",
  weight: "400",
  style: "normal",
  display: "swap",
  preload: true,
  fallback: ["system-ui", "arial"],
});
const quicksand_light = localFont({
  src: "../../../public/fonts/quicksand-variable.ttf",
  variable: "--Quicksand-Light",
  weight: "300",
  style: "normal",
  display: "swap",
  preload: true,
  fallback: ["system-ui", "arial"],
});
const quicksand_bold = localFont({
  src: "../../../public/fonts/quicksand-variable.ttf",
  variable: "--Quicksand-Bold",
  weight: "700",
  style: "normal",
  display: "swap",
  preload: true,
  fallback: ["system-ui", "arial"],
});
const quicksand_medium = localFont({
  src: "../../../public/fonts/quicksand-variable.ttf",
  variable: "--Quicksand-Medium",
  weight: "500",
  style: "normal",
  display: "swap",
  preload: true,
  fallback: ["system-ui", "arial"],
});
const quicksand_semibold = localFont({
  src: "../../../public/fonts/quicksand-variable.ttf",
  variable: "--Quicksand-SemiBold",
  weight: "600",
  style: "normal",
  display: "swap",
  preload: true,
  fallback: ["system-ui", "arial"],
});

// Root parameters must have at least one value once Cache Components is on, or
// the build fails (next-root-params.md: "each root parameter must have at least
// one value or the build fails").
//
// One value on purpose. This phase caches nothing, so a longer list would only
// buy build time; and 20 locales x every category page is between roughly 1,860
// and 7,420 pages, which is why the conversion prerenders the minimum and builds
// the rest on first request (D-23). Every locale not listed here still works:
// Next serves the App Shell and saves the page to disk after the first request.
export function generateStaticParams() {
  return [{ lang: "sy-en" }];
}

export default async function RootLayout({ children, modal }) {
  const lang = await langParam();

  // Refuse a segment this app does not serve. proxy.ts validates the locale
  // pair, but its matcher's `missing:` clause skips RSC, prefetch and Server
  // Action requests, so /zz-qq/... reached this layout and rendered. Once these
  // routes are cached the segment is part of the cache key, and an unchecked
  // segment is an unbounded number of entries a stranger can create.
  if (!isSupportedLocaleSegment(lang)) notFound();

  const [country, language] = lang.split("-");
  return (
    <html
      className={[
        quicksand_regular.variable,
        quicksand_light.variable,
        quicksand_medium.variable,
        quicksand_bold.variable,
        quicksand_semibold.variable,
        "overflow-x-clip",
      ].join(" ")}
      lang={mapLocaleToBCP47(lang)}
      translate="no"
      // dir={language === "ar" || language === "ku" ? "rtl" : "ltr"}
    >
      <body
        className={`${language === "ar" || language === "ku" ? "text-rtl" : ""} notranslate antialiased`}
        translate="no"
      >
        {/* First child of <body> on purpose. An inline script runs while the
            browser is still parsing, so this listener exists before any <img>
            below it does — and images in the server-rendered HTML start loading,
            and start failing, long before the app becomes interactive.

            A raw <script> rather than next/script: `beforeInteractive` is a
            client component whose position in the document the framework
            decides, while a plain element sits exactly where it is written.
            dangerouslySetInnerHTML is required — React escapes a text child of
            <script>, which would ship entities and throw on every page (the
            gtag-init script below does the same thing for the same reason).

            Costs the client bundle nothing: this is a Server Component, so
            utils/imageFallback.ts is rendered to a string here and never sent to
            the browser as JavaScript. */}
        <script
          id="image-fallback"
          dangerouslySetInnerHTML={{ __html: IMAGE_FALLBACK_SCRIPT }}
        />
        {/* Also inline, also near the top of <body>, and for the same reason.
            The product grids are rendered inside a cached scope shared by every
            shopper, so a luck badge in the markup says only that the PRODUCT has
            an offer. This script reads the shopper's own redeemed cookie and
            hides the badges they can no longer use, before the browser paints
            them. Costs the client bundle nothing — see RedeemedLuckScript. */}
        <RedeemedLuckScript />
        <Organaization local={lang} />
        <Website local={lang} />
        <Script
          strategy="lazyOnload"
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        />
        <Script
          id="gtag-init"
          strategy="lazyOnload"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA_MEASUREMENT_ID}', {
                page_path: window.location.pathname,
              });
            `,
          }}
        />
        <SpeedInsights />
        <div className="site-container items-center">
          <div className="home-navbar z-999999996 duration-1000 max-w-[1365px] min-h-[98px]  px-[20px] pt-[52px] bg-white flex-row items-start w-full justify-start">
            <a href={`/`} aria-label="TryDos Home" data-pw="NavLogo">
              <div className="logo-container" data-pw="storeLogo">
                <img
                  fetchPriority="high"
                  alt="TryDos Logo"
                  width={130}
                  height={36}
                  loading="eager"
                  src="/icons/Logo.svg"
                />
              </div>
            </a>
            {/* Four cookie reads, so this is request-bound. Wrapped so the
                rest of the document can be prerendered and this streams in
                behind it (D-9). Without the boundary the whole route is
                dynamic and nothing else on the page can be cached. */}
            <Suspense fallback={<AuthNavSkeleton />}>
              <AuthNavContainer />
            </Suspense>
          </div>
          <OverlayVisibilityProvider>
            <NavigationLoaderGate>
              <MainContent>{children}</MainContent>
              <ModalSlot>{modal}</ModalSlot>
            </NavigationLoaderGate>
          </OverlayVisibilityProvider>
        </div>
        {/* These four call useSearchParams(), and an unwrapped
            useSearchParams() opts the WHOLE route out of prerendering. They sit
            in the layout, so before these boundaries they opted out every page
            under [lang] — the entire storefront. Measured in Phase A: a probe
            page with no imports at all was still dynamic until they were
            wrapped. See docs/homepage-cache-phase-2-measurements.md.

            All four render nothing visible — they are effect-only or provider
            components — so fallback={null} costs no layout shift. */}
        <Suspense fallback={null}>
          <Init />
        </Suspense>

        <NavbarClient />
        <Suspense fallback={null}>
          <CartProvider language={language} country={country} />
        </Suspense>
        <Suspense fallback={null}>
          <PathTracker />
        </Suspense>
        <Suspense fallback={null}>
          <NavigationLoaderSafetyNet />
        </Suspense>
        <DeferredLayoutClients />
        <svg className="opacity-0 absolute" width={0} height={0}>
          <defs>
            <linearGradient
              id={`heartGradient77`}
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop offset="0%" stopColor="#FF6B6B" />
              <stop offset="100%" stopColor="#FF1E56" />
            </linearGradient>
          </defs>
        </svg>
      </body>
    </html>
  );
}
