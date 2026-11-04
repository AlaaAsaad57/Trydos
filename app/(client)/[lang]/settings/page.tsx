import { lang as langParam } from "next/root-params";
import { translateFunction } from "utils/server";
import { buildAlternates } from "serverRequests/meta/buildAlternates";
import { signedInScreenPage } from "serverRequests/settings/screenPage";

// The screen mount (components/DemoApp1/AppScreens) draws the profile tab (XD `Home Page – 9`) on this
// path (Stage 4 of UI-MIGRATION-PLAN.md). The page renders nothing; it only
// sends a guest to the login first (S4-4).

// TODO: Cache Components adoption. The page reads the profile cookie.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export async function generateMetadata() {
  const lang = await langParam();
  const [, language] = lang?.split("-");
  const metadata = {
    title: translateFunction("Settings - TryDos", language),
    description: translateFunction(
      "Manage your account settings and preferences.",
      language,
    ),
    alternates: buildAlternates(lang, "/settings"),
  };
  return metadata;
}

export default function Page() {
  return signedInScreenPage("settings");
}
