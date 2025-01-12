import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
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

export async function middleware(request) {
  let countryByIp = request?.geo?.country?.toLowerCase();
  let supportedLocales = [];
  let data = await getCountriesApi();
  const response = NextResponse.next();
  let countries = data.map((s) => s.iso.toLowerCase());
  let defaultLocale = `${countries[0]}-en`;

  countries.map((s) => {
    languages.map((l) => {
      supportedLocales.push(`${s}-${l}`);
    });
  });

  const url = request.nextUrl.clone();
  const countryLang = url.pathname.split("/")[1];
  const cookies = request.cookies;
  const countryFromCookies = cookies.get("country")?.value;
  const langFromCookies = cookies.get("lang")?.value;
  // 1- for url
  if (
    countryLang.split("-").length > 1 &&
    supportedLocales.includes(countryLang)
  ) {
    let [country, lang] = countryLang.split("-");
    response.cookies.set("country", country, {
      path: "/",
      httpOnly: true,
      secure: false,
      sameSite: "Strict",
    });
    response.cookies.set("lang", lang, {
      path: "/",
      httpOnly: true,
      secure: false,
      sameSite: "Strict",
    });
    response.cookies.set("languge", lang, {
      path: "/",
      httpOnly: true,
      secure: false,
      sameSite: "Strict",
    });
    response.headers.set("set-cookie", true);
    request.cookies.set("country", country, {
      path: "/",
      httpOnly: true,
      secure: false,
      sameSite: "Strict",
    });
    request.cookies.set("lang", lang, {
      path: "/",
      httpOnly: true,
      secure: false,
      sameSite: "Strict",
    });
    request.cookies.set("languge", lang, {
      path: "/",
      httpOnly: true,
      secure: false,
      sameSite: "Strict",
    });
    return response; // If valid, continue with the request
  }
  // 2- for cookies
  else if (countryFromCookies && langFromCookies) {
    let pahname =
      url.pathname.split("/")[1].split("-").length === 2
        ? url.pathname.slice(countryLang.length + 1)
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
    url.pathname = `/${defaultLocale}${url.pathname.slice(
      countryLang.length + 1
    )}`;
  } else {
    url.pathname = `/${defaultLocale}/${url.pathname}`;
    url.searchParams.set("no-country", true);
    return NextResponse.redirect(url);
  }

  //4- select country
  if (url.searchParams.get("no-contry")) {
    return response;
  }

  return NextResponse.redirect(url);
  // const cookieStore = cookies();
  // const url = request.nextUrl.clone();
  // const languageUrl =
  //   url.pathname?.split("/")[1]?.split("-")[1] ??
  //   cookieStore.get("language")?.value?.toLowerCase() ??
  //   "en";

  // request.cookies.set("language", languageUrl, {
  //   exoires: new Date(7467743843902 * 10000),
  // });

  // const start = new Date().getTime();
  // const data = await getCountriesApi();

  // let countries = data.map((s) => s.iso.toLowerCase());
  // const { pathname, searchParams, search, host, protocol } = request.nextUrl;

  // let countryByIp = request?.geo?.country?.toLowerCase();
  // const response = NextResponse.next();

  // const localization = cookieStore.get("country")?.value;
  // //without country cookies

  // if (!localization && countryByIp) {
  //   const countryByIpp = countryByIp || "jp";
  //   // const countryName = await _getCountryNameByIp(Ip);
  //   const originCountryJSON = {
  //     country: countryByIpp,
  //     isSupported: countries.some(
  //       (country) => countryByIp?.toLowerCase() === `${country.toLowerCase()}`
  //     ),
  //   };
  //   response.cookies.set({
  //     name: "origin-country",
  //     value: originCountryJSON,
  //   });
  // }

  // const routePath = pathname.split("/")[1];
  // const pathN = pathname.replace(routePath, "");
  // const hasSeparator =
  //   routePath.includes("-") &&
  //   routePath.split("-")[0].length === 2 &&
  //   routePath.split("-")[1].length === 2;
  // const hasLanguage =
  //   hasSeparator &&
  //   languages.some((lang) =>
  //     routePath.toLowerCase().endsWith(`-${lang.toLowerCase()}`)
  //   );

  // const hasCountry =
  //   hasSeparator &&
  //   countries.some((country) =>
  //     routePath.toLowerCase().startsWith(`${country.toLowerCase()}-`)
  //   );
  // const lang = (await getLocale(request))?.language ?? "";
  // const country = (await getLocale(request))?.country ?? "";
  // const preferredLang = languages.includes(lang.toLowerCase())
  //   ? lang
  //   : getDefaultLocale(countryByIp, countries).language;
  // const preferredCountry = countries.includes(country.toLowerCase())
  //   ? country
  //   : getDefaultLocale(countryByIp, countries).country;
  // if (!hasSeparator) {
  //   //url dosen't includes language-country
  //   const lang = (await getLocale(request))?.language;
  //   const country = (await getLocale(request))?.country;
  //   //check for country cookie
  //   if (country) {
  //     const preferredLang = languages.includes(lang)
  //       ? lang
  //       : getDefaultLocale(countryByIp, countries).language;
  //     const preferredCountry = countries.includes(country)
  //       ? country
  //       : getDefaultLocale(countryByIp, countries).country;
  //     response.cookies.set("lang", preferredLang);
  //     response.cookies.set("country", preferredCountry);
  //     request.nextUrl.pathname = `/${preferredCountry}-${preferredLang}${pathname}`;
  //     return response;
  //   } else {
  //     if (countries.includes(countryByIp)) {
  //       response.cookies.set("lang", preferredLang);
  //       response.cookies.set("country", preferredCountry);
  //       request.nextUrl.pathname = `/${preferredCountry}-${preferredLang}${pathname}`;
  //     } else {
  //       request.nextUrl.pathname = `/selectCountry`;
  //     }
  //     if (pathN.length > 1) request.nextUrl.searchParams.set("path", pathN);
  //     {
  //       return response;
  //     }
  //   }
  // } else if (!hasLanguage || !hasCountry) {
  //   if (!hasLanguage && !hasCountry) {
  //     // request.nextUrl.pathname = `/${preferredCountry}-${preferredLang}/${pathN}`;
  //     request.nextUrl.pathname = `/selectCountry`;
  //     if (pathN.length > 1) request.nextUrl.searchParams.set("path", pathN);
  //     //
  //   } else if (!hasLanguage && hasCountry) {
  //     const countryRoute = routePath?.split("-")[0];
  //     request.nextUrl.pathname = `/${countryRoute}-${preferredLang}/${pathN}`;
  //     response.cookies.set("lang", preferredLang);
  //     response.cookies.set("country", countryRoute);
  //   } else if (!hasCountry && hasLanguage) {
  //     //  request.nextUrl.pathname = `/${preferredCountry}-${preferredLang}/${pathN}`;
  //     request.nextUrl.pathname = `/selectCountry`;
  //     if (pathN.length > 1) request.nextUrl.searchParams.set("path", pathN);
  //     //
  //   } else return response;
  // }
  // if (hasLanguage) {
  //   const languageroute = routePath?.split("-")[1];
  //   setLocaleCookies(request, languageroute, preferredCountry);
  // } else {
  //   setLocaleCookies(request, preferredLang, preferredCountry);
  // }

  // return response;
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
