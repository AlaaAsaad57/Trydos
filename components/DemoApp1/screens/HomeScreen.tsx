"use client";

import type { DemoKey } from "../../DemoApp/demoKeys";
import React, { useState } from "react";
import { useDemoNav } from "../Demo1Shell";
import { C } from "../demo1Layout";
import { ScreenPage } from "../ui";
import { hrefFor } from "../../DemoApp/demoRoutes";
import { HomeHeader } from "./HomeHeader";
import {
  storeBySlug,
  storeScreen,
  type DemoStore,
} from "../../DemoApp/demoStores";
import HomeSections, { type HomeCard, type HomeStoryCard } from "./HomeSections";
import { useDemoCase } from "../demoCase";
import { warmListing } from "./ListingScreen";

/**
 * Home — XD `Home Page` (the header) and `Home Page – 2` (the page under it,
 * in ./HomeSections.tsx).
 *
 * A white 50 px header (shadow 0 0 3, black at 10%) over a `#FCFCFC` page.
 * On the left the categories mark (21 x 21 at 15.5, 64.5), then the category
 * chips: 32 tall at y 59, 12 px of padding, 13 px text. The picked chip is
 * `#F8F7FF` with a 0.3 `#707070` line and Medium text; the rest are bare
 * Regular text.
 *
 * The chips are a row that scrolls sideways, starting at x 60. Each chip is a
 * slot as wide as the file's step to the next chip (the words start at x 72,
 * 128, 204, 283 and 348), so in English every word lands on the file's x in
 * any browser, whatever width the browser gives the word. The picked pill
 * hugs its word (12 px each side). A longer word in another language makes
 * its slot wider, keeps 4 px before the next pill, and the row scrolls.
 *
 * On /demo the header is the sticky head of a fluid page (`ScreenPage`), and
 * the chip row takes whatever width the screen leaves after the mark.
 */
const CATEGORIES = ["Man", "Women", "Children", "Home", "Electronic"] as const;

/** Slot widths: the file's distance from one chip's left edge to the next. */
const SLOTS = [56, 76, 79, 65, undefined] as const;

/*
  The /demo body's data: the file's own stores and pictures (XD `Home Page – 2`).
  The app gives HomeSections real data instead (Stage 7, A-16).
*/
const demoStore = (slug: string): DemoStore => {
  const found = storeBySlug(slug);
  if (!found) throw new Error(`demoStores.ts has no store "${slug}"`);
  return found;
};

const card = (s: DemoStore, withLogo = true): HomeCard => ({
  slug: s.slug,
  name: s.name,
  shown: s.shown,
  logo: withLogo ? s.logo : undefined,
});

/** The file draws three carousel pages, each with the same three brands. */
const DEMO_BRANDS: HomeCard[] = Array.from({ length: 3 }, () =>
  ["zara", "mango", "vakko"].map((slug) => card(demoStore(slug))),
).flat();

/** The store grid, down each column. The last two columns have no logo in the file. */
const DEMO_STORES: HomeCard[] = [
  [["ebebek", true], ["boyner", true], ["sephora", true]],
  [["gratis", true], ["beymen", true], ["rossmann", true]],
  [["vakko", false], ["koton", false], ["zara", false]],
  [["stradivarius", false], ["bershka", false], ["koton", false]],
].flatMap((column) =>
  column.map(([slug, logo]) => card(demoStore(slug as string), logo as boolean)),
);

/** The file's four story cards. */
const DEMO_STORIES: HomeStoryCard[] = [
  ["Jon Plus", "story-jon.jpg"],
  ["Eda Love", "story-eda.jpg"],
  ["Ella", "story-ella.jpg"],
  ["Secret", "story-secret.jpg"],
].map(([name, photo]) => ({
  id: name,
  name,
  cover: `/assets/demo/home/${photo}`,
  avatar: "/assets/demo/home/story-jon.jpg",
  seen: false,
}));

export default function HomeScreen() {
  const { navigate, locale } = useDemoNav();
  // Titles and labels in Apple's title style (demoCase).
  const { t } = useDemoCase();
  const [picked, setPicked] = useState<string>(CATEGORIES[0]);

  const header = (
    <HomeHeader
      searchLabel={t("Search")}
      onSearch={() => navigate("search")}
      chips={CATEGORIES.map((name, i) => ({
        key: name,
        label: t(name),
        picked: name === picked,
        slot: SLOTS[i],
      }))}
      onPick={setPicked}
    />
  );

  return (
    <ScreenPage
      testId="demo-home"
      bg={C.page}
      header={header}
      tabBar
      // The header leaves on a scroll down and comes back on a fast scroll
      // up, the same code as the store page (useHeadOnScroll).
      hideHeadOnScroll
    >
      <HomeSections
        t={t}
        stories={DEMO_STORIES}
        brands={DEMO_BRANDS}
        stores={DEMO_STORES}
        openStore={{
          href: (slug) => hrefFor(locale, storeScreen(slug)),
          open: (slug, card) => navigate(storeScreen(slug), 1, card),
          warm: warmListing,
        }}
      />
    </ScreenPage>
  );
}
