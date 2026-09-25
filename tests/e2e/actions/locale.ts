// Arriving at the storefront — country, language, and what the app does about it.
//
// `arriveAsGuest` talks to the running server directly instead of driving a
// browser, and that is the point rather than a shortcut. Everything it reads is
// a decision `proxy.ts` makes **before** any page renders: which country and
// language end up in the address, and whether the visitor gets asked to pick.
// The answer is a redirect, so a redirect is what we read. Rendering the
// destination would only add a staging round trip to a question already
// answered, and would turn these cases red whenever a backend is slow.
//
// The browser comes back for one job at the bottom of this file: reading the
// list of countries the app offers, which no test may assume.
//
// The rules in docs/testing/E2E_TEST_DESIGN.md section 7 still hold: no spec
// builds a URL or names a header, it says where the visitor came from and reads
// back what the app decided.

import { expect, type Page } from "@playwright/test";

import { LIVE_ORIGIN } from "../harness/env";
import { localeSettings, region } from "../selectors";
import { localeParts, localePrefix, seedLocale } from "./nav";

/** A browser that is plainly a person, not a crawler.
 *
 *  `proxy.ts` sends crawlers down a completely separate path — a permanent
 *  redirect, no popup, no cookies — so a request carrying a word from that list
 *  would be answering a different question than the one asked. */
const HUMAN_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36";

/** One redirect the app answered with. */
export type Hop = {
  /** Where the visitor asked to go, path and query. */
  from: string;
  status: number;
  /** Where the app sent them instead. */
  to: string;
};

export type Arrival = {
  /** Every redirect, in order. Empty when the first address was served as-is. */
  hops: Hop[];
  /** The address the visitor ended on. */
  url: URL;
  /** The status of the last answer. 200 when the address was served. */
  status: number;
  /** Its `Content-Type`, lower case and without the charset — `text/html`,
   *  `application/xml`, `text/plain`. Empty when the answer had none. */
  contentType: string;
  /** The country and language the app saved on the way, read back out of the
   *  cookies it set. Empty strings when it saved none — which is itself the
   *  answer for a crawler, who must never be given any. */
  savedAfter: { country: string; language: string };
  /** `iq` out of `/iq-ar/about`. Empty when the address carries no locale. */
  country: string;
  /** `ar` out of `/iq-ar/about`. Empty when the address carries no locale. */
  language: string;
  /** The app could not work the country out and is asking the visitor to pick
   *  — the "Select Your Region" popup. */
  askedToPickCountry: boolean;
  /** The app found that the address and the saved country disagree, and is
   *  asking which one to keep: `{ inAddress: "tr", saved: "iq" }`. Null when
   *  there is no disagreement. */
  countryConflict: { inAddress: string; saved: string } | null;
};

/** Split `iq-ar` off the front of a path. Both halves are two letters or this
 *  is not a locale — `/products/Bodysuits-253` must not read as one. */
const readLocale = (
  pathname: string,
): { country: string; language: string } => {
  const [country = "", language = ""] = (pathname.split("/")[1] ?? "")
    .toLowerCase()
    .split("-");

  const isLocale = /^[a-z]{2}$/.test(country) && /^[a-z]{2}$/.test(language);
  return isLocale ? { country, language } : { country: "", language: "" };
};

/** Every `Set-Cookie` on a response, as name and value. A runtime without
 *  `getSetCookie` only offers the joined header, which is the best available
 *  there. */
const readSetCookies = (headers: Headers): [string, string][] => {
  const raw =
    typeof headers.getSetCookie === "function"
      ? headers.getSetCookie()
      : [headers.get("set-cookie") ?? ""];

  return raw
    .filter(Boolean)
    .map((cookie) => cookie.split(";")[0])
    .map((pair): [string, string] => {
      const equals = pair.indexOf("=");
      return equals > 0
        ? [pair.slice(0, equals).trim(), pair.slice(equals + 1).trim()]
        : ["", ""];
    })
    .filter(([name]) => name !== "");
};

