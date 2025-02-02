import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getCountriesApi } from "./store/homepage/cachedActions";

const languagesString = '["en", "ar", "tr"]' || "[]";
const languages = JSON.parse(languagesString);

// Get the preferred locale, similar to the above or using a library
async function getLocale(request) {
  const cookieStore = cookies();
  const localization = {
    language: cookieStore.get("language")?.value?.toLowerCase(),
    country: cookieStore.get("country")?.value?.toLowerCase(),
  };
  return localization;
}
function getLangByIp(ip) {
  switch (ip) {
    case "tr":
      return "tr";
    case "ar":
      return "ar";
    case "sy":
      return "ar";
    case "us":
      return "en";
    default:
      return "en";
  }
}
function getDefaultLocale(countryByIp, countries) {
  const localeENV = {
    country:
      countryByIp &&
      countries.some(
        (country) => countryByIp.toLowerCase() == `${country.toLowerCase()}`
      )
        ? countryByIp
        : process.env.NEXT_PUBLIC_DEFAULT_COUNTRY,
    language: countryByIp
      ? getLangByIp(countryByIp)
      : process.env.NEXT_PUBLIC_DEFAULT_LANGUAGE,
  };
  return localeENV;
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
  const ip = request.headers.get("x-forwarded-for") || request.ip;

  // Define the geolocation API endpoint (you can replace with ipinfo, ipstack, or any other geolocation service)

  let countryByIp = request?.geo?.country?.toLowerCase();
  let supportedLocales = [];
  let data = await getCountriesApi();

  let countries = data.map((s) => s.iso.toLowerCase());
  let defaultLocale = `${countries[0]}-en`;

  [...countries, "gb"].map((s) => {
    languages.map((l) => {
      supportedLocales.push(`${s}-${l}`);
    });
  });

  const url = request.nextUrl.clone();
  const countryLang = url.pathname.split("/")[1]?.toLowerCase();
  const cookies = request.cookies;
  const countryFromCookies = cookies.get("country")?.value?.toLowerCase();
  const langFromCookies = cookies.get("lang")?.value?.toLowerCase();

  // 1- for url
  if (
    countryLang.split("-").length > 1 &&
    supportedLocales.includes(countryLang)
  ) {
    if (url.searchParams.get("selected")) {
      url.searchParams.delete("changed-country");

      return NextResponse.redirect(url);
    }
    let [country, lang] = countryLang.toLowerCase().split("-");
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
    });
    response.cookies.set("lang", lang.toLowerCase(), {
      path: "/",
      httpOnly: true,
      secure: false,
      sameSite: "Strict",
    });
    response.cookies.set("languge", lang.toLowerCase(), {
      path: "/",
      httpOnly: true,
      secure: false,
      sameSite: "Strict",
    });
    response.headers.set("set-cookie", true);
    request.cookies.set("country", country.toLowerCase(), {
      path: "/",
      httpOnly: true,
      secure: false,
      sameSite: "Strict",
    });
    request.cookies.set("lang", lang.toLowerCase(), {
      path: "/",
      httpOnly: true,
      secure: false,
      sameSite: "Strict",
    });
    request.cookies.set("languge", lang.toLowerCase(), {
      path: "/",
      httpOnly: true,
      secure: false,
      sameSite: "Strict",
    });
    if (countryFromCookies === "gb") {
      return response;
    }
    if (url.searchParams.get("changed-country")) {
      if (isChangedLocalizationByUrl) {
        console.log(isChangedLocalizationByUrl);
        return response;
      } else {
        url.searchParams.delete("changed-country");
        return NextResponse.redirect(url);
      }
    }
    if (isChangedLocalizationByUrl) {
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
    url.pathname = `/gb-en/${url.pathname}`;
    url.searchParams.set("no-country", true);
    return NextResponse.redirect(url);
  }

  //4- select country
  if (url.searchParams.get("no-contry")) {
    return response;
  }

  return NextResponse.redirect(url);
}
function setLocaleCookies(request, lang, country) {
  request.cookies.set("language", lang, {
    exoires: new Date(7467743843902 * 10000),
  });
  request.cookies.set("lang", lang, {
    exoires: new Date(7467743843902 * 10000),
  });
  request.cookies.set("country", country, {
    exoires: new Date(7467743843902 * 10000),
  });
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
        "/((?!api|static|.*\\..*|_next|endCall|call_direct|revalidate|test|callInProg|selectCountry|favicon.ico).*)",
    },
  ],
};
