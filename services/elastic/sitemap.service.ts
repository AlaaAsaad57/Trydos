"use server";

import { elasticSearchClient } from "./elasticsearch.config";
import { SearchRequest, SearchResponse } from "@elastic/elasticsearch/lib/api/types";

interface SitemapUrl {
  loc: string;
  lastmod: string;
  changefreq: string;
  priority: number;
}

interface LocaleData {
  countries: string[];
  languages: string[];
}

interface ProductData {
  id: string;
  slug: string;
  language_code: string;
  country_iso: string;
  updated_at?: string;
}

interface StaticPage {
  url: string;
  priority: number;
  frequency: string;
  last_modified: string;
}

interface SearchTerm {
  term: string;
  country_iso?: string;
  language_code?: string;
  count?: number;
}

/**
 * Get all active countries and languages from Elasticsearch for sitemap generation
 */
export async function getHomeSitemapLocales(): Promise<LocaleData> {
  try {
    console.log('[getHomeSitemapLocales] Starting to fetch locales...');
    
    // Build base conditions (same as your existing buildBaseConditions but without country filter)
    const baseConditions = buildSitemapBaseConditions();
    const { must: mustConditions, must_not: mustNotConditions } = baseConditions;

    const searchQuery: SearchRequest = {
      index: "products_catalog",
      size: 0, // We only need aggregations, not documents
      query: {
        bool: {
          must: mustConditions,
          must_not: mustNotConditions,
        },
      },
      aggs: {
        // Get all countries from products
        countries: {
          nested: {
            path: "countries_iso",
          },
          aggs: {
            country_codes: {
              terms: {
                field: "countries_iso.iso.keyword",
                size: 300, // Adjust based on expected number of countries
              },
            },
          },
        },
        // Get all languages from custom_products
        languages: {
          nested: {
            path: "custom_products",
          },
          aggs: {
            language_codes: {
              terms: {
                field: "custom_products.language_code.keyword",
                size: 20, // Should be enough for languages
              },
            },
          },
        },
      },
    };

    console.log('[getHomeSitemapLocales] Search query:', JSON.stringify(searchQuery, null, 2));
    
    const response: SearchResponse = await elasticSearchClient.search(searchQuery);
    
    console.log('[getHomeSitemapLocales] Raw response:', JSON.stringify(response, null, 2));
    
    const aggregations = response.aggregations as any;

    // Extract countries
    const countryBuckets = aggregations?.countries?.country_codes?.buckets || [];
    console.log('[getHomeSitemapLocales] Country buckets:', countryBuckets);
    const countries = countryBuckets.map((bucket: any) => bucket.key.toLowerCase());

    // Extract languages
    const languageBuckets = aggregations?.languages?.language_codes?.buckets || [];
    console.log('[getHomeSitemapLocales] Language buckets:', languageBuckets);
    const languages = languageBuckets.map((bucket: any) => bucket.key.toLowerCase());

    console.log('[getHomeSitemapLocales] Raw countries:', countries);
    console.log('[getHomeSitemapLocales] Raw languages:', languages);

    // Filter to only include supported languages
    const supportedLanguages = ["en", "ar", "tr", "ku"];
    const filteredLanguages = languages.filter((lang: string) => 
      supportedLanguages.includes(lang)
    );

    // If no languages found in ES, use the supported languages
    const finalLanguages = filteredLanguages.length > 0 ? filteredLanguages : supportedLanguages;

    // If no countries found, try a different approach or use fallback
    let finalCountries = countries;
    if (countries.length === 0) {
      console.log('[getHomeSitemapLocales] No countries found, trying alternative approach...');
      
      // Try to get countries from a simple query
      try {
        const simpleQuery = {
          index: "products_catalog",
          size: 1,
          _source: ["countries_iso"]
        };
        
        const simpleResponse = await elasticSearchClient.search(simpleQuery);
        console.log('[getHomeSitemapLocales] Simple query response:', JSON.stringify(simpleResponse, null, 2));
        
        // If still no countries, use fallback
        if (countries.length === 0) {
          console.log('[getHomeSitemapLocales] Using fallback countries');
          finalCountries = ["tr", "iq", "lb", "sy"];
        }
      } catch (simpleError) {
        console.error('[getHomeSitemapLocales] Simple query failed:', simpleError);
        finalCountries = ["tr", "iq", "lb", "sy"];
      }
    }

    console.log('[getHomeSitemapLocales] Final countries:', finalCountries);
    console.log('[getHomeSitemapLocales] Final languages:', finalLanguages);

    return {
      countries: finalCountries,
      languages: finalLanguages,
    };
  } catch (error) {
    console.error("Error fetching sitemap locales:", error);
    
    // Fallback to default values if ES fails
    return {
      countries: ["tr", "iq", "lb", "sy"], // From your countries.ts fallback
      languages: ["en", "ar", "tr", "ku"], // From middleware
    };
  }
}

