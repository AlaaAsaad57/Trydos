import { NextResponse, type NextRequest } from "next/server";
import { ipAddress } from "@vercel/functions";
import { checkRateLimit, sendSecurityAlert } from "serverRequests/radis";
// Constants
const SUPPORTED_LANGUAGES = ["en", "ar", "tr", "ku"];
const DEFAULT_LANGUAGE = "en";
const DEFAULT_COUNTRY = "gb";

// Cookie options
const COOKIE_OPTIONS = {
  path: "/",
  httpOnly: false,
  secure: true,
  sameSite: "lax" as const,
  maxAge: 360 * 7 * 24 * 60 * 60,
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

function getAllSupportedCountries(): string[] {
  return [...getCachedCountries(), "gb"];
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
      country: parts[0],
      language: parts[1],
      locale: `${parts[0]}-${parts[1]}`,
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
// Main middleware function
export async function proxy(request: NextRequest) {
  const ip = getClientIp(request);
  // 1️⃣ Rate limiting
  if (ip && ip !== "0.0.0.0") {
    const allowed = await checkRateLimit(ip, 50, 60);
    if (!allowed) {
      await sendSecurityAlert(
        `🚨 IP ${ip} exceeded rate limit. Path: ${request.nextUrl.pathname}`,
      );
      return new NextResponse("Too many requests", { status: 429 });
    }
  }

  const userIP = request.cookies.get("userIP")?.value;

  const isBotAgent = isBot(request.headers.get("user-agent"));
  const url = request.nextUrl.clone();
  const pathname = url.pathname;
  const urlLocale = parseUrlLocale(pathname);
  const allSupportedCountries = getAllSupportedCountries();
  const supportedLocales = buildSupportedLocales(allSupportedCountries);
  const response = NextResponse.next();
  if (ip && ip !== userIP) {
    response.cookies.set("userIP", ip, {
      ...COOKIE_OPTIONS,
      httpOnly: false,
    });
  }
  // Handle referer and UTM tracking
  const referer = request.headers.get("referer");
  const utm_source = url.searchParams.get("utm_source");

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
    url.pathname = `/${defaultLocale}${cleanPathname}`;
    return NextResponse.redirect(url, 308);
  }

  // Handle robots.txt requests
  if (pathname?.includes("/robots.txt") || pathname?.includes("/robots")) {
    return NextResponse.redirect(new URL("/robots.txt", request.url));
  }

  // Get and validate cookie values
  const countryFromCookies = request.cookies.get("country")?.value;
  const langFromCookies =
    request.cookies.get("lang")?.value ||
    request.cookies.get("language")?.value;
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

    url.pathname = `/${defaultLocale}${cleanPathname}`;
    url.searchParams.delete("cart");
    url.searchParams.set("no-country", "true");
    return NextResponse.redirect(url);
  }

  // SCENARIO 1: Valid URL locale
  if (urlLocale && supportedLocales.has(urlLocale.locale)) {
    // Validate URL locale against supported countries
    const urlLocaleValidation = validateLocalePair(
      urlLocale.country,
      urlLocale.language,
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
          url.pathname = `/${targetLocale}${cleanPath === "/" ? "" : cleanPath}`;

          const res = createRedirectResponse(url, redirectCount);
          // IMPORTANT: You must attach cookies to the redirect response
          setLocaleCookies(res, cKey!, lKey!);
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
    url.pathname = `/${targetLocale}${cleanPath === "/" ? "" : cleanPath}`;

    const redirectResponse = NextResponse.redirect(url);
    // نقل الكوكيز الصالحة للـ Response الجديد لضمان عدم ضياعها
    setLocaleCookies(
      redirectResponse,
      cookieValidation.country,
      cookieValidation.language,
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
    const locale = buildLocale(geoValidation.country, geoValidation.language);
    url.pathname = `/${locale}${pathname.startsWith("/") ? pathname : "/" + pathname}`;
    return NextResponse.redirect(url);
  }

  // 3. Fallback الافتراضي (فقط هنا يظهر no-country)
  const defaultLocale = buildLocale(DEFAULT_COUNTRY, preferredLanguage);
  const cleanPathname = urlLocale
    ? pathname.replace(urlLocale.locale, defaultLocale)
    : pathname.startsWith("/")
      ? pathname
      : `/${pathname}`;

  url.pathname = `/${defaultLocale}${cleanPathname === "/" ? "" : cleanPathname}`;
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
        "/((?!api|noposter|sentry-test|requests-log|testBoutique|simulateUser|firebase-messaging-sw.js|google210329fcef4fbcff.html|robots.txt|robots.txt|robots|opengraph-image.png|default.mp3|wa.mp3|api-test|sitemap|manifest.json|error.png|assets|icons|fonts|translations|reports|images|styles|endCall|sitemap.xml|call_direct|error.png|static|.\\..|_next|revalidate|callInProg|selectCountry|favicon.ico).*)",
      missing: [
        { type: "header", key: "purpose", value: "prefetch" },
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "next-action" },
        { type: "header", key: "next-router-state-tree" },
      ],
    },
  ],
};
