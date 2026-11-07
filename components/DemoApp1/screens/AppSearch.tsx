"use client";

import React, { useSyncExternalStore } from "react";
import dynamic from "next/dynamic";
import { MotionConfig } from "framer-motion";
import XdIcon from "../../DemoApp/XdIcon";
import IconSkeleton from "components/skeleton/IconSkeleton";
import { useSearch } from "components/Home/Search/useSearch";
import { SearchContainer } from "components/Home/Search/SearchResults";
import type { DemoDictionary, DemoKey } from "../../DemoApp/demoKeys";
import { C, PAGE_MAX } from "../demo1Layout";
import { sentenceStyle, titleStyle } from "../demoCase";
import { isRtlLocale, usePageDir } from "../rtl";
import { ScreenPage } from "../ui";
import { Skeleton } from "components/Server/Skeleton";
import { SearchHeader } from "./SearchHeader";

// Lazy, as in the old search box: the image search brings the camera and
// crop tools, the voice search the recorder. Each skeleton is the mark's size.
const SearchVoice = dynamic(
  () => import("components/Home/Search/SearchVoice"),
  {
    ssr: false,
    loading: () => <IconSkeleton />,
  },
);
const SearchImage = dynamic(
  () => import("components/Home/Search/SearchImage"),
  {
    ssr: false,
    loading: () => <IconSkeleton />,
  },
);

/** True in the browser, false while the server renders. */
const noSubscribe = () => () => {};
const useInBrowser = () =>
  useSyncExternalStore(
    noSubscribe,
    () => true,
    () => false,
  );

/**
 * The results body's first state, in the server's HTML: the "Popular Search"
 * label and a row of word pills, the shape of the trending block.
 */
function SearchResultsSkeleton() {
  return (
    <div
      data-pw="search-results-skeleton"
      aria-hidden="true"
      className="flex flex-col w-full"
      style={{ padding: "26px 20px 0", gap: 14 }}
    >
      <Skeleton width={120} height={14} borderRadius={7} />
      <div className="flex flex-wrap" style={{ gap: 8 }}>
        {[84, 64, 96, 72, 58].map((w, i) => (
          <Skeleton key={i} width={w} height={32} borderRadius={12} />
        ))}
      </div>
    </div>
  );
}

/**
 * The search page on the real app: `/[lang]/search` (Stage 7, S7-2, D-44).
 *
 * The new header (XD `Home Page – 1`) over the old search:
 *  - the field searches with the old logic (useSearch): results 1.5 s after
 *    the last key, the inline completion, Enter opens the result listing;
 *  - Voice is the old voice search, Scan the old image search, each with the
 *    design's mark;
 *  - the chip row shows only "For you", picked, with no effect (S7-6);
 *  - under the header, the old results body (history and trending first,
 *    then the results, the filter bar and the "Search" button).
 *
 * English is in Apple's capital rules (D-4): title style for the labels and
 * the chip, sentence style for the field's placeholder.
 *
 * The results body is drawn only in the browser. It translates with the
 * client translateFunction, which answers English on the server (its cache is
 * empty there): drawn on the server, an Arabic page sent "Reset" and the
 * browser drew "إعادة تعيين", a hydration error. The server's HTML has a
 * skeleton of its first state instead.
 */
export default function AppSearch({
  lang,
  dictionary,
}: {
  lang: string;
  /** The design keys in this page's language (not used for English). */
  dictionary: DemoDictionary;
}) {
  const pageDir = usePageDir();
  const [country, language] = lang.split("-");
  const english = language === "en";
  const t = (key: DemoKey) =>
    english ? titleStyle(key) : (dictionary[key] ?? key);
  const body = (key: DemoKey) =>
    english ? sentenceStyle(key) : (dictionary[key] ?? key);

  const s = useSearch({ language, country, enabled: true });
  const inBrowser = useInBrowser();
  const pick = (word: string) => {
    if (word) s.setValue(word);
  };

  return (
    <MotionConfig reducedMotion="user">
      <div
        data-pw="app-search"
        dir={pageDir}
        className="relative w-full mx-auto font-quicksand"
        style={{ maxWidth: PAGE_MAX, overflowX: "clip" }}
      >
        <ScreenPage
          testId="demo-search"
          bg={C.page}
          // The [lang] layout keeps the room for the bar (--app-bar-room).
          tabBar={false}
          header={
            <SearchHeader
              placeholder={body("Search anything…")}
              value={s.value}
              onChange={s.setValue}
              onKeyDown={s.handleKeyDown}
              ghost={s.ghostSuffix}
              voice={
                <SearchVoice
                  setSearchValue={pick}
                  label={t("Voice search")}
                  icon={<XdIcon name="searchVoice" />}
                />
              }
              scan={
                <SearchImage
                  setSearchValue={pick}
                  label={t("Scan")}
                  icon={<XdIcon name="searchScan" />}
                />
              }
              chips={[t("For you")]}
              picked={0}
            />
          }
        >
          {inBrowser ? (
            // The old results body mirrors itself by hand (`isRtl` →
            // flex-row-reverse), as it did on the old left-to-right pages.
            // Inside this page's `dir="rtl"` it would be mirrored twice and
            // read left to right again, so it keeps its own `ltr` box.
            <div dir="ltr">
              <SearchContainer
                inPage
                setSearchEnable={() => {}}
                total_size={s.results.total_size}
                setAppliedFilters={s.setAppliedFilters}
                isRtl={isRtlLocale(lang)}
                setOffsets={s.setOffsets}
                language={language}
                value={s.value}
                setValue={s.setValue}
                loading={s.loading}
                products={s.results.products}
                brands={s.results.brands}
                categories={s.results.categories}
                boutiques={s.results.boutiques}
                related_categories={s.results.related_categories}
                trending={s.trending}
                searchHistoryItems={s.searchHistory}
                removeHistoryWord={s.removeHistoryWord}
                clearHistory={s.clearHistory}
                applied_filter={s.appliedFilters}
                EnableSearch={() => {}}
                hasMore={s.hasMore}
                loadMoreBrands={() => s.loadMore("brands")}
                loadMoreCategories={() => s.loadMore("categories")}
                loadMoreBoutiques={() => s.loadMore("boutiques")}
              />
            </div>
          ) : (
            <SearchResultsSkeleton />
          )}
        </ScreenPage>
      </div>
    </MotionConfig>
  );
}
