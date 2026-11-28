import { DEMO_ORDERS } from "components/DemoApp/demoOrders";

// The fluid demo shell (the layout at the top of /demo) draws this screen from the
// URL, so the page itself has nothing to render — and a page that renders
// nothing never blocks a navigation.
export const instant = false;

// The demo's own orders (demoOrders.ts) are built ahead of time, as
// demo/store/[store]/[product]/page.tsx does.
export function generateStaticParams() {
  return DEMO_ORDERS.map((order) => ({ id: order.id }));
}

// The params are awaited at the top, as the real settings/orders/[id] page does,
// so an id not listed above renders on request. Without that, the build makes a
// shell for an unknown id, where the [lang] layout's screen mount reads the path
// outside Suspense, and the build fails ("client rendering was requested
// outside a Suspense boundary").
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  await params;
  return null;
}
