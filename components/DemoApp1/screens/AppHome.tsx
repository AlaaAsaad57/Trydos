"use client";

import React from "react";
import { MotionConfig } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAppStore } from "store";
import AddStoryWidget from "components/Home/Stories/AddStoryWidgetLazy";
import StoriesPaginationWrapper from "components/Home/Stories/StoriesPaginationWrapper";
import { buildProxyGetUrl } from "utils/proxyGetUrl";
import type { DemoDictionary, DemoKey } from "../../DemoApp/demoKeys";
import { C, PAGE_MAX } from "../demo1Layout";
import { titleStyle } from "../demoCase";
import { usePageDir } from "../rtl";
import { ScreenPage } from "../ui";
import type { HomeChip, HomeStore } from "../homeData";
import { HOME_STORIES_PATH, useHomeGrid, useHomeStories } from "../useHomeData";
import { canAddStory, startAddStory } from "../addStory";
import { HomeHeader } from "./HomeHeader";
import HomeSections, {
  AddStoryCard,
  bandLogo,
  type HomeCard,
} from "./HomeSections";

/** The words the new home shows. The page looks them up on the server. */
export type AppHomeWords = {
  /** The design keys, in this page's language (not used for English). */
  dictionary: DemoDictionary;
  /** The "add story" card's label (S7-5); not a design key. */
  addStory: string;
};

/** A boutique as a card: its icon in the file's logo band (S7-11). */
const toCard = (s: HomeStore): HomeCard => ({
  slug: s.slug,
  name: s.name,
  logo: s.logo ? bandLogo(s.logo) : undefined,
});

/**
 * The new home on the real app: `/[lang]` and `/[lang]/categories/<slug>`
 * (Stage 7 of UI-MIGRATION-PLAN.md, S7-1, S7-2, S7-4).
 *
 * The header and the body are the /demo screens, with real data:
 *  - the chips are the main categories (links, S7-4, S7-8);
 *  - the stories row reads the stories backend in the browser
 *    (useHomeStories), with the "add story" card first (S7-5);
 *  - the Brand Stores and Stores cards are the boutiques the server read
 *    (S7-3), and the grid reads more as it is slid (useHomeGrid, S7-7).
 *
 * English is in Apple's title style (D-4, as useDemoCase on /demo); other
 * languages use the server's dictionary as it is.
 */
export default function AppHome({
  lang,
  category,
  chips,
  brands,
  stores,
  storesOffset,
  words,
}: {
  lang: string;
  /** The category slug on `/categories/<slug>`, null on the home. */
  category: string | null;
  chips: HomeChip[];
  brands: HomeStore[];
  /** The grid's first boutiques (the ones after the brand stores). */
  stores: HomeStore[];
  /** Where the next read of the grid starts. */
  storesOffset: unknown;
  words: AppHomeWords;
}) {
  const router = useRouter();
  const pageDir = usePageDir();
  const [country, language] = lang.split("-");
  const english = language === "en";
  const t = (key: DemoKey) =>
    english ? titleStyle(key) : (words.dictionary[key] ?? key);

  const { stories, nextPageUrl, open } = useHomeStories({ language, country });
  const grid = useHomeGrid({
    lang,
    category,
    initial: stores,
    initialOffset: storesOffset,
  });
  const profile = useAppStore((s) => s.userProfile);
  const busy = useAppStore((s) => s.storiesRefreshing);
  const loginOpen = useAppStore((s) => s.loginOpen);

  const hrefOf = (slug: string) => `/${lang}/filters/boutiques/${slug}`;

  return (
    <MotionConfig reducedMotion="user">
      {/* Starts the stories request while the HTML is still parsing; the
          hook's fetch is answered from it (the live bar's preload, D-5). */}
      <link
        rel="preload"
        as="fetch"
        crossOrigin="anonymous"
        href={buildProxyGetUrl({
          server: "stories",
          url: HOME_STORIES_PATH,
          country,
          language,
        })}
      />
      <AddStoryWidget />
      <div
        data-pw="app-home"
        dir={pageDir}
        className="relative w-full mx-auto font-quicksand"
        style={{ maxWidth: PAGE_MAX, overflowX: "clip" }}
      >
        <ScreenPage
          testId="demo-home"
          bg={C.page}
          header={
            <HomeHeader
              searchLabel={t("Search")}
              searchHref={`/${lang}/search`}
              chips={chips.map((c) => ({
                key: c.slug,
                label: c.name,
                picked: c.picked,
                href: c.href,
              }))}
            />
          }
          // The [lang] layout keeps the room for the bar (--app-bar-room).
          tabBar={false}
          hideHeadOnScroll
        >
          <HomeSections
            t={t}
            nameMark
            stories={stories}
            openStory={open}
            addStory={
              canAddStory(profile) ? (
                <AddStoryCard
                  label={words.addStory}
                  busy={busy}
                  onAdd={startAddStory}
                />
              ) : null
            }
            storiesTail={
              nextPageUrl && !loginOpen ? (
                <StoriesPaginationWrapper
                  userData={null}
                  next_page_url={nextPageUrl}
                />
              ) : null
            }
            brands={brands.map(toCard)}
            stores={grid.stores.map(toCard)}
            onStoresEnd={grid.loadMore}
            openStore={{
              href: hrefOf,
              open: (slug) => router.push(hrefOf(slug)),
            }}
          />
        </ScreenPage>
      </div>
    </MotionConfig>
  );
}
