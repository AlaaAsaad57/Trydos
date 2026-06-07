"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { DebounceInput } from "react-debounce-input/src";
import { useRouter, usePathname } from "next/navigation";
import { buildParamsFromFilters, pollinateInput } from "utils/tinyUtils";
import { useAppStore } from "store";
import { showSuccessNotification } from "store/notifications/reducer";
import { LogError } from "utils/functions";
import { GetSearchSuggestion } from "serverRequests/Search";

function SearchBoutiquePage({
  search_text,
  parsedFilters,
  lang,
  isAnalyzed,
  country,
  language,
  featured = false,
  flashdeal = false,
}) {
  const router = useRouter();
  const pathname = usePathname();

  // Parse current filters from URL path

  const currentFilters = parsedFilters;
  const [search, setSearch] = useState(
    parsedFilters?.search_text?.[0] ?? parsedFilters?.search_text ?? "",
  );
  const [focuse, setFocus] = useState(
    parsedFilters?.search_text?.[0]?.length ??
      parsedFilters?.search_text?.length ??
      false,
  );

  // --- Inline completion (ghost text) state -----------------------------
  // DebounceInput debounces its onChange, so we track keystrokes directly to
  // keep the ghost overlay in sync with what is actually visible while typing.
  const [typedValue, setTypedValue] = useState(search_text ?? "");
  const [suggestion, setSuggestion] = useState("");

  const inputElRef = useRef<HTMLInputElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const latestSuggestionRef = useRef(0);
  const suggestionTimeoutRef = useRef<any>(null);

  const onChange = (e) => {
    setSearch(e.target.value);
  };
  const onKeyDown = (e) => {
    try {
      if (isAnalyzed?.colors?.length > 0 && parsedFilters?.colors?.length > 0) {
        currentFilters.colors = currentFilters.colors?.filter(
          (color) =>
            !isAnalyzed.colors
              ?.map((s) => s.toLowerCase())
              .includes(color?.toLowerCase()),
        );
        if (currentFilters.colors?.length === 0) {
          delete currentFilters.colors;
        }
      }
      if (isAnalyzed?.sizes?.length > 0 && parsedFilters?.sizes?.length > 0) {
        currentFilters.sizes = currentFilters.sizes?.filter(
          (size) =>
            !isAnalyzed.sizes
              ?.map((s) => s.toLowerCase())
              .includes(size?.toLowerCase()),
        );
        if (currentFilters.sizes?.length === 0) delete currentFilters.sizes;
      }
      const newFilters = { ...currentFilters };
      if (e.target.value.length > 0) {
        newFilters.search_text = [e.target.value];
      } else {
        delete newFilters.search_text;
      }

      const pathParams = buildParamsFromFilters({
        ...newFilters,
        search: newFilters.search_text,
      });

      const newPath =
        pathParams.length > 0
          ? `/${lang}/filters/${pathParams.join("/")}`
          : `/${lang}/filters`;

      // Same-destination navigation is a no-op router.push: the intercepted
      // listing never re-renders, ProductInfiniteScroll never remounts, and the
      // is_filter_search loader (cleared only on that remount) would hang forever.
      const currentPath = decodeURIComponent(pathname || "");
      if (currentPath === newPath || currentPath === `${newPath}/`) {
        return;
      }

      const { setIsNavigating } = useAppStore.getState();
      setIsNavigating({
        is_filter_search: true,
        href: newPath,
      });
      router.push(newPath);
    } catch (error) {
      LogError({
        error: error,
        scenario:
          "on Enter pressed in search bar in listing page - SearhcBoutique Component",
        filters: currentFilters,
      });
    }
  };

  // --- Inline completion (ghost text) — scoped to the applied filters -----
  // Fetch the best "starts-with" completion, scoped to the active filters
  // (category / brand / boutique / color / size / price) AND the page mode
  // (flash deal / featured), so the suggestion matches the listing query.
  const fetchSuggestion = useCallback(async () => {
    const requestId = ++latestSuggestionRef.current;
    try {
      const res = await GetSearchSuggestion({
        language,
        country,
        search_text: typedValue,
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
      // Race condition: only apply the latest request's result.
      if (requestId === latestSuggestionRef.current) {
        setSuggestion(res?.suggestion || "");
      }
    } catch (error) {
      if (requestId === latestSuggestionRef.current) {
        setSuggestion("");
        LogError({ error, scenario: "fetchSuggestion in SearchBoutiquePage" });
      }
    }
  }, [language, country, typedValue, parsedFilters, featured, flashdeal]);

  // Debounce the suggestion fetch on each keystroke (best-effort, never blocks).
  useEffect(() => {
    if (suggestionTimeoutRef.current)
      clearTimeout(suggestionTimeoutRef.current);

    if (!typedValue || typedValue.length === 0) {
      setSuggestion("");
      return;
    }

    suggestionTimeoutRef.current = setTimeout(fetchSuggestion, 600);

    return () => clearTimeout(suggestionTimeoutRef.current);
  }, [typedValue, fetchSuggestion]);

  // Visible ghost remainder: only when the suggestion truly extends the typed
  // text (case-insensitive starts-with), otherwise nothing is shown.
  const ghostSuffix =
    typedValue.length > 0 &&
    suggestion.toLowerCase().startsWith(typedValue.toLowerCase()) &&
    suggestion.length > typedValue.length
      ? suggestion.slice(typedValue.length)
      : "";

  // Glue the ghost overlay to the input box (position, size, font, padding,
  // direction). Copying the input's computed direction keeps the remainder
  // aligned in both LTR and RTL, so the gray text starts exactly where typing
  // ends regardless of the input's dynamic padding/width.
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
    if (!ghostSuffix) return false;
    const full = typedValue + ghostSuffix;
    const input = inputElRef.current;
    if (input) {
      // Drive the value through the native input-event path so DebounceInput
      // updates its own internal display value (it doesn't read our state).
      const setter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        "value",
      )?.set;
      setter?.call(input, full);
      input.dispatchEvent(new Event("input", { bubbles: true }));
      requestAnimationFrame(() => {
        try {
          input.setSelectionRange(full.length, full.length);
        } catch {}
      });
    }
    setTypedValue(full);
    setSuggestion("");
    return true;
  };

  useEffect(() => {
    if (search_text?.length > 0) {
      document.querySelector<HTMLInputElement>("#searchIconBoutique")?.click();
      document.querySelector<HTMLInputElement>("#filter-search")?.focus();
    } else {
      document.querySelector<HTMLInputElement>("#filter-search")?.blur();
    }
  }, []);

  return (
    <div
      ref={containerRef}
      data-cy="searchIcon_boutiquePage"
      id="searchIconBoutique"
      className={`filter-option transition-all filter-search-option relative ${
        (search?.length || focuse) &&
        "w-[75%] [&>input]:w-full [&>input]:bg-[#f8f8f8] [&>input]:h-[40px]"
      }`}
      onClick={() => {
        document.querySelector<HTMLInputElement>("#filter-search")?.focus();
        if (
          document.querySelector<HTMLInputElement>(".boutique-logo-container")
        )
          document.querySelector<HTMLInputElement>(
            ".boutique-logo-container",
          ).style.display = "none";
      }}
    >
      {/* Inline completion (ghost text) overlay — sits above the input; the
          typed portion is transparent (so the real input text shows through)
          and only the remainder renders as gray ghost text. */}
      <div
        ref={overlayRef}
        aria-hidden="true"
        className="absolute z-[5] overflow-hidden whitespace-pre pointer-events-none"
        style={{ boxSizing: "border-box" }}
      >
        {focuse && ghostSuffix ? (
          <>
            <span className="text-transparent">{typedValue}</span>
            <span className="text-[#c4c2c2]">{ghostSuffix}</span>
          </>
        ) : null}
      </div>
      <DebounceInput
        data-cy="inputFiled"
        id="filter-search"
        inputRef={(ref: HTMLInputElement) => {
          inputElRef.current = ref;
        }}
        debounceTimeout={600}
        onFocus={() => {
          document
            .querySelector<HTMLInputElement>(".filter-bar-options")
            .classList.add("w-full");
          setFocus(true);
        }}
        value={pollinateInput(search_text)}
        onBlur={() => {
          setFocus(false);
          if (search.length === 0) {
            if (
              document.querySelector<HTMLInputElement>(
                ".boutique-logo-container",
              )
            ) {
              document.querySelector<HTMLInputElement>(
                ".boutique-logo-container",
              ).style.display = "flex";
            }

            document
              .querySelector<HTMLInputElement>(".filter-bar-options")
              .classList.remove("w-full");
          }
        }}
        onChange={(e) => {
          setTypedValue(e.target.value);
          if (e.target.value.length === 0) {
            onKeyDown(e);
          }
          onChange(e);
        }}
        onKeyUp={(e: any) => setTypedValue(e.target.value)}
        onKeyDown={(e: any) => {
          // Accept the inline completion with Tab, or ArrowRight at line end.
          if (ghostSuffix) {
            const atEnd =
              e.target.selectionStart === e.target.value.length &&
              e.target.selectionEnd === e.target.value.length;
            if (e.key === "Tab" || (e.key === "ArrowRight" && atEnd)) {
              e.preventDefault();
              acceptSuggestion();
              return;
            }
          }
          //@ts-ignore
          if (e.keyCode == 13) {
            onKeyDown(e);
            e.target.blur();
          }
        }}
        className={`${
          (search?.length || focuse) && "pl-[40px]"
        } rounded-[15px]  w-0 h-full border-0 outline-hidden text-[#5d5d5d]`}
      />
      <img
        src="/icons/searchIcon.svg"
        className={`absolute z-10 ${
          search?.length || focuse ? "top-[9px] left-[14px]" : "top-0 left-0"
        }`}
      />
    </div>
  );
}

export default SearchBoutiquePage;
