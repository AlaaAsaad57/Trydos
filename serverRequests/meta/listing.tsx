import { elasticSearchClient } from "services/elastic/elasticsearch.config";
import {
  getConfiguredImage,
  GetImageUrl,
  parseFiltersFromParams,
} from "utils/server";
import { trydosTranslations } from "./constants-meta";
import { General_Site_Data } from "./StructuredData/Constants";
import { LogServerError } from "utils/serverErrorReporter";
import { catalog_index } from "services/elastic/INDEXES";
import { RedisGet, RedisSet } from "serverRequests/radis";

const getMetadataLabels = async ({ parsedFilters, language }) => {
  const shouldQueries = [];
  let client = elasticSearchClient;
  // نجهز استعلامات البحث عن القيم المختارة
  const buildNestedShould = (path, field, values) => ({
    nested: {
      path,
      query: { terms: { [`${path}.${field}.keyword`]: values || [] } },
    },
  });
  if (parsedFilters.boutiques?.length)
    shouldQueries.push(
      buildNestedShould("custom_boutiques", "slug", parsedFilters.boutiques),
    );
  if (parsedFilters.categories?.length)
    shouldQueries.push(
      buildNestedShould("custom_categories", "slug", parsedFilters.categories),
    );
  if (parsedFilters.brands?.length)
    shouldQueries.push(
      buildNestedShould("custom_brands", "slug", parsedFilters.brands),
    );
  // إضافة الألوان للبحث
  if (parsedFilters.colors?.length)
    shouldQueries.push(
      buildNestedShould("colors", "color", parsedFilters.colors),
    );

  if (shouldQueries.length === 0) return { labels: {}, banner: null };

  try {
    const response: any = await client.search({
      index: catalog_index,
      size: 0,
      query: {
        bool: { should: shouldQueries, minimum_should_match: 1 },
      },
      aggs: {
        boutique_info: {
          nested: { path: "custom_boutiques" },
          aggs: {
            filtered: {
              filter: {
                bool: {
                  must: [
                    {
                      terms: {
                        "custom_boutiques.slug.keyword":
                          parsedFilters.boutiques || [],
                      },
                    },
                    {
                      term: {
                        "custom_boutiques.language_code.keyword": language,
                      },
                    },
                  ],
                },
              },
              aggs: {
                top: {
                  top_hits: {
                    size: 1,
                    _source: [
                      "custom_boutiques.name",
                      "custom_boutiques.banners.file_path",
                      "custom_boutiques.description",
                    ],
                  },
                },
              },
            },
          },
        },
        category_info: {
          nested: { path: "custom_categories" },
          aggs: {
            filtered: {
              filter: {
                bool: {
                  must: [
                    {
                      terms: {
                        "custom_categories.slug.keyword":
                          parsedFilters.categories || [],
                      },
                    },
                    {
                      term: {
                        "custom_categories.language_code.keyword": language,
                      },
                    },
                  ],
                },
              },
              aggs: {
                top: {
                  top_hits: { size: 1, _source: ["custom_categories.name"] },
                },
              },
            },
          },
        },
        brand_info: {
          nested: { path: "custom_brands" },
          aggs: {
            filtered: {
              filter: {
                bool: {
                  must: [
                    {
                      terms: {
                        "custom_brands.slug.keyword":
                          parsedFilters.brands || [],
                      },
                    },
                    {
                      term: { "custom_brands.language_code.keyword": language },
                    },
                  ],
                },
              },
              aggs: {
                top: { top_hits: { size: 1, _source: ["custom_brands.name"] } },
              },
            },
          },
        },
        // إضافة Aggregation للألوان لاستخراج أسمائها (مثل: "أحمر" بدلاً من "#FF0000")
        color_info: {
          nested: { path: "colors" },
          aggs: {
            filtered: {
              filter: {
                terms: { "colors.color.keyword": parsedFilters.colors || [] },
              },
              aggs: {
                top: {
                  top_hits: {
                    size: 5,
                    _source: ["colors.name", "colors.color"],
                  },
                },
              },
            },
          },
        },
      },
    });

    const getAggData = (agg) => agg?.filtered?.top?.hits?.hits[0]?._source;

    // الألوان قد تكون متعددة، لذا نجمع كل الأسماء الفريدة
    const colorHits = response.aggregations.color_info.filtered.top.hits.hits;
    const colorNames = [...new Set(colorHits.map((h) => h._source.name))].join(
      ", ",
    );

    const bData = getAggData(response.aggregations.boutique_info);
    const cData = getAggData(response.aggregations.category_info);
    const brData = getAggData(response.aggregations.brand_info);

    return {
      labels: {
        boutique: bData?.name,
        category: cData?.name,
        brand: brData?.name,
        colors: colorNames, // الاسم المترجم للون
        description: bData?.description,
      },
      banner: bData?.banners?.[0]?.file_path || null,
    };
  } catch (error) {
    LogServerError({
      language,
      error: error,
      scenario: "Error In getMetadataLabels in serverRequest/listing",
    });
    return { labels: {}, banner: null };
  }
};

