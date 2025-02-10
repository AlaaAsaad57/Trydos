import "styles/globals.css";

import "styles/home.css";
import "styles/unused-onload.css";
import Providers from "store/provider";
import localFont from "next/font/local";
import TranslationsMenu from "components/global/TranslationsMenu";
import "regenerator-runtime/runtime";
import PageTransition from "components/global/PageTransition";

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
export const revalidte = 360000;
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
      font-sans`}
      lang={params.lang.split("-")[1] === "ar" ? "ar-AE" : "en-US"}
    >
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>

      <body className={params.lang.split("-")[1] === "ar" ? "text-rtl" : ""}>
        <Providers>
          <div className="site-container">
            <>
              <TranslationsMenu init={params.lang} />
            </>
            <PageTransition>{children}</PageTransition>
          </div>
        </Providers>
      </body>
    </html>
  );
}