/** Arrive at the storefront as a guest, and report where the app put you.
 *
 *  @param options.path             where they asked to go. Default `/`.
 *  @param options.fromCountry      the country the platform says they are in.
 *  @param options.browserLanguages an `Accept-Language` value, written the way
 *                                  a browser sends it: `"ar-IQ,ar;q=0.9"`.
 *  @param options.saved            country and language from an earlier visit —
 *                                  the cookies the app wrote back then.
 *  @param options.maxHops          how many redirects to follow. One by
 *                                  default, which covers every case here and
 *                                  stops short of rendering a page.
 *  @param options.userAgent        who is asking. A crawler is sent down a
 *                                  completely separate branch, so this is the
 *                                  only way to reach it.
 *  @param options.bouncedAlready   how many redirects the app should believe
 *                                  have already happened. The app counts its
 *                                  own bounces in a header and gives up past a
 *                                  limit; this is how that limit is reached
 *                                  without building a real loop.
 *
 *  **On spoofing the country.** `x-vercel-ip-country` is set by the platform in
 *  production, and a header a client sends under that name is stripped there —
 *  so setting it here cannot weaken anything, and it is the only way to test
 *  country detection at all. This server is reached over loopback, which has no
 *  country: that is exactly why every other journey in this suite meets the
 *  region popup. */
export const arriveAsGuest = async (options: {
  path?: string;
  fromCountry?: string;
  browserLanguages?: string;
  saved?: { country?: string; language?: string };
  maxHops?: number;
  userAgent?: string;
  bouncedAlready?: number;
}): Promise<Arrival> => {
  const {
    path = "/",
    fromCountry,
    browserLanguages,
    saved,
    maxHops = 1,
    userAgent = HUMAN_USER_AGENT,
    bouncedAlready,
  } = options;

  const jar = new Map<string, string>();
  if (saved?.country) jar.set("country", saved.country);
  // `lang`, not `language`: the app reads `lang` first and falls back to
  // `language`, and writes all of them. `lang` is what a returning visitor has.
  if (saved?.language) jar.set("lang", saved.language);

  // What the app wrote back, as opposed to what the visitor arrived with.
  const written = new Map<string, string>();

  const hops: Hop[] = [];
  let url = new URL(path, LIVE_ORIGIN);
  let status = 0;
  let contentType = "";

  for (;;) {
    const headers: Record<string, string> = { "user-agent": userAgent };
    if (fromCountry) headers["x-vercel-ip-country"] = fromCountry;
    if (browserLanguages) headers["accept-language"] = browserLanguages;
    if (bouncedAlready !== undefined) {
      headers["x-redirect-count"] = String(bouncedAlready);
    }
    if (jar.size) {
      headers.cookie = [...jar]
        .map(([name, value]) => `${name}=${value}`)
        .join("; ");
    }

    const response = await fetch(url, { headers, redirect: "manual" });
    // Nothing reads a body here, and an unread one holds its socket open.
    await response.body?.cancel();

    status = response.status;
    contentType = (response.headers.get("content-type") ?? "")
      .split(";")[0]
      .trim()
      .toLowerCase();

    for (const [name, value] of readSetCookies(response.headers)) {
      jar.set(name, value);
      // Separately, because `jar` starts out holding what the visitor already
      // had — reading `savedAfter` off it would report cookies the app never
      // wrote, and "a crawler is given no cookies" would pass by accident.
      written.set(name, value);
    }

    const location = response.headers.get("location");
    const isRedirect = response.status >= 300 && response.status < 400;
    if (!isRedirect || !location) break;

    const next = new URL(location, url);
    hops.push({
      from: url.pathname + url.search,
      status: response.status,
      to: next.pathname + next.search,
    });
    url = next;

    if (hops.length >= maxHops) break;
  }

  const { country, language } = readLocale(url.pathname);
  // `changed-country` carries both halves of the disagreement, address first:
  // `?changed-country=tr,iq` means the address says Türkiye and the saved
  // country says Iraq.
  const conflict = url.searchParams.get("changed-country")?.split(",") ?? [];

  return {
    hops,
    url,
    status,
    contentType,
    savedAfter: {
      country: written.get("country") ?? "",
      language: written.get("lang") ?? "",
    },
    country,
    language,
    askedToPickCountry: url.searchParams.get("no-country") === "true",
    countryConflict:
      conflict.length === 2
        ? {
            inAddress: conflict[0].toLowerCase(),
            saved: conflict[1].toLowerCase(),
          }
        : null,
  };
};

// Countries to try as "somewhere the app does not serve". The first one the
// picker does not offer is used; the list is long enough that adding any single
// one of them as a real market does not leave the suite with nothing to use.
const FOREIGN_CANDIDATES = ["de", "fr", "jp", "br", "us", "za"];

