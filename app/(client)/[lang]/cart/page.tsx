// The bag (Stage 7d of UI-MIGRATION-PLAN.md). The screen mount
// (components/DemoApp1/AppScreens) draws the new bag (XD `Home Page – 50`,
// AppCart) on this path, so the page itself renders nothing. A guest has a
// cart too, so there is no login gate here; the checkout asks for one.
//
// Instant validation is off, as on the other screen pages: the shared [lang]
// layout above this folder cannot be validated yet.
export const instant = false;

// A shopper's own cart: nothing here for a search engine.
export const metadata = {
  robots: { index: false, follow: false },
};

export default function Page() {
  return null;
}
