import { NextResponse, userAgent, type NextRequest } from "next/server";
import { ipAddress } from "@vercel/functions";
import { NextURL } from "next/dist/server/web/next-url";

// ── STAGING GATE — off unless asked for ────────────────────────
// With STAGING_GATE=on this file serves nothing but the centered-logo page
// (app/page.tsx) at "/", and sends every other path it runs on back to "/".
// The redirect is deliberately temporary (307, never 308): a permanent redirect
// would be cached by browsers and keep sending real users to the logo long
// after launch.
//
// The gate is opt-in: any other value — including no value at all — leaves it
// off. That is what lets this branch carry the gate and still behave exactly
// like the storefront. Nothing has to be set to serve the real app, and one
// setting brings the logo page back.
//
// What the gate does NOT cover. Its other half would be `config.matcher` at
// the bottom of this file, and that is a build-time export — Next only accepts
// literals there, so it cannot read this setting. We ship the storefront
// matcher, which keeps /api, the sitemaps, the static folders and (through its
// `missing:` clause) prefetches and server actions away from this function.
// Those paths therefore stay live while the gate is on: it turns back every
// page navigation, and nothing else. Closing that hole means swapping in the
// wide gate matcher kept next to `config` at the bottom of this file — and
// swapping it back out at launch, because while it ships this function runs in
// front of every /api call and every prefetch, gate or no gate.
const STAGING_GATE_ENABLED = process.env.STAGING_GATE === "on";

// The only path the gate serves. Static assets the logo page needs are handled
// by the matcher below, which never invokes this function for them.
const STAGING_GATE_ALLOWED_PATH = "/";

// Constants
const SUPPORTED_LANGUAGES = ["en", "ar", "tr", "ku"];
const DEFAULT_LANGUAGE = "en";
const DEFAULT_COUNTRY = "gb";

// Mirror of COOKIE_NAMES.LOGOUT_GUARD. Declared as a literal (not imported) so
// this Edge middleware never pulls in cookie-manager, which depends on the
// Node-only `jsonwebtoken`. Keep this string in sync with that constant.
const LOGOUT_GUARD_COOKIE = "LOGOUT-GUARD";

// Cookie options
const COOKIE_OPTIONS = {
  path: "/",
  httpOnly: false,
  secure: true,
  sameSite: "lax" as const,
  // Non-token cookies (locale, referer, userIP). Default 1 year; override with
  // DEFAULT_COOKIE_MAX_AGE (seconds). Was ~6.9y (360*7 days) — now a sane 1y.
  maxAge: Number(process.env.DEFAULT_COOKIE_MAX_AGE) || 365 * 24 * 60 * 60, // 1y
};

// Types
interface LocaleInfo {
  country: string;
  language: string;
  locale: string;
}

interface ValidationResult {
  isValid: boolean;
  country?: string;
  language?: string;
}

// Bot detection
function isBot(userAgent: string | null): boolean {
  if (!userAgent) return false;

  const bots = [
    "googlebot",
    "bingbot",
    "facebookexternalhit",
    "facebot",
    "twitterbot",
    "whatsapp",
    "linkedinbot",
    "instagram",
    "discordbot",
    "slackbot-linkexpanding",
    "vercel",
    "vercel-og",
  ];

  userAgent = userAgent.toLowerCase();
  return bots.some((bot) => userAgent.includes(bot));
}

// Helper functions
function getCachedCountries(): string[] {
  return ["sy", "lb", "tr", "iq"];
}

function getAllSupportedCountries(countries): string[] {
  return [...countries.map((s) => s?.toLowerCase()), "gb"];
}

// Validation utilities
function isValidCountry(
  country: string | undefined,
  supportedCountries: string[],
): boolean {
  if (!country) return false;
  const normalizedCountry = country.toLowerCase();
  return supportedCountries.includes(normalizedCountry);
}

function isValidLanguage(language: string | undefined): boolean {
  if (!language) return false;
  return SUPPORTED_LANGUAGES.includes(language.toLowerCase());
}

function validateLocalePair(
  country: string | undefined,
  language: string | undefined,
  supportedCountries: string[],
): ValidationResult {
  const validCountry = isValidCountry(country, supportedCountries);
  const validLanguage = isValidLanguage(language);

  return {
    isValid: validCountry && validLanguage,
    country: validCountry ? country!.toLowerCase() : undefined,
    language: validLanguage ? language!.toLowerCase() : undefined,
  };
}

