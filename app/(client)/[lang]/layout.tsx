import "styles/globals.css";
import "styles/home.css";
import "styles/unused-onload.css";
import Providers from "store/provider";
import localFont from "next/font/local";

import NavbarServer from "components/Server/Navbar";
import PageLoadingIndicator from "Hooks/LoadingIndicator";
import dynamic from "next/dynamic";
const TranslationsMenu = dynamic(
  () => import("components/global/TranslationsMenu")
);
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
// const quicksand_regular = localFont({
//   src: "../../../public/fonts/Quicksand-Regular.woff2",
//   variable: "--Quicksand-Regular",
//   display: "swap",
//   preload: false,
//   fallback: ["system-ui", "arial"],
// });
// const quicksand_light = localFont({
//   src: "../../../public/fonts/Quicksand-Light.woff2",
//   variable: "--Quicksand-Light",
//   display: "swap",
//   preload: false,
//   fallback: ["system-ui", "arial"],
// });
// const quicksand_bold = localFont({
//   src: "../../../public/fonts/Quicksand-Bold.woff2",
//   variable: "--Quicksand-Bold",
//   display: "swap",
//   preload: false,
//   fallback: ["system-ui", "arial"],
// });
// const quicksand_medium = localFont({
//   src: "../../../public/fonts/Quicksand-Medium.woff2",
//   variable: "--Quicksand-Medium",
//   display: "swap",
//   preload: false,
//   fallback: ["system-ui", "arial"],
// });
export default async function RootLayout({ params: { lang }, children }) {
  // ${quicksand_regular.variable}
  // ${quicksand_light.variable}
  // ${quicksand_medium.variable}
  // ${quicksand_bold.variable}
  console.log("rendered");
  return (
    <html
      className={`

      font-sans`}
      lang={lang.split("-")[1]}
    >
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>

      <body>
        <PageLoadingIndicator />
        <Providers>
          <div className="site-container">
            <div className="home-page-container">
              <>
                <TranslationsMenu init={lang} />
                <NavbarServer lang={lang} />
              </>

              {children}
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
