import { signedInScreenPage } from "serverRequests/settings/screenPage";

// The checkout (Stage 7d of UI-MIGRATION-PLAN.md). The screen mount
// (components/DemoApp1/AppScreens) draws the new checkout (XD `Home Page –
// 56`, AppCheckout) on this path, so the page renders nothing. It sends a
// guest to the login first, with this path as the way back (A-27).

// TODO: Cache Components adoption. The guest check reads the profile cookie.
export const instant = false;

// A shopper's own checkout: nothing here for a search engine.
export const metadata = {
  robots: { index: false, follow: false },
};

export default function Page() {
  return signedInScreenPage("cart/checkout");
}
