# Notifications System

## Firebase Integration

### Available Notification Types
1. Product Availability
2. Product Comments
3. Product Discounts
4. Category Creation
5. Boutique Creation
6. Cart Expiration
7. Stock Alerts

### Topic Subscriptions
Users can subscribe to various notification topics:
- `product_availability_{product_id}`
- `product_comment_{product_id}`
- `product_discount_{product_id}`
- `category_created`
- `boutique_created`
- `product_before_stock_out_{product_id}`

### Configuration
```typescript
{
  enable_Firebase_Messaging: boolean;
  enable_crashylitcs: boolean;
  show_notifications: boolean;
}
```

## Push Notifications
- Device token registration
- Topic-based notifications
- Language-specific notifications
- Country-specific notifications