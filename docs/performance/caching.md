# Caching Strategy

## Next.js Cache Configuration

### Page Caching

Cache headers are configured in `next.config.js`:

```javascript
async headers() {
  return [
    {
      source: "/:lang",
      headers: [
        {
          key: "Cache-Control",
          value: "s-maxage=36000, stale-while-revalidate=36000"
        }
      ]
    }
  ];
}
```

### Image Optimization

```javascript
images: {
  domains: [
    "res.cloudinary.com",
    "eu.ui-avatars.com",
    "trydos.s3.ap-south-1.amazonaws.com"
  ],
  minimumCacheTTL: 300
}
```

## Revalidation Settings

Configured through environment variables:
```env
NEXT_PUBLIC_REVALIDATE=60
NEXT_PUBLIC_REVALIDATE_CATEGORIES=60
NEXT_PUBLIC_REVALIDATE_BOUTIQUES=60
NEXT_PUBLIC_REVALIDATE_LISTING=60
NEXT_PUBLIC_REVALIDATE_PRODUCT_DETAILS=60
NEXT_PUBLIC_REVALIDATE_COUNTRIES=3600
```