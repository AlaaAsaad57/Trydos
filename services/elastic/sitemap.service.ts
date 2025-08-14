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
                field: "countries_iso.iso",
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
                field: "custom_products.language_code",
                size: 20, // Should be enough for languages
              },
            },
          },
        },
      },
    };

    const response: SearchResponse = await elasticSearchClient.search(searchQuery);
    const aggregations = response.aggregations as any;

    // Extract countries
    const countryBuckets = aggregations?.countries?.country_codes?.buckets || [];
    const countries = countryBuckets.map((bucket: any) => bucket.key.toLowerCase());

    // Extract languages
    const languageBuckets = aggregations?.languages?.language_codes?.buckets || [];
    const languages = languageBuckets.map((bucket: any) => bucket.key.toLowerCase());

    // Filter to only include supported languages
    const supportedLanguages = ["en", "ar", "tr", "ku"];
    const filteredLanguages = languages.filter((lang: string) => 
      supportedLanguages.includes(lang)
    );

    // If no languages found in ES, use the supported languages
    const finalLanguages = filteredLanguages.length > 0 ? filteredLanguages : supportedLanguages;

    return {
      countries: countries,
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
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://trydos.vercel.app";
  const locales = await getHomeSitemapLocales();
  const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

  const sitemapUrls: SitemapUrl[] = [];

  // Generate URLs for all country-language combinations
  for (const country of locales.countries) {
    for (const language of locales.languages) {
      const url = `${baseUrl}/${country}-${language}/`;
      
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
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://trydos.vercel.app";
  const products = await getProductsForSitemap();
  const sitemapUrls: SitemapUrl[] = [];

  for (const product of products) {
    // Skip products without valid slug
    if (!product.slug || product.slug.trim() === "") {
      continue;
    }

    // Determine country for URL (use product.country_iso or fallback to 'global')
    const country = product.country_iso && product.country_iso !== 'global' 
      ? product.country_iso.toLowerCase() 
      : 'tr'; // Default fallback

    // Generate URL: {baseUrl}/{country}-{language}/products/{slug}
    const url = `${baseUrl}/${country}-${product.language_code}/products/${product.slug}`;
    
    // Parse lastmod date
    const lastmod = product.updated_at 
      ? new Date(product.updated_at).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0];

    sitemapUrls.push({
      loc: url,
      lastmod: lastmod,
      changefreq: "weekly", // Products change less frequently than home
      priority: 0.8, // Slightly lower priority than home
    });
  }

  return sitemapUrls;
}

/**
 * Get static pages configuration (following PHP pattern)
 */
function getStaticPages(): StaticPage[] {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://trydos.vercel.app";
  
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
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://trydos.vercel.app";
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
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://trydos.vercel.app";
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
