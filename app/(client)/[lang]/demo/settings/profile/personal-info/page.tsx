import { redirectToDemo1 } from "../../../redirectToDemo1";

// /demo is off: this page sends the browser to the same screen on /demo1
// (see redirectToDemo1.ts).
//
// Instant validation is off, as on /loginDemo: the check renders the whole
// route from the root, and the shared [lang] layout above this folder
// (DeferredLayoutClients) cannot be validated yet. That is a Cache Components
// adoption task for the root layout, not something this page can fix.
export const instant = false;

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await redirectToDemo1("settings/profile/personal-info", searchParams);
}
