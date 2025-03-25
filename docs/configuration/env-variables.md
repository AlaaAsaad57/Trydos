# Environment Variables

## Development Environment

Key environment variables used in development:

```env
NEXT_PUBLIC_BACKEND_URL=https://market-under-dev-backend.trydos.dev/api/new_v1
NEXT_PUBLIC_OTP_BACKEND_URL=https://otp-staging.trydos.dev/api/new_v1
NEXT_PUBLIC_STORIES_BACKEND_URL=https://stories-staging.trydos.dev/stories/public
NEXT_PUBLIC_ELASTIC_BACKEND_URL=https://recomende-elasticsearch-engin.trydos.dev
NEXT_PUBLIC_CHAT_BACKEND_URL=https://chating-staging-trydos.trydos.dev
```

## Sentry Configuration

```env
NEXT_PUBLIC_DSN_SENTRY=your-sentry-dsn
SENTRY_AUTH_TOKEN=your-sentry-auth-token
```

## Feature Flags

```env
ENABLE_SENTRY=false  # Enable/disable Sentry integration
```

## Currency Configuration

```env
NEXT_PUBLIC_SY_CIEL=1000
NEXT_PUBLIC_LB_CIEL=10000
```