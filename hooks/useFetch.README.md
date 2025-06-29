# useFetch Hook

A comprehensive React hook for making HTTP requests with built-in support for multiple server sources, automatic retries, token management, and caching.

## Features

- ✅ **Multiple Server Support**: Handles `chat`, `market`, and `stories` servers with automatic token retrieval
- ✅ **Automatic Retry Logic**: Retries failed network requests up to 3 times
- ✅ **401 Unauthorized Handling**: Automatically refreshes tokens and retries on authentication failures
- ✅ **In-Memory Caching**: Optional caching for identical requests
- ✅ **AbortController Integration**: Prevents memory leaks and handles component unmounting
- ✅ **TypeScript Support**: Full type safety with generics
- ✅ **Loading States**: Built-in loading, error, and data states
- ✅ **Manual Refetch**: Ability to manually trigger a new request

## Installation

The hook is located at `hooks/useFetch.ts`. Import it in your components:

```typescript
import { useFetch } from "@/hooks/useFetch";
```

## Basic Usage

```typescript
const { data, error, loading, refetch } = useFetch({
  url: "https://api.example.com/products",
  method: "GET",
  server: "market",
  useCached: true,
  reqTitle: "Fetch Products",
});
```

## Parameters

| Parameter   | Type                                              | Required | Default | Description                              |
| ----------- | ------------------------------------------------- | -------- | ------- | ---------------------------------------- |
| `url`       | `string`                                          | ✓        | -       | The API endpoint (relative or absolute)  |
| `method`    | `'GET' \| 'POST' \| 'PUT' \| 'DELETE' \| 'PATCH'` | ✓        | -       | HTTP method                              |
| `body`      | `object \| null`                                  | ✗        | `null`  | Request body for POST/PUT/PATCH requests |
| `useCached` | `boolean`                                         | ✗        | `false` | Whether to use cached results            |
| `reqTitle`  | `string`                                          | ✗        | -       | Optional label for logging               |
| `server`    | `'chat' \| 'market' \| 'stories'`                 | ✓        | -       | Server type for token retrieval          |

## Return Values

The hook returns an object with:

| Property  | Type            | Description                                |
| --------- | --------------- | ------------------------------------------ |
| `data`    | `T \| null`     | The response data (generic type)           |
| `error`   | `Error \| null` | Any error that occurred                    |
| `loading` | `boolean`       | Whether the request is in progress         |
| `refetch` | `() => void`    | Function to manually trigger a new request |

## Server-Specific Token Handling

The hook automatically retrieves the appropriate token based on the server:

- **Market**: Uses `MARKET-TOKEN` or `DEVICE-TOKEN` from localStorage
- **Chat**: Uses `access_token` from `USER-CHAT` in localStorage
- **Stories**: Uses `access_token` from `USER-STORIES` in localStorage

## Examples

### GET Request with Caching

```typescript
const ProductList = () => {
  const { data, error, loading, refetch } = useFetch<{ products: Product[] }>({
    url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/products`,
    method: "GET",
    server: "market",
    useCached: true,
    reqTitle: "Fetch Products",
  });

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {data?.products.map((product) => (
        <div key={product.id}>{product.name}</div>
      ))}
      <button onClick={refetch}>Refresh</button>
    </div>
  );
};
```

### POST Request

```typescript
const CreateProduct = () => {
  const [productData, setProductData] = useState({ name: '', price: 0 })

  const { data, error, loading } = useFetch({
    url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/products`,
    method: 'POST',
    body: productData,
    server: 'market',
    reqTitle: 'Create Product'
  })

  const handleSubmit = () => {
    // The hook will automatically make the request when body changes
  }

  if (data) {
    console.log('Product created:', data)
  }

  return (
    // Your form UI here
  )
}
```

### Conditional Fetching

```typescript
const ProductDetails = ({ productId }: { productId?: string }) => {
  const { data, error, loading } = useFetch({
    url: productId
      ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/products/${productId}`
      : "/dummy",
    method: "GET",
    server: "market",
    useCached: true,
  });

  if (!productId) return <div>Select a product</div>;
  // Rest of your component
};
```

## Error Handling

The hook handles several error scenarios:

1. **Network Errors**: Automatically retries up to 3 times with exponential backoff
2. **401 Unauthorized**: Server-specific handling:
   - **Market Server**: Calls `ExpiredUser()` to refresh the token, then retries automatically
   - **Chat/Stories Servers**: Shows phone verification widget, waits for user to verify, then retries if successful
3. **Other HTTP Errors**: Returns error object with status information
4. **Abort Errors**: Silently handled when component unmounts

### 401 Unauthorized Behavior

When a 401 error occurs:

- **Market API**: The hook automatically calls `ExpiredUser()` which requests a new token, then retries the request
- **Chat/Stories APIs**: A phone verification widget appears. If the user successfully verifies, the request is retried. If the user closes the widget, the page reloads

## Caching

When `useCached` is `true`:

- Results are stored in memory using request configuration as key
- Subsequent identical requests return cached data immediately
- Cache is cleared when calling `refetch()`
- Cache persists across component re-renders but not page refreshes

### Cache Management

```typescript
import { clearFetchCache, removeCacheEntry } from "@/hooks/useFetch";

// Clear all cached requests
clearFetchCache();

// Remove specific cache entry
removeCacheEntry({
  url: "/api/products",
  method: "GET",
  server: "market",
});
```

## Best Practices

1. **Use TypeScript Generics**: Always specify the expected response type for better type safety

   ```typescript
   const { data } = useFetch<ProductResponse>({ ... })
   ```

2. **Handle Loading States**: Always show appropriate UI during loading

   ```typescript
   if (loading) return <Skeleton />;
   ```

3. **Error Boundaries**: Consider wrapping components using this hook in error boundaries

4. **Conditional Requests**: For conditional fetching, change the URL or use a state trigger rather than conditional hook calls

5. **Cache Strategy**: Use caching for relatively static data, avoid for user-specific or frequently changing data

## Troubleshooting

### Token Not Found Errors

Ensure the user is authenticated and the appropriate token exists in localStorage before making requests.

### CORS Issues

For cross-origin requests, ensure your backend has proper CORS headers configured.

### Memory Leaks

The hook automatically handles cleanup using AbortController. Ensure you're not storing references to the returned data outside the component.

## Advanced Usage

### Custom Error Handling

```typescript
const MyComponent = () => {
  const { data, error } = useFetch({ ... })

  useEffect(() => {
    if (error) {
      if (error.message.includes('Network')) {
        // Handle network errors
      } else if (error.message.includes('401')) {
        // Handle unauthorized (though the hook handles this automatically)
      }
    }
  }, [error])
}
```

### Multiple Parallel Requests

```typescript
const Dashboard = () => {
  const products = useFetch({
    url: "/products",
    method: "GET",
    server: "market",
  });
  const orders = useFetch({ url: "/orders", method: "GET", server: "market" });
  const messages = useFetch({
    url: "/messages",
    method: "GET",
    server: "chat",
  });

  const loading = products.loading || orders.loading || messages.loading;

  if (loading) return <div>Loading dashboard...</div>;

  // Use all three datasets
};
```