/**
 * Generate home page sitemap URLs for all country-language combinations
 */
export async function generateHomeSitemapUrls(): Promise<SitemapUrl[]> {
  const baseUrl = "https://trydos-front-git-determine-the-type-of-639e4a-trydos-front-team.vercel.app";
  const locales = await getHomeSitemapLocales();
  const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

  const sitemapUrls: SitemapUrl[] = [];

  // Generate URLs for all country-language combinations
  for (const country of locales.countries) {
    for (const language of locales.languages) {
      const url = `${baseUrl}/${country}-${language}`;
      
      sitemapUrls.push({
        loc: url,
        lastmod: currentDate,
        changefreq: "daily",
        priority: 1.0,
      });
    }
  }

  return sitemapUrls;
}

/**
 * Get all products for sitemap generation using scroll search
 */
export async function getProductsForSitemap(batchSize: number = 1000): Promise<ProductData[]> {
  const allProducts: ProductData[] = [];
  let scrollId: string | null = null;
  const scrollTimeout = "5m";

  try {
    // Initial search
    const initialParams = buildProductSearchParams(batchSize, scrollTimeout);
    let response: SearchResponse = await elasticSearchClient.search(initialParams);
    console.log("the product count is :", response);
    
    scrollId = response._scroll_id || null;
    if (!scrollId) {
      throw new Error("Failed to initialize scroll search");
    }

    // Process initial batch
    const initialHits = response.hits.hits as any[];
    allProducts.push(...transformHitsToProducts(initialHits));

    // Continue scrolling until no more results
    while (response.hits.hits.length > 0) {
      response = await elasticSearchClient.scroll({
        scroll_id: scrollId,
        scroll: scrollTimeout,
      });

      const hits = response.hits.hits as any[];
      if (hits.length > 0) {
        allProducts.push(...transformHitsToProducts(hits));
      }
    }

    return allProducts;
  } catch (error) {
    console.error("Error fetching products for sitemap:", error);
    throw error;
  } finally {
    // Clean up scroll context
    if (scrollId) {
      try {
        await elasticSearchClient.clearScroll({ scroll_id: scrollId });
      } catch (cleanupError) {
        console.warn("Failed to clear scroll context:", cleanupError);
      }
    }
  }
}

/**
 * Generate product sitemap URLs
 */
export async function generateProductSitemapUrls(): Promise<SitemapUrl[]> {
  const baseUrl = "https://trydos-front-git-determine-the-type-of-639e4a-trydos-front-team.vercel.app";
  const products = await getProductsForSitemap();
  const locales = await getHomeSitemapLocales();
  const sitemapUrls: SitemapUrl[] = [];
  console.log("Unique products count:", products);
  console.log("Available countries:", locales.countries.length);
  console.log("Available languages:", locales.languages.length);
  console.log("Expected total URLs:", products.length * locales.countries.length * locales.languages.length);
  
  // Generate URLs for all country-language combinations for each product
  for (const product of products) {
    // Skip products without valid slug
    if (!product.slug || product.slug.trim() === "") {
      continue;
    }

    // Parse lastmod date
    const lastmod = product.updated_at 
      ? new Date(product.updated_at).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0];

    // Generate URLs for all country-language combinations
    for (const country of locales.countries) {
      for (const language of locales.languages) {
        // Generate URL: {baseUrl}/{country}-{language}/products/{slug}
        const url = `${baseUrl}/${country}-${language}/products/${product.slug}`;
        
        sitemapUrls.push({
          loc: url,
          lastmod: lastmod,
          changefreq: "weekly", // Products change less frequently than home
          priority: 0.8, // Slightly lower priority than home
        });
      }
    }
  }

  console.log("Generated URLs count:", sitemapUrls.length);
  return sitemapUrls;
}

/**
 * Get static pages configuration (following PHP pattern)
 */
