import "styles/globals.css";

// Root layout for the logo page at "/". Next 16.4 fails the build when a page
// has no root layout, and "/" sits outside the other route groups. The
// staging gate in proxy.ts serves this page while STAGING_GATE=on.
export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <title>Trydos</title>
        <meta
          name="google-site-verification"
          content="XZ0AXyUrQnxKY1ZWh79BveP9tLhDxMNxL-cCubzwe5k"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