function validateCookieValues(
  countryFromCookies: string | undefined,
  langFromCookies: string | undefined,
  supportedCountries: string[],
): ValidationResult {
  return validateLocalePair(
    countryFromCookies,
    langFromCookies,
    supportedCountries,
  );
}

// URL parsing utilities
// A prefix counts as a locale only if it is two letters, a hyphen, two letters.
// The shape check is the whole point: without it any first segment carrying one
// hyphen is read as a country and a language, so "/privacy-policy" is taken as
// country "privacy" plus language "policy". `getCleanPathname` then strips it
// as if it were a prefix, the path is gone, and the visitor lands on the home
// page instead of the page they asked for.
function parseUrlLocale(pathname: string): LocaleInfo | null {
  const parts = pathname.split("/")[1]?.toLowerCase()?.split("-");
  if (parts?.length === 2 && parts.every((part) => /^[a-z]{2}$/.test(part))) {
    return {
      country: parts[0]?.toLowerCase(),
      language: parts[1]?.toLowerCase(),
      locale: `${parts[0]}-${parts[1]}`?.toLowerCase(),
    };
  }
  return null;
}

// Language detection utilities
function getPreferredLanguage(request: NextRequest): string {
  const acceptLanguage = request.headers.get("accept-language");
  if (!acceptLanguage) return DEFAULT_LANGUAGE;

  // Parse Accept-Language header
  const languages = acceptLanguage.split(",").map((lang) => {
    const [code] = lang.trim().split(";")[0].split("-");
    return code.toLowerCase();
  });

  // Find first supported language
  for (const lang of languages) {
    if (SUPPORTED_LANGUAGES.includes(lang)) {
      return lang;
    }
  }

  return DEFAULT_LANGUAGE;
}

// Locale building utilities
function buildLocale(country: string, language: string): string {
  return `${country.toLowerCase()}-${language.toLowerCase()}`;
}

function buildSupportedLocales(supportedCountries: string[]): Set<string> {
  const supportedLocales = new Set<string>();
  supportedCountries.forEach((country) => {
    SUPPORTED_LANGUAGES.forEach((lang) => {
      supportedLocales.add(buildLocale(country, lang));
    });
  });
  return supportedLocales;
}

// Cookie utilities
function setLocaleCookies(
  response: NextResponse,
  country: string,
  language: string,
): void {
  response.cookies.set("country", country.toLowerCase(), COOKIE_OPTIONS);
  response.cookies.set("lang", language.toLowerCase(), COOKIE_OPTIONS);
  response.cookies.set("language", language.toLowerCase(), COOKIE_OPTIONS);
}

// Geo IP utilities
function getGeoCountry(request: NextRequest): string | undefined {
  // `x-vercel-ip-country` is derived from the IP that connects to Vercel. Once
  // Cloudflare proxies this hostname that is a Cloudflare edge IP, not the
  // visitor, so every request would resolve to the PoP's country and fall
  // through to the no-country default below. `CF-IPCountry` is set by
  // Cloudflare from the real client IP, so prefer it.
  //
  // The header is absent whenever Cloudflare is not in front — a grey-clouded
  // record, a direct *.vercel.app request, local dev — and the original Vercel
  // value is used unchanged. That is what makes this safe to ship BEFORE the
  // DNS record is proxied, which is the order it has to happen in.
  //
  // Cloudflare answers "XX" for unknown and "T1" for Tor. Neither is a
  // supported country, so validateLocalePair rejects them and they take the
  // same path an unknown geo takes today.
  const country =
    request.headers.get("cf-ipcountry") ??
    request.headers.get("x-vercel-ip-country");
  return country?.toLowerCase();
}

// Redirect utilities
function createRedirectResponse(url: URL, redirectCount: number): NextResponse {
  const redirectResponse = NextResponse.redirect(url);
  redirectResponse.headers.set(
    "x-redirect-count",
    (redirectCount + 1).toString(),
  );
  return redirectResponse;
}
let countriesCache: { data: any[]; expiry: number } | null = null;
const COUNTRIES_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in-memory
let countriesInflight = false;

