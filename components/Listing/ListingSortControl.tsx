"use client";

import React, { useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import BottomSheet from "components/global/BottomSheet";
import { translateFunction } from "utils/functions";
import {
  LISTING_SORT_KEYS,
  type ListingSortKey,
} from "services/elastic/sortKeys";

/**
 * ListingSortControl — the listing sort widget (ticket: listing-sort).
 *
 * Replaces the previously inert `sortIcon.svg` in the listing filter bar. Opens
 * a bottom sheet that maps the 7 sort keys the backend understands (see
 * services/elastic/helpers.ts › buildSortClause) onto 5 human-shaped choices:
 *
 *   • Recommended  → relevance (default, no `?sort=`)
 *   • Best sellers → best_selling
 *   • New arrivals → newest / oldest        (directional pair)
 *   • Price        → price_asc / price_desc (directional pair)
 *   • Name         → name_asc / name_desc   (directional pair)
 *
 * Rather than a flat radio list, related directions are grouped so the intent
 * ("Price") and the direction ("Low to High") read as one thought. Selection is
 * driven purely by the `?sort=` query param (SSR + shareable); picking an option
 * navigates and the server re-renders. The product grid's remount key includes
 * `sort`, so pagination state resets cleanly on every change.
 */

// "relevance" is the implicit default (no `?sort=`); the rest mirror the
// backend's ListingSortKey vocabulary exactly (services/elastic/helpers).
type SortKey = ListingSortKey | "relevance";

const PRIMARY = "#5b3fe0";

function IconBadge({
  active,
  children,
}: {
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <span
      className="flex items-center justify-center rounded-[12px] shrink-0"
      style={{
        width: 38,
        height: 38,
        background: active ? "rgba(91,63,224,0.10)" : "#f2f2f2",
        color: active ? PRIMARY : "#707070",
      }}
    >
      {children}
    </span>
  );
}

/* Thin, rounded, monochrome line icons (currentColor) — house style. */
const svgProps = {
  width: 19,
  height: 19,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const SparkleIcon = () => (
  <svg {...svgProps} aria-hidden="true">
    <path d="M12 3l1.9 4.9L18.8 9.8 13.9 11.7 12 16.6 10.1 11.7 5.2 9.8 10.1 7.9z" />
    <path d="M18.5 15.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z" />
  </svg>
);
const FlameIcon = () => (
  <svg {...svgProps} aria-hidden="true">
    <path d="M12 3s5 3.5 5 8a5 5 0 0 1-10 0c0-1.6.8-2.9 1.6-3.8C8.9 8.9 9 10 10 10.5c.4-2.2 1-4.4 2-7.5z" />
    <path d="M12 20a2.2 2.2 0 0 1-2.2-2.2c0-1.3 1-2 2.2-3.3 1.2 1.3 2.2 2 2.2 3.3A2.2 2.2 0 0 1 12 20z" />
  </svg>
);
const ClockIcon = () => (
  <svg {...svgProps} aria-hidden="true">
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 1.8" />
  </svg>
);
const TagIcon = () => (
  <svg {...svgProps} aria-hidden="true">
    <path d="M20 12.5l-7.2 7.2a1.6 1.6 0 0 1-2.3 0l-6-6a1.6 1.6 0 0 1 0-2.3L11.7 4H20z" />
    <circle cx="16" cy="8" r="1.3" />
  </svg>
);
const AlphaIcon = () => (
  <svg {...svgProps} aria-hidden="true">
    <path d="M4 16l2.6-8 2.6 8" />
    <path d="M5 13.4h3.2" />
    <path d="M14 8h5l-5 8h5" />
  </svg>
);
const CheckIcon = () => (
  <svg
    width={18}
    height={18}
    viewBox="0 0 24 24"
    fill="none"
    stroke={PRIMARY}
    strokeWidth={2.2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M5 12.5l4.5 4.5L19 7" />
  </svg>
);

export default function ListingSortControl({
  language,
  isRtl = false,
}: {
  language: string;
  isRtl?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);

  const raw = searchParams.get("sort") || "";
  const active: SortKey = (LISTING_SORT_KEYS as readonly string[]).includes(raw)
    ? (raw as SortKey)
    : "relevance";
  const isActive = active !== "relevance";

  const t = (key: string) => translateFunction(key, language);

  const [, startNavigation] = useTransition();

  const applySort = (key: SortKey) => {
    setIsOpen(false);
    if (key === active) return; // already selected — nothing to refetch
    const params = new URLSearchParams(searchParams.toString());
    if (key === "relevance") params.delete("sort");
    else params.set("sort", key);
    const qs = params.toString();
    const url = qs ? `${pathname}?${qs}` : pathname;
    // Why push AND refresh, batched in one transition:
    //  • next.config `staleTimes.dynamic: 30` caches the dynamic page RSC and
    //    does NOT vary it by search params, so a `?sort=` push alone reuses the
    //    stale grid (URL + widget update, but products never re-sort). This is
    //    compounded by the intercepting `@modal/(.)filters` parallel-route slot,
    //    which serves the cached listing overlay.
    //  • refresh() invalidates the Router Cache and forces a fresh server render
    //    (incl. the modal slot) for the new sort.
    //  • Batching both in ONE transition is what makes them cooperate: called
    //    inline back-to-back the refresh cancels the push (URL never changes); in
    //    a follow-up effect the refresh races the push. In a single transition
    //    the push URL is applied and the refresh refetches against it.
    // With `sort` in the product-list Suspense key, the skeleton shows while the
    // server re-renders. Applies uniformly to filters / featured / flashDeals.
    startNavigation(() => {
      router.push(url);
      router.refresh();
    });
  };

  // A short, human summary of the current selection for the trigger's a11y label.
  const ACTIVE_LABELS: Record<SortKey, string> = {
    relevance: "Recommended",
    best_selling: "Best sellers",
    newest: "Newest",
    oldest: "Oldest",
    price_asc: "Price: Low to High",
    price_desc: "Price: High to Low",
    name_asc: "Name: A to Z",
    name_desc: "Name: Z to A",
  };
  const activeLabel = t(ACTIVE_LABELS[active]);

  return (
    <>
      <button
        type="button"
        data-cy="sort_control"
        className="filter-option relative flex items-center justify-center border-0 bg-transparent p-0"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-label={`${t("Sort products")} — ${activeLabel}`}
        onClick={() => setIsOpen(true)}
      >
        <img src="/icons/sortIcon.svg" alt="" />
        {isActive && (
          <span
            aria-hidden="true"
            className="absolute rounded-full"
            style={{
              top: -1,
              insetInlineEnd: -1,
              width: 8,
              height: 8,
              background: PRIMARY,
              boxShadow: "0 0 0 2px #fff",
            }}
          />
        )}
      </button>

      {isOpen && (
        <BottomSheet isOpen={isOpen} onClose={() => setIsOpen(false)} height={60}>
          <div
            dir={isRtl ? "rtl" : "ltr"}
            role="dialog"
            aria-label={t("Sort products")}
            className="w-full px-[14px] pb-[28px]"
            style={{ textAlign: isRtl ? "right" : "left" }}
          >
            {/* Header */}
            <div className="flex flex-col gap-[2px] mb-[14px]">
              <span className="text-[16px] semibold text-[#3c3c3c]">
                {t("Sort products")}
              </span>
              <span className="text-[12px] regular text-[#707070]">
                {t("Choose how products are ordered")}
              </span>
            </div>

            <div className="flex flex-col gap-[10px]">
              {/* Recommended — the default / reset */}
              <SingleRow
                icon={<SparkleIcon />}
                title={t("Recommended")}
                subtitle={t("Best match for your search")}
                active={active === "relevance"}
                isRtl={isRtl}
                onSelect={() => applySort("relevance")}
              />

              {/* Best sellers */}
              <SingleRow
                icon={<FlameIcon />}
                title={t("Best sellers")}
                subtitle={t("Most bought right now")}
                active={active === "best_selling"}
                isRtl={isRtl}
                onSelect={() => applySort("best_selling")}
              />

              {/* Date added */}
              <DirectionalRow
                icon={<ClockIcon />}
                title={t("New arrivals")}
                subtitle={t("By date added")}
                isRtl={isRtl}
                options={[
                  {
                    key: "newest",
                    label: t("Newest"),
                    active: active === "newest",
                  },
                  {
                    key: "oldest",
                    label: t("Oldest"),
                    active: active === "oldest",
                  },
                ]}
                onSelect={applySort}
              />

              {/* Price */}
              <DirectionalRow
                icon={<TagIcon />}
                title={t("Price")}
                subtitle={t("By product price")}
                isRtl={isRtl}
                options={[
                  {
                    key: "price_asc",
                    label: t("Low to High"),
                    active: active === "price_asc",
                  },
                  {
                    key: "price_desc",
                    label: t("High to Low"),
                    active: active === "price_desc",
                  },
                ]}
                onSelect={applySort}
              />

              {/* Name */}
              <DirectionalRow
                icon={<AlphaIcon />}
                title={t("Name")}
                subtitle={t("Alphabetical")}
                isRtl={isRtl}
                options={[
                  {
                    key: "name_asc",
                    label: t("A to Z"),
                    active: active === "name_asc",
                  },
                  {
                    key: "name_desc",
                    label: t("Z to A"),
                    active: active === "name_desc",
                  },
                ]}
                onSelect={applySort}
              />
            </div>
          </div>
        </BottomSheet>
      )}
    </>
  );
}

/* A whole-row, single-select option (Recommended, Best sellers). */
function SingleRow({
  icon,
  title,
  subtitle,
  active,
  isRtl,
  onSelect,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  active: boolean;
  isRtl: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onSelect}
      className="w-full flex items-center gap-[12px] rounded-[15px] px-[12px] py-[11px] transition-colors"
      style={{
        border: `1px solid ${active ? PRIMARY : "transparent"}`,
        background: active ? "rgba(91,63,224,0.06)" : "#f8f8f8",
        flexDirection: isRtl ? "row-reverse" : "row",
        textAlign: isRtl ? "right" : "left",
      }}
    >
      <IconBadge active={active}>{icon}</IconBadge>
      <span className="flex flex-col grow gap-[1px]">
        <span
          className="text-[14px] medium"
          style={{ color: active ? PRIMARY : "#3c3c3c" }}
        >
          {title}
        </span>
        <span className="text-[12px] regular text-[#707070]">{subtitle}</span>
      </span>
      <span className="shrink-0 w-[20px] flex justify-center">
        {active && <CheckIcon />}
      </span>
    </button>
  );
}

/* A grouped option with two directional chips (Date, Price, Name). */
function DirectionalRow({
  icon,
  title,
  subtitle,
  isRtl,
  options,
  onSelect,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  isRtl: boolean;
  options: { key: SortKey; label: string; active: boolean }[];
  onSelect: (key: SortKey) => void;
}) {
  const groupActive = options.some((o) => o.active);
  return (
    <div
      className="w-full flex items-center gap-[12px] rounded-[15px] px-[12px] py-[11px]"
      style={{
        border: `1px solid ${groupActive ? PRIMARY : "transparent"}`,
        background: groupActive ? "rgba(91,63,224,0.06)" : "#f8f8f8",
        flexDirection: isRtl ? "row-reverse" : "row",
      }}
    >
      <IconBadge active={groupActive}>{icon}</IconBadge>
      <div
        className="flex flex-col grow gap-[8px]"
        style={{ textAlign: isRtl ? "right" : "left" }}
      >
        <span className="flex flex-col gap-[1px]">
          <span
            className="text-[14px] medium"
            style={{ color: groupActive ? PRIMARY : "#3c3c3c" }}
          >
            {title}
          </span>
          <span className="text-[12px] regular text-[#707070]">{subtitle}</span>
        </span>
        <div
          className="flex w-full gap-[8px]"
          style={{ flexDirection: isRtl ? "row-reverse" : "row" }}
        >
          {options.map((o) => (
            <button
              key={o.key}
              type="button"
              role="radio"
              aria-checked={o.active}
              aria-label={`${title}: ${o.label}`}
              onClick={() => onSelect(o.key)}
              className="flex-1 basis-0 rounded-full py-[8px] text-center text-[12px] medium transition-colors"
              style={{
                border: `1px solid ${o.active ? PRIMARY : "transparent"}`,
                background: o.active ? "rgba(91,63,224,0.10)" : "#f2f2f2",
                color: o.active ? PRIMARY : "#505050",
              }}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
