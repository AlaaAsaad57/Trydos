"use client";

import React, { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import NewLoginWidget from "NewLoginDesign/NewLoginWidget";
import { useAppStore } from "store";
import { setCookie, COOKIE_NAMES, setLocaizationCookies } from "utils/cookies/cookie-manager";
import { countryNameFromIso } from "utils/server/country";
import { isCrawlerAgent } from "utils/botAgent";
import type { DemoDictionary, DemoKey } from "../DemoApp/demoKeys";
import { appBarShrink } from "./appBarShrink";
import { countryFlag } from "./countryFlag";
import { NavCtx, type DemoNav } from "./screenNav";
import StartCover from "./StartCover";
import CountryPickerBody from "./screens/CountryPickerBody";
import type { RowCountry } from "./screens/CountryRow";

/**
 * The real start flow (Stage 7e part 2 of UI-MIGRATION-PLAN.md, Step 4): the
 * start animation, the country picker (XD `Ramaaz pay signin – 16` / `– 15`),
 * the Quick Preview and Get Started — the same login widget and picker as
 * /demo, as a layer over the page, with real data.
 *
 * Init shows it where the old country popup showed: a `gb-` address,
 * `?no-country`, `?changed-country`. The page's own HTML renders under it.
 *
 *  - The rows are the real country list (Init reads it), in the design's
 *    order. On `?changed-country=<new>,<old>` only those two show, with the
 *    new one (the address's) chosen (`– 15`); the owner's rule of 2026-11-28.
 *    A value there that is not a listed 2-letter code is ignored, and the
 *    page counts as having no country (review finding S-3).
 *  - A pick saves the country and the page's language in the locale cookies,
 *    as the old popup did, and the flow goes on to the Quick Preview with no
 *    reload.
 *  - The flow ends ("Later", the close, the login's end) with ONE full load:
 *    the same path in the picked country, with the popup's flags gone. The
 *    proxy saves the cookies again from `_bypass=popup-selection`, and Init
 *    takes that flag off the address. The app's start reads the new
 *    country's starter settings there (services/home.ts reads them fresh on
 *    every load).
 *  - The flow ends only after a pick. On `changed-country` the chosen new
 *    country counts as the pick. The end address is never a `gb-` one, or
 *    the flow would show again on it (review finding S-2), and it always
 *    stays on this site.
 *  - A crawler gets nothing: no flow over the page it reads. The check runs
 *    after the first render, so the server's HTML and the first client render
 *    are the same white cover (no hydration mismatch).
 *  - While it is open, `loginLayerOpen` keeps the session-expired and phone
 *    check widgets away: one scaled canvas at a time (scaling/AppScaler.tsx).
 */

/** The design's four countries: their order on the picker, and their row names. */
const DESIGN_ORDER = ["tr", "sy", "iq", "lb"] as const;
const DESIGN_NAMES: Readonly<Record<string, DemoKey>> = {
  tr: "Turkiye",
  sy: "Syria",
  iq: "Iraq",
  lb: "Lebanon",
};

/** The address flags of the old popup, and the navigation flags Init cleans. */
const DROPPED_FLAGS = ["no-country", "changed-country", "cart", "_t", "_bypass"] as const;

/** A country code as the list and the address carry it: two letters. */
const ISO = /^[a-z]{2}$/;

/** A country of the list, as `GetCountries` gives it. */
export type ListCountry = { iso?: string | null; name?: string | null };

/** The list's codes, small letters, in the design's order, then the rest. */
function orderedCodes(list: readonly ListCountry[]): string[] {
  const codes = Array.from(
    new Set(
      list
        .map((c) => (c.iso ?? "").trim().toLowerCase())
        .filter((iso) => ISO.test(iso) && iso !== "gb"),
    ),
  );
  const rank = (iso: string) => {
    const at = (DESIGN_ORDER as readonly string[]).indexOf(iso);
    return at === -1 ? DESIGN_ORDER.length : at;
  };
  return codes.sort((a, b) => rank(a) - rank(b));
}

/**
 * The two countries of `?changed-country=<new>,<old>`, when both are listed
 * codes and differ; otherwise null (the page then counts as no-country).
 */
export function readChanged(
  raw: string | null | undefined,
  listed: readonly string[],
): [string, string] | null {
  if (!raw) return null;
  let text = raw;
  try {
    text = decodeURIComponent(raw);
  } catch {
    return null;
  }
  const [first, second] = text.split(",").map((part) => part.trim().toLowerCase());
  if (!first || !second || first === second) return null;
  if (!listed.includes(first) || !listed.includes(second)) return null;
  return [first, second];
}

/**
 * The address the flow ends on: the same path and query in `country`, with
 * the popup's flags gone and `_bypass=popup-selection` added. Null when the
 * country is not a listed code, is `gb`, or the address would leave this site.
 */
export function endAddress(
  country: string | null,
  language: string,
  listed: readonly string[],
  where: { origin: string; pathname: string; search: string },
): string | null {
  if (!country || country === "gb" || !ISO.test(country) || !listed.includes(country)) return null;
  if (!/^[a-z]{2}$/.test(language)) return null;
  const rest = where.pathname.replace(/^\/[^/]*/, "");
  const query = new URLSearchParams(where.search);
  for (const flag of DROPPED_FLAGS) query.delete(flag);
  query.set("_bypass", "popup-selection");
  const url = new URL(`/${country}-${language}${rest}?${query.toString()}`, where.origin);
  return url.origin === where.origin ? url.toString() : null;
}

export default function AppStartFlow({
  words,
  countries,
  changed,
  loadFailed,
  onRetry,
}: {
  /** The flow's words in the page's language, looked up on the server. */
  words: DemoDictionary;
  /** The real country list (empty while it loads). */
  countries: readonly ListCountry[];
  /** The raw `?changed-country` value, or null. */
  changed: string | null;
  loadFailed: boolean;
  onRetry: () => void;
}) {
  const params = useParams();
  const locale = typeof params?.lang === "string" ? params.lang : "gb-en";
  const language = locale.split("-")[1] || "en";
  const [shown, setShown] = useState<"wait" | "flow" | "none">("wait");
  const picked = useRef<string | null>(null);

  // In the browser only: a crawler gets no flow. Before this the server and
  // the first client render both draw the white cover.
  useEffect(() => {
    setShown(isCrawlerAgent(navigator.userAgent) ? "none" : "flow");
  }, []);

  const flowOpen = shown === "flow";
  useEffect(() => {
    if (!flowOpen) return;
    const { setLoginLayerOpen } = useAppStore.getState();
    setLoginLayerOpen(true);
    return () => setLoginLayerOpen(false);
  }, [flowOpen]);

  if (shown === "none") return null;
  if (shown === "wait") return <StartCover />;

  const listed = orderedCodes(countries);
  const pair = readChanged(changed, listed);
  // The two countries of a change keep the design's order, as all rows do.
  const shownCodes = pair ? listed.filter((iso) => pair.includes(iso)) : listed;
  const rows: RowCountry[] = shownCodes.map((iso) => ({
    id: iso,
    name: DESIGN_NAMES[iso] ?? countryNameFromIso(iso, language) ?? iso.toUpperCase(),
    ...countryFlag(iso),
  }));
  // On changed-country the address's new country is chosen at first, and it
  // counts as the pick until the shopper taps another.
  const initial = pair ? pair[0] : null;

  const t = (key: DemoKey) => words[key] ?? key;
  const nav: DemoNav = {
    shown: null,
    navigate: () => {},
    back: () => {},
    locale,
    t,
    barShrink: appBarShrink,
  };

  const savePick = (iso: string) => {
    picked.current = iso;
    setLocaizationCookies(iso, language);
    // The old popup set `language` too; proxy.ts and fetchData read it.
    setCookie(COOKIE_NAMES.lANGUAGE, language, {
      path: "/",
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 365 * 24 * 60 * 60,
      httpOnly: false,
    });
  };

  const end = () => {
    const to = endAddress(picked.current ?? initial, language, listed, window.location);
    // No pick yet (the picker has no way out, so this should not happen):
    // stay in the flow rather than land on an address that shows it again.
    if (!to) return;
    window.location.replace(to);
  };

  return (
    <NavCtx.Provider value={nav}>
      <NewLoginWidget
        initialStep="country-picker"
        onFinish={end}
        countryPicker={(onPicked) => (
          <CountryPickerBody
            countries={rows}
            initial={initial}
            only={pair}
            failed={loadFailed}
            onRetry={onRetry}
            onDone={(iso) => {
              savePick(iso);
              onPicked();
            }}
          />
        )}
      />
    </NavCtx.Provider>
  );
}
