# Sitemap Implementation Guide

This document describes the comprehensive sitemap implementation for the Trydos frontend application, including generation, serving, and Cloudinary integration.

## Overview

The sitemap system consists of four main components:
1. **Sitemap Generation Service** (`services/elastic/sitemap.service.ts`) - Generates XML sitemaps from Elasticsearch data
2. **API Routes** (`app/sitemap-*.xml/route.ts`) - Serve sitemaps via HTTP endpoints
3. **Cloudinary Service** (`services/cloudinary/cloudinary.service.ts`) - Manages sitemap uploads to Cloudinary
4. **Sitemap Manager Service** (`services/sitemap-manager.service.ts`) - Orchestrates sitemap generation and Cloudinary operations

## Sitemap Types

### 1. Home Sitemap (`sitemap-home.xml`)
- **URL Pattern**: `/{country}-{language}/`
- **Data Source**: Elasticsearch `products_catalog` index
- **Query**: Aggregations on `countries_iso.iso` and `custom_products.language_code`
- **Priority**: 1.0
- **Change Frequency**: Daily

### 2. Products Sitemap (`sitemap-products.xml`)
- **URL Pattern**: `/{country}-{language}/products/{slug}`
- **Data Source**: Elasticsearch `products_catalog` index
- **Query**: Scroll search for products with `status: 1`
- **Priority**: 0.8
- **Change Frequency**: Weekly

### 3. Static Pages Sitemap (`sitemap-static.xml`)
- **URL Pattern**: `/{country}-{language}{path}`
- **Data Source**: Hardcoded static page configuration
- **Pages**: `/about`, `/contact`, `/privacy-policy`, `/terms-of-service`, `/help`
- **Priority**: 0.3-0.5
- **Change Frequency**: Monthly/Weekly

### 4. Search Terms Sitemap (`sitemap-search.xml`)
- **URL Pattern**: `/{country}-{language}/filters/search/{encodedTerm}`
- **Data Source**: Elasticsearch `search_logs` index
- **Query**: Aggregations on `search_term.keyword` with `results_count > 0`
- **Priority**: 0.5
- **Change Frequency**: Weekly

## Elasticsearch Queries

### Home Sitemap Query
```typescript
{
  index: "products_catalog",
  size: 0,
  aggs: {
    countries: {
      terms: {
        field: "countries_iso.iso",
        size: 50
      }
    },
    languages: {
      nested: {
        path: "custom_products"
      },
      aggs: {
        language_codes: {
          terms: {
            field: "custom_products.language_code",
            size: 10
          }
        }
      }
    }
  }
}
```

### Products Sitemap Query
```typescript
{
  index: "products_catalog",
  size: 1000,
  scroll: "5m",
  query: {
    bool: {
      must: [
        { term: { status: 1 } }
      ],
      must_not: [
        { exists: { field: "deleted_at" } }
      ]
    }
  },
  _source: ["custom_products.slug", "custom_products.language_code", "countries_iso.iso", "updated_at"]
}
```

### Search Terms Sitemap Query
```typescript
{
  index: "search_logs",
  size: 0,
  query: {
    range: {
      results_count: {
        gt: 0
      }
    }
  },
  aggs: {
    top_search_terms: {
      terms: {
        field: "search_term.keyword",
        size: 100,
        order: { "_count": "desc" }
      }
    }
  }
}
```

## Cloudinary Integration

### Configuration
The Cloudinary service requires the following environment variables:
- `CLOUDINARY_CLOUD_NAME` - Your Cloudinary cloud name
- `CLOUDINARY_API_KEY` - Your Cloudinary API key
- `CLOUDINARY_API_SECRET` - Your Cloudinary API secret

### Features
- **Upload Sitemaps**: Upload XML sitemaps directly to Cloudinary
- **Retrieve URLs**: Get public URLs for uploaded sitemaps
- **Delete Sitemaps**: Remove sitemaps from Cloudinary
- **List Sitemaps**: List all sitemaps in the sitemaps folder
- **Check Existence**: Verify if sitemaps exist
- **Get Metadata**: Retrieve sitemap information and metadata

