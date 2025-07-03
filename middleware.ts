"use server";
import { NextResponse, type NextRequest } from "next/server";
import { fetchCountries } from "Server Requests";
import { shouldBlockRegistration } from "@/utils/bot-detector";
import { AuthServerService } from "@/services/auth-server";
import {
  COOKIE_NAMES,
  getCookieMiddleware,
  UserData,
} from "utils/cookies/cookie-manager";

const languages = ["en", "ar", "tr"];
let cachedCountries: any;
let cacheTimestamp = 0;
const CACHE_TTL = 60 * 60 * 1000 * 24; // 1 day

async function getCachedCountries() {
  const now = Date.now();
  if (!cachedCountries || now - cacheTimestamp > CACHE_TTL) {
    const data = await fetchCountries();
    cachedCountries = data.countries;
    cacheTimestamp = now;
  }
  return cachedCountries;
}

const CheckLocalization = ({
  countryFromCookies,
  langFromCookies,
  lang,
  country,
}: {
  countryFromCookies: string | undefined;
  langFromCookies: string | undefined;
  lang: string;
  country: string;
}) => {
  if (countryFromCookies && langFromCookies) {
    if (countryFromCookies.toLowerCase() !== country.toLowerCase()) {
      return true;
    }
  }
  return false;
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

function shouldSkipRegistration(pathname: string): boolean {
  return SKIP_REGISTRATION_PATHS.some((path) => pathname.startsWith(path));
}

export async function middleware(request: NextRequest) {
  const userData = getCookieMiddleware<UserData>(
    request,
    COOKIE_NAMES.USER_DATA
  );
  const response = NextResponse.next();
  if (
    request.method === "POST" ||
    !request.headers.get("accept")?.includes("text/html")
  ) {
    return response;
  }
  const url = request.nextUrl.clone();
  const pathname = url.pathname;

  // ===== GUEST REGISTRATION LOGIC =====
  // Only run for HTML pages, not API routes or static assets
  if (!shouldSkipRegistration(pathname) && !userData) {
    try {
      // Check if request is from a bot
      const isBot = shouldBlockRegistration(request);

      if (!isBot) {
        // Not a bot - ensure guest session exists
        const registrationResult =
          await AuthServerService.ensureGuestSessionMiddleware(
            request,
            response
          );

        if (!registrationResult.success) {
          console.error("Guest registration failed:", registrationResult.error);
        }
      } else {
        console.log(
          "Bot detected, skipping guest registration:",
          request.headers.get("user-agent")
        );
      }
    } catch (error) {
      // Don't block the request if registration fails
      console.error("Middleware guest registration error:", error);
    }
  }

  // ===== EXISTING LOCALIZATION LOGIC =====
  const countryLang = url.pathname.split("/")[1]?.toLowerCase();
  const countryUrl = url.pathname.split("/")[1]?.toLowerCase()?.split("-")[0];
  const langUrl = url.pathname.split("/")[1]?.toLowerCase()?.split("-")[1];
  const cookies = request.cookies;
  const countryFromCookies = cookies.get("country")?.value?.toLowerCase();
  const langFromCookies = cookies.get("lang")?.value?.toLowerCase() || "en";

  // Handle bypass parameter - skip all checks and clean URL
  if (url.searchParams.get("_bypass") === "popup-selection") {
    // Set cookies to match URL
    const cookieOptions = {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict" as const,
      maxAge: 360 * 7 * 24 * 60 * 60,
    };

    response.cookies.set("country", countryUrl.toLowerCase(), cookieOptions);
    response.cookies.set("lang", langUrl.toLowerCase(), cookieOptions);
    response.cookies.set("language", langUrl.toLowerCase(), cookieOptions);

    // Clean URL by removing all navigation-related params
    url.searchParams.delete("_bypass");
    url.searchParams.delete("changed-country");
    url.searchParams.delete("no-country");
    url.searchParams.delete("_t");

    // Redirect to clean URL if there are remaining params, otherwise proceed
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
    return response;
  }

  // Get supported countries and locales
  let countryByIp = request?.geo?.country?.toLowerCase();
  let supportedLocales: string[] = [];
  let data = await getCachedCountries();
  let countries = data.map((s: any) => s.iso.toLowerCase());
  let defaultLocale = `${countries[0]}-en`;

  [...countries, "gb"].forEach((s) => {
    languages.forEach((l: string) => {
      supportedLocales.push(`${s}-${l}`);
    });
  });

  let [country, lang] = countryLang?.toLowerCase()?.split("-") || [];

  // SCENARIO 1: Valid URL with country-lang format
  if (
    countryLang?.split("-")?.length === 2 &&
    supportedLocales?.includes(countryLang)
  ) {
    // Clean up timestamp parameter if present (used to bypass cache)
    if (url.searchParams.get("_t")) {
      url.searchParams.delete("_t");
    }

    // CASE 1A: Handle no-country parameter (user needs to select country)
    if (url.searchParams.get("no-country")) {
      // Set cookies for current URL locale if not already set
      if (!countryFromCookies) {
        response.cookies.set("country", country.toLowerCase(), {
          path: "/",
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          maxAge: 360 * 7 * 24 * 60 * 60,
        });
      }
      if (!langFromCookies) {
        response.cookies.set("lang", lang.toLowerCase(), {
          path: "/",
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          maxAge: 360 * 7 * 24 * 60 * 60,
        });
        response.cookies.set("language", lang.toLowerCase(), {
          path: "/",
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          maxAge: 360 * 7 * 24 * 60 * 60,
        });
      }
      return response; // Show the popup
    }

    // CASE 1B: Same country and lang as cookies - proceed normally
    if (
      countryFromCookies?.length > 0 &&
      langFromCookies?.length > 0 &&
      countryUrl?.toLowerCase() === countryFromCookies?.toLowerCase() &&
      langUrl?.toLowerCase() === langFromCookies?.toLowerCase() &&
      !url.searchParams.get("changed-country")
    ) {
      return response;
    }

    // CASE 1C: No country cookies - proceed with URL country (don't show popup)
    if (!countryFromCookies || countryFromCookies.length === 0) {
      // Set cookies for current URL locale and proceed directly
      response.cookies.set("country", country.toLowerCase(), {
        path: "/",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 360 * 7 * 24 * 60 * 60,
      });
      response.cookies.set("lang", lang.toLowerCase(), {
        path: "/",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 360 * 7 * 24 * 60 * 60,
      });
      response.cookies.set("language", lang.toLowerCase(), {
        path: "/",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 360 * 7 * 24 * 60 * 60,
      });

      return response;
    }

    // CASE 1D: Different country in cookies vs URL - show country choice popup
    let isChangedLocalizationByUrl = CheckLocalization({
      countryFromCookies,
      langFromCookies,
      lang,
      country,
    });

    if (
      isChangedLocalizationByUrl &&
      !url.searchParams.get("changed-country")
    ) {
      url.searchParams.delete("cart");
      url.searchParams.set(
        "changed-country",
        `${country},${countryFromCookies}`
      );
      const redirectResponse = NextResponse.redirect(url);
      redirectResponse.headers.set(
        "x-redirect-count",
        (redirectCount + 1).toString()
      );
      return redirectResponse;
    }

    // CASE 1E: Handle changed-country parameter (show country choice popup)
    if (url.searchParams.get("changed-country")) {
      // Set cookies for current URL locale
      response.cookies.set("country", country.toLowerCase(), {
        path: "/",
        httpOnly: true,
        secure: false,
        sameSite: "strict",
        maxAge: 360 * 7 * 24 * 60 * 60,
      });
      response.cookies.set("lang", lang.toLowerCase(), {
        path: "/",
        httpOnly: true,
        secure: false,
        sameSite: "strict",
        maxAge: 360 * 7 * 24 * 60 * 60,
      });
      response.cookies.set("language", lang.toLowerCase(), {
        path: "/",
        httpOnly: true,
        secure: false,
        sameSite: "strict",
        maxAge: 360 * 7 * 24 * 60 * 60,
      });

      return response; // Show the popup
    }

    // Default case - set cookies and proceed
    response.cookies.set("country", country.toLowerCase(), {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 360 * 7 * 24 * 60 * 60,
    });
    response.cookies.set("lang", lang.toLowerCase(), {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 360 * 7 * 24 * 60 * 60,
    });
    response.cookies.set("language", lang.toLowerCase(), {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 360 * 7 * 24 * 60 * 60,
    });

    return response;
  }
  // SCENARIO 2: No valid URL format but has cookies - redirect to cookie locale
  else if (countryFromCookies && langFromCookies) {
    let pathname =
      url.pathname.split("/")[1].toLowerCase()?.split("-").length === 2
        ? url.pathname?.toLowerCase()?.slice(countryLang?.length + 1)
        : url.pathname;

    const countryLangFromCookies = `${countryFromCookies.toLowerCase()}-${langFromCookies}`;
    if (supportedLocales.includes(countryLangFromCookies)) {
      url.pathname = `/${countryLangFromCookies}${pathname}`;
      return NextResponse.redirect(url);
    }
  }
  // SCENARIO 3: No cookies, try IP-based detection
  else if (countryByIp && countries.includes(countryByIp)) {
    defaultLocale = `${countryByIp}-en`;
    url.pathname = `/${defaultLocale}${url.pathname}`;
    url.searchParams.set("no-country", "true");
    return NextResponse.redirect(url);
  }
  // SCENARIO 4: Fallback to default locale with country selection
  else {
    if (url.pathname.split("/")[1]?.includes("-")) {
      url.pathname = url.pathname.replace(url.pathname.split("/")[1], "gb-en");
    } else {
      url.pathname = `/gb-en${url.pathname}`;
    }
    url.searchParams.delete("cart");
    url.searchParams.set("no-country", "true");
    return NextResponse.redirect(url);
  }

  return NextResponse.redirect(url);
}

export const config = {
  runtime: "nodejs",
  preferredRegion: ["bom1", "sin1"],
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
        "/((?!api|noposter|firebase-messaging-sw.js|default.mp3|wa.mp3|api-test|sitemap|manifest.json|error.png|assets|svg|fonts|translations|reports|images|styles|endCall|sitemap.xml|svg|call_direct|error.png|static|.\\..|_next|revalidate|callInProg|selectCountry|favicon.ico).*)",
    },
  ],
};
