import "styles/chatstyles.css";
import "styles/chatcomponent.css";
import "styles/globals.css";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
      </head>
      <link rel="icon" href="/favicon.ico" sizes="any" />
      <body className="bg-black">{children}</body>
    </html>
  );
}
