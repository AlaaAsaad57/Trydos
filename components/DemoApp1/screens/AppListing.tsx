"use client";

import React, { useEffect, useRef, useState } from "react";
import { MotionConfig } from "framer-motion";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAppStore } from "store";
import NextLink from "components/global/NextLink";
import { useIsModalRoute } from "components/ModalRoute/ModalRouteContext";
import { rememberBaseScroll } from "components/ModalRoute/overlayScroll";
import ListingSortControl from "components/Listing/ListingSortControl";
import ListingShareControl from "components/Listing/ListingShareControl";
import { BagNoResults } from "components/Listing/illustrations/ListingBagIllustration";
import { useListingSearch } from "components/filterPage/useListingSearch";
import { GetFilters } from "serverRequests/listing";
import { LogError, translateFunction } from "utils/functions";
import { DisableScroll, EnableScroll } from "utils/tinyUtils";
import { getFilterStateForItem } from "utils/listing/filterItemState";
import type { ListingProduct } from "types/listing";
import type { DemoDictionary, DemoKey } from "../../DemoApp/demoKeys";
import Toast, { useToast } from "../chat/Toast";
import { PAGE_MAX } from "../demo1Layout";
import { sentenceStyle, titleStyle } from "../demoCase";
import {
  toListingTiles,
  toStoreCard,
  withBag,
  type ListingCurrency,
  type ListingMark,
  type ListingTile,
  type StoreCard,
} from "../listingData";
import { usePageDir } from "../rtl";
import { useListingPages, type ListingSeed } from "../useListingPages";
import { StorePage, type MarkSlot, type StoreBanner } from "./StorePage";

/** Which listing this is: its address starts with `/filters`, `/flashDeals` or `/featured`. */
export type ListingKind = "filters" | "flashDeals" | "featured";

/**
 * Every product listing on the real app (Stage 7b, A-32): a boutique's page,
 * a category, brand or filter result, a search result, the flash deals and
 * the featured products. Each draws the store page design (`StorePage`,
 * XD `Home Page – 47`) with real data:
 *
 *  - the header: the boutique's logo, or the page's title (S7b-5); search
 *    with the live listing search (S7b-9); sort and share open the old
 *    sheets; filter opens the old filter sheet (A-4). Sort and filter show
 *    with more than one product, share with one or more, as before;
 *  - the banner: a boutique's card, only on a boutique's page (S7b-6, D-46);
 *  - the tiles: the result's categories; a tap filters by one (S7b-7);
 *  - the cards: Elasticsearch products, the next pages read as the shopper
 *    scrolls (useListingPages). A new order or search starts the list again
 *    in the browser, as the old grid did (`SortableGrid`);
 *  - the add button says "Soon available" until D-45 (S7b-1).
 *
 * English is in Apple's capital rules (D-4): title style for labels,
 * sentence style for messages; other languages use the server's dictionary.
 */