function getStaticPages(): StaticPage[] {
  const baseUrl = "https://trydos-front-git-determine-the-type-of-639e4a-trydos-front-team.vercel.app";
  
  // Define static pages configuration (similar to PHP config)
  const staticPagesConfig = [
    {
      path: "/about",
      priority: 0.5,
      change_frequency: "monthly",
      last_modified: 30 // days ago
    },
    {
      path: "/contact",
      priority: 0.5,
      change_frequency: "monthly", 
      last_modified: 30
    },
    {
      path: "/privacy-policy",
      priority: 0.3,
      change_frequency: "monthly",
      last_modified: 60
    },
    {
      path: "/terms-of-service",
      priority: 0.3,
      change_frequency: "monthly",
      last_modified: 60
    },
    {
      path: "/help",
      priority: 0.4,
      change_frequency: "weekly",
      last_modified: 7
    }
  ];

  const pages: StaticPage[] = [];

  for (const page of staticPagesConfig) {
    const lastModified = new Date();
    lastModified.setDate(lastModified.getDate() - page.last_modified);

    pages.push({
      url: `${baseUrl}${page.path}`,
      priority: page.priority,
      frequency: page.change_frequency,
      last_modified: lastModified.toISOString().split('T')[0]
    });
  }

  return pages;
}

/**
 * Generate static pages sitemap URLs for all country-language combinations
 */
export async function generateStaticPagesSitemapUrls(): Promise<SitemapUrl[]> {
  const baseUrl = "https://trydos-front-git-determine-the-type-of-639e4a-trydos-front-team.vercel.app";
  const locales = await getHomeSitemapLocales();
  const staticPages = getStaticPages();
  const sitemapUrls: SitemapUrl[] = [];

  // Generate static page URLs for all country-language combinations
  for (const country of locales.countries) {
    for (const language of locales.languages) {
      for (const page of staticPages) {
        // Extract path from full URL
        const urlPath = new URL(page.url).pathname;
        
        // Create country-specific URL: {baseUrl}/{country}-{language}{path}
        const url = `${baseUrl}/${country}-${language}${urlPath}`;
        
        sitemapUrls.push({
          loc: url,
          lastmod: page.last_modified,
          changefreq: page.frequency,
          priority: page.priority,
        });
      }
    }
  }

  return sitemapUrls;
}

/**
 * Get top search terms from Elasticsearch (following PHP pattern)
 */
export async function getTopSearchTerms(limit: number = 100): Promise<SearchTerm[]> {
  try {
    console.log(`[getTopSearchTerms] Starting search terms query with limit: ${limit}`);
    
    // First, get the most used search terms (following PHP pattern)
    const searchQuery: SearchRequest = {
      index: "search_logs",
      size: 0,
      query: {
        range: {
          results_count: {
            gt: 0 // greater than 0
          }
        }
      },
      aggs: {
        top_search_terms: {
          terms: {
            field: "search_term.keyword",
            size: limit,
            order: { "_count": "desc" }
          }
        }
      }
    };

    console.log('[getTopSearchTerms] Elasticsearch query params:', JSON.stringify(searchQuery, null, 2));
    
    const response: SearchResponse = await elasticSearchClient.search(searchQuery);
    
    console.log('[getTopSearchTerms] Raw Elasticsearch response:', JSON.stringify(response, null, 2));
    
    const topTerms: SearchTerm[] = [];

    // Process results
    const buckets = (response.aggregations as any)?.top_search_terms?.buckets || [];
    console.log(`[getTopSearchTerms] Found ${buckets.length} buckets in response`);
    
    if (buckets.length === 0) {
      console.log('[getTopSearchTerms] No buckets found - checking if index exists and has data');
      
      // Check if index exists
      try {
        const indexExists = await elasticSearchClient.indices.exists({ index: 'search_logs' });
        console.log('[getTopSearchTerms] Index exists check:', indexExists);
        
        if (indexExists) {
          // Get index stats to see if there's any data
          const indexStats = await elasticSearchClient.indices.stats({ index: 'search_logs' });
          console.log('[getTopSearchTerms] Index stats:', JSON.stringify(indexStats, null, 2));
          
          // Try a simple count query to see total documents
          const countResponse = await elasticSearchClient.count({ index: 'search_logs' });
          console.log('[getTopSearchTerms] Total documents in index:', countResponse.count);
          
          // Try a query without the range filter to see if any documents exist
          const simpleQuery = {
            index: 'search_logs',
            size: 0,
            aggs: {
              all_terms: {
                terms: {
                  field: 'search_term.keyword',
                  size: 5
                }
              }
            }
          };
          
          const simpleResponse = await elasticSearchClient.search(simpleQuery);
          console.log('[getTopSearchTerms] Simple query response:', JSON.stringify(simpleResponse, null, 2));
        }
      } catch (error) {
        console.error('[getTopSearchTerms] Error checking index:', error);
      }
    }
    
    for (const bucket of buckets) {
      let term = bucket.key;
      console.log(`[getTopSearchTerms] Processing term: "${term}" with count: ${bucket.doc_count}`);

      // Skip invalid terms
      if (typeof term !== 'string' || !term.trim()) {
        console.log(`[getTopSearchTerms] Skipping invalid term: "${term}"`);
        continue;
      }

      // Clean the term (remove extra whitespace)
      term = term.trim();

      // For each search term, get the most common country and language used with it
      const termDetails = await getMostCommonCountryAndLanguageForTerm(term);
      console.log(`[getTopSearchTerms] Term "${term}" - country: ${termDetails.country_iso}, language: ${termDetails.language_code}`);

      topTerms.push({
        term: term,
        count: bucket.doc_count,
        country_iso: termDetails.country_iso,
        language_code: termDetails.language_code
      });
    }

    console.log(`[getTopSearchTerms] Final result: ${topTerms.length} valid search terms`);
    return topTerms;
  } catch (error) {
    console.error("Error fetching top search terms:", error);
    return [];
  }
}

