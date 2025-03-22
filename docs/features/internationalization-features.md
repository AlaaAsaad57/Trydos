# Internationalization Features

## Multi-language Support
- Dynamic language routing
- RTL support for Arabic
- Language-specific content
- Automatic language detection

## Multi-country Support
- Country-specific pricing
- Local currency support
- Regional shipping options
- Country-specific phone codes

### Country Configuration
```typescript
{
  id: number;
  iso: string;
  name: string;
  phonecode: number;
  flag_photo_path: string;
  isAccess: number;
  otp_by_whatsapp: number;
  otp_by_sms: number;
}
```

## Currency Handling
- Dynamic currency conversion
- Currency formatting
- Price ceiling configuration