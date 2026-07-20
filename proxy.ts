import { NextResponse, userAgent, type NextRequest } from "next/server";
import { ipAddress } from "@vercel/functions";
import { NextURL } from "next/dist/server/web/next-url";

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
function parseUrlLocale(pathname: string): LocaleInfo | null {
  const parts = pathname.split("/")[1]?.toLowerCase()?.split("-");
  if (parts?.length === 2) {
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
  const country = request.headers.get("x-vercel-ip-country");
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
  return pathname.startsWith("/") ? pathname : `/${pathname}`;
}
function getClientIp(req: NextRequest): string {
  const ip = ipAddress(req);

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

    const preferredLanguage = getPreferredLanguage(request);
    const defaultLocale = urlLocale
      ? buildLocale(urlLocale.country, urlLocale.language)
      : buildLocale(DEFAULT_COUNTRY, preferredLanguage);

    // Preserve full path, prefix with locale
    const cleanPathname = pathname.startsWith("/") ? pathname : `/${pathname}`;
    url.pathname = `/${defaultLocale?.toLowerCase()}${cleanPathname}`;
    return NextResponse.redirect(url, 308);
  }
  const ip = getClientIp(request);
  // console.log(
  //   `Incoming request: ${pathname} from IP: ${ip}, User-Agent: ${ua}`,
  // );
  if (!isBotAgent) {
    if (ip && ip !== userIP) {
      // HttpOnly: userIP is PII and must not be readable by page JS. Server code
      // still reads it via getCookieServer (serverErrorReporter); client error
      // reports get the IP from Sentry ingestion (sendDefaultPii), not this cookie.
      response.cookies.set("userIP", ip, {
        ...COOKIE_OPTIONS,
        httpOnly: true,
      });
    }
  }
  // Handle referer and UTM tracking
  const referer = request.headers.get("referer");
  const utm_source = url.searchParams.get("utm_source");
  const mediaUrl=process.env.NEXT_PUBLIC_MEDIA_SERVER_BASE_URL;
 if (mediaUrl) {
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

  if (!isBotAgent && (referer || utm_source)) {
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
  if (pathname?.includes("/robots.txt") || pathname?.includes("/robots")) {
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

  // Handle bypass parameter - skip all checks and clean URL
  if (url.searchParams.get("_bypass") === "popup-selection") {
    if (urlLocale && supportedLocales.has(urlLocale.locale)) {
      setLocaleCookies(response, urlLocale.country, urlLocale.language);
    }

    // Clean URL by removing all navigation-related params
    url.searchParams.delete("_bypass");
    url.searchParams.delete("changed-country");
    url.searchParams.delete("no-country");
    url.searchParams.delete("_t");

    if (url.search) {
      return NextResponse.redirect(url);
    }
    return response;
  }

  // Redirect protection
  const redirectCount = parseInt(
    request.headers.get("x-redirect-count") || "0",
  );
  if (redirectCount > 2) {
    // Even if we hit redirect limit, ensure we have a proper locale
    const preferredLanguage = getPreferredLanguage(request);
    const defaultLocale = buildLocale(DEFAULT_COUNTRY, preferredLanguage);
    const cleanPathname = urlLocale
      ? pathname.replace(urlLocale.locale, defaultLocale)
      : pathname.startsWith("/")
        ? pathname
        : `/${pathname}`;

    url.pathname = `/${defaultLocale?.toLowerCase()}${cleanPathname}`;
    url.searchParams.delete("cart");
    url.searchParams.set("no-country", "true");
    return NextResponse.redirect(url);
  }

  // SCENARIO 1: Valid URL locale
  if (urlLocale && supportedLocales.has(urlLocale.locale)) {
    // Validate URL locale against supported countries
    const urlLocaleValidation = validateLocalePair(
      urlLocale.country?.toLowerCase(),
      urlLocale.language?.toLowerCase(),
      allSupportedCountries,
    );

    // If URL locale is not valid, treat as no valid URL locale
    if (!urlLocaleValidation.isValid) {
      // Fall through to SCENARIO 2
    } else {
      // Clean up timestamp parameter if present
      if (url.searchParams.get("_t")) {
        url.searchParams.delete("_t");
      }
      if (cookieValidation.isValid) {
        const { country: cKey, language: lKey } = cookieValidation;

        // If URL is GB but cookie is something else (e.g., TR), REDIRECT
        if (urlLocale.country === "gb" && cKey !== "gb") {
          const targetLocale = buildLocale(cKey!, lKey!);
          const cleanPath = getCleanPathname(pathname, urlLocale);
          url.pathname = `/${targetLocale?.toLowerCase()}${cleanPath === "/" ? "" : cleanPath}`;

          const res = createRedirectResponse(url, redirectCount);
          // IMPORTANT: You must attach cookies to the redirect response
          setLocaleCookies(res, cKey!.toLowerCase(), lKey!.toLowerCase());
          return res;
        }
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
          let parts=url.pathname.split('/');
          let normalizedPart=parts[1];
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
    url.pathname = `/${locale?.toLowerCase()}${pathname.startsWith("/") ? pathname : "/" + pathname}`;
    return NextResponse.redirect(url);
  }

  // 3. Fallback الافتراضي (فقط هنا يظهر no-country)
  const defaultLocale = buildLocale(DEFAULT_COUNTRY, preferredLanguage);
  const cleanPathname = urlLocale
    ? pathname.replace(urlLocale.locale, defaultLocale)
    : pathname.startsWith("/")
      ? pathname
      : `/${pathname}`;

  url.pathname = `/${defaultLocale?.toLowerCase()}${cleanPathname === "/" ? "" : cleanPathname}`;
  url.searchParams.delete("cart");
  url.searchParams.set("no-country", "true");
  return NextResponse.redirect(url);
}

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
