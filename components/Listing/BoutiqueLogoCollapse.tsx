"use client";

import { useAppStore } from "store";

/**
 * BoutiqueLogoCollapse — hides the compact boutique logo while the search box is
 * expanded, freeing horizontal room. Replaces the querySelector(".boutique-logo-
 * container").style.display hack. Only the /filters (boutique) listing renders a
 * logo; featured/flashDeals have none.
 */
export default function BoutiqueLogoCollapse({
  children,
}: {
  children: React.ReactNode;
}) {
  const expanded = useAppStore((s) => s.searchExpanded);
  if (expanded) return null;
  return <>{children}</>;
}
