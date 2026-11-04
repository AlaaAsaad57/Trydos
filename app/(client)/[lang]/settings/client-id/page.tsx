import { signedInScreenPage } from "serverRequests/settings/screenPage";

// The screen mount (components/DemoApp1/AppScreens) draws the client ID card on this
// path (Stage 4 of UI-MIGRATION-PLAN.md). The page renders nothing; it only
// sends a guest to the login first (S4-4).

// TODO: Cache Components adoption. The page reads the profile cookie.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export default function Page() {
  return signedInScreenPage("settings/client-id");
}
