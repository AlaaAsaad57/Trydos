"use server";
import { NextResponse } from "next/server";
import { fetchCountries } from "Server Requests";
const languagesString = '["en", "ar", "tr"]' || "[]";
const languages = JSON.parse(languagesString);
let cachedCountries;
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
}) => {
  if (countryFromCookies && langFromCookies) {
    if (countryFromCookies.toLowerCase() !== country.toLowerCase()) {
      return true;
    }
  }
  return false;
};

export async function middleware(request) {
  const response = NextResponse.next();
  const url = request.nextUrl.clone();
  const countryLang = url.pathname.split("/")[1]?.toLowerCase();
  const countryUrl = url.pathname.split("/")[1]?.toLowerCase()?.split("-")[0];
  const langUrl = url.pathname.split("/")[1]?.toLowerCase()?.split("-")[1];
  const cookies = request.cookies;
  const countryFromCookies = cookies.get("country")?.value?.toLowerCase();
  const langFromCookies = cookies.get("lang")?.value?.toLowerCase() || "en";

  // Add comprehensive logging
  console.log("🔍 MIDDLEWARE DEBUG:", {
    url: url.toString(),
    pathname: url.pathname,
    search: url.search,
    countryLang,
    countryUrl,
    langUrl,
    countryFromCookies,
    langFromCookies,
    userAgent: request.headers.get("user-agent")?.substring(0, 50),
  });

  // Handle bypass parameter - skip all checks and clean URL
  if (url.searchParams.get("_bypass") === "popup-selection") {
    console.log("🚀 BYPASSING middleware checks for popup selection");

    // Set cookies to match URL
    const cookieOptions = {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
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
      console.log("🔄 Cleaning URL parameters");
      return NextResponse.redirect(url);
    }

    console.log("✅ Proceeding with clean URL");
    return response;
  }

  // Add redirect protection
  const redirectCount = parseInt(
    request.headers.get("x-redirect-count") || "0"
  );
  if (redirectCount > 2) {
    console.error("🚨 TOO MANY REDIRECTS, STOPPING:", redirectCount);
    return response;
  }

  // Get supported countries and locales
  let countryByIp = request?.geo?.country?.toLowerCase();
  let supportedLocales = [];
  let data = await getCachedCountries();
  let countries = data.map((s) => s.iso.toLowerCase());
  let defaultLocale = `${countries[0]}-en`;

  [...countries, "gb"].map((s) => {
    languages.map((l) => {
      supportedLocales.push(`${s}-${l}`);
    });
  });

  let [country, lang] = countryLang?.toLowerCase()?.split("-");

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
      console.log("🏁 Showing country selection popup");
      // Set cookies for current URL locale if not already set
      if (!countryFromCookies) {
        response.cookies.set("country", country.toLowerCase(), {
          path: "/",
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "Strict",
          maxAge: 360 * 7 * 24 * 60 * 60,
        });
      }
      if (!langFromCookies) {
        response.cookies.set("lang", lang.toLowerCase(), {
          path: "/",
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "Strict",
          maxAge: 360 * 7 * 24 * 60 * 60,
        });
        response.cookies.set("language", lang.toLowerCase(), {
          path: "/",
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "Strict",
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
      console.log("✅ Cookies match URL, proceeding normally");
      return response;
    }

    // CASE 1C: No country cookies - proceed with URL country (don't show popup)
    if (!countryFromCookies || countryFromCookies.length === 0) {
      console.log(
        "🚫 No cookies found, but URL has valid country - setting cookies and proceeding"
      );
      // Set cookies for current URL locale and proceed directly
      response.cookies.set("country", country.toLowerCase(), {
        path: "/",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "Strict",
        maxAge: 360 * 7 * 24 * 60 * 60,
      });
      response.cookies.set("lang", lang.toLowerCase(), {
        path: "/",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "Strict",
        maxAge: 360 * 7 * 24 * 60 * 60,
      });
      response.cookies.set("language", lang.toLowerCase(), {
        path: "/",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "Strict",
        maxAge: 360 * 7 * 24 * 60 * 60,
      });

      // Proceed directly without showing popup
      console.log("✅ Cookies set for valid URL country, proceeding normally");
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
      console.log("🔄 Country changed, showing choice popup");
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
      console.log("🏁 Showing country change popup");
      // Set cookies for current URL locale
      response.cookies.set("country", country.toLowerCase(), {
        path: "/",
        httpOnly: true,
        secure: false,
        sameSite: "Strict",
        maxAge: 360 * 7 * 24 * 60 * 60,
      });
      response.cookies.set("lang", lang.toLowerCase(), {
        path: "/",
        httpOnly: true,
        secure: false,
        sameSite: "Strict",
        maxAge: 360 * 7 * 24 * 60 * 60,
      });
      response.cookies.set("language", lang.toLowerCase(), {
        path: "/",
        httpOnly: true,
        secure: false,
        sameSite: "Strict",
        maxAge: 360 * 7 * 24 * 60 * 60,
      });

      return response; // Show the popup
    }

    // Default case - set cookies and proceed
    response.cookies.set("country", country.toLowerCase(), {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      maxAge: 360 * 7 * 24 * 60 * 60,
    });
    response.cookies.set("lang", lang.toLowerCase(), {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      maxAge: 360 * 7 * 24 * 60 * 60,
    });
    response.cookies.set("language", lang.toLowerCase(), {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
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
        "/((?!api|sitemap|manifest.json|error.png|static|.\\..|_next|assets|endCall|sitemap.xml|svg|call_direct|error.png|revalidate|test|callInProg|selectCountry|favicon.ico).*)",
    },
  ],
};
