import { NextResponse, type NextRequest } from "next/server";
import { fetchCountries, fetchLanguages } from "Server Requests";

import {
  COOKIE_NAMES,
  getCookieMiddleware,
  UserData,
} from "utils/cookies/cookie-manager";

// Constants
const SUPPORTED_LANGUAGES = ["en", "ar", "tr"];
const DEFAULT_LANGUAGE = "en";
const DEFAULT_COUNTRY = "gb";
const CACHE_TTL = 60 * 60 * 1000 * 24; // 1 day

// Cache for countries
let cachedCountries: any;
let cacheTimestamp = 0;
let cachedLanguages: any;
let cacheLanguagesTimestamp = 0;
// Cookie options
const COOKIE_OPTIONS = {
  path: "/",
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  maxAge: 360 * 7 * 24 * 60 * 60,
};

// Paths that should skip guest registration
const SKIP_REGISTRATION_PATHS = [
  "/api",
  "/_next",
  "/static",
  "/favicon.ico",
  "/robots.txt",
  "/sitemap.xml",
  "/manifest.json",
  "/firebase-messaging-sw.js",
  "/api-test",
  "/sitemap",
  "/manifest.json",
  "/error.png",
  "/assets",
  "/svg",
  "/fonts",
  "/translations",
  "/reports",
  "/images",
  "/styles",
  "/endCall",
  "/sitemap.xml",
  "/svg",
  "/call_direct",
  "/error.png",
  "/static",
  "/noposter",
  "/revalidate",
  "/callInProg",
  "/selectCountry",
  "/.well-known/appspecific/com.chrome.devtools.json",
  "/.well-known/appspecific/com.chrome.devtools.json",
  "/appspecific/com.chrome.devtools.json",
];
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

// Helper functions
async function getCachedCountries(): Promise<string[]> {
  const now = Date.now();
  if (!cachedCountries || now - cacheTimestamp > CACHE_TTL) {
    const data = await fetchCountries();
    cachedCountries = data.countries.map((s: any) => s.iso.toLowerCase());
    cacheTimestamp = now;
  }
  return cachedCountries;
}

// async function getCachedLanguages(): Promise<string[]> {
//   const now = Date.now();
//   if (!cachedLanguages || now - cacheLanguagesTimestamp > CACHE_TTL) {
//     const data = await fetchLanguages();
//     cachedLanguages = data;
//     cacheLanguagesTimestamp = now;
//   }
//   return cachedLanguages;
// }

function shouldSkipRegistration(pathname: string): boolean {
  return SKIP_REGISTRATION_PATHS.some((path) => pathname.startsWith(path));
}

// Validation functions
function isValidCountry(
  country: string | undefined,
  supportedCountries: string[]
): boolean {
  if (!country) return false;
  return (
    supportedCountries.includes(country.toLowerCase()) ||
    country.toLowerCase() === "gb"
  );
}

function isValidLanguage(language: string | undefined): boolean {
  if (!language) return false;
  return SUPPORTED_LANGUAGES.includes(language.toLowerCase());
}

function validateCookieValues(
  countryFromCookies: string | undefined,
  langFromCookies: string | undefined,
  supportedCountries: string[]
): ValidationResult {
  const validCountry = isValidCountry(countryFromCookies, supportedCountries);
  const validLanguage = isValidLanguage(langFromCookies);

  return {
    isValid: validCountry && validLanguage,
    country: validCountry ? countryFromCookies!.toLowerCase() : undefined,
    language: validLanguage ? langFromCookies!.toLowerCase() : undefined,
  };
}

// Parse locale from URL
function parseUrlLocale(pathname: string): LocaleInfo | null {
  const parts = pathname.split("/")[1]?.toLowerCase()?.split("-");
  if (parts?.length === 2) {
    return {
      country: parts[0],
      language: parts[1],
      locale: `${parts[0]}-${parts[1]}`,
    };
  }
  return null;
}

// Get preferred language from Accept-Language header
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

// Build locale string
function buildLocale(country: string, language: string): string {
  return `${country.toLowerCase()}-${language.toLowerCase()}`;
}

// Set locale cookies
function setLocaleCookies(
  response: NextResponse,
  country: string,
  language: string
): void {
  response.cookies.set("country", country.toLowerCase(), COOKIE_OPTIONS);
  response.cookies.set("lang", language.toLowerCase(), COOKIE_OPTIONS);
  response.cookies.set("language", language.toLowerCase(), COOKIE_OPTIONS);
}

