"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAppStore } from "store";
import { GetSearchSuggestion } from "serverRequests/Search";
import { LogError } from "utils/functions";

/** How long after the last key the words search the list. */
const COMMIT_DEBOUNCE_MS = 1500;

/**
 * The listing search (Stage 7b, S7b-9): the logic of the old listing search
 * box (`SearchBoutiquePage`), for the store page's search field.
 *
 *  - The words live in the field (the caret stays where it is while the
 *    address changes).
 *  - They go into `?search=` 1.5 s after the last key, or at once on Enter
 *    (`router.replace`, so no history entry per word). The grid reads the
 *    new words in the browser (useListingPages).
 *  - The in-field progress flag (`searchLoading`) goes up when a read
 *    really starts.
 *  - When the field is not in use and no change waits, the words follow
 *    the address (a search removed elsewhere empties the field).
 *  - `clear` removes the search at once (the close mark, S7b-9).
 *  - The inline completion (S7b-14): 600 ms after a key, the rest of a
 *    likely word, within the page's filters (`ghost`). Tab, or the right
 *    arrow at the end of the words, takes it.
 */
export function useListingSearch({
  serverSearch = "",
  lang,
  filters,
}: {
  serverSearch?: string;
  lang: string;
  /** The page's filters, with `featured` / `flashdeal` set. */
  filters: Record<string, any>;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const setListingSearchLoading = useAppStore((s) => s.setListingSearchLoading);
  const [value, setValue] = useState(serverSearch ?? "");
  const [focused, setFocused] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [suggestion, setSuggestion] = useState("");
  const latest = useRef(0);
  const [country, language] = lang.split("-");

  useEffect(() => {
    if (!value) {
      setSuggestion("");
      return;
    }
    const wait = setTimeout(async () => {
      const id = ++latest.current;
      try {
        const res = await GetSearchSuggestion({
          language,
          country,
          search_text: value,
          filters: {
            categories: filters?.categories,
            related_categories: filters?.related_categories,
            brands: filters?.brands,
            boutiques: filters?.boutiques,
            colors: filters?.colors,
            sizes: filters?.sizes,
            tags_names: filters?.tags_names,
            priceRange: filters?.prices,
            featured: filters?.featured || undefined,
            flashdeal: filters?.flashdeal || undefined,
          },
        });
        if (id === latest.current) setSuggestion(res?.suggestion || "");
      } catch (error) {
        if (id === latest.current) {
          setSuggestion("");
          LogError({ error, scenario: "useListingSearch suggestion" });
        }
      }
    }, 600);
    return () => clearTimeout(wait);
  }, [value, language, country, filters]);

  const ghost =
    value.length > 0 &&
    suggestion.toLowerCase().startsWith(value.toLowerCase()) &&
    suggestion.length > value.length
      ? suggestion.slice(value.length)
      : "";

  // The words last sent to the address, until the address shows them.
  // `router.replace` takes a moment, and `searchParams` is old until it ends:
  // read alone, it made the close mark right after Enter compare "" with ""
  // and do nothing, and then the search came back.
  const sent = useRef<string | null>(null);

  useEffect(() => {
    const committed = searchParams.get("search") || "";
    if (sent.current !== null) {
      // An older change landing: the newest one is still on its way.
      if (committed !== sent.current) return;
      sent.current = null;
    }
    if (focused || timer.current) return;
    setValue((prev) => (prev === committed ? prev : committed));
  }, [searchParams, focused]);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const commit = useCallback(
    (next: string) => {
      const params = new URLSearchParams(searchParams.toString());
      const trimmed = next.trim();
      const now = sent.current ?? (params.get("search") || "");
      if (trimmed.length > 0) params.set("search", trimmed);
      else params.delete("search");
      // Nothing changes, so nothing reads: the progress flag stays down.
      if (trimmed === now) {
        setListingSearchLoading(false);
        return;
      }
      const qs = params.toString();
      sent.current = trimmed;
      setListingSearchLoading(true);
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [router, pathname, searchParams, setListingSearchLoading],
  );

  const later = (next: string) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      timer.current = null;
      commit(next);
    }, COMMIT_DEBOUNCE_MS);
  };

  const now = (next: string) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    commit(next);
  };

  return {
    value,
    onChange: (next: string) => {
      setValue(next);
      later(next);
    },
    ghost: focused ? ghost : "",
    onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => {
      const el = e.currentTarget;
      const atEnd =
        el.selectionStart === value.length && el.selectionEnd === value.length;
      if (ghost && (e.key === "Tab" || (e.key === "ArrowRight" && atEnd))) {
        e.preventDefault();
        const full = value + ghost;
        setValue(full);
        setSuggestion("");
        later(full);
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        now(value);
        e.currentTarget.blur();
      }
    },
    onFocus: () => setFocused(true),
    onBlur: () => setFocused(false),
    clear: () => {
      setValue("");
      now("");
    },
  };
}
