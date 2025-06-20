import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const lang = searchParams.get("lang") || "en-US";
  const [country, language] = lang.split("-");

  try {
    // Fetch all data in parallel
    const [categoriesData, boutiqueData, searchData] = await Promise.all([
      fetchCategories(language, country),
      fetchBoutiques(language, country),
      fetchProductsAndBrands(language, country),
    ]);

    const sitemapData = {
      categories: categoriesData,
      boutiques: boutiqueData,
      products: searchData.products,
      brands: searchData.brands,
      metadata: {
        totalItems:
          categoriesData.length +
          boutiqueData.length +
          searchData.products.length +
          searchData.brands.length,
        fetchedAt: new Date().toISOString(),
        language,
        country,
      },
    };

    return NextResponse.json(sitemapData, {
      status: 200,
      headers: {
        "Cache-Control": "public, max-age=10, stale-while-revalidate=10",
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Sitemap generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate sitemap data" },
      { status: 500 }
    );
  }
}

async function fetchCategories(language: string, country: string) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_ELASTIC_BACKEND_URL}/api/home/mainCategories?lang=${language}`,
      {
        headers: {
          lang: language,
          country: country,
          Accept: "application/json",
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Categories fetch failed: ${response.status}`);
    }

    const { data } = await response.json();
    return data.mainCategories.map((category: any) => ({
      name: category.name,
      url: `/categories/${category.slug}`,
      type: "category",
    }));
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
}

async function fetchBoutiques(language: string, country: string) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_ELASTIC_BACKEND_URL}/api/home/boutiques?category_slugs=[]&limit=100&offset=0`,
      {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
          "Cache-Control": "no-cache",
          lang: language,
          country: country,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Boutiques fetch failed: ${response.status}`);
    }

    const { data } = await response.json();
    return (
      data.boutiques?.map((boutique: any) => ({
        name: boutique.name,
        slug: boutique.slug,
        icon: boutique.icon?.file_path,
        description: boutique.description,
        url: `/filters/boutiques/${boutique.slug}`,
        type: "boutique",
        categories:
          boutique.mainCategoriesForProductIds?.map((cat: any) => cat.slug) ||
          [],
      })) || []
    );
  } catch (error) {
    console.error("Error fetching boutiques:", error);
    return [];
  }
}

async function fetchProductsAndBrands(language: string, country: string) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_ELASTIC_BACKEND_URL}/api/products/searchInCatalog?lang=${language}&limit=100`,
      {
        headers: {
          lang: language,
          country: country,
          Accept: "application/json",
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Search fetch failed: ${response.status}`);
    }

    const { data } = await response.json();

    const products =
      data.products?.map((product: any) => ({
        name: product.name,
        slug: product.slug,
        url: `/products/${product.slug}`,
        type: "product",
      })) || [];

    const brands =
      data.brands?.map((brand: any) => ({
        name: brand.name,
        slug: brand.slug,

        url: `/filters/brands/${brand.slug}`,
        type: "brand",
      })) || [];

    return { products, brands };
  } catch (error) {
    console.error("Error fetching products and brands:", error);
    return { products: [], brands: [] };
  }
}

// Additional utility function to get all available languages
export async function OPTIONS(request: NextRequest) {
  return NextResponse.json({
    availableLanguages: ["en-US", "ar-SA"],
    supportedMethods: ["GET"],
    description: "Dynamic sitemap data endpoint",
  });
}
