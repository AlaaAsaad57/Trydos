import { cookies, headers } from "next/headers";
const countriesString = process.env.NEXT_PUBLIC_COUNTRIES || "[]";
const countries = JSON.parse(countriesString);
const languagesString = process.env.NEXT_PUBLIC_LANGUAGES || "[]";
const languages = JSON.parse(languagesString);

// Get the preferred locale, similar to the above or using a library
function getLocale(request) {
  const cookieStore = cookies();
  const localization = {
    language: cookieStore.get("language")?.value,
    country: cookieStore.get("country")?.value,
  };
  return localization;
}
function getLangByIp(ip) {
  switch (ip) {
    case "tr":
      return "tr";
    case "ae":
      return "ar";
    case "sy":
      return "ar";
    case "us":
      return "en";
    default:
      return "en";
  }
}
function getDefaultLocale(countryByIp) {
  const localeENV = {
    country:
      countryByIp &&
      countries.some(
        (country) => countryByIp.toLowerCase() == `${country.toLowerCase()}-`
      )
        ? countryByIp
        : process.env.NEXT_PUBLIC_DEFAULT_COUNTRY,
    language: countryByIp
      ? getLangByIp(countryByIp)
      : process.env.NEXT_PUBLIC_DEFAULT_LANGUAGE,
  };
  return localeENV;
}

export function middleware(request) {
  const { pathname, href } = request.nextUrl;
  let Ip = request.headers?.get("X-Forwarded-For");
  let countryByIp = request?.geo?.country?.toLowerCase();

  const headersList = headers();
  const referer = headersList.get("referer");
  const curUrl = `${headersList.get("x-forwarded-proto")}://${headersList.get(
    "host"
  )}${pathname}`;
  console.log(referer, curUrl, "request");
  //   if (referer == curUrl) {
  //     return Response.redirect(request.nextUrl);
  //   }
  console.log(Ip, countryByIp, "geo");
  const routePath = pathname.split("/")[1];
  const pathN = pathname.replace(routePath, "");
  const hasSeparator = routePath.includes("-");
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
  if (!hasSeparator) {
    const lang = getLocale()?.language;
    const country = getLocale()?.country;
    const preferredLang = languages.includes(lang)
      ? lang
      : getDefaultLocale(countryByIp).language;
    const preferredCountry = countries.includes(country)
      ? country
      : getDefaultLocale(countryByIp).country;
    request.nextUrl.pathname = `/${preferredCountry}-${preferredLang}${pathname}`;
    return Response.redirect(request.nextUrl);
  } else if (!hasLanguage || !hasCountry) {
    const lang = getLocale()?.language ?? "";
    const country = getLocale()?.country ?? "";
    const preferredLang = languages.includes(lang.toLowerCase())
      ? lang
      : getDefaultLocale(countryByIp).language;
    const preferredCountry = countries.includes(country.toLowerCase())
      ? country
      : getDefaultLocale(countryByIp).country;
    console.log(countries, routePath);
    if (!hasLanguage && !hasCountry) {
      request.nextUrl.pathname = `/${preferredCountry}-${preferredLang}/${routePath}`;
    } else if (!hasLanguage && hasCountry) {
      const countryRoute = routePath?.split("-")[0];
      request.nextUrl.pathname = `/${countryRoute}-${preferredLang}/${pathN}`;
    } else if (!hasCountry && hasLanguage) {
      const langRoute = routePath?.split("-")[1];
      request.nextUrl.pathname = `/${preferredCountry}-${langRoute}/${pathN}`;
    }
    setLocaleCookies(request, preferredLang, preferredCountry);

    return Response.redirect(request.nextUrl);
  }
}
function setLocaleCookies(request, lang, country) {
  request.cookies.set("language", lang);
  request.cookies.set("country", country);
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
    "/((?!api|static|.*\\..*|_next|endCall|call_direct|revalidate).*)",
  ],
};