### Sitemap Manager Service
The `SitemapManagerService` provides high-level operations:
- `generateAndUploadAllSitemaps()` - Generate and upload all sitemap types
- `generateAndUploadSitemap(type)` - Generate and upload a specific sitemap type
- `generateAndUploadSitemapIndex()` - Create and upload a sitemap index
- `getAllSitemapUrls()` - Get URLs for all uploaded sitemaps
- `deleteAllSitemaps()` - Remove all sitemaps from Cloudinary
- `checkSitemapStatus()` - Check existence of all sitemaps

## API Endpoints

### Sitemap Serving
- `GET /sitemap-home.xml` - Home sitemap
- `GET /sitemap-products.xml` - Products sitemap
- `GET /sitemap-static.xml` - Static pages sitemap
- `GET /sitemap-search.xml` - Search terms sitemap

### Testing Endpoints
- `GET /api-test/sitemap-test?type={type}` - Test sitemap generation
- `GET /api-test/cloudinary-test?action={action}` - Test Cloudinary operations

### Cloudinary Test Actions
- `status` - Check sitemap status and URLs
- `generate-all` - Generate and upload all sitemaps
- `generate-home` - Generate home sitemap only
- `generate-products` - Generate products sitemap only
- `generate-static` - Generate static pages sitemap only
- `generate-search` - Generate search terms sitemap only
- `generate-index` - Generate sitemap index only
- `list` - List all sitemaps in Cloudinary
- `info` - Get metadata for all sitemaps
- `delete-all` - Delete all sitemaps from Cloudinary

## Usage Examples

### Generate and Upload All Sitemaps
```typescript
import { sitemapManagerService } from './services/sitemap-manager.service';

const result = await sitemapManagerService.generateAndUploadAllSitemaps();
console.log(result);
```

### Check Sitemap Status
```typescript
const status = await sitemapManagerService.checkSitemapStatus();
const urls = await sitemapManagerService.getAllSitemapUrls();
```

### Test via API
```bash
# Check status
curl "http://localhost:3000/api-test/cloudinary-test?action=status"

# Generate all sitemaps
curl "http://localhost:3000/api-test/cloudinary-test?action=generate-all"

# Generate specific sitemap
curl "http://localhost:3000/api-test/cloudinary-test?action=generate-home"
```

## Error Handling

The system includes comprehensive error handling:
- **Elasticsearch Errors**: Fallback to default data if queries fail
- **Cloudinary Errors**: Detailed logging and graceful failure handling
- **Encoding Issues**: Proper handling of Unicode characters (Arabic, Turkish, etc.)
- **Network Errors**: Retry logic and timeout handling

## Performance Considerations

- **Scroll Search**: Used for large product datasets to avoid memory issues
- **Batch Processing**: Products are processed in batches of 1000
- **Caching**: Sitemaps can be cached and served from Cloudinary
- **CDN**: Cloudinary provides global CDN for fast sitemap delivery

## Monitoring and Logging

All services include comprehensive logging:
- `[getTopSearchTerms]` - Search terms processing
- `[CloudinaryService]` - Cloudinary operations
- `[SitemapManager]` - Sitemap management operations
- `[CloudinaryTest]` - Test endpoint operations

## Robots.txt Integration

The `robots.txt` file includes references to all sitemap endpoints:
```
Sitemap: https://trydos.vercel.app/sitemap-home.xml
Sitemap: https://trydos.vercel.app/sitemap-products.xml
Sitemap: https://trydos.vercel.app/sitemap-static.xml
Sitemap: https://trydos.vercel.app/sitemap-search.xml
```

## Future Enhancements

- **Scheduled Generation**: Automate sitemap generation on a schedule
- **Incremental Updates**: Only update changed content
- **Compression**: Gzip compression for large sitemaps
- **Analytics**: Track sitemap usage and performance
- **Validation**: XML schema validation for generated sitemaps
