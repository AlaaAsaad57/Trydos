"use client";

import { useEffect, useRef, useState } from "react";
import { useAppStore } from "store";
import { showErrorNotification } from "store/notifications/reducer";
import { translateFunction } from "utils/functions";
import { GAevent } from "utils/gtag";
import { GA_EVENT_NAMES, GA_GLOBAL_SCREEN } from "utils/GAEvents";
import { EnableScroll } from "utils/tinyUtils";
import auth from "services/auth";
import { GetProducts } from "serverRequests/listing";
import type { GAProductListItem, ListingProduct } from "types/listing";

/**
 * The store page's next pages (Stage 7b, A-16). The old listing's paging
 * (`ProductsInfiniteScroll`), with the same rules, for the new grid:
 *
 *  - the next page is read with the `GetProducts` server action, from the
 *    cursor (`offset`) of the last page, in the same Elasticsearch snapshot
 *    (`pit_id`, ADR-009);
 *  - only products not seen yet are added; a full page of seen ones moves on
 *    to the next page, at most MAX_EMPTY_PAGES times;
 *  - the end is an empty page, a page shorter than PAGE_LIMIT, or a cursor
 *    that did not move;
 *  - a failed read says so and tries again after 3 s;
 *  - every new product is reported once in `view_item_list`.
 *
 * A "session" is one order and one search. A new session (the shopper
 * changed `?sort=` or `?search=` in the browser) starts again from page 1:
 * `first` is then empty and `fetchFirst` true. For a search session, page 1
 * sends the words as typed and the next pages send the analyzed name.
 */

/** Page size asked from the server; a shorter page is the last one. */
const PAGE_LIMIT = 10;
const MAX_EMPTY_PAGES = 5;

/** How far under the screen the end of the list may be when the next page starts to load. */
const LOAD_AHEAD = "0px 0px 800px 0px";

export type ListingSeed = {
  products: ListingProduct[];
  offset: unknown;
  pitId: string | null;
  recommendedOffset: unknown;
  /** The first page's products for `view_item_list`. */
  analytics: GAProductListItem[];
};

function screenName() {
  const url = window.location.pathname;
  if (url.includes("filters/boutique")) return GA_GLOBAL_SCREEN.BOUTIQUE_SCREEN;
  if (url.includes("tags_names")) return GA_GLOBAL_SCREEN.TAGS_SCREEN;
  if (url.includes("/filters")) return GA_GLOBAL_SCREEN.FILTERS_SCREEN;
  return GA_GLOBAL_SCREEN.HOME_SCREEN;
}

const same = (a: unknown, b: unknown) =>
  Array.isArray(a) &&
  Array.isArray(b) &&
  a.length === b.length &&
  a.every((v, i) => v === b[i]);

