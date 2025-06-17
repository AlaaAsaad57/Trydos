"use server";
import { NextResponse } from "next/server";
import { getCountriesApi } from "./store/homepage/cachedActions";

const languagesString = '["en", "ar", "tr"]' || "[]";
const languages = JSON.parse(languagesString);
let cachedCountries;
let cacheTimestamp = 0;
const CACHE_TTL = 60 * 60 * 1000 * 24; // 1 day

async function getCachedCountries() {
  const now = Date.now();
  if (!cachedCountries || now - cacheTimestamp > CACHE_TTL) {
    const data = await getCountriesApi();
    console.log(data);
    cachedCountries = data;
    cacheTimestamp = now;
  }
  return cachedCountries;
}
const CheckLocalaization = ({
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
  const cookies = request.cookies;
  const countryFromCookies = cookies.get("country")?.value?.toLowerCase();
  const langFromCookies = cookies.get("lang")?.value?.toLowerCase() || "en";
  if (
    countryFromCookies?.length > 0 &&
    countryUrl?.length > 0 &&
    countryUrl?.toLowerCase() === countryFromCookies?.toLowerCase() &&
    countryUrl !== "gb" &&
    countryFromCookies !== "gb" &&
    !url.searchParams.get("changed-country")
  ) {
    return response;
  }

  // Define the geolocation API endpoint (you can replace with ipinfo, ipstack, or any other geolocation service)

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
  // 1- for url
  if (
    countryLang?.split("-")?.length > 1 &&
    supportedLocales?.includes(countryLang)
  ) {
    if (url.searchParams.get("selected")) {
      url.searchParams.delete("changed-country");
      url.searchParams.delete("no-country");

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
      response.headers.set("set-cookie", true);
      request.cookies.set("country", country.toLowerCase(), {
        path: "/",
        httpOnly: true,
        secure: false,
        sameSite: "Strict",
        maxAge: 360 * 7 * 24 * 60 * 60,
      });
      request.cookies.set("lang", lang.toLowerCase(), {
        path: "/",
        httpOnly: true,
        secure: false,
        sameSite: "Strict",
        maxAge: 360 * 7 * 24 * 60 * 60,
      });
      request.cookies.set("language", lang.toLowerCase(), {
        path: "/",
        httpOnly: true,
        secure: false,
        sameSite: "Strict",
        maxAge: 360 * 7 * 24 * 60 * 60,
      });
      return NextResponse.redirect(url);
    }

    let isChangedLocalizationByUrl = CheckLocalaization({
      countryFromCookies,
      langFromCookies,
      lang,
      country,
    });
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
    response.headers.set("set-cookie", true);
    request.cookies.set("country", country.toLowerCase(), {
      path: "/",
      httpOnly: true,
      secure: false,
      sameSite: "Strict",
      maxAge: 360 * 7 * 24 * 60 * 60,
    });
    request.cookies.set("lang", lang.toLowerCase(), {
      path: "/",
      httpOnly: true,
      secure: false,
      sameSite: "Strict",
      maxAge: 360 * 7 * 24 * 60 * 60,
    });
    request.cookies.set("language", lang.toLowerCase(), {
      path: "/",
      httpOnly: true,
      secure: false,
      sameSite: "Strict",
      maxAge: 360 * 7 * 24 * 60 * 60,
    });
    if (countryFromCookies === "gb") {
      return response;
    }
    if (url.searchParams.get("changed-country")) {
      if (isChangedLocalizationByUrl) {
        return response;
      } else {
        url.searchParams.delete("changed-country");
        return NextResponse.redirect(url);
      }
    }
    if (isChangedLocalizationByUrl) {
      url.searchParams.delete("cart");
      url.searchParams.set(
        "changed-country",
        `${country},${countryFromCookies}`
      );
      return NextResponse.redirect(url);
    } else {
      return response;
    }
    // If valid, continue with the request
  }
  // 2- for cookies
  else if (countryFromCookies && langFromCookies) {
    let pahname =
      url.pathname.split("/")[1].toLowerCase()?.split("-").length === 2
        ? url.pathname?.toLowerCase()?.slice(countryLang.length + 1)
        : url.pathname;

    const countryLangFromCookies = `${countryFromCookies.toLowerCase()}-${langFromCookies}`;
    if (supportedLocales.includes(countryLangFromCookies)) {
      // If valid, redirect to the appropriate `country-lang` in the URL

      url.pathname = `/${countryLangFromCookies}${pahname}`;
      return NextResponse.redirect(url);
    }
  }
  // 3- for ip
  else if (countryByIp && countries.includes(countryByIp)) {
    defaultLocale = `${countryByIp}-en`;
    url.pathname = `/${defaultLocale}${url.pathname}`;
  } else {
    if (url.pathname.split("/")[1].includes("-")) {
      url.pathname = url.pathname.replace(url.pathname.split("/")[1], "gb-en");
      url.searchParams.delete("cart");
      url.searchParams.set("no-country", true);
      return NextResponse.redirect(url);
    } else {
    }
    url.pathname = `/gb-en/${url.pathname}`;
    url.searchParams.delete("cart");
    url.searchParams.set("no-country", true);
    return NextResponse.redirect(url);
  }

  //4- select country
  if (url.searchParams.get("no-contry")) {
    return response;
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
        "/((?!api|static|.\\..|_next|assets|endCall|svg|call_direct|revalidate|test|callInProg|selectCountry|favicon.ico).*)",
    },
  ],
};