// Main middleware function
export async function middleware(request: NextRequest) {
  const isBotAgent = isBot(request.headers.get("user-agent"));
  if (isBotAgent) {
    let url = request.nextUrl.clone();
    let pathname = url.pathname;
    const urlLocale = parseUrlLocale(pathname);

    const preferredLanguage = getPreferredLanguage(request);
    const defaultLocale = urlLocale
      ? buildLocale(urlLocale.country, urlLocale.language)
      : buildLocale(DEFAULT_COUNTRY, preferredLanguage);

    // Preserve full path, prefix with locale
    // Ensure pathname starts with /
    const cleanPathname = pathname.startsWith("/") ? pathname : `/${pathname}`;

    url.pathname = `/${defaultLocale}${cleanPathname}`;
    return NextResponse.redirect(url, 308);
    // return NextResponse.redirect(new URL("/", request.url), 308);
  }
  const url = request.nextUrl.clone();
  const pathname = url.pathname;

  if (pathname?.includes("/robots.txt") || pathname?.includes("/robots")) {
    // Immediately return NextResponse.next() to serve the static file
    return NextResponse.redirect(new URL("/robots.txt", request.url));
  }
  const userData = getCookieMiddleware<UserData>(
    request,
    COOKIE_NAMES.USER_DATA
  );
  const response = NextResponse.next();

  // Skip non-HTML requests
  if (
    request.method === "POST" ||
    !request.headers.get("accept")?.includes("text/html")
  ) {
    return response;
  }

  // ===== GUEST REGISTRATION LOGIC =====
  // if (!shouldSkipRegistration(pathname) && !userData) {
  //   try {
  //     const isBot = shouldBlockRegistration(request);

  //     if (!isBot) {
  //       console.warn("ensureGuestSessionMiddleware", JSON.stringify(request));
  //       const registrationResult =
  //         await AuthServerService.ensureGuestSessionMiddleware(
  //           request,
  //           response
  //         );

  //       if (!registrationResult.success) {
  //         console.error("Guest registration failed:", registrationResult.error);
  //       }
  //     } else {
  //       console.log(
  //         "Bot detected, skipping guest registration:",
  //         request.headers.get("user-agent")
  //       );
  //     }
  //   } catch (error) {
  //     console.error("Middleware guest registration error:", error);
  //   }
  // }

  // ===== LOCALIZATION LOGIC =====

  // Get supported countries
  const supportedCountries = await getCachedCountries();
  const allSupportedCountries = [...supportedCountries, "gb"];

  // Build supported locales
  const supportedLocales = new Set<string>();
  allSupportedCountries.forEach((country) => {
    SUPPORTED_LANGUAGES.forEach((lang) => {
      supportedLocales.add(buildLocale(country, lang));
    });
  });

  // Parse URL locale
  const urlLocale = parseUrlLocale(pathname);

  // Get and validate cookies
  const countryFromCookies = request.cookies.get("country")?.value;
  const langFromCookies =
    request.cookies.get("lang")?.value ||
    request.cookies.get("language")?.value;
  const cookieValidation = validateCookieValues(
    countryFromCookies,
    langFromCookies,
    allSupportedCountries
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

  // Add redirect protection
  const redirectCount = parseInt(
    request.headers.get("x-redirect-count") || "0"
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

    url.pathname = `/${defaultLocale}${cleanPathname}`;
    url.searchParams.delete("cart");
    url.searchParams.set("no-country", "true");
    return NextResponse.redirect(url);
  }

  // SCENARIO 1: Valid URL locale
  if (urlLocale && supportedLocales.has(urlLocale.locale)) {
    // Clean up timestamp parameter if present
    if (url.searchParams.get("_t")) {
      url.searchParams.delete("_t");
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
          `${urlLocale.country},${cookieCountry}`
        );
        const redirectResponse = NextResponse.redirect(url);
        redirectResponse.headers.set(
          "x-redirect-count",
          (redirectCount + 1).toString()
        );
        return redirectResponse;
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
  if (cookieValidation.isValid) {
    const locale = buildLocale(
      cookieValidation.country!,
      cookieValidation.language!
    );
    const cleanPathname = urlLocale
      ? pathname.slice(urlLocale.locale.length + 1)
      : pathname;

    url.pathname = `/${locale}${cleanPathname}`;
    return NextResponse.redirect(url);
  }

  // Try Geo IP detection (first visit)
  const geoCountry = request.geo?.country?.toLowerCase();
  const preferredLanguage = getPreferredLanguage(request);

  if (geoCountry && isValidCountry(geoCountry, allSupportedCountries)) {
    const locale = buildLocale(geoCountry, preferredLanguage);
    url.pathname = `/${locale}${pathname}`;
    return NextResponse.redirect(url);
  }

  // Fallback to default locale - ALWAYS redirect to gb-en
  const defaultLocale = buildLocale(DEFAULT_COUNTRY, preferredLanguage);
  const cleanPathname = urlLocale
    ? pathname.replace(urlLocale.locale, defaultLocale)
    : pathname.startsWith("/")
    ? pathname
    : `/${pathname}`;

  url.pathname = `/${defaultLocale}${cleanPathname}`;
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
        "/((?!api|noposter|firebase-messaging-sw.js|robots.txt|robots.txt|robots|opengraph-image.png|default.mp3|wa.mp3|api-test|sitemap|manifest.json|error.png|assets|svg|fonts|translations|reports|images|styles|endCall|sitemap.xml|svg|call_direct|error.png|static|.\\..|_next|revalidate|callInProg|selectCountry|favicon.ico).*)",
    },
  ],
};