export default function AppListing({
  lang,
  kind,
  title,
  banner,
  categories,
  seed,
  currency,
  filters,
  serverSort,
  serverSearch,
  sizes,
  listName,
  dictionary,
  empty,
}: {
  lang: string;
  kind: ListingKind;
  title: ListingMark;
  banner: StoreBanner | null;
  /** The result's categories, as Elasticsearch sends them. */
  categories: unknown;
  seed: ListingSeed;
  currency: ListingCurrency;
  /** The page's filters from its address, with `featured` / `flashdeal` set. */
  filters: Record<string, any>;
  serverSort: string;
  serverSearch: string;
  sizes: string[] | null;
  listName: string;
  dictionary: DemoDictionary;
  /** The old "no products" block (A-4, S7b-10), drawn by the server. */
  empty: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const pageDir = usePageDir();
  const isModal = useIsModalRoute();
  const [, language] = lang.split("-");
  const english = language === "en";
  const t = (key: DemoKey) =>
    english ? titleStyle(key) : (dictionary[key] ?? key);
  const body = (key: DemoKey) =>
    english ? sentenceStyle(key) : (dictionary[key] ?? key);
  const [toast, showToast] = useToast();

  // The order and the search on show. Both change in the browser with no
  // server render (the sort sheet and the search write the address).
  const sort = params.get("sort") || "";
  const search = params.get("search") || "";
  const fromServer = sort === serverSort && search === serverSearch;
  const searching = search !== serverSearch;

  const pages = useListingPages({
    session: `${sort}|${search}`,
    lang,
    currency,
    filters: searching
      ? { ...filters, search_text: search || undefined }
      : filters,
    sort: sort || undefined,
    search: searching ? search : "",
    seed: fromServer
      ? seed
      : {
          products: [],
          offset: [],
          pitId: null,
          recommendedOffset: null,
          analytics: [],
        },
    fetchFirst: !fromServer,
    listName,
    sizes,
  });

  // The header's marks follow what the server found, until the browser reads again.
  useEffect(() => {
    if (!fromServer) return;
    const store = useAppStore.getState();
    store.setListingSearchLoading(false);
    store.setSearchHasResults(seed.products.length > 0);
    store.setSearchHasMultipleResults(seed.products.length > 1);
  }, [fromServer, seed.products.length]);
  const hasResults = useAppStore((s) => s.searchHasResults);
  const hasMany = useAppStore((s) => s.searchHasMultipleResults);
  const filterOpen = useAppStore((s) => s.filterEnabled);
  const filterPending = useAppStore((s) => !!s.isNavigating?.is_filter);
  const cart = useAppStore((s) => s.localCart) as any[];

  const tiles = useTiles({
    lang,
    kind,
    categories,
    filters,
    search,
    searching,
    query: params.toString(),
  });

  const listSearch = useListingSearch({ serverSearch, lang, filters });

  // The cards. The clock is read once per list, as the old card read it once per render.
  const [now] = useState(() => new Date());
  const byId = new Map<string, ListingProduct>();
  const cards: StoreCard[] = filterPending
    ? []
    : pages.products.map((p) => {
        const card = withBag(toStoreCard(p, lang, currency, now), cart ?? []);
        byId.set(card.id, p);
        return card;
      });

  /** Opens an address in the app, as the old links did (`NextLink`): the page loader shows `data`. */
  const goTo = (href: string, data: Record<string, unknown>) => {
    rememberBaseScroll(href);
    const store = useAppStore.getState();
    store.setColorBottomSheet(null);
    store.setLastPathname(pathname);
    store.setIsNavigating(data);
    router.push(href);
  };

  const backTo = (slot: MarkSlot) =>
    isModal ? (
      <button
        type="button"
        aria-label={slot.label}
        data-pw={slot.testId}
        onClick={() => router.back()}
        className={slot.className}
        style={slot.style}
      >
        {slot.icon}
      </button>
    ) : (
      <NextLink
        ignoreConditionCase
        data={{ is_full_home: true }}
        href={`/${lang}`}
        ariaLabel={slot.label}
        data-pw={slot.testId}
        className={slot.className}
        style={slot.style}
      >
        {slot.icon}
      </NextLink>
    );

  const toggleFilter = () => {
    if (!filterOpen) DisableScroll();
    else EnableScroll();
    useAppStore.getState().setFilterEnabled(!filterOpen);
  };

  // Nothing to show. The server's answer is known at once, so its block is
  // in the first HTML; a read in the browser is known when it ends.
  const nothing =
    !pages.loading &&
    pages.products.length === 0 &&
    (fromServer ? seed.products.length === 0 : pages.done);
  const noResults = !nothing ? undefined : fromServer ? (
    empty
  ) : (
    // A search in the browser that found nothing: the old words (A-4).
    <div
      data-pw="NoProductsFound"
      className="flex flex-col items-center text-center px-6 py-16"
    >
      <BagNoResults />
      <h2 className="f-16 medium color-dark-gray mt-4">
        {translateFunction("No products found", language)}
      </h2>
      <p className="f-14 mt-1 text-[#707070]">
        {translateFunction("Try changing or clearing your filters.", language)}
      </p>
    </div>
  );

  return (
    <MotionConfig reducedMotion="user">
      <div
        data-pw="app-listing"
        dir={pageDir}
        className="relative w-full mx-auto font-quicksand"
        style={{ maxWidth: PAGE_MAX, overflowX: "clip" }}
      >
        <StorePage
          t={t}
          body={body}
          header={{
            title,
            search: {
              value: listSearch.value,
              onChange: listSearch.onChange,
              onKeyDown: listSearch.onKeyDown,
              onFocus: listSearch.onFocus,
              onBlur: listSearch.onBlur,
              onClear: listSearch.clear,
              ghost: listSearch.ghost,
            },
            back: backTo,
            sort: (slot) =>
              hasMany ? (
                <ListingSortControl
                  key="sort"
                  language={language}
                  isRtl={pageDir === "rtl"}
                  trigger={slot}
                />
              ) : null,
            filter: (slot) =>
              hasMany ? (
                <button
                  key="filter"
                  type="button"
                  aria-label={slot.label}
                  aria-expanded={filterOpen}
                  data-pw={slot.testId}
                  onClick={toggleFilter}
                  className={slot.className}
                  style={slot.style}
                >
                  {slot.icon}
                </button>
              ) : null,
            share: (slot) =>
              hasResults ? (
                <ListingShareControl
                  key="share"
                  language={language}
                  isRtl={pageDir === "rtl"}
                  trigger={slot}
                />
              ) : null,
          }}
          banner={banner}
          tiles={tiles}
          onTile={(tile, e) => {
            e.preventDefault();
            goTo(tile.href, { is_filter: true });
          }}
          cards={cards}
          paging={{
            loading: pages.loading || filterPending,
            done: pages.done,
            end: pages.end,
            addedFrom: fromServer ? seed.products.length : 0,
          }}
          actions={{
            open: (card, colorIndex) => {
              const p = byId.get(card.id);
              goTo(card.links[colorIndex] ?? card.links[0], {
                name: p?.name,
                brand: p?.brand,
                images: [
                  p?.sync_color_images?.[0]?.images?.[0] ?? p?.images?.[0],
                ],
                price: p?.price,
                is_luck: p?.is_luck,
                offer_price: p?.offer_price,
                is_product: true,
              });
            },
            warm: (card, colorIndex) =>
              router.prefetch(card.links[colorIndex] ?? card.links[0]),
            add: () => showToast(t("Soon available")),
          }}
          empty={noResults}
          tabBar={false}
        />
        <Toast text={toast} bottom={110} fixed />
      </div>
    </MotionConfig>
  );
}

/**
 * The category tiles (S7b-7). A tile is a link to the listing with that
 * category picked, by the old category chip's rule (`getFilterStateForItem`),
 * with the page's order and search kept. A search typed in the browser
 * reads the categories of the new result, as the old filter row did
 * (`FilterListReactive`).
 */
function useTiles({
  lang,
  kind,
  categories,
  filters,
  search,
  searching,
  query,
}: {
  lang: string;
  kind: ListingKind;
  categories: unknown;
  filters: Record<string, any>;
  search: string;
  searching: boolean;
  query: string;
}): ListingTile[] {
  const [country, language] = lang.split("-");
  const [fresh, setFresh] = useState<unknown>(null);
  const latest = useRef(0);
  useEffect(() => {
    if (!searching) {
      setFresh(null);
      return;
    }
    const id = ++latest.current;
    const wait = setTimeout(async () => {
      try {
        const res = await GetFilters({
          country,
          language,
          filter_offset: 1,
          filters: { ...filters, search_text: search || undefined },
        });
        if (id === latest.current && res) setFresh(res.categories ?? []);
      } catch (error) {
        if (id === latest.current)
          LogError({ error, scenario: "AppListing GetFilters" });
      }
    }, 400);
    return () => clearTimeout(wait);
  }, [searching, search, country, language, filters]);
  const base = `/${kind}`;
  return toListingTiles(
    searching && fresh ? fresh : categories,
    (slug) =>
      getFilterStateForItem(
        filters as any,
        slug,
        "categories",
        undefined,
        lang,
        base,
        query,
      ).href,
  );
}
