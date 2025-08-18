import { NextRequest, NextResponse } from "next/server";
import { generateLocaleSpecificSitemapXML } from "services/elastic/sitemap.service";

export async function GET(
  request: NextRequest,
  { params }: { params: { lang: string } }
) {
  try {
    const lang = params.lang;
    
    // Parse country-language from the lang parameter (e.g., "tr-en" -> country: "tr", language: "en")
    const parts = lang.split('-');
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
    const validCountries = ['tr', 'iq', 'lb', 'sy'];
    const validLanguages = ['en', 'ar', 'tr', 'ku'];
    
    if (!validCountries.includes(country) || !validLanguages.includes(language)) {
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
      },
    });
  } catch (error) {
    console.error(`Error generating sitemap for ${params.lang}:`, error);

    return new NextResponse("Error generating sitemap", {
      status: 500,
      headers: {
        "Content-Type": "text/plain",
      },
    });
  }
}
