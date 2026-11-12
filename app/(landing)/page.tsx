import Image from "next/image";
import "styles/globals.css";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export default function LandingPage() {
  return (
    <html lang="en">
      <head>
        <title>Trydos</title>
        <meta
          name="google-site-verification"
          content="XZ0AXyUrQnxKY1ZWh79BveP9tLhDxMNxL-cCubzwe5k"
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
