import "styles/globals.css";
import "styles/home.css";

import localFont from "next/font/local";
import { SpeedInsights } from "@vercel/speed-insights/next";
import Script from "next/script";
import { GA_MEASUREMENT_ID } from "utils/gtag";
import CartProvider from "components/Cart/CartProvider";
import Init from "components/Home/Init";
import AuthNavContainer from "components/Home/AuthNavContainer";
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

export default async function RootLayout({ params, children, modal }) {
  const { lang } = await params;
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
            <AuthNavContainer />
          </div>
          <OverlayVisibilityProvider>
            <NavigationLoaderGate>
              <MainContent>{children}</MainContent>
              <ModalSlot>{modal}</ModalSlot>
            </NavigationLoaderGate>
          </OverlayVisibilityProvider>
        </div>
        <Init />

        <NavbarClient />
        <CartProvider language={language} country={country} />
        <PathTracker />
        <NavigationLoaderSafetyNet />
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
