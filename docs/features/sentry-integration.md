# Sentry Integration

## Configuration

Sentry is integrated for error tracking and performance monitoring across different environments:

### Client Configuration
```javascript
init({
  dsn: process.env.NEXT_PUBLIC_DSN_SENTRY,
  integrations: [new Replay()],
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});
```

### Toggle Sentry

Sentry can be enabled/disabled using environment variables:
```env
ENABLE_SENTRY=false  # Development
ENABLE_SENTRY=true   # Production
```

## Source Maps

Source maps handling in `next.config.js`:
```javascript
const sentryWebpackPluginOptions = {
  org: "ramaaz-fm",
  project: "javascript-nextjs",
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: true,
  ignore: ["node_modules", ".next/cache"],
  sentry: {
    disableSourceMaps: true,
  },
};
```