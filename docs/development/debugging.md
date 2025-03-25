# Debugging

## Development Tools

### Logging Configuration

Logging can be enabled/disabled via environment variables:
```env
NEXT_PUBLIC_ENABLE_LOG=false
```

### Next.js Logging

Configured in `next.config.js`:
```javascript
logging: {
  fetches: {
    hmrRefreshes: true,
    fullUrl: true
  }
}
```

### Sentry Debug Mode

```javascript
init({
  debug: false,
  tracesSampleRate: 1.0
});
```

## Browser DevTools

### Source Maps
Source maps are disabled in production but available in development:
```javascript
if (!dev) {
  config.devtool = false;
}
```

### Performance Monitoring

Web Vitals tracking:
```javascript
experimental: {
  webVitalsAttribution: ["CLS", "LCP", "FCP", "FID", "TTFB", "INP"]
}
```