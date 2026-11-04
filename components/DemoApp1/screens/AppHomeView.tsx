import { Suspense } from "react";
import { lang as langParam } from "next/root-params";
import { connection } from "next/server";
import Home from "components/Home";
import {
  getCachedBoutiques,
  getCachedCategories,
} from "serverRequests/cached/home";
import { translateFunction } from "utils/server";
import type { DemoDictionary, DemoKey } from "../../DemoApp/demoKeys";
import {
  HOME_FIRST_READ,
  splitHomeStores,
  toHomeChips,
  toHomeStores,
} from "../homeData";
import AppHome from "./AppHome";

/** The design keys the new home shows (header and body). */
const HOME_KEYS: DemoKey[] = [
  "Search",
  "Trydos Stories",
  "Watch. Shop. Share. See it. Tag It !",
  "Brand Stores",
  "all {name} collection now !",
  "Turkish brands",
  "Stores",
  "Shop {brand} collection now !",
];

/**
 * An empty part that waits for the request. The home's metadata
 * (GetHomeMetaData) reads Redis at request time. Next allows that only on a
 * page with some request-time content; the old home had one (the recommended
 * row reads a cookie), the new one has none, and Next then stops with
 * "uncached data in generateMetadata()". This part, in its own Suspense, keeps
 * the page as it was: the content prerenders, the metadata is built per
 * request. See node_modules/next/dist/docs/01-app/03-api-reference/
 * 04-functions/generate-metadata.md (the DynamicMarker example).
 */
async function RequestTime() {
  await connection();
  return null;
}

/**
 * The new home, on the server: `/[lang]` (slug null) and
 * `/[lang]/categories/<slug>` (Stage 7, S7-1, S7-4).
 *
 * Both reads are cached (`cacheLife("homepage")` and their tags), so nothing
 * here reads a cookie, a header or the clock, and the page stays a shared
 * cache entry. The stories are read in the browser (useHomeStories).
 *
 * The cards are real links to the boutique pages in the server's HTML, for
 * search engines (D-42). Featured, flash deals and recommended are not shown
 * (S7-1); their code stays.
 */
export default async function AppHomeView({ slug }: { slug: string | null }) {
  const lang = await langParam();
  const [country, language] = lang.split("-");

  const [categories, boutiques] = await Promise.all([
    getCachedCategories(country, language),
    getCachedBoutiques(country, language, slug, HOME_FIRST_READ),
  ]);
  const { brands, stores } = splitHomeStores(
    toHomeStores(boutiques.boutiques, lang),
  );

  // English does not use the dictionary: the screen writes the keys in
  // Apple's title style itself (D-4).
  const dictionary: DemoDictionary =
    language === "en"
      ? {}
      : Object.fromEntries(
          HOME_KEYS.map((key) => [key, translateFunction(key, language)]),
        );

  const chips = toHomeChips(categories, lang, slug);
  // The page's one h1 (D-42, owner's answer 2026-11-04: a hidden h1). The
  // design draws no title, so screen readers and search engines read it, and
  // nobody sees it. On a category page it is the category's name.
  const heading =
    chips.find((c) => c.picked)?.name ?? translateFunction("Trydos", language);

  return (
    <>
      <h1 className="sr-only">{heading}</h1>
      <AppHome
        lang={lang}
        category={slug}
        chips={chips}
        brands={brands}
        stores={stores}
        storesOffset={boutiques.offset}
        words={{
          dictionary,
          addStory: translateFunction("Add Story", language),
        }}
      />
      {/* The `?message=` toasts (a dead product or boutique sends the shopper
          home with one) and the name prompt. It reads useSearchParams, so it
          has its own Suspense: an unwrapped read would make the whole route
          dynamic. */}
      <Suspense fallback={null} key={`Home ${lang}`}>
        <Home />
      </Suspense>
      <Suspense fallback={null}>
        <RequestTime />
      </Suspense>
    </>
  );
}
