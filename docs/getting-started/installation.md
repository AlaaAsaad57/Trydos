# Installation

## Prerequisites

- Node.js 20.9.0 or later
- Yarn package manager

## Setup

1. Clone the repository:
```bash
git clone <repository-url>
```

2. Install dependencies:
```bash
yarn
```

3. Create a `.env.local` file based on `.env.development`:
```bash
cp .env.development .env.local
```

4. Start the development server:
```bash
yarn dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).