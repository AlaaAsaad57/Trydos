import { RedisGet, RedisSet } from "serverRequests/radis";
import { elasticSearchComment } from "services/elastic/elasticsearch.config";
import { trydosTranslations } from "./constants-meta";
import { getRobotsConfig } from "utils/server";
import { mapLocaleToBCP47 } from "./StructuredData/utils";
import { General_Site_Data } from "./StructuredData/Constants";
import { LogServerError } from "utils/serverErrorReporter";
import { DEFAULT_INDEX } from "services/elastic/elasticsearch-reader.service";
let client = elasticSearchComment;

export async function GetHomeMetaData({ local, category = null }) {
  const [country, language] = local?.split("-");
  const lang = language || "en";
  const cacheKey = category
    ? `meta-obj-${category}-${lang}-${country}`
    : `meta-obj-home-${lang}-${country}`;

  // 1. Redis Cache Check
  const cachedMeta = await RedisGet(cacheKey);
  if (cachedMeta) return cachedMeta;

  // 2. Parallel Data Fetch
  const categoriesMeta = await GetCatgoriesMetaData({
    country,
    language: lang,
    slug: category,
  });

  const t = trydosTranslations[lang] || trydosTranslations.en;

  // 3. Build Content Strings
  let pageTitle = "";
  let pageDesc = "";
  const baseUrl = General_Site_Data.url; // Ensure this is "https://trydos.com"
  const path = category ? `?mainCategory=${category}` : "";
  const fullUrl = `${baseUrl}/${country}-${lang}${path}`;
  const ogImageUrl = General_Site_Data.url + General_Site_Data.og; // Relative path like "/opengraph-image.png"

  if (category) {
    const currentCat = categoriesMeta?.[0]?.name || category;
    pageTitle = t.home.categoryTitle(currentCat);
    pageDesc = t.listingDesc(currentCat);
  } else {
    pageTitle = t.home.title;
    pageDesc = t.home.description;
  }

  // 4. THE COMPLETE METADATA OBJECT
  const metadataObject = {
    metadataBase: new URL(baseUrl),
    title: pageTitle,
    description: pageDesc,
    keywords: ["Trydos", "e-commerce", "boutiques", "fashion", country, lang],
    icons: {
      icon: "/favicon.ico",
      shortcut: "/favicon.ico",
      apple: "/favicon.ico",
    },
    alternates: {
      canonical: fullUrl,
      languages: {
        en: `${baseUrl}/${country}-en${path}`,
        ar: `${baseUrl}/${country}-ar${path}`,
        tr: `${baseUrl}/${country}-tr${path}`,
        ku: `${baseUrl}/${country}-ku${path}`,
        "x-default": `${baseUrl}/${country}-en${path}`,
      },
    },
    robots: getRobotsConfig({
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    }),
    openGraph: {
      title: pageTitle,
      description: pageDesc,
      url: fullUrl,
      siteName: "Trydos",
      locale: mapLocaleToBCP47(local),
      type: "website",
      images: [{ url: ogImageUrl, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: pageTitle,
      description: pageDesc,
      images: [ogImageUrl],
    },
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: "Trydos",
    },
    verification: {
      google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
    },
  };

  // 5. Cache the final result
  await RedisSet(cacheKey, JSON.stringify(metadataObject));

  return metadataObject;
}
// get Cateogires for metadata
async function GetCatgoriesMetaData({ country, language, slug }) {
  try {
    const { mustConditions, mustNotConditions } = getRules(country);
    const query = {
      index: DEFAULT_INDEX,
      _source: [
        "custom_categories.name",
        "custom_categories.language_code",
        "custom_categories.id",
      ],
      query: {
        bool: {
          must: slug
            ? [
                ...mustConditions,
                {
                  bool: {
                    must: [
                      {
                        nested: {
                          path: "categories",
                          query: { term: { "categories.status": 1 } },
                        },
                      },
                      {
                        nested: {
                          path: "custom_categories",
                          query: {
                            term: {
                              "custom_categories.slug.keyword": slug,
                            },
                          },
                        },
                      },
                    ],
                  },
                },
              ]
            : mustConditions,
          must_not: mustNotConditions,
        },
      },
    };
    const searchParams = {
      index: DEFAULT_INDEX,
      size: 1,
      ...query,
    };
    const mainCategories = await client.search(searchParams);
    let categoriesData = mainCategories.hits.hits.map((s) => {
      // @ts-ignore
      return s._source?.custom_categories?.find(
        (cat) => cat.language_code?.toLowerCase() === language?.toLowerCase(),
      );
    });
    categoriesData = categoriesData.filter((c) => c !== undefined);
    categoriesData = Array.from(
      new Map(categoriesData.map((c: any) => [c.id, c])).values(),
    );

    return categoriesData;
  } catch (error) {
    LogServerError({
      language,
      country,
      error: error,
      scenario: "Error In GetCatgoriesMetaData in serverRequest/home",
    });
    throw error;
  }
}

function getRules(country) {
  const mustConditions = [
    { term: { status: 1 } },
    {
      nested: {
        path: "boutique",
        query: { term: { "boutique.status": 1 } },
      },
    },
    {
      nested: {
        path: "brand",
        query: { term: { "brand.status": 1 } },
      },
    },
    {
      bool: {
        should: [
          { term: { added_by: "admin" } },
          {
            bool: {
              must: [
                { term: { added_by: "seller" } },
                { term: { seller_status: "approved" } },
              ],
            },
          },
        ],
        minimum_should_match: 1,
      },
    },
    {
      nested: {
        path: "custom_boutiques.banners",
        ignore_unmapped: true,
        query: {
          exists: { field: "custom_boutiques.banners.file_path" },
        },
      },
    },
  ];
  const upperCountry = country.toUpperCase();
  const mustNotConditions = [
    { exists: { field: "deleted_at" } },
    {
      nested: {
        path: "categories",
        query: {
          bool: {
            must: [
              {
                term: {
                  "categories.status": 0,
                },
              },
            ],
          },
        },
      },
    },
    {
      nested: {
        path: "countries_iso",
        ignore_unmapped: true,
        query: {
          bool: {
            must: [
              {
                term: {
                  "categories.status": 0, // 👈 use plain 0, not `{ value: 0 }`
                },
              },
            ],
          },
        },
      },
    },
    {
      nested: {
        path: "categories",
        ignore_unmapped: true,
        query: {
          nested: {
            path: "categories.countries_iso",
            query: {
              term: { "categories.countries_iso.iso": upperCountry },
            },
          },
        },
      },
    },
    {
      nested: {
        path: "brand",
        ignore_unmapped: true,
        query: {
          nested: {
            path: "brand.countries_iso",
            query: { term: { "brand.countries_iso.iso": upperCountry } },
          },
        },
      },
    },
    {
      nested: {
        path: "boutique",
        ignore_unmapped: true,
        query: {
          nested: {
            path: "boutique.countries_iso",
            query: {
              term: { "boutique.countries_iso.iso": upperCountry },
            },
          },
        },
      },
    },
  ];
  return { mustConditions, mustNotConditions };
}

// get boutiques for metadata

export async function GetBoutiqueForMetaData({ language, country, category }) {
  let { must, must_not } = buildBaseConditions({ language, country, category });

  const customQuery = {
    index: DEFAULT_INDEX,
    body: {
      size: 10, // How many product hits to return
      query: {
        bool: { must, must_not },
      },
      // 1. COLLAPSE: Ensures we only get 1 document per Boutique ID in 'hits'
      collapse: {
        field: "boutique_id", // Use the keyword field for boutique ID
      },
      // 2. AGGREGATION: This calculates the "Total Unique Boutiques"
      aggs: {
        unique_boutique_count: {
          cardinality: {
            field: "boutique_id",
          },
        },
      },
      sort: [{ boutique_position: { order: "desc" } }],
      _source: [
        "custom_boutiques.id",
        "custom_boutiques.name",
        "custom_boutiques.language_code",
      ],
    },
  };

  const response = await client.search(customQuery);

  // The unique count of boutiques
  const totalUniqueBoutiques = (
    response.aggregations.unique_boutique_count as any
  ).value;

  // The list of unique boutiques from the collapsed hits
  let customBoutiques: any[] = response.hits.hits.map((hit) => hit._source);

  // Filter boutiques by language
  customBoutiques.forEach((boutique) => {
    if (Array.isArray(boutique.custom_boutiques)) {
      boutique.custom_boutiques = boutique.custom_boutiques.filter(
        (cb) => cb.language_code === language,
      );
    }
  });

  return {
    customBoutiques: customBoutiques.map((s) => ({ ...s.custom_boutiques[0] })),
    total: totalUniqueBoutiques, // This is now the count of BOUTIQUES, not products
  };
}
function buildBaseConditions({ country, language, category }) {
  const categorySlugs = category;

  const must: any[] = [
    { term: { status: 1 } },
    {
      nested: {
        path: "boutique",
        query: { term: { "boutique.status": 1 } },
      },
    },
    {
      nested: {
        path: "brand",
        query: { term: { "brand.status": 1 } },
      },
    },
  ];
  must.push({
    nested: {
      path: "custom_products",
      ignore_unmapped: true,
      query: {
        exists: { field: "custom_products.id" },
      },
    },
  });
  if (categorySlugs) {
    must.push({
      bool: {
        must: [
          {
            nested: {
              path: "categories",
              query: { term: { "categories.status": 1 } },
            },
          },
          {
            nested: {
              path: "custom_categories",
              query: {
                term: { "custom_categories.slug.keyword": categorySlugs },
              },
            },
          },
        ],
      },
    });
  }

  must.push({
    bool: {
      should: [
        { term: { added_by: "admin" } },
        {
          bool: {
            must: [
              { term: { added_by: "seller" } },
              { term: { seller_status: "approved" } },
            ],
          },
        },
      ],
      minimum_should_match: 1,
    },
  });

  must.push({
    nested: {
      path: "custom_boutiques.banners",
      ignore_unmapped: true,
      query: {
        exists: { field: "custom_boutiques.banners.file_path" },
      },
    },
  });

  const must_not: any[] = [{ exists: { field: "deleted_at" } }];

  if (country) {
    const iso = country.toUpperCase();
    must_not.push(
      {
        nested: {
          path: "countries_iso",
          ignore_unmapped: true,
          query: { term: { "countries_iso.iso": iso } },
        },
      },
      {
        nested: {
          path: "categories",
          ignore_unmapped: true,
          query: {
            nested: {
              path: "categories.countries_iso",
              query: { term: { "categories.countries_iso.iso": iso } },
            },
          },
        },
      },
      {
        nested: {
          path: "brand",
          ignore_unmapped: true,
          query: {
            nested: {
              path: "brand.countries_iso",
              query: { term: { "brand.countries_iso.iso": iso } },
            },
          },
        },
      },
      {
        nested: {
          path: "boutique",
          ignore_unmapped: true,
          query: {
            nested: {
              path: "boutique.countries_iso",
              query: { term: { "boutique.countries_iso.iso": iso } },
            },
          },
        },
      },
    );
  }

  must_not.push({
    nested: {
      path: "categories",
      query: {
        bool: { must: [{ term: { "categories.status": 0 } }] },
      },
    },
  });

  return { must, must_not };
}