let offered: string[] | null = null;

/** The countries the app offers, read off its own country picker.
 *
 *  Deliberately **not** worked out by watching where the app redirects. That is
 *  the very thing the locale cases assert, and a case that gets its expected
 *  answer from the behaviour it is checking can never fail. The picker is an
 *  independent source: it is the backend's list, rendered for the visitor.
 *
 *  Nothing here is hard-coded for the same reason README rule 3 gives — the
 *  list is the backend's to change, and the day a market is added or dropped
 *  must not be the day this suite goes red.
 *
 *  Cached for the run. It costs one home page render, and it does not change
 *  between two tests a second apart. */
export const listOfferedCountries = async (page: Page): Promise<string[]> => {
  if (offered) return offered;

  // Loopback has no country, so the app cannot detect one and shows the picker.
  // That is the same popup every other journey in this suite has to dismiss.
  await page.goto("/", { waitUntil: "domcontentloaded" });

  const rows = region.anyCountry(page);
  await expect(
    rows.first(),
    "the country picker offered nothing — is staging up?",
  ).toBeVisible();

  offered = (await rows.evaluateAll((nodes) =>
    nodes.map((node) => node.getAttribute("data-pw") ?? ""),
  ))
    .map((hook) => hook.replace("personal-info-countries-", "").toLowerCase())
    .filter((iso) => /^[a-z]{2}$/.test(iso));

  return offered;
};

/** Two countries the app serves, and one it does not.
 *
 *  `gb` is left out of the served pair on purpose. It is the default, and
 *  `proxy.ts` gives it a branch of its own — using it as "a country we support"
 *  would quietly test that branch instead of the one meant. */
export const pickCountries = async (
  page: Page,
): Promise<{ served: string[]; foreign: string }> => {
  const list = await listOfferedCountries(page);
  const served = list.filter((iso) => iso !== "gb");
  const foreign =
    FOREIGN_CANDIDATES.find((iso) => !list.includes(iso)) ?? "";

  return { served, foreign };
};

// ---------------------------------------------------------------------------
// Changing the locale from the settings screens
//
// Everything above reads what `proxy.ts` decides from an address. These helpers
// drive the other way in: a shopper who is already on the site and picks a new
// language or country from Settings. The two screens write the locale cookies
// themselves and then load a new address, so what matters is that all three
// agree afterwards — the address, the saved choice, and the page.
// ---------------------------------------------------------------------------

/** The locale as the shopper meets it, read in one place.
 *
 *  Each value comes from a different layer, so a case can say which one did
 *  not follow: the address is `proxy.ts` and the screen, the cookies are what
 *  the next visit will use, and `<html lang>` is what the server rendered. */
export type LocaleOnScreen = {
  /** `iq-ar`, from the address. */
  prefix: string;
  /** The rendered `<html lang>`, e.g. `ar-IQ`. */
  htmlLang: string;
  /** The saved `country` cookie, or null when there is none. */
  savedCountry: string | null;
  /** The saved `language` cookie, or null when there is none. */
  savedLanguage: string | null;
};

export const readLocaleOnScreen = async (page: Page): Promise<LocaleOnScreen> => {
  // Every cookie, not `cookies(LIVE_ORIGIN)`. Both the app and `proxy.ts`
  // write these as `Secure`, and Playwright leaves a `Secure` cookie out of a
  // lookup by an `http://` address — even though the browser itself sends it to
  // loopback. Asking by address reported a saved language as missing.
  const host = new URL(LIVE_ORIGIN).hostname;
  const cookies = (await page.context().cookies()).filter(
    (cookie) => cookie.domain.replace(/^\./, "") === host,
  );
  // The app's own writer JSON-encodes the value and then URI-encodes it, so
  // `ar` can arrive as `%22ar%22`. Both layers are taken off.
  const saved = (name: string): string | null => {
    const raw = cookies.find((cookie) => cookie.name === name)?.value;
    if (raw === undefined) return null;
    const decoded = decodeURIComponent(raw);
    return decoded.replace(/^"(.*)"$/, "$1");
  };

  return {
    prefix: localePrefix(page),
    htmlLang: await page.evaluate(() => document.documentElement.lang),
    savedCountry: saved("country"),
    savedLanguage: saved("language"),
  };
};

