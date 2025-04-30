import "styles/globals.css";

import "styles/home.css";
import "styles/unused-onload.css";
import Providers from "store/provider";
import localFont from "next/font/local";
import { reportWebVitals } from "utils/libs/new_stories_lib/report-web-vitals";
import { Suspense } from "react";
import NextLink from "components/global/NextLink";
import Logo from "components/Home/Logo";
import UserNavTopSection from "components/Home/UserNavTopSection";
import Skeleton from "react-loading-skeleton";
import NavbarClient from "components/Home/NavbarClient";
import PageLoadingIndicator from "hooks/PageLoadingIndicator";
import { SpeedInsights } from "@vercel/speed-insights/next";
export const metadata = {
  title: "TryDos",
  description: "TryDos E-Commerce Website",
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
export const revalidte = parseInt(process.env.NEXT_PUBLIC_REVALIDATE);
export { reportWebVitals };
export default async function RootLayout({ params, children }) {
  // ${sf_pro_rounded_light.variable}
  // ${sf_pro_rounded_semibold.variable}
  // ${sf_pro_rounded_regular.variable}
  // ${sf_pro_rounded_medium.variable}
  // ${sf_pro_rounded_bold.variable}
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
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <meta name="google" content="notranslate" />
      </head>

      <body className={params.lang.split("-")[1] === "ar" ? "text-rtl" : ""}>
        <SpeedInsights debug={true} />
        <PageLoadingIndicator />
        <Providers>
          <div
            className="site-container items-center"
            key={`${JSON.stringify(params)}`}
          >
            <Suspense fallback={<></>}>
              <NavbarClient />
            </Suspense>
            <div className="home-navbar max-h-[1365px]">
              <NextLink
                data={{
                  is_full_home: true,
                  href: `/${params.lang}`,
                }}
                href={`/${params.lang}`}
                aria-label="TryDos Home"
                data-cy="NavLogo"
              >
                <Logo animated={false} style={false} key={1} />
              </NextLink>
              <Suspense
                fallback={
                  <div className="user-nav-container">
                    <div className="nav-question-item">
                      <Skeleton className="w-[30px] h-[30px] rounded-sm" />
                    </div>
                    <div className="nav-question-item ml-2">
                      <Skeleton className="w-[30px] h-[30px] rounded-sm" />
                    </div>
                    <div className="nav-question-item ml-2">
                      <Skeleton className="w-[30px] h-[30px] rounded-sm" />
                    </div>
                  </div>
                }
              >
                <UserNavTopSection />
              </Suspense>
            </div>

            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