// Fire-and-forget refresh of the in-memory countries cache. Never awaited on the
// request path, so it cannot block a navigation. A killed post-response promise
// just retries on the next request (self-healing); intentionally no waitUntil.
async function refreshCountries({ language, country }) {
  if (countriesInflight) return;
  countriesInflight = true;

  try {
    const res = await fetch(
      `${process.env.BACKEND_URL}/countries`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          lang: language,
          country: country,
        },
      },
    );

    if (!res.ok) return; // keep existing cache / hardcoded fallback

    const json = await res.json();
    const countries = json?.data?.countries || [];

    if (countries.length) {
      countriesCache = {
        data: countries.map((s) => s.iso),
        expiry: Date.now() + COUNTRIES_CACHE_TTL,
      };
    }
  } catch {
    // swallow — fallback stays in effect, refresh retries next request
  } finally {
    countriesInflight = false;
  }
}

// Synchronous: serves cached-or-hardcoded countries instantly and triggers a
// background refresh when the cache is stale/empty. Never blocks the request.
function getCountriesForMiddleware({ language, country }): string[] {
  const isFresh = countriesCache && Date.now() < countriesCache.expiry;
  if (!isFresh) {
    void refreshCountries({ language, country });
  }
  return countriesCache?.data ?? getCachedCountries();
}
function getCleanPathname(
  pathname: string,
  urlLocale: LocaleInfo | null,
): string {
  if (urlLocale) {
    return pathname.slice(urlLocale.locale.length + 1);
  }
  // A URL's pathname always starts with "/", so there is nothing to add here.
  return pathname;
}
function getClientIp(req: NextRequest): string {
  // Same reasoning as getGeoCountry above: behind Cloudflare, ipAddress() reads
  // headers describing the connection Vercel saw, which is Cloudflare's edge.
  // `CF-Connecting-IP` carries the real client. Absent when Cloudflare is not
  // in front, so the original call still runs everywhere it used to.
  const ip = req.headers.get("cf-connecting-ip") ?? ipAddress(req);

  if (ip) return ip;
  return "0.0.0.0"; // fallback, should not happen on Vercel
}

