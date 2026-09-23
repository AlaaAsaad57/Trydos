// The demo shell (the layout at the top of /demo) draws this screen from the
// URL, so the page itself has nothing to render — and a page that renders
// nothing never blocks a navigation.
//
// Instant validation is off, as on /loginDemo: the check renders the whole
// route from the root, and the shared [lang] layout above this folder
// (DeferredLayoutClients) cannot be validated yet. That is a Cache Components
// adoption task for the root layout, not something this page can fix.
export const instant = false;

export default function Page() {
  return null;
}
