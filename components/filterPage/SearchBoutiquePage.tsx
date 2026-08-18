"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useAppStore } from "store";
import { LogError } from "utils/functions";
import { GetSearchSuggestion } from "serverRequests/Search";
import Spinner from "components/global/Spinner";

const COMMIT_DEBOUNCE_MS = 1500;

/**
 * SearchBoutiquePage — the listing search box (listing search → ?search=
 * refactor). Locally controlled (keeps focus/caret across the URL change),
 * commits the query to ?search= via router.replace 1.5s after typing stops or
 * immediately on Enter, and shows an in-input spinner (never a skeleton) from
 * the first keystroke until results land. Collapses when empty & unfocused;
 * expands on focus or when it holds a value (drives store.searchExpanded, which
 * widens the options bar and hides the boutique logo). Keeps the inline
 * ghost-suggestion (Tab / ArrowRight-at-end to accept).
 */
export default function SearchBoutiquePage({
  serverSearch = "",
  parsedFilters,
  country,
  language,
  featured = false,
  flashdeal = false,
}: {
  serverSearch?: string;
  parsedFilters: any;
  country: string;
  language: string;
  featured?: boolean;
  flashdeal?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const setListingSearchLoading = useAppStore((s) => s.setListingSearchLoading);
  const setSearchExpanded = useAppStore((s) => s.setSearchExpanded);
  const searchLoading = useAppStore((s) => s.searchLoading);

  const [value, setValue] = useState(serverSearch ?? "");
  const [focused, setFocused] = useState(false);
  const [suggestion, setSuggestion] = useState("");

  const inputElRef = useRef<HTMLInputElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const commitTimerRef = useRef<any>(null);
  const latestSuggestionRef = useRef(0);
  const suggestionTimerRef = useRef<any>(null);

  const expanded = focused || value.length > 0;

  // Publish expand state (widens options bar + hides boutique logo).
  useEffect(() => {
    setSearchExpanded(expanded);
  }, [expanded, setSearchExpanded]);

  // Mirror the committed ?search= into the box while NOT focused AND no commit is
  // pending, so removing the search (chip ✕ / clear-all) empties the box. While
  // focused (mid-typing) or with a queued commit, local state wins — never move
  // the caret or blank an in-flight query before it commits.
  useEffect(() => {
    if (focused || commitTimerRef.current) return;
    const committed = searchParams.get("search") || "";
    setValue((prev) => (prev === committed ? prev : committed));
  }, [searchParams, focused]);

  // Commit the query to ?search= (shareable). replace = no history spam.
  const commit = useCallback(
    (next: string) => {
      const params = new URLSearchParams(searchParams.toString());
      const trimmed = next.trim();
      const current = params.get("search") || "";
      if (trimmed.length > 0) params.set("search", trimmed);
      else params.delete("search");

      // No-op commit (value unchanged from the URL): nothing will refetch, so
      // stop the spinner here — SortableGrid won't fire to clear it.
      if (trimmed === current) {
        setListingSearchLoading(false);
        return;
      }
      const qs = params.toString();
      // Spinner reflects the actual request being dispatched (not each keystroke):
      // turn it on here, right before the refetch fires. Cleared when results land
      // (ProductInfiniteScroll finally, incl. 0-results) or when SortableGrid falls
      // back to the server grid.
      setListingSearchLoading(true);
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [router, pathname, searchParams, setListingSearchLoading],
  );

  const scheduleCommit = useCallback(
    (next: string) => {
      if (commitTimerRef.current) clearTimeout(commitTimerRef.current);
      commitTimerRef.current = setTimeout(() => {
        commitTimerRef.current = null;
        commit(next);
      }, COMMIT_DEBOUNCE_MS);
    },
    [commit],
  );

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = e.target.value;
    setValue(next);
    // Spinner is driven by the request (see commit), not by typing — otherwise it
    // shows during the whole debounce window before anything is actually called.
    scheduleCommit(next);
  };

  const flushCommit = () => {
    if (commitTimerRef.current) clearTimeout(commitTimerRef.current);
    commitTimerRef.current = null;
    commit(value);
  };

  // --- Inline completion (ghost text), scoped to the applied filters ---------
  const fetchSuggestion = useCallback(async () => {
    const requestId = ++latestSuggestionRef.current;
    try {
      const res = await GetSearchSuggestion({
        language,
        country,
        search_text: value,
        filters: {
          categories: parsedFilters?.categories,
          related_categories: parsedFilters?.related_categories,
          brands: parsedFilters?.brands,
          boutiques: parsedFilters?.boutiques,
          colors: parsedFilters?.colors,
          sizes: parsedFilters?.sizes,
          tags_names: parsedFilters?.tags_names,
          priceRange: parsedFilters?.prices,
          featured: featured || undefined,
          flashdeal: flashdeal || undefined,
        },
      });
      if (requestId === latestSuggestionRef.current) {
        setSuggestion(res?.suggestion || "");
      }
    } catch (error) {
      if (requestId === latestSuggestionRef.current) {
        setSuggestion("");
        LogError({ error, scenario: "fetchSuggestion in SearchBoutiquePage" });
      }
    }
  }, [language, country, value, parsedFilters, featured, flashdeal]);

  useEffect(() => {
    if (suggestionTimerRef.current) clearTimeout(suggestionTimerRef.current);
    if (!value) {
      setSuggestion("");
      return;
    }
    suggestionTimerRef.current = setTimeout(fetchSuggestion, 600);
    return () => clearTimeout(suggestionTimerRef.current);
  }, [value, fetchSuggestion]);

  const ghostSuffix =
    value.length > 0 &&
    suggestion.toLowerCase().startsWith(value.toLowerCase()) &&
    suggestion.length > value.length
      ? suggestion.slice(value.length)
      : "";

  // Glue the ghost overlay to the input box (position/size/font/dir) so the gray
  // remainder starts exactly where typing ends, in both LTR and RTL.
  useEffect(() => {
    const input = inputElRef.current;
    const overlay = overlayRef.current;
    const container = containerRef.current;
    if (!input || !overlay || !container) return;
    const ir = input.getBoundingClientRect();
    const cr = container.getBoundingClientRect();
    const cs = getComputedStyle(input);
    overlay.style.left = `${ir.left - cr.left}px`;
    overlay.style.top = `${ir.top - cr.top}px`;
    overlay.style.width = `${ir.width}px`;
    overlay.style.height = `${ir.height}px`;
    overlay.style.lineHeight = `${ir.height}px`;
    overlay.style.paddingLeft = cs.paddingLeft;
    overlay.style.paddingRight = cs.paddingRight;
    overlay.style.fontFamily = cs.fontFamily;
    overlay.style.fontSize = cs.fontSize;
    overlay.style.fontWeight = cs.fontWeight;
    overlay.style.fontStyle = cs.fontStyle;
    overlay.style.letterSpacing = cs.letterSpacing;
    overlay.style.direction = cs.direction;
    overlay.style.textAlign = cs.textAlign;
  });

  const acceptSuggestion = () => {
    if (!ghostSuffix) return;
    const full = value + ghostSuffix;
    setValue(full);
    setSuggestion("");
    // Spinner is driven by the request (see commit), not by accepting a suggestion.
    scheduleCommit(full);
    requestAnimationFrame(() => {
      const input = inputElRef.current;
      if (input) {
        input.focus();
        try {
          input.setSelectionRange(full.length, full.length);
        } catch {}
      }
    });
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (ghostSuffix) {
      const el = e.target as HTMLInputElement;
      const atEnd =
        el.selectionStart === value.length && el.selectionEnd === value.length;
      if (e.key === "Tab" || (e.key === "ArrowRight" && atEnd)) {
        e.preventDefault();
        acceptSuggestion();
        return;
      }
    }
    if (e.key === "Enter") {
      e.preventDefault();
      flushCommit();
      (e.target as HTMLInputElement).blur();
    }
  };

  const isOpen = focused || value.length > 0;

  return (
    <div
      ref={containerRef}
      data-pw="searchIcon_boutiquePage"
      id="searchIconBoutique"
      className={`filter-option transition-all filter-search-option relative ${
        isOpen
          ? "w-[75%] [&>input]:w-full [&>input]:bg-[#f8f8f8] [&>input]:h-[40px]"
          : ""
      }`}
      onClick={() => inputElRef.current?.focus()}
    >
      {/* Inline completion (ghost text) overlay. */}
      <div
        ref={overlayRef}
        aria-hidden="true"
        className="absolute z-[5] overflow-hidden whitespace-pre pointer-events-none"
        style={{ boxSizing: "border-box" }}
      >
        {focused && ghostSuffix ? (
          <>
            <span className="text-transparent">{value}</span>
            <span className="text-[#c4c2c2]">{ghostSuffix}</span>
          </>
        ) : null}
      </div>

      <input
        ref={inputElRef}
        data-pw="inputFiled"
        id="filter-search"
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className={`${
          isOpen ? "pl-[40px]" : ""
        } rounded-[15px] w-0 h-full border-0 outline-hidden text-[#5d5d5d]`}
      />

      {/* Search icon collapses to a spinner while a search is in flight. */}
      <span
        className={`absolute z-10 ${
          isOpen ? "top-[9px] left-[14px]" : "top-0 left-0"
        }`}
      >
        {searchLoading ? (
          <Spinner no className="" />
        ) : (
          <img src="/icons/searchIcon.svg" alt="" />
        )}
      </span>
    </div>
  );
}
