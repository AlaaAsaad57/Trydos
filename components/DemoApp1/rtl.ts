"use client";

import type React from "react";
import { useParams } from "next/navigation";

/**
 * The page's writing direction for the new UI (decided in Stage 1 of
 * UI-MIGRATION-PLAN.md, D-3): Arabic (`ar`) and Kurdish (`ku`) pages are
 * right-to-left, so the whole layout is mirrored on them.
 *
 * The new UI sets `dir` on its own roots, not on `<html>`: the old pages do
 * their own right-to-left per component, and `dir` on `<html>` would flip them
 * a second time. A portal hangs on `<body>`, outside those roots, so every
 * portal sets `dir` itself too.
 */
export type PageDir = "rtl" | "ltr";

/** True for a locale segment (`sy-ar`) whose language is written right to left. */
export const isRtlLocale = (locale: string) =>
  ["ar", "ku"].includes(locale.split("-")[1] ?? "");

/** The writing direction of the page on show, from its locale segment. */
export function usePageDir(): PageDir {
  const params = useParams();
  const lang = typeof params?.lang === "string" ? params.lang : "";
  return isRtlLocale(lang) ? "rtl" : "ltr";
}

/**
 * Turns an icon that points a way (a back arrow) to point the other way on a
 * right-to-left page. Icons that point no way (a logo, a clock) never use it.
 */
export const mirrorFor = (dir: PageDir): React.CSSProperties | undefined =>
  dir === "rtl" ? { transform: "scaleX(-1)" } : undefined;
