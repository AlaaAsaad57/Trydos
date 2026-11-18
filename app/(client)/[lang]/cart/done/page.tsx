import { signedInScreenPage } from "serverRequests/settings/screenPage";

// The purchase done (Stage 7d of UI-MIGRATION-PLAN.md). The screen mount
// (components/DemoApp1/AppScreens) draws it (XD `Home Page – 103`,
// AppOrderDone) on this path, so the page renders nothing. A guest goes to
// the login first, as on the checkout.

// TODO: Cache Components adoption. The guest check reads the profile cookie.
export const instant = false;

// A shopper's own order: nothing here for a search engine.
export const metadata = {
  robots: { index: false, follow: false },
};

export default function Page() {
  return signedInScreenPage("cart/done");
}
