import "styles/chatstyles.css";
import "styles/chatcomponent.css";
import "styles/globals.css";
export const runtime = "nodejs";

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
