import React from "react";

/*
  The new app design, as a demo for the client: /[lang]/demo.

  TURNED OFF: every page under this folder sends the browser to the same
  screen on /demo1 (see redirectToDemo1.ts). So this layout renders only the
  page, not the demo shell: the shell draws each screen from the URL itself
  and never renders the page, so the page's redirect would never run. The
  notes below say how the layout worked while /demo was on.

  The layout owns the whole app (components/DemoApp/DemoShell): the scaled
  canvas, the tab bar and the screen on show. It stays mounted while the
  shopper moves between /demo, /demo?search|cart|chat and /demo/settings/...,
  which is what lets every move slide at once. The page files under this
  folder render nothing — they exist so each screen has a real URL.

  The demo's words are looked up here, on the server, and handed to the shell
  (see components/DemoApp/demoKeys.ts for why). Only the demo's own keys go
  over the wire, not the whole translation table.

  The shell reads the URL (usePathname / useSearchParams), so it sits in a
  Suspense boundary. The fallback is a plain white page, the colour every demo
  screen starts from.
*/
export const metadata = {
  title: "App Design Demo | Trydos",
  description: "Interactive demo of the new Trydos app design.",
  robots: { index: false, follow: false },
};

export const viewport = {
  width: "device-width",
  initialScale: 1.0,
  maximumScale: 1.0,
  userScalable: false,
  viewportFit: "cover",
};

export default function DemoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
