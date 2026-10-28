import React from "react";
import { lang as langParam } from "next/root-params";
import NewLoginWidget from "NewLoginDesign/NewLoginWidget";
import { translateFunction } from "utils/server";

/*
  The login page, /[lang]/login (D-11 in UI-MIGRATION-PLAN.md).

  A page that needs a signed-in shopper sends them here with its own path in
  ?next= (utils/loginPath.ts). The widget reads ?next= in the browser when it
  leaves, so this page reads no request data and needs no Suspense boundary.

  Search engines do not index it (A-24), and it is in no sitemap.
*/

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export async function generateMetadata() {
  const [, language] = (await langParam()).split("-");
  return {
    title: translateFunction("Login", language),
    robots: { index: false, follow: false },
  };
}

export default function LoginPage() {
  return <NewLoginWidget />;
}
