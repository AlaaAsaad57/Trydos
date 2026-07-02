"use client";

import { ReactNode, useEffect, useRef, useState } from "react";
import { useAppStore } from "store";

interface ListingHeaderCollapseProps {
  /** Sticky top-bar (.filter-listing-bar), server-rendered. */
  filterBar: ReactNode;
  /** Collapsible banner region (ListingBoutiqueSlider: store logo + banner slider). */
  banner: ReactNode;
  /** Category filters — stay visible, rendered below the collapsing banner. */
  categoryFilters: ReactNode;
  /** Product grid — rendered inside .listing-header so the sticky bar's containing block spans the full scroll length. */
  productList: ReactNode;
  isRtl?: boolean;
}

// Pin stack height = navbar (--listing-navbar-h, 98px) + top-bar (50px).
// The banner collapses once its top scrolls under the pinned bar, and
// re-expands only when it returns near the top (the sentinel re-enters).
const PIN_STACK_PX = 148;

export default function ListingHeaderCollapse({
  filterBar,
  banner,
  categoryFilters,
  productList,
  isRtl = false,
}: ListingHeaderCollapseProps) {
  const [collapsed, setCollapsed] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Freeze toggling while the filter modal is open so opening filters does not
  // reshuffle the header. Read through a ref so the once-created observer
  // callback always sees the latest value without re-subscribing.
  const filterEnabled = useAppStore((s) => s.filterEnabled);
  const filterEnabledRef = useRef(filterEnabled);
  filterEnabledRef.current = filterEnabled;

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (filterEnabledRef.current) return;
        setCollapsed(!entry.isIntersecting);
      },
      { rootMargin: `-${PIN_STACK_PX}px 0px 0px 0px`, threshold: 0 },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  return (
    <div data-collapsed={collapsed} data-rtl={isRtl} className="listing-header">
      {filterBar}
      <div
        data-cy="boutique_header"
        className="boutique-header flex-col align-center"
      >
        <div ref={sentinelRef} aria-hidden className="banner-sentinel" />
        <div className="banner-collapse items-center justify-center justify-items-center">
          <div className="banner-collapse-inner w-full">{banner}</div>
        </div>
        {categoryFilters}
      </div>
      {productList}
    </div>
  );
}
