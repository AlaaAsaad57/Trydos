import Image from "next/image";
import "styles/globals.css";
export const dynamic = "force-static";
export const revalidate = 600;
export default function LandingPage() {
  return (
    <html lang="en">
      <head>
        <title>Trydos</title>
        <meta
          name="google-site-verification"
          content="iANrHdX9P3YTSLpnXZYxSv3Zlk9s0Vy9Oiympeu25oE"
        />
      </head>
      <body>
        <main className="flex min-h-screen items-center justify-center bg-white">
          <Image
            src="/icons/Logo.svg"
            alt="Trydos Logo"
            width={220}
            height={86}
            priority
          />
        </main>
      </body>
    </html>
  );
}
