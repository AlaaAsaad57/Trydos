import React, { Suspense } from "react";
import { lang as langParam } from "next/root-params";
import Demo1Shell from "components/DemoApp1/Demo1Shell";
import { HIDE_SITE_CHROME } from "components/DemoApp1/demo1Layout";
import { DEMO_KEYS, type DemoDictionary } from "components/DemoApp/demoKeys";
import { translateFunction } from "utils/server";

/*
  The new app design as a normal web page, for the client: /[lang]/demo1.

  The same screens, data and words as /demo, without the scaled canvas: the
  page is fluid and the document scrolls, so Safari 26 on the iPhone draws its
  glass bar over the page. See components/DemoApp1/Demo1Shell.tsx.

  The words are looked up here, on the server, exactly as /demo does it (see
  components/DemoApp/demoKeys.ts). The shell reads the URL, so it sits in a
  Suspense boundary; the fallback is a plain white page.
*/
export const metadata = {
  title: "App Design Demo (fluid) | Trydos",
  description: "Interactive demo of the new Trydos app design, as a web page.",
  robots: { index: false, follow: false },
};

export const viewport = {
  width: "device-width",
  initialScale: 1.0,
  maximumScale: 1.0,
  userScalable: false,
  viewportFit: "cover",
};

export default async function Demo1Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const language = (await langParam()).split("-")[1] || "en";
  const dictionary: DemoDictionary = Object.fromEntries(
    DEMO_KEYS.map((key) => [key, translateFunction(key, language)]),
  );

  return (
    <>
      <style>{HIDE_SITE_CHROME}</style>
      <Suspense
        fallback={
          <div data-pw="demo1-app" className="w-full min-h-dvh bg-white" />
        }
      >
        <Demo1Shell dictionary={dictionary}>{children}</Demo1Shell>
      </Suspense>
    </>
  );
}
