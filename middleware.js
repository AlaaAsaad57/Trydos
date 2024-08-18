import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getCountriesApi } from "./store/homepage/cachedActions";

const languagesString = process.env.NEXT_PUBLIC_LANGUAGES || "[]";
const languages = JSON.parse(languagesString);

// Get the preferred locale, similar to the above or using a library
function getLocale(request) {
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
  const start = new Date().getTime();
  const data = await getCountriesApi();

  let countries = data.map((s) => s.iso.toLowerCase());
  const { pathname } = request.nextUrl;
  let countryByIp = request?.geo?.country?.toLowerCase();
  const response = NextResponse.next();
  const cookieStore = cookies();
  const localization = cookieStore.get("country")?.value;
  //without country cookies
  const countryVar = getLocale()?.country ?? "";

  if (!localization && countryByIp) {
    const countryByIpp = countryByIp || "jp";
    // const countryName = await _getCountryNameByIp(Ip);
    const originCountryJSON = {
      country: countryByIpp,
      isSupported: countries.some(
        (country) => countryByIp?.toLowerCase() === `${country.toLowerCase()}`
      ),
    };
    response.cookies.set({
      name: "origin-country",
      value: originCountryJSON,
    });
  }
  const routePath = pathname.split("/")[1];
  const pathN = pathname.replace(routePath, "");
  const hasSeparator =
    routePath.includes("-") &&
    routePath.split("-")[0].length === 2 &&
    routePath.split("-")[1].length === 2;
  const hasLanguage =
    hasSeparator &&
    languages.some((lang) =>
      routePath.toLowerCase().endsWith(`-${lang.toLowerCase()}`)
    );

  const hasCountry =
    hasSeparator &&
    countries.some((country) =>
      routePath.toLowerCase().startsWith(`${country.toLowerCase()}-`)
    );
  const lang = getLocale()?.language ?? "";
  const country = getLocale()?.country ?? "";
  const preferredLang = languages.includes(lang.toLowerCase())
    ? lang
    : getDefaultLocale(countryByIp, countries).language;
  const preferredCountry = countries.includes(country.toLowerCase())
    ? country
    : getDefaultLocale(countryByIp, countries).country;
  if (!hasSeparator) {
    //url dosen't includes language-country
    const lang = getLocale()?.language;
    const country = getLocale()?.country;
    //check for country cookie
    if (country) {
      const preferredLang = languages.includes(lang)
        ? lang
        : getDefaultLocale(countryByIp, countries).language;
      const preferredCountry = countries.includes(country)
        ? country
        : getDefaultLocale(countryByIp, countries).country;

      request.nextUrl.pathname = `/${preferredCountry}-${preferredLang}${pathname}`;
      const end = new Date().getTime();
      console.log(end - start);
      return NextResponse.redirect(request.nextUrl);
    } else {
      if (countries.includes(countryByIp)) {
        request.nextUrl.pathname = `/${preferredCountry}-${preferredLang}${pathname}`;
      } else {
        request.nextUrl.pathname = `/selectCountry`;
      }
      if (pathN.length > 1) request.nextUrl.searchParams.set("path", pathN);
      {
        const end = new Date().getTime();
        console.log(end - start);
        return NextResponse.redirect(request.nextUrl);
      }
    }
  } else if (!hasLanguage || !hasCountry) {
    if (!hasLanguage && !hasCountry) {
      // request.nextUrl.pathname = `/${preferredCountry}-${preferredLang}/${pathN}`;
      request.nextUrl.pathname = `/selectCountry`;
      if (pathN.length > 1) request.nextUrl.searchParams.set("path", pathN);
      //
    } else if (!hasLanguage && hasCountry) {
      const countryRoute = routePath?.split("-")[0];
      request.nextUrl.pathname = `/${countryRoute}-${preferredLang}/${pathN}`;
    } else if (!hasCountry && hasLanguage) {
      //  request.nextUrl.pathname = `/${preferredCountry}-${preferredLang}/${pathN}`;
      request.nextUrl.pathname = `/selectCountry`;
      if (pathN.length > 1) request.nextUrl.searchParams.set("path", pathN);
      //
    }
    const end = new Date().getTime();
    console.log(end - start);
    return NextResponse.redirect(request.nextUrl);
  }
  if (hasLanguage) {
    const languageroute = routePath?.split("-")[1];
    setLocaleCookies(request, languageroute, preferredCountry);
  } else {
    setLocaleCookies(request, preferredLang, preferredCountry);
  }
  return response;
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
    "/((?!api|static|.*\\..*|_next|endCall|call_direct|revalidate|test|callInProg|selectCountry|favicon.ico).*)",
  ],
};