/**
 * Get the most common country and language used with a specific search term
 * (Following PHP pattern from TopSearchServiceForSiteMap.php)
 */
async function getMostCommonCountryAndLanguageForTerm(term: string): Promise<{ country_iso: string; language_code: string }> {
  try {
    const params: SearchRequest = {
      index: "search_logs",
      size: 0,
      query: {
        bool: {
          must: [
            { term: { "search_term.keyword": term } },
            { range: { results_count: { gt: 0 } } }
          ]
        }
      },
      aggs: {
        countries: {
          terms: {
            field: "country_iso.keyword",
            size: 10,
            missing: "tr" // Default country value is tr
          }
        },
        languages: {
          terms: {
            field: "language_code.keyword",
            size: 10,
            missing: "en" // Default language value is en
          }
        }
      }
    };

    const response: SearchResponse = await elasticSearchClient.search(params);
    const aggregations = response.aggregations as any;

    // Extract the most used country
    const countryBuckets = aggregations?.countries?.buckets || [];
    let country = countryBuckets.length > 0 ? countryBuckets[0].key : 'tr'; // Default country is tr

    // Extract the most used language
    const languageBuckets = aggregations?.languages?.buckets || [];
    let language = languageBuckets.length > 0 ? languageBuckets[0].key : 'en'; // Default language is en

    // Check that values are not empty
    if (!country || country === '_missing') {
      country = 'tr'; // Default country is tr
    }

    if (!language || language === '_missing') {
      language = 'en'; // Default language is en
    }

    // Check that the country is supported
    const supportedCountries = ["tr", "iq", "lb", "sy"]; // Following PHP pattern
    if (!supportedCountries.includes(country)) {
      country = 'tr'; // Default country is tr
    }

    return {
      country_iso: country,
      language_code: language
    };
  } catch (error) {
    console.error('Error getting country and language for term:', error);
    return {
      country_iso: 'tr', // Default country is tr
      language_code: 'en' // Default language is en
    };
  }
}



/**
 * Generate search terms sitemap URLs
 */
export async function generateSearchTermsSitemapUrls(): Promise<SitemapUrl[]> {
  const baseUrl = "https://trydos-front-git-determine-the-type-of-639e4a-trydos-front-team.vercel.app";
  const searchTerms = await getTopSearchTerms(100);
  const sitemapUrls: SitemapUrl[] = [];
  const currentDate = new Date().toISOString().split('T')[0];

  // Default values (following PHP pattern)
  const defaultCountry = "tr";
  const defaultLanguage = "en";
  const supportedCountries = ["tr", "iq", "lb", "sy"];

  for (const termData of searchTerms) {
    const encodedTerm = encodeURIComponent(termData.term);
    
    // Get country and language from search data or use defaults
    let countryIso = termData.country_iso || defaultCountry;
    const languageCode = termData.language_code || defaultLanguage;

    // If country is not in supported countries, use default country
    if (!supportedCountries.includes(countryIso)) {
      countryIso = defaultCountry;
    }

    // Create URL: {baseUrl}/{country}-{language}/filters/search/{encodedTerm}
    const url = `${baseUrl}/${countryIso}-${languageCode}/filters/search/${encodedTerm}`;

    sitemapUrls.push({
      loc: url,
      lastmod: currentDate,
      changefreq: "weekly",
      priority: 0.5,
    });
  }

  return sitemapUrls;
}

