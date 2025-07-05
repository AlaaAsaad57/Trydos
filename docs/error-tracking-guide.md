# Lightweight Error Tracking Guide

## Overview

This guide explains how to use our custom lightweight error tracking system that replaces the full Sentry client SDK with a minimal implementation. This approach significantly reduces bundle size while maintaining full error visibility in Sentry.

## Architecture

### Client-Side

- **Lightweight error reporter** (`utils/error-reporter.ts`): ~2KB utility that captures and batches errors
- **API endpoint** (`/api/report-error`): Receives error reports from the client
- **No Sentry SDK on client**: Zero Sentry code shipped to browsers

### Server-Side

- **Full Sentry SDK** (`@sentry/node`): Used only on the server to forward errors
- **Error enrichment**: Adds context, user info, and metadata before sending to Sentry

## Benefits

1. **Reduced Bundle Size**: Saves ~50-100KB by removing Sentry client SDK
2. **Better Performance**: Less JavaScript to parse and execute
3. **Full Error Tracking**: All errors still captured in Sentry with full context
4. **Privacy Control**: Error data flows through your server
5. **Batching**: Errors are batched to reduce API calls

## Usage Examples

### Basic Error Boundary

```tsx
import { ErrorBoundary } from "@/components/global/ErrorBoundary";

function MyPage() {
  return (
    <ErrorBoundary>
      <MyComponent />
    </ErrorBoundary>
  );
}
```

### With Custom Fallback

```tsx
<ErrorBoundary
  fallback={(error, reset) => (
    <div>
      <h2>Error: {error.message}</h2>
      <button onClick={reset}>Try Again</button>
    </div>
  )}
  context={{
    page: "checkout",
    userId: user.id,
  }}
>
  <CheckoutForm />
</ErrorBoundary>
```

### Manual Error Reporting

```tsx
import { reportError } from "@/utils/error-reporter";

try {
  await riskyOperation();
} catch (error) {
  reportError(error as Error, {
    action: "riskyOperation",
    userId: currentUser.id,
  });
}
```

### Using the Error Hook

```tsx
import { useErrorBoundary } from "@/components/global/ErrorBoundary";

function MyComponent() {
  const { error, resetError, captureError } = useErrorBoundary();

  async function handleClick() {
    try {
      await doSomethingRisky();
    } catch (err) {
      captureError(err as Error);
    }
  }

  if (error) {
    return <ErrorDisplay error={error} onReset={resetError} />;
  }

  return <button onClick={handleClick}>Do Something</button>;
}
```

## Server Component Errors

For server components, use Next.js error.tsx files. They've been updated to use our lightweight reporter automatically.

## API Reference

### reportError()

```typescript
function reportError(
  error: Error | ErrorEvent | string,
  context?: ErrorContext,
  componentStack?: string
): void;
```

### ErrorBoundary Props

```typescript
interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode | ((error: Error, reset: () => void) => ReactNode);
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  context?: Record<string, any>;
  showError?: boolean;
}
```

## Migration from Sentry

### Before

```tsx
import * as Sentry from "@sentry/nextjs";
Sentry.captureException(error);
```

### After

```tsx
import { reportError } from "@/utils/error-reporter";
reportError(error as Error);
```

## Best Practices

1. **Use Error Boundaries Strategically**: Wrap feature sections, not the entire app
2. **Add Meaningful Context**: Include user ID, page, action, etc.
3. **Handle Recovery**: Provide reset options in error UI
4. **Test Error Flows**: Verify errors reach Sentry correctly

## Troubleshooting

- **Errors not in Sentry?** Check `/api/report-error` responses in Network tab
- **Bundle still large?** Ensure no imports of `@sentry/nextjs` remain
- **Global errors not caught?** Verify `<ErrorReporterInit />` is in root layout