export function useListingPages({
  session,
  lang,
  currency,
  filters,
  sort,
  search,
  seed,
  fetchFirst,
  listName,
  sizes,
}: {
  /** Changes when the order or the search changes: the list starts again. */
  session: string;
  lang: string;
  currency: unknown;
  /** The page's filters, with `featured` / `flashdeal` set. */
  filters: Record<string, unknown>;
  sort?: string;
  /** The words of a search session; empty when this is not one. */
  search: string;
  /** The server's first page; empty for a session started in the browser. */
  seed: ListingSeed;
  /** True: read page 1 now (a session started in the browser). */
  fetchFirst: boolean;
  /** `item_list_name` for `view_item_list`. */
  listName: string;
  sizes: string[] | null;
}) {
  const [country, language] = lang.split("-");
  const [products, setProducts] = useState<ListingProduct[]>(seed.products);
  const [loading, setLoading] = useState(fetchFirst);
  const [done, setDone] = useState(false);
  const end = useRef<HTMLDivElement>(null);

  // The read's state lives in refs: the observer and the retry read them later.
  const offset = useRef<unknown>(seed.offset);
  const recommended = useRef<unknown>(seed.recommendedOffset);
  const pit = useRef<string | null>(seed.pitId);
  const searchName = useRef<string | null>(search || null);
  const seen = useRef(new Set(seed.analytics.map((p) => String(p?.item_id))));
  const emptyPages = useRef(0);
  const busy = useRef(false);
  const ended = useRef(false);
  const retry = useRef<ReturnType<typeof setTimeout> | null>(null);
  const current = useRef(session);

  const read = async (): Promise<void> => {
    if (busy.current || ended.current) return;
    const mine = current.current;
    busy.current = true;
    setLoading(true);
    let again = false;
    let isFirst = false;
    try {
      isFirst = seen.current.size === 0;
      const response = await GetProducts({
        country,
        language,
        currency,
        offset: offset.current,
        parsedFilters: search
          ? { ...filters, search_text: searchName.current || undefined }
          : filters,
        userId: useAppStore.getState().userProfile?.id,
        recomended_offset: recommended.current,
        sizes_filters: sizes,
        sort,
        pit_id: pit.current,
      });
      // A newer session started while this page was on its way.
      if (mine !== current.current) return;
      if (!response) {
        showErrorNotification(
          translateFunction("Failed To Load Products Retring in 3 seconds"),
        );
        retry.current = setTimeout(() => void read(), 3000);
        return;
      }
      // The analyzed name from page 1 keeps the next pages the same search.
      if (search && searchName.current === search) {
        const analyzed = response?.isAnalyzed?.name;
        if (analyzed && typeof analyzed === "string")
          searchName.current = analyzed;
      }
      const stuck = same(offset.current, response.offset);
      const last =
        response.products.length === 0 ||
        stuck ||
        response.products.length < PAGE_LIMIT;
      const ids = (
        response.productIds?.length
          ? response.productIds
          : (response.GA_PRODUCTS_LIST || []).map((p) => p?.item_id)
      ).map((id) => String(id));
      const fresh = ids
        .map((id, index) => ({ id, index }))
        .filter(({ id }) => {
          if (!id || id === "undefined" || seen.current.has(id)) return false;
          seen.current.add(id);
          return true;
        })
        .map(({ index }) => index);
      const added = fresh.map((i) => response.products[i]).filter(Boolean);
      if (added.length > 0) setProducts((prev) => [...prev, ...added]);
      const analytics = fresh
        .map((i) => response.GA_PRODUCTS_LIST?.[i])
        .filter(Boolean);
      if (analytics.length > 0) {
        GAevent({
          action: GA_EVENT_NAMES.VIEW_ITEMS_LIST,
          params: {
            items: analytics,
            item_list_name: listName,
            user_id_custom: auth.UserID(),
            screen_name: screenName(),
            screen_path: window.location.pathname,
          },
        });
      }
      offset.current = response.offset;
      recommended.current = response.recomended_offset;
      pit.current = response.pit_id ?? pit.current;
      if (last) {
        ended.current = true;
        setDone(true);
        return;
      }
      if (added.length === 0) {
        emptyPages.current += 1;
        if (emptyPages.current >= MAX_EMPTY_PAGES) {
          ended.current = true;
          setDone(true);
          return;
        }
        again = true;
      } else {
        emptyPages.current = 0;
      }
    } finally {
      if (mine === current.current) {
        busy.current = false;
        setLoading(false);
        if (isFirst) {
          // A session's first page is here: the page loader goes, and the
          // header's marks learn whether there is anything to sort or share.
          const store = useAppStore.getState();
          store.setIsNavigating(null);
          store.setListingSearchLoading(false);
          store.setSearchHasResults(seen.current.size > 0);
          store.setSearchHasMultipleResults(seen.current.size > 1);
        }
      }
    }
    if (again) setTimeout(() => void read(), 0);
  };

  // A new session: start again from page 1. The first session starts here too.
  useEffect(() => {
    current.current = session;
    if (retry.current) clearTimeout(retry.current);
    busy.current = false;
    ended.current = false;
    emptyPages.current = 0;
    offset.current = seed.offset;
    recommended.current = seed.recommendedOffset;
    pit.current = seed.pitId;
    searchName.current = search || null;
    seen.current = new Set(seed.analytics.map((p) => String(p?.item_id)));
    setProducts(seed.products);
    setDone(false);
    // A read of the old session may be on its way: it will not clear this.
    setLoading(false);
    if (fetchFirst) {
      void read();
    } else {
      // The server's page is here already: the page loader goes.
      useAppStore.getState().setIsNavigating(null);
      GAevent({
        action: GA_EVENT_NAMES.VIEW_ITEMS_LIST,
        params: {
          items: seed.analytics,
          item_list_name: listName,
          screen_name: screenName(),
          screen_path: window.location.pathname,
          user_id_custom: auth.UserID(),
        },
      });
      EnableScroll();
      useAppStore.getState().resetBoutique();
      // A short first page is the whole list.
      if (seed.products.length < PAGE_LIMIT) {
        ended.current = true;
        setDone(true);
      }
    }
    return () => {
      if (retry.current) clearTimeout(retry.current);
    };
    // Only a new session starts the list again.
  }, [session]);

  // The next page, when the end of the list comes near.
  useEffect(() => {
    const node = end.current;
    if (!node || done || loading) return;
    const watch = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) void read();
      },
      { rootMargin: LOAD_AHEAD },
    );
    watch.observe(node);
    return () => watch.disconnect();
    // `read` is new on each render; the observer is set again when the list moves on.
  }, [done, loading, products.length, session]);

  return { products, loading, done, end };
}