/**
 * Generate XML sitemap string for static pages
 */
export async function generateStaticPagesSitemapXML(): Promise<string> {
  const urls = await generateStaticPagesSitemapUrls();
  
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  
  for (const url of urls) {
    xml += '  <url>\n';
    xml += `    <loc>${url.loc}</loc>\n`;
    xml += `    <lastmod>${url.lastmod}</lastmod>\n`;
    xml += `    <changefreq>${url.changefreq}</changefreq>\n`;
    xml += `    <priority>${url.priority}</priority>\n`;
    xml += '  </url>\n';
  }
  
  xml += '</urlset>';
  
  return xml;
}

/**
 * Generate XML sitemap string for search terms
 */
export async function generateSearchTermsSitemapXML(): Promise<string> {
  const urls = await generateSearchTermsSitemapUrls();
  
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  
  for (const url of urls) {
    xml += '  <url>\n';
    xml += `    <loc>${url.loc}</loc>\n`;
    xml += `    <lastmod>${url.lastmod}</lastmod>\n`;
    xml += `    <changefreq>${url.changefreq}</changefreq>\n`;
    xml += `    <priority>${url.priority}</priority>\n`;
    xml += '  </url>\n';
  }
  
  xml += '</urlset>';
  
  return xml;
}

/**
 * Generate XML sitemap string for products
 */
export async function generateProductSitemapXML(): Promise<string> {
  const urls = await generateProductSitemapUrls();
  
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  
  for (const url of urls) {
    xml += '  <url>\n';
    xml += `    <loc>${url.loc}</loc>\n`;
    xml += `    <lastmod>${url.lastmod}</lastmod>\n`;
    xml += `    <changefreq>${url.changefreq}</changefreq>\n`;
    xml += `    <priority>${url.priority}</priority>\n`;
    xml += '  </url>\n';
  }
  
  xml += '</urlset>';
  
  return xml;
}

/**
 * Build search parameters for product sitemap (following PHP pattern)
 */
function buildProductSearchParams(batchSize: number, scrollTimeout: string): SearchRequest {
  return {
    index: "products_catalog",
    scroll: scrollTimeout,
    size: batchSize,
    _source: [
      "custom_products.slug",
      "custom_products.language_code", 
      "custom_products.country_iso",
      "updated_at",
      "status"
    ],
    query: buildProductBaseQuery(),
  };
}

/**
 * Build base query for products (following PHP pattern)
 */
function buildProductBaseQuery() {
  return {
    bool: {
      must: [
        { term: { status: 1 } }, // Only active products
        {
          nested: {
            path: "custom_products",
            query: {
              exists: {
                field: "custom_products.slug"
              }
            }
          }
        }
      ]
    }
  };
}

/**
 * Transform Elasticsearch hits to product data (following PHP pattern)
 */
function transformHitsToProducts(hits: any[]): ProductData[] {
  const products: ProductData[] = [];

  for (const hit of hits) {
    const source = hit._source;
    const productId = hit._id;
    const status = source.status || 0;
    const updatedAt = source.updated_at;

    // Skip inactive products
    if (status !== 1) {
      continue;
    }

    // Process custom_products array
    if (source.custom_products && Array.isArray(source.custom_products)) {
      for (const customProduct of source.custom_products) {
        if (!customProduct.slug || customProduct.slug.trim() === "") {
          continue;
        }

        const languageCode = customProduct.language_code || 'en';
        const countryIso = customProduct.country_iso || 'global';

        products.push({
          id: productId,
          slug: customProduct.slug,
          language_code: languageCode,
          country_iso: countryIso,
          updated_at: updatedAt,
        });
      }
    }
  }

  return products;
}

/**
 * Build base conditions for sitemap queries (same as your existing buildBaseConditions but without country filter)
 */
function buildSitemapBaseConditions() {
  const mustConditions: any[] = [
    { term: { status: 1 } },
    { nested: { path: "boutique", query: { term: { "boutique.status": 1 } } } },
    { nested: { path: "brand", query: { term: { "brand.status": 1 } } } },
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
  ];

  const mustNotConditions: any[] = [
    { exists: { field: "deleted_at" } },
    {
      nested: {
        path: "categories",
        query: {
          bool: {
            must: [{ term: { "categories.status": 0 } }],
          },
        },
      },
    },
  ];

  return {
    must: mustConditions,
    must_not: mustNotConditions,
  };
}

