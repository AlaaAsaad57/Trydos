import { NextRequest, NextResponse } from "next/server";
import { generateLocaleSpecificSitemapXML } from "services/elastic/sitemap.service";
import { LogServerError } from "utils/serverErrorReporter";

export async function GET(request: NextRequest, { params }) {
  const Params = await params;

  try {
    const lang = Params.lang;

    // Parse country-language from the lang parameter (e.g., "tr-en" -> country: "tr", language: "en")
    const parts = lang.split("-");
    if (parts.length !== 2) {
      return new NextResponse("Invalid lang format", {
        status: 400,
        headers: {
          "Content-Type": "text/plain",
        },
      });
    }

    const [country, language] = parts;

    // Validate country and language parameters
    const validCountries = ["tr", "iq", "lb", "sy", "gb"];
    const validLanguages = ["en", "ar", "tr", "ku"];

    if (
      !validCountries.includes(country) ||
      !validLanguages.includes(language)
    ) {
      return new NextResponse("Invalid country or language", {
        status: 400,
        headers: {
          "Content-Type": "text/plain",
        },
      });
    }

    const xml = await generateLocaleSpecificSitemapXML(country, language);

    return new NextResponse(xml, {
      status: 200,
      headers: {
        "Content-Type": "application/xml",
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
        "Content-Encoding": "identity",
      },
    });
  } catch (error) {
    console.error(`Error generating sitemap for ${Params.lang}:`, error);
    LogServerError(
      { error, type: "get currency error", local: Params.lang },
      `/api/${Params.lang}/sitemap.xml`,
    );
    return new NextResponse("Error generating sitemap", {
      status: 500,
      headers: {
        "Content-Type": "text/plain",
      },
    });
  }
}
