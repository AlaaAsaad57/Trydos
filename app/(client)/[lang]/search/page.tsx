import { lang as langParam } from "next/root-params";
import AppSearch from "components/DemoApp1/screens/AppSearch";
import type { DemoDictionary, DemoKey } from "components/DemoApp/demoKeys";
import { translateFunction } from "utils/server";

// The search page (Stage 7 of UI-MIGRATION-PLAN.md, S7-2, D-44). Until now the
// search opened over the home page and had no address.
//
// Instant validation is off, as on the cart page: the check renders the whole
// route from the root, and the shared [lang] layout cannot be validated yet.
export const instant = false;

// The design keys the search page shows. Here, not in AppSearch.tsx: a server
// file that imports a value from a "use client" file gets a reference, not
// the list.
const SEARCH_KEYS: DemoKey[] = ["Search anything…", "Voice search", "Scan", "For you"];

// An empty field until the shopper types: nothing here for a search engine.
// The result listings (/[lang]/filters/...?search=) stay indexable.
export async function generateMetadata() {
  const language = (await langParam()).split("-")[1] || "en";
  return {
    title: `${translateFunction("Search", language)} | Trydos`,
    robots: { index: false, follow: false },
  };
}

export default async function SearchPage() {
  const lang = await langParam();
  const language = lang.split("-")[1] || "en";
  // English does not use the dictionary: the screen writes the keys in
  // Apple's capital rules itself (D-4).
  const dictionary: DemoDictionary =
    language === "en"
      ? {}
      : Object.fromEntries(
          SEARCH_KEYS.map((key) => [key, translateFunction(key, language)]),
        );
  return <AppSearch lang={lang} dictionary={dictionary} />;
}
