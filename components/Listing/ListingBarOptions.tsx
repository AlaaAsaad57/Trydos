"use client";

import { useAppStore } from "store";

/**
 * ListingBarOptions — the right-hand cluster of the listing bar (search input +
 * the sort/filter/share actions). It expands to full width when the search box
 * is expanded (focused or holding a value, via store.searchExpanded) or when the
 * page was server-rendered with a `?search=` (shared link). Replaces the old
 * classList.add("w-full") DOM hack. Server-rendered children (the Suspense'd
 * search container and the actions trio) are passed straight through.
 */
export default function ListingBarOptions({
  serverSearch = "",
  isRtl,
  children,
}: {
  serverSearch?: string;
  isRtl: boolean;
  children: React.ReactNode;
}) {
  const expanded = useAppStore((s) => s.searchExpanded);
  const isExpanded = expanded || serverSearch.length > 0;
  return (
    <div
      data-pw="filter_bar_options"
      className={`filter-bar-options justify-between ${
        isRtl ? "flex-row-reverse flex" : "flex-row flex"
      } align-center ${isExpanded ? "w-full" : "w-[170px]"}`}
    >
      {children}
    </div>
  );
}