export async function generateMetadataForListing({ params }) {
  const { lang, filters: filterParams } = await params;
  const [country, language] = lang.split("-");

  const cacheKey = `meta-listing-${lang}-${filterParams?.join("-") || "none"}`;
  const cached = await RedisGet(cacheKey);
  if (cached) return cached;

  const t = trydosTranslations[language] || trydosTranslations.en;

  // تحويل المصفوفة إلى Object (يحتوي على الـ slugs والأسعار الخام)
  const parsedFilters = parseFiltersFromParams(filterParams || []);

  // جلب الأسماء المترجمة والبانر من Elasticsearch (استعلام الـ Aggs الخفيف)
  const { labels, banner } = await getMetadataLabels({
    parsedFilters,
    language,
  });

  // بناء أجزاء العنوان بترتيب منطقي للـ SEO
  const titleParts = [
    parsedFilters.search_text?.[0] ? `"${parsedFilters.search_text[0]}"` : null,
    labels.boutique,
    labels.brand,
    labels.category,
    parsedFilters.tags_names?.join(", "),
    labels.colors, // استخدام الأسماء المترجمة للألوان (مثل: أحمر، أزرق)
    parsedFilters.sizes?.join(", "),
    parsedFilters.prices
      ? `${parsedFilters.prices[0]} - ${parsedFilters.prices[1]}`
      : null,
  ].filter(Boolean);

  // إذا كانت المصفوفة فارغة نستخدم اسم الموقع فقط، وإلا ندمج الأجزاء
  const finalTitle =
    titleParts.length > 0
      ? `${titleParts.join(" - ")} | ${t.siteName}`
      : t.siteName;

  // تنظيف الوصف من أي وسم HTML وقصه لـ 160 حرفاً
  const cleanDescription = labels.description
    ? labels.description.replace(/<[^>]*>/g, "").substring(0, 160)
    : t.listingDesc(finalTitle.split("|")[0].trim());

  // بناء رابط صورة الـ OpenGraph (يفضل استخدام رابط الـ CDN الكامل)
  const ogImage = banner
    ? getConfiguredImage({
        src: GetImageUrl(banner),
        width: 1200,
        height: 630,
        q: "90",
      }).replace('f_auto','f_jpg')
    : `${General_Site_Data.url}/opengraph-image.png`;

  const currentUrl = `${General_Site_Data.url}/${lang}/filters/${
    filterParams?.join("/") || ""
  }`;

  const result = {
    title: finalTitle,
    description: cleanDescription,
    alternates: {
      canonical: currentUrl,
    },
    openGraph: {
      title: finalTitle,
      description: cleanDescription,
      url: currentUrl,
      siteName: t.siteName,
      images: [{ url: ogImage, width: 1200, height: 630 }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: finalTitle,
      description: cleanDescription,
      images: [ogImage],
    },
  };

  await RedisSet(cacheKey, result, 300);
  return result;
}
