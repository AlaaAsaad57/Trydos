import { NextRequest, NextResponse } from "next/server";
import { 
  testSitemapGeneration, 
  testProductSitemapGeneration,
  testStaticPagesSitemapGeneration,
  testSearchTermsSitemapGeneration,
  testLocaleSitemapGeneration,
  testLocaleSitemapIndexGeneration
} from "services/elastic/sitemap.service";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type') || 'all';

    let result: any = {};

    if (type === 'home' || type === 'all') {
      console.log("🏠 Testing home sitemap...");
      const homeResult = await testSitemapGeneration();
      result.home = homeResult;
    }

    if (type === 'products' || type === 'all') {
      console.log("🛍️ Testing products sitemap...");
      const productsResult = await testProductSitemapGeneration();
      result.products = productsResult;
    }

    if (type === 'static' || type === 'all') {
      console.log("📄 Testing static pages sitemap...");
      const staticResult = await testStaticPagesSitemapGeneration();
      result.static = staticResult;
    }

    if (type === 'search' || type === 'all') {
      console.log("🔍 Testing search terms sitemap...");
      const searchResult = await testSearchTermsSitemapGeneration();
      result.search = searchResult;
    }

    if (type === 'locale-index' || type === 'all') {
      console.log("🌍 Testing locale sitemap index...");
      const localeIndexResult = await testLocaleSitemapIndexGeneration();
      result.localeIndex = localeIndexResult;
    }

    if (type === 'locale' || type === 'all') {
      console.log("🏳️ Testing locale-specific sitemap...");
      const searchParams = request.nextUrl.searchParams;
      const country = searchParams.get('country') || 'tr';
      const language = searchParams.get('language') || 'en';
      const localeResult = await testLocaleSitemapGeneration(country, language);
      result.locale = localeResult;
    }

    const success = Object.values(result).every((r: any) => r.success !== false);
    
    return NextResponse.json({
      success,
      timestamp: new Date().toISOString(),
      ...result
    }, {
      status: success ? 200 : 500,
    });
  } catch (error) {
    console.error("Error in sitemap test route:", error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    );
  }
}
