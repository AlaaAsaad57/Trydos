# TryDOS Documentation

## Table of Contents

1. [Getting Started](./getting-started/README.md)
2. [Architecture](./architecture/README.md)
3. [Features](./features/README.md)
4. [Development](./development/README.md)
5. [Testing](./testing/README.md)
6. [Deployment](./deployment/README.md)
7. [Configuration](./configuration/README.md)
8. [Performance](./performance/README.md)
9. [Services](./services/README.md)

## Project Overview

TryDOS is a modern e-commerce platform built with Next.js 14, TypeScript, and React. It provides a comprehensive shopping experience with advanced features for product discovery, purchasing, and user interaction.

### Tech Stack

- **Framework**: Next.js 14
- **Language**: TypeScript
- **UI Library**: React 18
- **Styling**: TailwindCSS
- **State Management**: Redux
- **Testing**: Cypress
- **Maps**: Leaflet
- **Charts**: ApexCharts
- **Real-time Communication**: Agora RTC
- **AI Integration**: Google Generative AI
- **Analytics**: Sentry
- **Monitoring**: Smartlook
- **Payment Processing**: Multiple payment gateways
- **Search Engine**: Elasticsearch

## Key Features

1. **E-commerce Core**

   - Product browsing and search
   - Advanced filtering by categories, brands, boutiques, price, color, and size
   - Shopping cart management
   - Multiple payment options (TryDOS Wallet, Cash on Delivery, Crypto, Credit Cards)
   - Order tracking and management

2. **Search Capabilities**

   - Text-based search
   - Image-based search using Google AI
   - Voice search with speech recognition
   - Advanced filtering system
   - Search by product attributes

3. **User Experience**

   - Real-time chat support
   - Push notifications via Firebase
   - Responsive design
   - Multi-language support
   - RTL support for Arabic

4. **Payment Options**

   - TryDOS Wallet integration
   - Cash on Delivery
   - Cryptocurrency payments
   - Credit/Debit card processing
   - Multiple payment gateways

5. **Additional Features**
   - Real-time notifications
   - User authentication
   - Order history
   - Wishlist management
   - Product reviews and ratings

## Project Structure

```
trydos/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── (client)/          # Client-side components
│   └── (special)/         # Special routes
├── components/            # Reusable components
│   ├── Cart/             # Shopping cart components
│   ├── Product/          # Product-related components
│   ├── Search/           # Search functionality
│   └── Payment/          # Payment processing
├── services/             # External service integrations
├── store/                # Redux store configuration
├── utils/                # Utility functions
├── types/                # TypeScript type definitions
├── models/               # Data models
├── public/               # Static assets
└── docs/                 # Documentation
```

## Getting Started

See [Getting Started Guide](./getting-started/README.md) for detailed setup instructions.

## Development

See [Development Guide](./development/README.md) for coding standards and practices.

## Testing

See [Testing Guide](./testing/README.md) for testing procedures and coverage requirements.

## Deployment

See [Deployment Guide](./deployment/README.md) for deployment procedures and environments.

## Configuration

See [Configuration Guide](./configuration/README.md) for environment variables and settings.

## Performance

See [Performance Guide](./performance/README.md) for optimization techniques and metrics.

## Services

See [Services Guide](./services/README.md) for external service integrations and APIs.

## Contributing

Please read our contributing guidelines before submitting pull requests.

## License

This project is private and proprietary.
