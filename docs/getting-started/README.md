# Getting Started with TryDOS

## Prerequisites

- Node.js >= 18.x
- npm >= 9.x
- Git

## Installation

1. Clone the repository:

```bash
git clone https://github.com/your-org/trydos.git
cd trydos
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
cp .env.example .env.development
cp .env.example .env.production
```

Edit the environment files with your configuration values.

## Development

1. Start the development server:

```bash
npm run dev
```

2. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run cypress` - Open Cypress test runner
- `npm test` - Run Cypress tests in headless mode
- `npm run start-all-test-with-coverage` - Run tests with coverage
- `npm run open-coverage` - Open coverage report

## Project Structure

### Key Directories

- `app/` - Next.js app directory with routes and pages
- `components/` - Reusable React components
- `services/` - External service integrations
- `store/` - Redux store configuration
- `utils/` - Utility functions
- `types/` - TypeScript type definitions
- `models/` - Data models
- `public/` - Static assets

### File Naming Conventions

- React components: PascalCase (e.g., `UserProfile.tsx`)
- Utility functions: camelCase (e.g., `formatDate.ts`)
- Type definitions: PascalCase with `.d.ts` extension
- Test files: Same name as source with `.test.ts` or `.spec.ts`

## Development Guidelines

### Code Style

- Use TypeScript for type safety
- Follow ESLint rules
- Use functional components with hooks
- Implement proper error handling
- Write unit tests for critical functionality

### Git Workflow

1. Create feature branch from `develop`
2. Make changes and commit with descriptive messages
3. Push changes and create pull request
4. Get code review and address feedback
5. Merge to `develop` after approval

### Environment Variables

Required environment variables:

```env
# API Keys
NEXT_PUBLIC_GOOGLE_AI_KEY=
NEXT_PUBLIC_AGORA_APP_ID=
NEXT_PUBLIC_SENTRY_DSN=
NEXT_PUBLIC_SMARTLOOK_KEY=

# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Other Services
NEXT_PUBLIC_API_URL=
NEXT_PUBLIC_WS_URL=
```

## Next Steps

1. Review the [Architecture Guide](../architecture/README.md)
2. Explore [Features](../features/README.md)
3. Learn about [Development Practices](../development/README.md)
4. Set up [Testing Environment](../testing/README.md)
