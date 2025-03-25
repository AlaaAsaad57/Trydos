# API Endpoints Documentation

## Base URLs

```env
NEXT_PUBLIC_BACKEND_URL         # Main backend services
NEXT_PUBLIC_OTP_BACKEND_URL     # OTP verification services
NEXT_PUBLIC_STORIES_BACKEND_URL # Stories management
NEXT_PUBLIC_ELASTIC_BACKEND_URL # Search and product services
NEXT_PUBLIC_CHAT_BACKEND_URL    # Chat services
```

## Chat Services

### Authentication

```text
POST /api/v1/login
  Body:
    - otp_id_token: string
    - mobile_phone: string
    - name: string
    - original_user_id: number

POST /api/v1/firebase_tokens
  Headers:
    - Authorization: Bearer USER-CHAT.access_token | DEVICE-TOKEN
  Body:
    - token: string
```

### Messaging

```text
POST /api/v1/messages/share_product
  Body:
    - receiver_ids: number[]
    - content: Product[]

POST /api/v2/elastic/channelSearch
  Body:
    - query: string
    - channel_id: number
    - limit: number
    - offset: number

GET /api/v1/messages
  Query:
    - channel_id: number
    - limit: number
    - offset: number
```

## Product Services

### Product Details

```text
GET /web/product/simpleDetails/${productId}
  Query:
    - color?: string
  Headers:
    - lang: string
    - country: string

GET /web/boutique/simpleDetails/${boutiqueId}
  Query:
    - lang: string
  Headers:
    - lang: string
    - country: string
```

### Product Search

```text
GET /api/products/search
  Query:
    - limit: number
    - boutique_slugs: string[]
    - categories: string[]
    - brands: string[]
    - prices: string[]
    - attributes: object
    - colors: string[]
    - searchText: string
    - lang: string
    - country: string
```

## Error Logging

```text
POST /mobile_error_log/store
  Body:
    - error_description: string
    - token: string
    - url: string
    - backend_url: string
```

## User Management

```text
POST /register_for_expire
  Body:
    - user_id: number

GET /stories
  Headers:
    - Authentication: Bearer STORIES-TOKEN
    - Authorization: Bearer STORIES-TOKEN
  Config:
    - tags: ["stories"]
    - revalidate: number
```

## Common Headers

```typescript
{
  Accept: "application/json",
  "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
  lang: string,
  country: string,
  Authorization: `Bearer ${token}`
}
```

## Chat Headers

```typescript
{
  Authorization: `Bearer ${USER-CHAT.access_token}`,
  lang: string,
  country: string
}
```

## Response Interfaces

### Chat Login Response

```typescript
interface ChatLoginResponse {
  data: {
    id: number;
    name: string;
    username: any;
    mobile_phone: string;
    photo_path: any;
    created_at: string;
    access_token: string;
    contact_user: any;
  };
}
```

### Product API Responses

```typescript
interface SimpleDetailsProductApi {
  // Product details response
}

interface FilterProductApi {
  data: {
    categories: any[];
    brands: any[];
    attributes: {
      name: string;
      options: any[];
    }[];
    prices: any;
    colors: any[];
    total_size: number;
    products: any[];
  };
}
```

### Message Search Response

```typescript
interface GetMessageSearchApi {
  data: {
    messages_ids: any[];
    offset: number;
  };
}
```

## Error Handling

```typescript
{
  retry: {
    attempts: 2,
    delay: 200, // ms
  },
  errorLogging: {
    endpoint: "/mobile_error_log/store",
    required_fields: ["error_description", "token", "url", "backend_url"]
  }
}
```

## Cache Configuration

```typescript
{
  tags: string[],
  revalidate: number // from process.env.NEXT_PUBLIC_REVALIDATE
}
```

## Authentication Tokens

```typescript
{
  "MARKET-TOKEN": string,
  "DEVICE-TOKEN": string,
  "USER-CHAT": {
    access_token: string,
    id: number,
    // other user data
  },
  "STORIES-TOKEN": string,
  "ID-TOKEN": string
}
```

## Local Storage Keys

```typescript
{
  "USER": string,        // User data
  "USER-CHAT": string,   // Chat user data
  "CHAT-TOKEN": string,  // Chat authentication
  "firebase_token": string,
  "firebase_id": string,
  "search-history": string[],
  "LAST_JSON": string   // When NEXT_PUBLIC_IS_STORE_LAST_JSON is true
}
```
