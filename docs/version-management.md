# Version Management System

This document explains how the version management system works in the TryDos application.

## Overview

The version management system automatically checks if the application version has changed and clears all client-side storage when a version mismatch is detected. This ensures that users always have a clean state when the application is updated.

## How It Works

1. **Version Environment Variable**: The system reads the current version from `NEXT_PUBLIC_APP_VERSION` environment variable
2. **Version Cookie**: The current version is stored in a cookie named `APP_VERSION`
3. **Version Check**: On each page load, the system compares the environment version with the stored version
4. **Storage Clearing**: If versions don't match, all localStorage, sessionStorage, and non-essential cookies are cleared
5. **Page Reload**: The page is automatically reloaded to ensure a clean state

## Environment Setup

Add the version environment variable to your `.env.local` file:

```bash
NEXT_PUBLIC_APP_VERSION=1.0.0
```

## Usage

### Automatic Version Checking

The version check is automatically performed on every page load through the `VersionChecker` component in the main layout.

### Manual Version Check

You can manually trigger a version check in any component:

```typescript
import { checkAndUpdateVersion } from "utils/version-manager";

// Check version manually
checkAndUpdateVersion();
```

### Using the Hook

You can use the version check hook in any component:

```typescript
import { useVersionCheck } from "hooks";

const MyComponent = () => {
  useVersionCheck(); // Runs version check on mount

  return <div>My Component</div>;
};
```

### Force Version Update

For development or testing purposes, you can force a version update:

```typescript
import { forceVersionUpdate } from "utils/version-manager";

// Force version update (clears storage and reloads page)
forceVersionUpdate();
```

### Get Version Information

For debugging purposes, you can get version information:

```typescript
import { getVersionInfo } from "utils/version-manager";

const versionInfo = getVersionInfo();
console.log(versionInfo);
// Output: { currentVersion: "1.0.0", storedVersion: "0.9.0", needsUpdate: true }
```

## Storage Clearing

When a version update is detected, the following storage is cleared:

- **localStorage**: Completely cleared
- **sessionStorage**: Completely cleared
- **Cookies**: All cookies except essential ones:
  - `APP_VERSION` (version cookie)
  - `country` (country setting)
  - `lang` (language setting)

## Essential Cookies Preserved

The following cookies are preserved during version updates:

- `APP_VERSION`: The version cookie itself
- `country`: User's country preference
- `lang`: User's language preference

## Configuration

### Cookie Options

The version cookie is set with the following options:

- **maxAge**: 1 year (365 days)
- **path**: "/" (available site-wide)
- **secure**: true in production, false in development
- **sameSite**: "strict"

### Environment Variables

- `NEXT_PUBLIC_APP_VERSION`: The current application version (defaults to "1.0.0")

## Best Practices

1. **Version Format**: Use semantic versioning (e.g., "1.0.0", "1.1.0")
2. **Environment Variables**: Always set `NEXT_PUBLIC_APP_VERSION` in your deployment environment
3. **Testing**: Test version updates in development by changing the environment variable
4. **Monitoring**: Monitor console logs for version update events

## Troubleshooting

### Version Not Updating

1. Check that `NEXT_PUBLIC_APP_VERSION` is set correctly
2. Verify the environment variable is accessible on the client side
3. Check browser console for any errors

### Storage Not Clearing

1. Ensure the code is running on the client side
2. Check browser console for errors
3. Verify that cookies are not httpOnly

### Page Not Reloading

1. Check if `window.location.reload()` is being called
2. Verify there are no JavaScript errors preventing execution
3. Check browser console for any blocked reload attempts
