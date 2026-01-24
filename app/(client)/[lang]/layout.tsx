import "styles/globals.css";
import "styles/home.css";
import localFont from "next/font/local";
import { SpeedInsights } from "@vercel/speed-insights/next";
import Script from "next/script";
import { GA_MEASUREMENT_ID } from "utils/gtag";
import PathTracker from "components/PathTracker";
import SessionChecker from "components/SessionChecker";
import SessionTimer from "components/Login/SessionTimer";
import CartProvider from "components/Cart/CartProvider";
import Init from "components/Home/Init";
import NotificationsContainer from "components/global/NotificationsContainer";
import AuthNavContainer from "components/Home/AuthNavContainer";
import VersionChecker from "components/global/VersionChecker";
import NavbarClient from "components/Home/NavbarClient";
import dynamic from "next/dynamic";
import PageLoadingIndicator from "hooks/PageLoadingIndicator";
import Organaization from "serverRequests/meta/StructuredData/Organaization";
import Website from "serverRequests/meta/StructuredData/Website";
import { General_Site_Data } from "serverRequests/meta/StructuredData/Constants";

export const metadata = {
  title: "TryDos",
  description: "TryDos E-Commerce Website",
  metadataBase: new URL(General_Site_Data.url),
};
export const viewport = {
  width: "device-width",
  initialScale: 1.0,
  maximumScale: 1.0,
  userScalable: false,
};
const quicksand_regular = localFont({
  src: "../../../public/fonts/Quicksand-Regular.woff2",
  variable: "--Quicksand-Regular",
  display: "swap",
  preload: false,
  fallback: ["system-ui", "arial"],
});
const quicksand_light = localFont({
  src: "../../../public/fonts/Quicksand-Light.woff2",
  variable: "--Quicksand-Light",
  display: "swap",
  preload: false,
  fallback: ["system-ui", "arial"],
});
const quicksand_bold = localFont({
  src: "../../../public/fonts/Quicksand-Bold.woff2",
  variable: "--Quicksand-Bold",
  display: "swap",
  preload: false,
  fallback: ["system-ui", "arial"],
});
const quicksand_medium = localFont({
  src: "../../../public/fonts/Quicksand-Medium.woff2",
  variable: "--Quicksand-Medium",
  display: "swap",
  preload: false,
  fallback: ["system-ui", "arial"],
});
const quicksand_semibold = localFont({
  src: "../../../public/fonts/Quicksand-SemiBold.woff2",
  variable: "--Quicksand-SemiBold",
  display: "swap",
  preload: false,
  fallback: ["system-ui", "arial"],
});

export default async function RootLayout({ params, children }) {
  const { lang } = await params;
  const [country, language] = lang.split("-");
  return (
    <html
      className={`
      ${quicksand_regular.variable}
      ${quicksand_light.variable}
      ${quicksand_medium.variable}
      ${quicksand_bold.variable}
      ${quicksand_semibold.variable}
      font-sans overflow-x-hidden`}
      lang={lang.split("-")[1] === "ar" ? "ar-AE" : "en-US"}
    >
      <head>
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
        <meta
          name="google-site-verification"
          content="iANrHdX9P3YTSLpnXZYxSv3Zlk9s0Vy9Oiympeu25oE"
        />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <meta name="google" content="notranslate" />
      </head>

      <body className={lang.split("-")[1] === "ar" ? "text-rtl" : ""}>
        <SpeedInsights />
        <div className="site-container items-center">
          <div className="home-navbar z-[999999996] duration-[1s] max-w-[1365px] min-h-[98px]  px-[20px] pt-[52px] bg-white flex-row items-start w-full justify-start">
            <a href={`/`} aria-label="TryDos Home" data-cy="NavLogo">
              <div className="logo-container" data-cy="storeLogo">
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
            {/*@ts-expect-error Async Server Component is valid in Next  */}
            <AuthNavContainer />
          </div>

          {children}
        </div>
        <Init />

        <VersionChecker />
        <NavbarClient />
        <CartProvider language={language} country={country} />
        <NotificationsContainer />
        <PathTracker />
        <SessionChecker />
        <SessionTimer />
        <PageLoadingIndicator />
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
