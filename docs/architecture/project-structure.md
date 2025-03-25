# Project Structure

## Overview

The project follows a Next.js 13+ structure with App Router architecture:

```text
├── app/
│   ├── (client)/
│   │   └── [lang]/           # Language-based routing
│   │       ├── layout.tsx    # Root layout with translations
│   │       └── page.tsx      # Home page component
├── components/
│   ├── Home/                 # Home page components
│   ├── Server/               # Server components
│   └── global/              # Shared components
├── styles/                  # Global CSS files
├── public/                  # Static assets
└── store/                   # State management
```

## Key Directories

### App Directory
Contains the core application logic using Next.js App Router. The `(client)` directory handles client-side components with language-based routing.

### Components
Organized into three main categories:
- `Home/`: Components specific to the home page
- `Server/`: Server-side rendered components
- `global/`: Reusable components across the application