export const dynamic = "force-dynamic";

import "styles/globals.css";
import "styles/home.css";
import "styles/unused-onload.css";
import localFont from "next/font/local";
import Logo from "components/Home/Logo";
import { SpeedInsights } from "@vercel/speed-insights/next";
import Script from "next/script";
import { GA_MEASUREMENT_ID } from "utils/gtag";
import NextLink from "components/global/NextLink";

export const metadata = {
  title: "TryDos",
  description: "TryDos E-Commerce Website",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_REMOTE_FRONT || "https://trydos.vercel.app"
  ),
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

export default function RootLayout({
  params,
  children,
  loader,
  cart,
  nav,
  init,
  navauth,
  notification,
}) {
  return (
    <html
      className={`
      ${quicksand_regular.variable}
      ${quicksand_light.variable}
      ${quicksand_medium.variable}
      ${quicksand_bold.variable}
      ${quicksand_semibold.variable}
      font-sans overflow-x-hidden`}
      lang={params.lang.split("-")[1] === "ar" ? "ar-AE" : "en-US"}
    >
      <head>
        <Script
          strategy="afterInteractive"
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        />
        <Script
          id="gtag-init"
          strategy="afterInteractive"
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
          content="msuFSuyNve82GpHnHzl67XWbTCGPccO_gyT0bgEDLcU"
        />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <meta name="google" content="notranslate" />
      </head>

      <body className={params.lang.split("-")[1] === "ar" ? "text-rtl" : ""}>
        <SpeedInsights />

        <div
          className="site-container items-center"
          key={`${JSON.stringify(params)}`}
        >
          <div className="home-navbar max-h-[1365px]">
            <NextLink
              href={`/${params.lang}`}
              data={{ is_full_home: true }}
              aria-label="TryDos Home"
              data-cy="NavLogo"
            >
              <Logo animated={false} style={false} key={1} />
            </NextLink>

            {nav}
          </div>

          {children}
        </div>
        {init}
        {loader}
        {navauth}
        {cart}
        {notification}
      </body>
    </html>
  );
}
