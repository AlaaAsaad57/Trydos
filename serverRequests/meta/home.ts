import { cacheLife, cacheTag } from "next/cache";
import { RedisGet, RedisSet } from "serverRequests/radis";
import { elasticSearchComment } from "services/elastic/elasticsearch.config";
import { trydosTranslations } from "./constants-meta";
import { getRobotsConfig } from "utils/server";
import { mapLocaleToBCP47 } from "./StructuredData/utils";
import { General_Site_Data } from "./StructuredData/Constants";
import { buildAlternates } from "./buildAlternates";
import { LogServerError } from "utils/serverErrorReporter";
import { catalog_index } from "services/elastic/INDEXES";
let client = elasticSearchComment;

/**
 * Is this a value that could be a category slug?
 *
 * `?mainCategory=` is a query parameter, so anything can arrive in it — a
 * sentence, an array (from `?mainCategory=a&mainCategory=b`), or nothing at all.
 * Whatever arrives ends up in three places that matter: the Redis cache key, the
 * page title when Elasticsearch finds no such category, and the OpenGraph url a
 * crawler reads.
 *
 * The rule is deliberately about shape, not about a list of real categories:
 * checking against the real list would mean an Elasticsearch query before the
 * cache is consulted, and an unknown slug would then cost a query every time it
 * is sent. Letters and digits (in any script, so Arabic, Turkish and Kurdish
 * slugs pass), plus `-` and `_`, up to 64 characters. A value that fails is
 * treated as no category at all, which is the same answer an unknown category
 * should give.
 */
export function isValidCategorySlug(category: unknown): category is string {
  return typeof category === "string" && /^[\p{L}\p{N}][\p{L}\p{N}_-]{0,63}$/u.test(category);
}

export async function GetHomeMetaData({ local, category: rawCategory = null }) {
  const [country, language] = local?.split("-");
  const lang = language || "en";
  const category = isValidCategorySlug(rawCategory) ? rawCategory : null;
  const cacheKey = category
    ? `meta-obj-${category}-${lang}-${country}`
    : `meta-obj-home-${lang}-${country}`;

  const baseUrl = General_Site_Data.url;

  // 1. Redis Cache Check
  const cachedMeta = await RedisGet(cacheKey);
  // Reconstruct metadataBase as a URL instance — plain objects survive JSON round-trips but
  // Next.js requires a real URL instance to resolve relative paths correctly.
  if (cachedMeta) return { ...cachedMeta, metadataBase: new URL(baseUrl) };

  // 2. Parallel Data Fetch
  const categoriesMeta = await getCachedMetaSource(country, lang, category);

  const t = trydosTranslations[lang] || trydosTranslations.en;

  // 3. Build Content Strings
  let pageTitle = "";
  let pageDesc = "";
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
    alternates: buildAlternates(`${country}-${lang}`, path),
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
      google: [
      "iANrHdX9P3YTSLpnXZYxSv3Zlk9s0Vy9Oiympeu25oE",
      "t3AmV4IAkGgEHviuLtG_c1OI3Dlo7OlcM1TWPwx7OVk",
    ]
    },
  };

  // 5. Cache the final result (RedisSet already JSON.stringifies internally — do NOT pre-stringify)
  await RedisSet(cacheKey, metadataObject);

  return metadataObject;
}
/**
 * The category's name, cached per country, language and slug.
 *
 * generateMetadata runs on every request — including the many that are served
 * from a cached page — so an uncached reader here means the search engine is
 * asked for a title that did not change, once per visit (finding 3).
 *
 * The slug is validated by the caller before it reaches this function, so the
 * cache key can never carry a value a stranger chose. All three arguments are
 * read inside the scope, so all three join the cache key.
 *
 * The Redis write stays in the caller. A cached scope must not carry a side
 * effect: the write would run on the call that filled the entry and never
 * again, which is not what a cache write means.
 */
async function getCachedMetaSource(
  country: string,
  language: string,
  category: string | null,
) {
  "use cache";
  cacheLife("homepage");
  cacheTag(`meta-${country}-${language}-${category ?? "home"}`);

  return GetCatgoriesMetaData({ country, language, slug: category });
}

// get Cateogires for metadata
async function GetCatgoriesMetaData({ country, language, slug }) {
  try {
    const { mustConditions, mustNotConditions } = getRules(country);
    const query = {
      index: catalog_index,
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
      index: catalog_index,
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
