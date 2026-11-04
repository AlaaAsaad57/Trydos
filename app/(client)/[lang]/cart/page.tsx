import CartPage from "components/Cart/CartPage";

// The cart and its checkout (Stage 3, D-18 / S3-7). It was a drawer over every
// page; now it is this page, inside the shell, with the bottom nav visible.
//
// Instant validation is off, as on /demo and /loginDemo: the check renders the
// whole route from the root, and the shared [lang] layout above this folder
// (DeferredLayoutClients) cannot be validated yet. That is a Cache Components
// adoption task for the root layout, not something this page can fix.
export const instant = false;

// A shopper's own cart: nothing here for a search engine.
export const metadata = {
  robots: { index: false, follow: false },
};

export default function Page() {
  return <CartPage />;
}
