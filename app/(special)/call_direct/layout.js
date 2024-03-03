import "styles/chatstyles.css";
import "styles/chatcomponent.css";
import "styles/globals.css";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <link rel="icon" href="/favicon.ico" sizes="any" />
      <body style={{ backgroundColor: "black" }}>{children}</body>
    </html>
  );
}
