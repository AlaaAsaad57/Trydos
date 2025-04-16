import "styles/globals.css";

import "styles/home.css";
import "styles/unused-onload.css";
import Providers from "store/provider";
import localFont from "next/font/local";

import PageTransition from "components/global/PageTransition";
import CustomNavbarServer from "components/Server/ServerCustomNav";
import { Suspense } from "react";
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
export async function generateStaticParams() {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/countries`
    );
    if (!response.ok) {
      throw new Error("Failed to fetch countries");
    }
    const data = await response.json();
    const languages = ["en", "ar", "tr"];

    return data.data.countries?.flatMap((country) =>
      languages.map((lang) => ({
        lang: `${country.iso.toLowerCase()}-${lang}`,
      }))
    );
  } catch (error) {
    console.error("Error generating static params:", error);
    return [];
  }
}
export default async function RootLayout({ params, children }) {
  // ${sf_pro_rounded_light.variable}
  // ${sf_pro_rounded_semibold.variable}
  // ${sf_pro_rounded_regular.variable}
  // ${sf_pro_rounded_medium.variable}
  // ${sf_pro_rounded_bold.variable}
  console.log(
    "Layout Page",
    `${new Date().getMinutes()}:${new Date().getSeconds()}`
  );

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
        <meta name="google" content="notranslate" />
      </head>

      <body className={params.lang.split("-")[1] === "ar" ? "text-rtl" : ""}>
        <Providers>
          <div className="site-container items-center">
            <CustomNavbarServer lang={params.lang} />

            <PageTransition init={params.lang}>{children}</PageTransition>
          </div>
        </Providers>
      </body>
    </html>
  );
}
