# Internationalization (i18n)

## Language Support

The application supports multiple languages through dynamic routing `[lang]`. Default languages:
- English (en)
- Arabic (ar)

## Implementation

### URL Structure
Languages are implemented in the URL path:
```text
/{lang}/path-to-page
Example: /en-US/products
```

### RTL Support
Arabic language support includes RTL layout:

```typescript
<body className={params.lang.split("-")[1] === "ar" ? "text-rtl" : ""}>
```

### Language Switching
The `TranslationsMenu` component handles language switching:
```typescript
<TranslationsMenu init={params.lang} />
```

## Default Configuration

```env
NEXT_PUBLIC_DEFAULT_LANGUAGE=en
NEXT_PUBLIC_DEFAULT_COUNTRY=tr
```