/** Start a guest on the settings page, in a country the app serves.
 *
 *  The country and language are saved first, so the region picker never opens
 *  over the page. The settings page is opened by address rather than through
 *  the home page: the home page builds every section from the search backend,
 *  and a case about the settings screens should not wait on that. */
export const startInSettings = async (
  page: Page,
  options: { country: string },
): Promise<void> => {
  await seedLocale(page, options.country);
  await page.goto(`/${options.country}-en/settings`, {
    waitUntil: "domcontentloaded",
  });
  await expect(
    localeSettings.countryEntry(page),
    "the settings page did not render",
  ).toBeVisible();
};

/** Press one of the two entries on the settings page and wait for its screen.
 *
 *  Pressed until the address moves, not once. The settings page is
 *  server-rendered, so the entry is on screen before React has attached its
 *  handler, and a press in that window can do nothing at all. Measured: the
 *  second switch in GUEST-50 pressed Languages on the freshly loaded Arabic
 *  settings page and stayed there. `openCart` handles the same race the same
 *  way. */
const openSettingsEntry = async (
  page: Page,
  options: { entry: "language" | "country" },
): Promise<void> => {
  const control =
    options.entry === "language"
      ? localeSettings.languageEntry(page)
      : localeSettings.countryEntry(page);
  const screen = options.entry === "language" ? "/settings/languages" : "/settings/countries";

  for (let press = 0; press < 3; press += 1) {
    await control.click({ timeout: 10_000 }).catch(() => undefined);
    const moved = await page
      .waitForURL((url) => url.pathname.endsWith(screen), { timeout: 10_000 })
      .then(() => true)
      .catch(() => false);
    if (moved) return;
  }
  expect(
    new URL(page.url()).pathname,
    `pressing the ${options.entry} entry on the settings page never opened ${screen}`,
  ).toContain(screen);
};

/** Pick a language on Settings → Languages and press Save.
 *
 *  Returns once the new settings page has rendered under the new address. The
 *  screen reloads the whole document (`window.location.href`), so waiting for
 *  the address is waiting for the change itself. */
export const chooseLanguageInSettings = async (
  page: Page,
  options: { language: string },
): Promise<LocaleOnScreen> => {
  const { country } = localeParts(page);

  await openSettingsEntry(page, { entry: "language" });
  const row = localeSettings.language(page, options.language);
  await expect(
    row,
    `the language screen offers no "${options.language}" row — the backend's /languages list may have dropped it`,
  ).toBeVisible();
  await row.click();

  const save = localeSettings.saveLanguage(page);
  await expect(
    save,
    `picking "${options.language}" did not offer a Save button`,
  ).toBeVisible();

  await Promise.all([
    page.waitForURL(
      (url) => url.pathname === `/${country}-${options.language}/settings`,
    ),
    save.click(),
  ]);
  await expect(
    localeSettings.countryEntry(page),
    `the settings page did not render again under /${country}-${options.language}`,
  ).toBeVisible();

  return readLocaleOnScreen(page);
};

/** Pick a country on Settings → Countries and confirm it.
 *
 *  The screen asks "are you sure?" before it changes anything, so this presses
 *  Confirm too. Returns once the settings page has rendered under the new
 *  address. */
export const chooseCountryInSettings = async (
  page: Page,
  options: { country: string },
): Promise<LocaleOnScreen & { flag: string | null }> => {
  const { language } = localeParts(page);

  await openSettingsEntry(page, { entry: "country" });
  const row = region.country(page, options.country);
  await expect(
    row,
    `the country screen offers no "${options.country}" row`,
  ).toBeVisible();
  await row.click();

  const confirm = localeSettings.confirmCountry(page);
  await expect(
    confirm,
    `picking "${options.country}" did not ask to confirm the change`,
  ).toBeVisible();

  await Promise.all([
    page.waitForURL(
      (url) => url.pathname === `/${options.country}-${language}/settings`,
      // The screen fetches the new country's starting settings before it
      // moves, so this is one backend round trip longer than a plain click.
      { timeout: 30_000 },
    ),
    confirm.click(),
  ]);
  await expect(
    localeSettings.countryEntry(page),
    `the settings page did not render again under /${options.country}-${language}`,
  ).toBeVisible();

  return {
    ...(await readLocaleOnScreen(page)),
    flag: await localeSettings
      .countryEntry(page)
      .locator("img")
      .first()
      .getAttribute("src"),
  };
};
