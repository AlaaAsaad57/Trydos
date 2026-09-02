import React from "react";
import "styles/globals.css";

/*
  This route needs its own <html> and <body>.

  There is no app/layout.tsx in this repository, so nothing above supplies the
  document tags. Every other route under (special) — callInProg, call_direct,
  endCall — carries its own layout for exactly this reason, and /navigation was
  the one that did not. Without it Next reports "Missing <html> and <body> tags
  in the root layout" and, in dev, draws an error panel over the whole page.
*/
export const metadata = {
  title: "Bottom Navigation Demo | Trydos",
  description: "Design demo for the iOS-style glass bottom navigation bar.",
};

export default function NavigationDemoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#0b0b0d]">{children}</body>
    </html>
  );
}