const normalizeUrl=(url:NextURL):NextURL=>{
 url.pathname=url.pathname.toLowerCase();
 return url
}
const extractLocales=(u:string)=>{
   const parts = u.split("/")[1]?.split("-");
   if(parts.length===2){
    return `${parts[0]}-${parts[1]}`
   }
}
// Main middleware function
export async function proxy(request: NextRequest) {
  // Staging gate — see STAGING_GATE_ENABLED above. Must stay the first thing
  // this function does, so no locale/country/bot logic can run while it is on.
  if (STAGING_GATE_ENABLED) {
    return request.nextUrl.pathname === STAGING_GATE_ALLOWED_PATH
      ? NextResponse.next()
      : NextResponse.redirect(new URL("/", request.url), 307);
  }

  const ua = request.headers.get("user-agent") ?? "";
  const url = request.nextUrl.clone();
  const pathname = url.pathname;
  const urlLocale = parseUrlLocale(pathname);

  // Sitemaps bypass ALL locale/country logic. The matcher only excludes these
  // when they're the first path segment, so locale-prefixed routes like
  // /lb-en/sitemap.xml still hit the proxy and get a changed-country redirect —
  // crawlers must receive the raw XML, never a popup redirect.
  // (robots.txt is handled separately below.)
  if (/\/sitemap[\w-]*\.xml$/i.test(pathname)) {
    return NextResponse.next();
  }

  const userIP = request.cookies.get("userIP")?.value;

  const isBotAgent = isBot(request.headers.get("user-agent"));

  let coutries = getCountriesForMiddleware({
    language: "en",
    country: getGeoCountry(request) ?? "sy",
  });
  const allSupportedCountries = getAllSupportedCountries(coutries);

  const supportedLocales = buildSupportedLocales(allSupportedCountries);
  const hasUppercase = extractLocales(url.pathname) !== extractLocales(url.pathname)?.toLowerCase();
  const response = hasUppercase 
    ? NextResponse.redirect(normalizeUrl(url), 308) 
    : NextResponse.next();


  // End of the logout window. The logout route armed LOGOUT-GUARD so that any
  // in-flight 401 couldn't resurrect the cleared session; this top-level
  // navigation IS the post-logout reload, so drop the marker now and let the
  // fresh page register a guest normally again. Only cleared on a real page
  // render (NextResponse.next) — redirect hops below intentionally keep the
  // guard so protection holds until the reload actually lands. (The matcher
  // excludes /api, so the follow-up /api/auth/register-device is never blocked.)
  if (request.cookies.get(LOGOUT_GUARD_COOKIE)?.value) {
    response.cookies.delete(LOGOUT_GUARD_COOKIE);
  }
  if (isBotAgent) {
    if (urlLocale && supportedLocales.has(urlLocale.locale)) {
      return response;
    }

    // Only unsupported pairs reach this point, so the pair in the address can
    // never be the answer: building the target from it sent a crawler to
    // /xx-en/xx-en/shop — doubled, and still unsupported. Because this is a
    // permanent redirect, a crawler would remember that address. Use the default
    // locale and strip the bad prefix, the same as the path a person takes.
    const preferredLanguage = getPreferredLanguage(request);
    const defaultLocale = buildLocale(DEFAULT_COUNTRY, preferredLanguage);

    // Preserve full path, prefix with locale
    const cleanPathname = getCleanPathname(pathname, urlLocale);
    url.pathname = `/${defaultLocale?.toLowerCase()}${cleanPathname === "/" ? "" : cleanPathname}`;
    return NextResponse.redirect(url, 308);
  }
  const ip = getClientIp(request);
  // console.log(
  //   `Incoming request: ${pathname} from IP: ${ip}, User-Agent: ${ua}`,
  // );
  // No `!isBotAgent` guard needed: every crawler has already returned above.
  if (ip && ip !== userIP) {
    // HttpOnly: userIP is PII and must not be readable by page JS. Server code
    // still reads it via getCookieServer (serverErrorReporter); client error
    // reports get the IP from Sentry ingestion (sendDefaultPii), not this cookie.
    response.cookies.set("userIP", ip, {
      ...COOKIE_OPTIONS,
      httpOnly: true,
    });
  }
  // Handle referer and UTM tracking
  const referer = request.headers.get("referer");
  const utm_source = url.searchParams.get("utm_source");
  const mediaUrl=process.env.NEXT_PUBLIC_MEDIA_SERVER_BASE_URL;
 // Skipped when `response` is the lower-case redirect: these hints tell a browser
 // to open connections early for a page it is about to render, and a redirect
 // renders nothing. The browser gets them on the real page it lands on.
 if (mediaUrl && !hasUppercase) {
    // We only need to preconnect to the base domain origin, not the full subpaths
    response.headers.append(
      'Link',
      `<${mediaUrl}>; rel="preconnect"; crossorigin`
    );
    response.headers.append(
      'Link',
      '<https://www.googletagmanager.com>; rel="preconnect"'
    );

    response.headers.append(
      'Link',
      '<https://www.google-analytics.com>; rel="dns-prefetch"'
    );
  }

  // Same again: a crawler never gets this far, so it needs no check here.
  if (referer || utm_source) {
    if (utm_source) {
      response.cookies.set("referer", referer, {
        ...COOKIE_OPTIONS,
        httpOnly: false,
      });
      url.searchParams.delete("utm_source");
    } else {
      const hostname = request.nextUrl.origin;
      // Skip if referer is from same origin
      if (!referer?.startsWith(hostname)) {
        response.cookies.set("referer", referer, {
          ...COOKIE_OPTIONS,
          httpOnly: false,
        });
      }
    }
  }
  // Bot handling

  // Handle robots.txt requests
  // Exact match only. `includes` used to catch any path with the word in it, so
  // a real page like /gb-en/robots-guide was sent to the robots file too. The
  // matcher already excludes /robots and /robots.txt as a first segment, so this
  // is only a safety net for the day that list changes.
  if (pathname === "/robots.txt" || pathname === "/robots") {
    return NextResponse.redirect(new URL("/robots.txt", request.url));
  }

  // Get and validate cookie values
  const countryFromCookies = request.cookies.get("country")?.value?.toLowerCase();
  const langFromCookies =
    request.cookies.get("lang")?.value?.toLowerCase() ||
    request.cookies.get("language")?.value?.toLowerCase();
  const cookieValidation = validateCookieValues(
    countryFromCookies,
    langFromCookies,
    allSupportedCountries,
  );

  // Handle bypass parameter - skip all checks and clean URL.
  //
  // Only when the address carries a pair we support. The pair IS the choice the
  // visitor made in the popup, so without one there is nothing to save — and
  // skipping every check would leave them on an address with no locale at all.
  // Without a pair we now fall through and let the normal rules put them on a
  // proper address first.
  if (
    url.searchParams.get("_bypass") === "popup-selection" &&
    urlLocale &&
    supportedLocales.has(urlLocale.locale)
  ) {
    // Clean URL by removing all navigation-related params
    url.searchParams.delete("_bypass");
    url.searchParams.delete("changed-country");
    url.searchParams.delete("no-country");
    url.searchParams.delete("_t");

    // The choice has to travel with whichever answer we give. It used to be
    // written only on the pass-through response, so a bypass that still had
    // another query value on it came back as a fresh redirect carrying no
    // cookies — the choice was lost and the popup asked again.
    const bypassResponse = url.search ? NextResponse.redirect(url) : response;
    setLocaleCookies(bypassResponse, urlLocale.country, urlLocale.language);
    return bypassResponse;
  }

  // Redirect protection
  const redirectCount = parseInt(
    request.headers.get("x-redirect-count") || "0",
  );
  if (redirectCount > 2) {
    // Even if we hit redirect limit, ensure we have a proper locale
    const preferredLanguage = getPreferredLanguage(request);
    const defaultLocale = buildLocale(DEFAULT_COUNTRY, preferredLanguage);
    // Take off whatever locale-shaped prefix the address arrived with, then put
    // the default one in front. `replace` used to swap the prefix for the default
    // and the template then added the default again, so /xx-en/shop came out as
    // /gb-en/gb-en/shop.
    const cleanPathname = getCleanPathname(pathname, urlLocale);

    url.pathname = `/${defaultLocale?.toLowerCase()}${cleanPathname === "/" ? "" : cleanPathname}`;
    url.searchParams.delete("cart");
    url.searchParams.set("no-country", "true");
    return NextResponse.redirect(url);
  }

  // SCENARIO 1: Valid URL locale
  if (urlLocale && supportedLocales.has(urlLocale.locale)) {
    // The locale is already in `supportedLocales`, which is built from the same
    // country and language lists that validateLocalePair checks against. Running
    // that check again here could never fail, so the "treat as no valid URL
    // locale" branch it guarded never ran. Both are gone.

    // Clean up timestamp parameter if present
    if (url.searchParams.get("_t")) {
      url.searchParams.delete("_t");
    }
    // A visitor on the global address who has already chosen a country belongs
    // in that country, not here. `gb` is the global bucket — "we do not know
    // where you are" — not a market, which is why the app also offers the
    // country picker on every gb address.
    //
    // **The saved country alone is enough to move them.** Everywhere else a
    // saved pair must be complete before it counts, because a country without a
    // language decides only half a locale. Here it decides all of it: the
    // address already carries a supported language, so the language they are
    // reading is the obvious one to keep. Requiring both used to strand anyone
    // whose `lang` cookie had been lost or expired separately on the global
    // address, with the picker in front of them and a perfectly good country
    // already chosen.
    //
    // Their saved language wins when they have one; the address's language is
    // the fallback. Either way the full set is written back, so a half-set
    // state heals itself on the way through.
    const savedCountry = isValidCountry(countryFromCookies, allSupportedCountries)
      ? countryFromCookies!.toLowerCase()
      : undefined;

    if (urlLocale.country === "gb" && savedCountry && savedCountry !== "gb") {
      const targetLanguage = cookieValidation.language ?? urlLocale.language;
      const targetLocale = buildLocale(savedCountry, targetLanguage);
      const cleanPath = getCleanPathname(pathname, urlLocale);
      url.pathname = `/${targetLocale?.toLowerCase()}${cleanPath === "/" ? "" : cleanPath}`;

      const res = createRedirectResponse(url, redirectCount);
      // IMPORTANT: You must attach cookies to the redirect response
      setLocaleCookies(res, savedCountry, targetLanguage);
      return res;
    }
    // CASE 1A: Handle no-country parameter
    if (url.searchParams.get("no-country")) {
      setLocaleCookies(response, urlLocale.country, urlLocale.language);
      return response; // Show the popup
    }

    // CASE 1B: Check if cookies match URL (only if cookies are valid)
    if (cookieValidation.isValid) {
      const cookieCountry = cookieValidation.country!;
      const cookieLanguage = cookieValidation.language!;

      // Same country and language - proceed normally
      if (
        urlLocale.country === cookieCountry &&
        urlLocale.language === cookieLanguage &&
        !url.searchParams.get("changed-country")
      ) {
        return response;
      }

      // Different country - show popup
      if (
        urlLocale.country !== cookieCountry &&
        cookieCountry !== "gb" &&
        !url.searchParams.get("changed-country")
      ) {
        url.searchParams.delete("cart");
        url.searchParams.set(
          "changed-country",
          `${urlLocale.country},${cookieCountry}`,
        );
        return createRedirectResponse(url, redirectCount);
      }
    }

    // CASE 1C: No valid cookies - set from URL
    if (!cookieValidation.isValid) {
      setLocaleCookies(response, urlLocale.country, urlLocale.language);
      return response;
    }

    // CASE 1D: Handle changed-country parameter
    if (url.searchParams.get("changed-country")) {
      setLocaleCookies(response, urlLocale.country, urlLocale.language);
      return response; // Show the popup
    }

    // Default: set cookies and proceed
    setLocaleCookies(response, urlLocale.country, urlLocale.language);
    return response;
  }

  // SCENARIO 2: No valid URL locale - determine redirect

  // Try valid cookies first
  if (
    cookieValidation.isValid &&
    cookieValidation.country &&
    cookieValidation.language
  ) {
    const targetLocale = buildLocale(
      cookieValidation.country,
      cookieValidation.language,
    );
    const cleanPath = getCleanPathname(pathname, urlLocale);
    url.pathname = `/${targetLocale?.toLowerCase()}${cleanPath === "/" ? "" : cleanPath}`;

    const redirectResponse = NextResponse.redirect(url);
    // نقل الكوكيز الصالحة للـ Response الجديد لضمان عدم ضياعها
    setLocaleCookies(
      redirectResponse,
      cookieValidation.country?.toLowerCase(),
      cookieValidation.language?.toLowerCase(),
    );
    return redirectResponse;
  }

  // 2. محاولة Geo IP
  const geoCountry = getGeoCountry(request);
  const preferredLanguage = getPreferredLanguage(request);
  const geoValidation = validateLocalePair(
    geoCountry,
    preferredLanguage,
    allSupportedCountries,
  );

  if (
    geoValidation.isValid &&
    geoValidation.country &&
    geoValidation.language
  ) {
    const locale = buildLocale(geoValidation.country?.toLowerCase(), geoValidation.language?.toLowerCase());
    url.pathname = `/${locale?.toLowerCase()}${pathname}`;
    return NextResponse.redirect(url);
  }

  // 3. Fallback الافتراضي (فقط هنا يظهر no-country)
  const defaultLocale = buildLocale(DEFAULT_COUNTRY, preferredLanguage);
  // Same fix as the redirect-limit branch above: strip the locale-shaped prefix
  // rather than replacing it, or the default locale ends up in the address twice.
  const cleanPathname = getCleanPathname(pathname, urlLocale);

  url.pathname = `/${defaultLocale?.toLowerCase()}${cleanPathname === "/" ? "" : cleanPathname}`;
  url.searchParams.delete("cart");
  url.searchParams.set("no-country", "true");
  return NextResponse.redirect(url);
}

