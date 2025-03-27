# Configuration Guide

## Environment Configuration

### Environment Variables

#### Development Environment

```env
# .env.development
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_WS_URL=ws://localhost:3000
NEXT_PUBLIC_GOOGLE_AI_KEY=your_development_key
NEXT_PUBLIC_AGORA_APP_ID=your_development_app_id
NEXT_PUBLIC_SENTRY_DSN=your_development_dsn
NEXT_PUBLIC_SMARTLOOK_KEY=your_development_key

# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=your_development_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_development_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_development_project
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_development_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_development_sender
NEXT_PUBLIC_FIREBASE_APP_ID=your_development_app_id

# Database
DATABASE_URL=your_development_database_url
```

#### Production Environment

```env
# .env.production
NEXT_PUBLIC_API_URL=https://api.trydos.com
NEXT_PUBLIC_WS_URL=wss://api.trydos.com
NEXT_PUBLIC_GOOGLE_AI_KEY=your_production_key
NEXT_PUBLIC_AGORA_APP_ID=your_production_app_id
NEXT_PUBLIC_SENTRY_DSN=your_production_dsn
NEXT_PUBLIC_SMARTLOOK_KEY=your_production_key

# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=your_production_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_production_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_production_project
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_production_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_production_sender
NEXT_PUBLIC_FIREBASE_APP_ID=your_production_app_id

# Database
DATABASE_URL=your_production_database_url
```

## Next.js Configuration

### Next.js Config

```javascript
// next.config.js
const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
});

module.exports = withBundleAnalyzer({
  poweredByHeader: false,
  compress: true,
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ["cdn.trydos.com"],
    formats: ["image/avif", "image/webp"],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
        ],
      },
    ];
  },
});
```

### TypeScript Configuration

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}
```

## Tailwind Configuration

### Tailwind Config

```javascript
// tailwind.config.js
module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#f0f9ff",
          100: "#e0f2fe",
          // ... other shades
          900: "#0c4a6e",
        },
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [require("@tailwindcss/forms"), require("@tailwindcss/typography")],
};
```

## ESLint Configuration

### ESLint Config

```javascript
// eslint.config.js
module.exports = {
  extends: [
    "next/core-web-vitals",
    "plugin:@typescript-eslint/recommended",
    "plugin:import/typescript",
  ],
  plugins: ["@typescript-eslint", "import"],
  rules: {
    "@typescript-eslint/no-unused-vars": ["error"],
    "@typescript-eslint/no-explicit-any": ["error"],
    "import/order": [
      "error",
      {
        groups: [
          "builtin",
          "external",
          "internal",
          "parent",
          "sibling",
          "index",
        ],
        "newlines-between": "always",
        alphabetize: { order: "asc" },
      },
    ],
  },
};
```

## Testing Configuration

### Cypress Configuration

```typescript
// cypress.config.ts
import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    baseUrl: "http://localhost:3000",
    supportFile: "cypress/support/e2e.ts",
    specPattern: "cypress/e2e/**/*.spec.ts",
    video: true,
    screenshotOnRunFailure: true,
  },
  component: {
    devServer: {
      framework: "next",
      bundler: "webpack",
    },
  },
});
```

### Jest Configuration

```javascript
// jest.config.js
module.exports = {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
};
```

## Firebase Configuration

### Firebase Config

```typescript
// firebase.config.ts
export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};
```

## Sentry Configuration

### Sentry Config

```typescript
// sentry.client.config.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
  integrations: [new Sentry.BrowserTracing(), new Sentry.Replay()],
});
```

## Vercel Configuration

### Vercel Config

```json
// vercel.json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/$1"
    }
  ]
}
```

## Git Configuration

### Git Ignore

```gitignore
# dependencies
/node_modules
/.pnp
.pnp.js

# testing
/coverage

# next.js
/.next/
/out/

# production
/build

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# local env files
.env*.local

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts
```

## VS Code Configuration

### VS Code Settings

```json
// .vscode/settings.json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,
  "tailwindCSS.experimental.classRegex": [],
  "tailwindCSS.includeLanguages": {
    "typescript": "typescript",
    "typescriptreact": "typescriptreact"
  }
}
```

## Security Configuration

### Security Headers

```typescript
// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
  );

  return response;
}

export const config = {
  matcher: "/:path*",
};
```

## Performance Configuration

### Performance Monitoring

```typescript
// performance.ts
export function reportWebVitals(metric: any) {
  if (metric.label === "web-vital") {
    console.log(metric);
    // Send to analytics
  }
}
```

### Cache Configuration

```typescript
// cache.config.ts
export const cacheConfig = {
  maxAge: 60 * 60 * 24 * 7, // 7 days
  staleWhileRevalidate: 60 * 60 * 24, // 1 day
};
```

## Internationalization Configuration

### i18n Config

```typescript
// i18n.config.ts
export const i18nConfig = {
  defaultLocale: "en",
  locales: ["en", "ar"],
  localeDetection: true,
};
```

### RTL Configuration

```typescript
// rtl.config.ts
export const rtlConfig = {
  supportedLocales: ["ar"],
  defaultDirection: "ltr",
};
```
