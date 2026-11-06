import { getConfiguredImage, GetImageUrl } from "utils/server/helpers";

/**
 * Real data for the new home (Stage 7 of UI-MIGRATION-PLAN.md, A-16).
 *
 * Plain functions with no React in them. The home page reads the boutiques
 * and the main categories on the server (cached), maps them here, and gives
 * the screen plain values. The grid's next pages are read in the browser and
 * mapped by the same functions, so both reads give the same shape.
 *
 * Only `utils/server/helpers` is imported: it is safe in client bundles,
 * unlike `utils/server` (which carries the translation tables).
 */

/** A boutique, as a card on the home draws it. */
export type HomeStore = {
  slug: string;
  /** The boutique's name, as the backend sends it for the page's language. */
  name: string;
  /** The boutique's logo (its `icon`), or null when it has none. */
  logo: string | null;
  /** The boutique's page. */
  href: string;
};

/** A main category, as a chip in the home header draws it. */
export type HomeChip = {
  slug: string;
  name: string;
  /** The category's home: `/[lang]/categories/<slug>` (S7-4). */
  href: string;
  /** True only on that category's own page (S7-8). */
  picked: boolean;
};

/** A logo draws 20 px high: three times that stays sharp on a phone. */
const LOGO_PX = 60;

/** The Brand Stores carousel takes the first 9 boutiques: 3 pages of 3 (S7-3). */
export const HOME_BRAND_COUNT = 9;

/** The first read: 9 for the carousel and 12 for the grid's 4 columns of 3 (S7-7). */
export const HOME_FIRST_READ = HOME_BRAND_COUNT + 12;

/** Each next read of the grid: 4 more columns of 3 (S7-7). */
export const HOME_NEXT_READ = 12;

/** The first page of the stories row. See utils/earlyStories.ts. */
export const HOME_STORIES_PATH = "/api/v1/stories/users_stories?page=1";

/**
 * One boutique from the boutiques reader (`custom_boutiques` in
 * Elasticsearch). Returns null for a boutique with no slug, because a card
 * with no page to open is a dead card.
 */
export function toHomeStore(boutique: any, lang: string): HomeStore | null {
  const slug = typeof boutique?.slug === "string" ? boutique.slug : "";
  if (!slug) return null;
  return {
    slug,
    name: typeof boutique?.name === "string" ? boutique.name : "",
    logo: boutique?.icon
      ? getConfiguredImage({ src: GetImageUrl(boutique.icon), height: LOGO_PX }) ||
        null
      : null,
    href: `/${lang}/filters/boutiques/${slug}`,
  };
}

/** Every boutique of a read, in the backend's order, with the dead ones left out. */
export function toHomeStores(boutiques: unknown, lang: string): HomeStore[] {
  if (!Array.isArray(boutiques)) return [];
  return boutiques
    .map((b) => toHomeStore(b, lang))
    .filter((s): s is HomeStore => s !== null);
}

/**
 * S7-3: the live boutiques have no "brand store" field. So the backend's
 * order (`boutique_position`) decides: the first 9 are the brand stores, the
 * rest go to the grid.
 */
export function splitHomeStores(stores: HomeStore[]): {
  brands: HomeStore[];
  stores: HomeStore[];
} {
  return {
    brands: stores.slice(0, HOME_BRAND_COUNT),
    stores: stores.slice(HOME_BRAND_COUNT),
  };
}

/**
 * The main categories as header chips. On a category's page (S7-4) its chip
 * is picked and moves to the front, as the old category bar does
 * (`components/Server/MainCategories`). On the home no chip is picked (S7-8).
 * A category with no slug or no name is left out.
 */
export function toHomeChips(
  categories: unknown,
  lang: string,
  activeSlug: string | null,
): HomeChip[] {
  if (!Array.isArray(categories)) return [];
  const chips = categories
    .filter(
      (c) =>
        typeof c?.slug === "string" &&
        c.slug &&
        typeof c?.name === "string" &&
        c.name,
    )
    .map((c) => ({
      slug: c.slug as string,
      name: c.name as string,
      href: `/${lang}/categories/${c.slug}`,
      picked: activeSlug !== null && c.slug === activeSlug,
    }));
  const picked = chips.filter((c) => c.picked);
  return [...picked, ...chips.filter((c) => !c.picked)];
}
