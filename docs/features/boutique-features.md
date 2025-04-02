# Boutique Features

## Boutique Management
- Boutique creation
- Boutique categories
- Boutique products
- Boutique banners

### Boutique Structure
```typescript
{
  id: number;
  name: string;
  slug: string;
  banner: {
    file_path: string;
    original_width: string;
    original_height: string;
  };
}
```

## Category Management
- Main categories
- Sub-categories
- Category navigation
- Category filters

## Product Listing
- Grid view
- List view
- Sorting options
- Pagination
- Lazy loading