/**
 * Generate XML sitemap string for home pages
 */
export async function generateHomeSitemapXML(): Promise<string> {
  const urls = await generateHomeSitemapUrls();
  
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  
  for (const url of urls) {
    xml += '  <url>\n';
    xml += `    <loc>${url.loc}</loc>\n`;
    xml += `    <lastmod>${url.lastmod}</lastmod>\n`;
    xml += `    <changefreq>${url.changefreq}</changefreq>\n`;
    xml += `    <priority>${url.priority}</priority>\n`;
    xml += '  </url>\n';
  }
  
  xml += '</urlset>';
  
  return xml;
}

/**
 * Test function to debug sitemap generation
 * This can be called from a development route to verify the service works
 */
export async function testSitemapGeneration() {
  try {
    console.log("🔍 Testing sitemap generation...");
    
    // Test 1: Get locales
    const locales = await getHomeSitemapLocales();
    console.log("📊 Found locales:", {
      countries: locales.countries,
      languages: locales.languages,
      totalCombinations: locales.countries.length * locales.languages.length
    });
    
    // Test 2: Generate URLs
    const urls = await generateHomeSitemapUrls();
    console.log("🔗 Generated URLs:", urls.length);
    
    // Show first few URLs as examples
    const sampleUrls = urls.slice(0, 5);
    console.log("📝 Sample URLs:", sampleUrls);
    
    // Test 3: Generate XML
    const xml = await generateHomeSitemapXML();
    console.log("📄 XML length:", xml.length);
    
    return {
      success: true,
      locales,
      urlCount: urls.length,
      sampleUrls,
      xmlLength: xml.length
    };
  } catch (error) {
    console.error("❌ Sitemap test failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

/**
 * Test function specifically for products sitemap
 */
export async function testProductSitemapGeneration() {
  try {
    console.log("🔍 Testing product sitemap generation...");
    
    // Test 1: Get products
    const products = await getProductsForSitemap(100); // Small batch for testing
    console.log("📦 Found products:", products.length);
    
    // Show sample products
    const sampleProducts = products.slice(0, 5);
    console.log("📝 Sample products:", sampleProducts);
    
    // Test 2: Generate product URLs
    const urls = await generateProductSitemapUrls();
    console.log("🔗 Generated product URLs:", urls.length);
    
    // Show sample URLs
    const sampleUrls = urls.slice(0, 5);
    console.log("📝 Sample product URLs:", sampleUrls);
    
    // Test 3: Generate XML
    const xml = await generateProductSitemapXML();
    console.log("📄 Product XML length:", xml.length);
    
    return {
      success: true,
      productCount: products.length,
      urlCount: urls.length,
      sampleProducts,
      sampleUrls,
      xmlLength: xml.length
    };
  } catch (error) {
    console.error("❌ Product sitemap test failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

/**
 * Test function for static pages sitemap
 */
export async function testStaticPagesSitemapGeneration() {
  try {
    console.log("🔍 Testing static pages sitemap generation...");
    
    // Test 1: Get static pages
    const staticPages = getStaticPages();
    console.log("📄 Found static pages:", staticPages.length);
    
    // Test 2: Generate static page URLs
    const urls = await generateStaticPagesSitemapUrls();
    console.log("🔗 Generated static page URLs:", urls.length);
    
    // Show sample URLs
    const sampleUrls = urls.slice(0, 5);
    console.log("📝 Sample static page URLs:", sampleUrls);
    
    // Test 3: Generate XML
    const xml = await generateStaticPagesSitemapXML();
    console.log("📄 Static pages XML length:", xml.length);
    
    return {
      success: true,
      staticPageCount: staticPages.length,
      urlCount: urls.length,
      sampleUrls,
      xmlLength: xml.length
    };
  } catch (error) {
    console.error("❌ Static pages sitemap test failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

/**
 * Test function for search terms sitemap
 */
export async function testSearchTermsSitemapGeneration() {
  try {
    console.log("🔍 Testing search terms sitemap generation...");
    
    // Test 1: Get search terms
    const searchTerms = await getTopSearchTerms(10); // Small limit for testing
    console.log("🔍 Found search terms:", searchTerms.length);
    
    // Test 2: Generate search term URLs
    const urls = await generateSearchTermsSitemapUrls();
    console.log("🔗 Generated search term URLs:", urls.length);
    
    // Show sample URLs
    const sampleUrls = urls.slice(0, 5);
    console.log("📝 Sample search term URLs:", sampleUrls);
    
    // Test 3: Generate XML
    const xml = await generateSearchTermsSitemapXML();
    console.log("📄 Search terms XML length:", xml.length);
    
    return {
      success: true,
      searchTermCount: searchTerms.length,
      urlCount: urls.length,
      sampleSearchTerms: searchTerms.slice(0, 5),
      sampleUrls,
      xmlLength: xml.length
    };
  } catch (error) {
    console.error("❌ Search terms sitemap test failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

export async function generateSitemapIndexXML(): Promise<string> {
  const baseUrl = "https://trydos-front-git-determine-the-type-of-639e4a-trydos-front-team.vercel.app";
  const now = new Date().toISOString();

  const sitemaps = [
    `${baseUrl}/sitemap-home.xml`,
    `${baseUrl}/sitemap-products.xml`,
    `${baseUrl}/sitemap-static.xml`,
    `${baseUrl}/sitemap-search.xml`,
  ];

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

  for (const loc of sitemaps) {
    xml += '  <sitemap>\n';
    xml += `    <loc>${loc}</loc>\n`;
    xml += `    <lastmod>${now}</lastmod>\n`;
    xml += '  </sitemap>\n';
  }

  xml += '</sitemapindex>';
  return xml;
}

export async function generateFullSitemapXML(): Promise<string> {
	// Gather all URLs in parallel
	const [homeUrls, productUrls, staticUrls, searchUrls] = await Promise.all([
		generateHomeSitemapUrls(),
		generateProductSitemapUrls(),
		generateStaticPagesSitemapUrls(),
		generateSearchTermsSitemapUrls(),
	]);

	// Merge and de-duplicate by loc
	const all = [...homeUrls, ...productUrls, ...staticUrls, ...searchUrls];
	const seen = new Set<string>();
	const deduped = all.filter((u) => {
		if (seen.has(u.loc)) return false;
		seen.add(u.loc);
		return true;
	});

	let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
	xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

	for (const url of deduped) {
		xml += '  <url>\n';
		xml += `    <loc>${url.loc}</loc>\n`;
		xml += `    <lastmod>${url.lastmod}</lastmod>\n`;
		xml += `    <changefreq>${url.changefreq}</changefreq>\n`;
		xml += `    <priority>${url.priority}</priority>\n`;
		xml += '  </url>\n';
	}

	xml += '</urlset>';
	return xml;
}

// New functions for country-language specific sitemaps
export async function getAllCountryLanguageCombinations(): Promise<Array<{ country: string; language: string }>> {
  const countries = ['tr', 'iq', 'lb', 'sy'];
  const languages = ['en', 'ar', 'tr', 'ku'];

  const combinations: Array<{ country: string; language: string }> = [];

  for (const country of countries) {
    for (const language of languages) {
      combinations.push({ country, language });
    }
  }

  return combinations;
}


export async function generateLocaleSpecificSitemapUrls(
  country: string, 
  language: string
): Promise<SitemapUrl[]> {
  console.log(`language : ${language} and the country : ${country} from the url`);
  const baseUrl = "https://trydos-front-git-determine-the-type-of-639e4a-trydos-front-team.vercel.app";
  const sitemapUrls: SitemapUrl[] = [];
  
  // 1. Home page for this locale
  const homeUrl = `${baseUrl}/${country}-${language}`;
  sitemapUrls.push({
    loc: homeUrl,
    lastmod: new Date().toISOString().split('T')[0],
    changefreq: "daily",
    priority: 1.0,
  });
  console.log("1. Home page for this locale :" , sitemapUrls)
  
  // 2. Static pages for this locale
  const staticPages = getStaticPages();
  for (const page of staticPages) {
    // Extract path from full URL
    const urlPath = new URL(page.url).pathname;
    const staticUrl = `${baseUrl}/${country}-${language}${urlPath}`;
    sitemapUrls.push({
      loc: staticUrl,
      lastmod: page.last_modified,
      changefreq: page.frequency,
      priority: page.priority,
    });
  }
  console.log("2. Static pages for this locale:" , sitemapUrls)
  
      // 3. Products for this locale
    try {
      const products = await getProductsForSitemap();
      
      // Filter products by language (since country_iso is 'global' for all products)
      const localeProducts = products.filter(product => 
        product.language_code === language
      );
      
      console.log("3. Products for this global :" , products.length);
      console.log("3. Products for this locale :" , localeProducts.length);

      for (const product of localeProducts) {
        if (product.slug && product.slug.trim() !== "") {
          const productUrl = `${baseUrl}/${country}-${language}/products/${product.slug}`;
          const lastmod = product.updated_at 
            ? new Date(product.updated_at).toISOString().split('T')[0]
            : new Date().toISOString().split('T')[0];
          
          sitemapUrls.push({
            loc: productUrl,
            lastmod: lastmod,
            changefreq: "weekly",
            priority: 0.8,
          });
        }
      }
    } catch (error) {
      console.error(`Error fetching products for ${country}-${language}:`, error);
    }

  
      // 4. Search terms for this locale
    try {
      const searchTerms = await getTopSearchTerms(100);
      
      // Since all search terms have fallback country/language, include all terms for this locale
      // This ensures each locale gets relevant search terms
      console.log("4. Search terms for this global :" , searchTerms.length)
      
      for (const term of searchTerms) {
        const encodedTerm = encodeURIComponent(term.term);
        const searchUrl = `${baseUrl}/${country}-${language}/filters/search/${encodedTerm}`;
        
        sitemapUrls.push({
          loc: searchUrl,
          lastmod: new Date().toISOString().split('T')[0],
          changefreq: "weekly",
          priority: 0.6,
        });
      }
    } catch (error) {
      console.error(`Error fetching search terms for ${country}-${language}:`, error);
    }

  
  return sitemapUrls;
}

export async function generateLocaleSpecificSitemapXML(
  country: string, 
  language: string
): Promise<string> {
  const urls = await generateLocaleSpecificSitemapUrls(country, language);
  
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  
  for (const url of urls) {
    xml += '  <url>\n';
    xml += `    <loc>${url.loc}</loc>\n`;
    xml += `    <lastmod>${url.lastmod}</lastmod>\n`;
    xml += `    <changefreq>${url.changefreq}</changefreq>\n`;
    xml += `    <priority>${url.priority}</priority>\n`;
    xml += '  </url>\n';
  }
  
  xml += '</urlset>';
  return xml;
}

export async function generateLocaleSitemapIndexXML(): Promise<string> {
  const baseUrl = "https://trydos-front-git-determine-the-type-of-639e4a-trydos-front-team.vercel.app";
  const now = new Date().toISOString();
  const combinations = await getAllCountryLanguageCombinations();
  
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  
  for (const { country, language } of combinations) {
    const sitemapUrl = `${baseUrl}/${country}-${language}/sitemap.xml`;
    xml += '  <sitemap>\n';
    xml += `    <loc>${sitemapUrl}</loc>\n`;
    xml += `    <lastmod>${now}</lastmod>\n`;
    xml += '  </sitemap>\n';
  }
  
  xml += '</sitemapindex>';
  return xml;
}

export async function testLocaleSitemapGeneration(country: string, language: string) {
  try {
    console.log(`[testLocaleSitemapGeneration] Testing sitemap for ${country}-${language}`);
    
    const urls = await generateLocaleSpecificSitemapUrls(country, language);
    const xml = await generateLocaleSpecificSitemapXML(country, language);
    
    console.log(`[testLocaleSitemapGeneration] Generated ${urls.length} URLs for ${country}-${language}`);
    console.log(`[testLocaleSitemapGeneration] Sample URLs:`, urls.slice(0, 3));
    console.log(`[testLocaleSitemapGeneration] XML length: ${xml.length}`);
    
    return {
      success: true,
      country,
      language,
      urlCount: urls.length,
      sampleUrls: urls.slice(0, 5),
      xmlLength: xml.length,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error(`[testLocaleSitemapGeneration] Error for ${country}-${language}:`, error);
    return {
      success: false,
      country,
      language,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    };
  }
}

export async function testLocaleSitemapIndexGeneration() {
  try {
    console.log('[testLocaleSitemapIndexGeneration] Testing locale sitemap index generation');
    
    const combinations = await getAllCountryLanguageCombinations();
    const xml = await generateLocaleSitemapIndexXML();
    
    console.log(`[testLocaleSitemapIndexGeneration] Generated ${combinations.length} locale combinations`);
    console.log(`[testLocaleSitemapIndexGeneration] Sample combinations:`, combinations.slice(0, 5));
    console.log(`[testLocaleSitemapIndexGeneration] XML length: ${xml.length}`);
    
    return {
      success: true,
      combinationCount: combinations.length,
      sampleCombinations: combinations.slice(0, 5),
      xmlLength: xml.length,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('[testLocaleSitemapIndexGeneration] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    };
  }
}
