"use client";

import React, { useEffect, useRef, useState } from "react";
import { hrefFor } from "../../DemoApp/demoRoutes";
import {
  openProductInColor,
  productFirstImages,
} from "../../DemoApp/demoProduct";
import {
  LISTING_CATEGORIES,
  LISTING_FIRST_IMAGES,
  LISTING_PAGES,
  listingPage,
  productScreen,
  storeBySlug,
  type DemoProduct,
  type DemoStore,
} from "../../DemoApp/demoStores";
import type { StoreCard } from "../listingData";
import { useDemoNav } from "../Demo1Shell";
import { useDemoCase } from "../demoCase";
import type { T } from "./ListingParts";
import { StorePage, type MarkSlot } from "./StorePage";
import { useSettled } from "./useSettled";

/**
 * The demo's store page, with the mock store: `/[lang]/demo/store/<slug>`.
 * The page itself is `StorePage`; the real listings draw it from AppListing.
 */

/** The file's height for this board; the demo page is at least this tall. */
const BOARD_H = 1779;

let warmed = false;

/**
 * Starts loading the first pictures of a store's page, so they are already
 * there when it opens. Home calls it when a finger or the mouse is on a card,
 * a moment before the tap. It runs once. (/demo only.)
 */
export function warmListing() {
  if (warmed || typeof window === "undefined") return;
  warmed = true;
  for (const src of LISTING_FIRST_IMAGES) {
    const img = new Image();
    img.decoding = "async";
    img.src = src;
  }
}

/** Starts loading the first photos of a product's page, once per colour. */
const warmedProducts = new Set<string>();
function warmProduct(product: DemoProduct, colorIndex: number) {
  const key = `${product.id}:${colorIndex}`;
  if (warmedProducts.has(key)) return;
  warmedProducts.add(key);
  for (const src of productFirstImages(product, colorIndex)) {
    const img = new Image();
    img.decoding = "async";
    img.src = src;
  }
}

/** Starts loading the first photo of every colour of a product, once. */
const warmedColors = new Set<string>();
function warmColors(product: {
  id: string;
  colors: readonly { images: readonly string[] }[];
}) {
  if (warmedColors.has(product.id)) return;
  warmedColors.add(product.id);
  for (const color of product.colors) {
    const img = new Image();
    img.decoding = "async";
    img.src = color.images[0];
  }
}

/** How long a "next page" takes, as a quick real request would. */
const PAGE_LOAD_MS = 900;

/** How far under the screen the end of the list may be when the next page starts to load. */
const LOAD_AHEAD = "0px 0px 800px 0px";

/**
 * Paging, as a shop app does it: when the end of the list comes within
 * LOAD_AHEAD of the screen, the next page "loads" for PAGE_LOAD_MS. Its
 * photos start to download at once, so they are mostly there when the
 * cards come in. If the end is still near after that, the next page loads
 * too. Nothing loads after the last page.
 */
function usePages(enabled: boolean) {
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const end = useRef<HTMLDivElement>(null);
  const done = pages >= LISTING_PAGES;

  useEffect(() => {
    const node = end.current;
    if (!enabled || !node || done || loading) return;
    const watch = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setLoading(true);
      },
      { rootMargin: LOAD_AHEAD },
    );
    watch.observe(node);
    return () => watch.disconnect();
  }, [enabled, done, loading]);

  useEffect(() => {
    if (!loading) return;
    for (const product of listingPage(pages + 1)) {
      const img = new Image();
      img.decoding = "async";
      img.src = product.image;
    }
    const wait = setTimeout(() => {
      setPages((n) => n + 1);
      setLoading(false);
    }, PAGE_LOAD_MS);
    return () => clearTimeout(wait);
  }, [loading, pages]);

  return { pages, loading, done, end };
}

/** The cards drawn on the tap: two rows, more than a phone's screen shows under the banner. */
const FIRST_CARDS = 4;

/** A mock product as a card. */
function demoCard(
  product: DemoProduct,
  store: DemoStore,
  link: string,
  t: T,
): StoreCard {
  return {
    id: product.id,
    links: product.colors.map(() => link),
    name: product.name.map((word) => t(word)),
    mark: { name: store.name, logo: store.logo },
    colors: product.colors.map((c) => ({
      name: t(c.name),
      swatch: c.swatch,
      images: c.images,
    })),
    selected: product.selected,
    labels: [product.badge, ...(product.labels ?? [])],
    price: String(product.price),
    currency: t(product.currency),
    line: product.line,
    inBag: product.addColor === "purple",
  };
}

/** The demo's store page (mock data), at /[lang]/demo/store/<slug>. */
export default function ListingScreen({ slug }: { slug: string }) {
  // Labels in Apple's title style, messages in sentence style (demoCase).
  const { t, body } = useDemoCase();
  const { navigate, locale, back } = useDemoNav();
  const settled = useSettled();
  // The next page loads only once the whole first page is there.
  const { pages, loading, done, end } = usePages(settled);
  const [query, setQuery] = useState("");
  const store = storeBySlug(slug);
  if (!store) return null;
  const products = Array.from({ length: pages }, (_, p) =>
    p === 0 && !settled
      ? listingPage(1).slice(0, FIRST_CARDS)
      : listingPage(p + 1),
  ).flat();
  const byId = new Map(products.map((p) => [p.id, p]));
  const cards = products.map((p) =>
    demoCard(p, store, hrefFor(locale, productScreen(store.slug, p.id)), t),
  );
  return (
    <StorePage
      t={t}
      body={body}
      header={{
        title: { name: store.name, logo: store.logo },
        // No results design yet: the field takes text.
        back: (slot: MarkSlot) => (
          <button
            type="button"
            aria-label={slot.label}
            data-pw={slot.testId}
            onClick={back}
            className={slot.className}
            style={slot.style}
          >
            {slot.icon}
          </button>
        ),
        search: {
          value: query,
          onChange: setQuery,
          onClear: () => setQuery(""),
        },
      }}
      banner={{ name: store.name, shown: store.shown, logo: store.logo }}
      tiles={LISTING_CATEGORIES.map((c) => ({
        key: c.key,
        name: t(c.key),
        image: c.image,
        href: "",
        color: c.color,
      }))}
      cards={cards}
      paging={{ loading, done, end, addedFrom: listingPage(1).length }}
      actions={{
        /**
         * The product's page slides in as one Home slide, the same as a
         * store's page from Home (Demo1Shell).
         */
        open: (card, colorIndex, el) => {
          openProductInColor(card.id, colorIndex);
          navigate(productScreen(store.slug, card.id), 1, el);
        },
        warm: (card, colorIndex) => {
          const product = byId.get(card.id);
          if (product) warmProduct(product, colorIndex);
        },
        warmColors,
      }}
      tabBar
      contentHeight={BOARD_H}
    />
  );
}
