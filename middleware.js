import {cookies} from "next/headers";

const countriesString = process.env.NEXT_PUBLIC_COUNTRIES || '[]';
const countries = JSON.parse(countriesString);
const languagesString = process.env.NEXT_PUBLIC_LANGUAGES || '[]';
const languages = JSON.parse(languagesString);

// Get the preferred locale, similar to the above or using a library
 function getLocale(request) {
    const cookieStore = cookies()
    const localization = {language:cookieStore.get('language')?.value,country:cookieStore.get('country')?.value}
      return localization
}

function getDefaultLocale(request) {
    const localeENV =
        {country: process.env.NEXT_PUBLIC_DEFAULT_COUNTRY, language
            : process.env.NEXT_PUBLIC_DEFAULT_LANGUAGE}
    return localeENV
}

export async function middleware(request) {
   try{ const { pathname } = request.nextUrl;
    const pathName = pathname.split('/')[1];
    const pathN = pathname.replace(pathName, '');
    const hasSeparator = pathName.includes('-');
    const hasLanguage = hasSeparator && languages.some((lang) => pathName.endsWith(`-${lang}`));
    const hasCountry = hasSeparator && countries.some((country) => pathName.startsWith(`${country}-`));
    if(request.nextUrl.pathname.startsWith('/call_direct')||request.nextUrl.pathname.startsWith('/endCall')||request.nextUrl.pathname.startsWith('/revalidate'))
    {
        return Response.redirect(request.nextUrl) ;
    }
    if (!hasSeparator) {
        const lang =  getLocale()?.language;
        const country = getLocale()?.country;
        console.log(getLocale()?.language, getLocale(), lang, country, "0")
        const preferredLang = languages.includes(lang) ? lang : getDefaultLocale().language;
        const preferredCountry = countries.includes(country) ? country : getDefaultLocale().country;

        request.nextUrl.pathname = `/${preferredCountry}-${preferredLang}${pathname}`;
        return Response.redirect(request.nextUrl);
    }
    if (!hasLanguage || !hasCountry) {
        const lang = getLocale()?.language;
        const country = getLocale()?.country;
        const preferredLang = languages.includes(lang) ? lang : getDefaultLocale().language;
        const preferredCountry = countries.includes(country) ? country : getDefaultLocale().country;

        if (!hasLanguage && !hasCountry) {
            request.nextUrl.pathname = `/${preferredCountry}-${preferredLang}${pathN}`;
        } else if (!hasLanguage && hasCountry) {
            request.nextUrl.pathname = `/${preferredCountry}-${preferredLang}${pathN}`;
        } else if (!hasCountry && hasLanguage) {
            request.nextUrl.pathname = `/${preferredCountry}-${preferredLang}${pathN}`;
        }
        setLocaleCookies(request, preferredLang, preferredCountry);

        return Response.redirect(request.nextUrl);
    }}
    catch(e){
        console.log(e)
    }
}
function setLocaleCookies(request, lang, country) {
    request.cookies.set('language', lang);
    request.cookies.set('country', country);
}


export const config = {
    matcher: [/*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        "/((?!api|static|.*\\..*|_next).*)",],
}