// Turning the gate on takes two edits, and the second is the one that gets
// forgotten:
//
//   1. Set STAGING_GATE=on — the flag at the top of this file.
//   2. Swap the storefront matcher below for the gate matcher kept just above
//      it, commented out.
//
// Nothing checks that the two agree. The flag is read at request time and the
// matcher is fixed at build time, so no test and no runtime check can tell you
// the pair is half done — this comment is the only link between them. Undo both
// together when the storefront comes back.
//
// ── THE GATE MATCHER — commented out on purpose ─────────────────
// Far wider than the storefront matcher: everything the logo page does not
// need reaches this function, so /api, the sitemaps, the static folders,
// prefetches and server actions are all turned back as well. Excluded is only
// what the logo page needs to render, plus crawler hygiene — `_next` for the
// bundle and the image optimizer, `icons` for Logo.svg, `favicon.ico`,
// `robots.txt` (which serves `disallow: /`), and the search-console file.
// Sitemaps are deliberately NOT excluded: they 307 to "/" rather than
// advertising product addresses that all redirect.
//
// export const config = {
//   matcher: [
//     "/((?!_next|icons|favicon.ico|robots.txt|google210329fcef4fbcff.html).*)",
//   ],
// };

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    {
      source:
        "/((?!api|ingest|noposter|sentry-test|fcm-dashboard|testBoutique|simulateUser|firebase-messaging-sw.js|google210329fcef4fbcff.html|robots.txt|robots.txt|robots|opengraph-image.png|default.mp3|wa.mp3|backend-compare|sitemap|manifest.json|error.png|assets|icons|fonts|translations|reports|images|styles|endCall|sitemap.xml|call_direct|error.png|static|.\\..|_next|revalidate|callInProg|selectCountry|favicon.ico).*)",
      missing: [
        { type: "header", key: "purpose", value: "prefetch" },
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "next-action" },
        { type: "header", key: "next-router-state-tree" },
      ],
    },
  ],
};
