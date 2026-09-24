import React, { Suspense } from "react";
import { lang as langParam } from "next/root-params";
import DemoShell from "components/DemoApp/DemoShell";
import { DEMO_KEYS, type DemoDictionary } from "components/DemoApp/demoKeys";
import { translateFunction } from "utils/server";

/*
  The new app design, as a demo for the client: /[lang]/demo.

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

export default async function DemoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const language = (await langParam()).split("-")[1] || "en";
  const dictionary: DemoDictionary =
    language === "en"
      ? {}
      : Object.fromEntries(
          DEMO_KEYS.map((key) => [key, translateFunction(key, language)]),
        );

  return (
    <Suspense
      fallback={<div className="fixed inset-0 z-[99999999999] bg-white" />}
    >
      <DemoShell dictionary={dictionary}>{children}</DemoShell>
    </Suspense>
  );
}
