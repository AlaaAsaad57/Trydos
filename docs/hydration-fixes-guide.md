# Hydration and Store Error Fixes Guide

## 🚨 Common Errors

### 1. "Cannot read properties of undefined (reading 'call')"

This happens when Zustand store methods are called before hydration is complete.

### 2. "useExternalStorage" errors

These occur due to server-client state mismatches in Next.js 14 App Router.

### 3. Hydration Mismatches

React warns about content differences between server and client rendering.

## 🛠️ Solutions Implemented

### 1. Enhanced Store with Hydration Support

```typescript
// store/index.ts - Now includes hydration tracking
export const useAppStore = create<AppState>()(
  devtools((set, get) => ({
    // ... existing state
    _hasHydrated: false,
    setHasHydrated: (hasHydrated: boolean) => {
      set({ _hasHydrated: hasHydrated });
    },
  }))
);
```

### 2. Safe Store Hooks

```typescript
// hooks/useSafeStore.ts
import { useSafeAppStore } from "hooks/useSafeStore";

function MyComponent() {
  const { storiesData, setStoryData } = useSafeAppStore();

  // Safe to use - won't cause hydration errors
  return <div>{storiesData.length} stories</div>;
}
```

### 3. Hydration Provider

```typescript
// components/global/HydrationProvider.tsx
import { HydrationProvider } from "components/global/HydrationProvider";

export default function Layout({ children }) {
  return <HydrationProvider>{children}</HydrationProvider>;
}
```

### 4. Fixed StoriesStoreInitializer

```typescript
// components/Home/Stories/StoriesStoreInitializer.tsx
import { useHydratedAppStore } from "components/global/HydrationProvider";

function StoriesStoreInitializer({ initialStories }) {
  const { setStoryData, storiesData, _hasHydrated } = useHydratedAppStore();

  useEffect(() => {
    // Only initialize after hydration
    if (_hasHydrated && !hasInitialized && initialStories?.length > 0) {
      setStoryData(initialStories);
      setHasInitialized(true);
    }
  }, [_hasHydrated, hasInitialized, initialStories]);

  return null;
}
```

## 📋 Migration Steps

### Step 1: Replace Direct Store Usage

**❌ Old (causes errors):**

```typescript
import { useAppStore } from "store";

function MyComponent() {
  const { storiesData, setStoryData } = useAppStore();
  // Can cause hydration errors
}
```

**✅ New (safe):**

```typescript
import { useSafeAppStore } from "hooks/useSafeStore";

function MyComponent() {
  const { storiesData, setStoryData } = useSafeAppStore();
  // Safe from hydration errors
}
```

### Step 2: Update Component Patterns

**❌ Old pattern:**

```typescript
useEffect(() => {
  if (initialData.length > 0) {
    setStoreData(initialData);
  }
}, [initialData]);
```

**✅ New pattern:**

```typescript
const isClient = useIsClient();

useEffect(() => {
  if (isClient && initialData.length > 0) {
    setStoreData(initialData);
  }
}, [isClient, initialData]);
```

### Step 3: Safe State Access

**❌ Old (risky):**

```typescript
const storiesData = useAppStore((state) => state.storiesData);
```

**✅ New (safe):**

```typescript
const storiesData = useSafeStoreValue(
  (state) => state.storiesData,
  [] // Safe default
);
```

## 🔧 Quick Fixes for Common Components

### Stories Components

```typescript
// Replace useAppStore with useSafeAppStore
import { useSafeAppStore } from "hooks/useSafeStore";

function StoriesComponent() {
  const { storiesData, setStoryData } = useSafeAppStore();
  // Now safe from hydration errors
}
```

### Login Components

```typescript
import { useSafeStoreValue } from "hooks/useSafeStore";

function LoginComponent() {
  const loginOpen = useSafeStoreValue(
    (state) => state.loginOpen,
    false // Safe default
  );
}
```

### Chat Components

```typescript
import { useSafeStoreActions } from "hooks/useSafeStore";

function ChatComponent() {
  const { setLoginOpen } = useSafeStoreActions();
  // Safe action calls
}
```

## 🚀 Best Practices

### 1. Always Use Safe Hooks

- `useSafeAppStore()` - For full store access
- `useSafeStoreValue()` - For specific values
- `useSafeStoreActions()` - For actions only
- `useIsClient()` - For client-side checks

### 2. Provide Safe Defaults

```typescript
// Always provide meaningful defaults
const storiesData = useSafeStoreValue(
  (state) => state.storiesData,
  [] // Empty array, not null
);

const loading = useSafeStoreValue(
  (state) => state.loading,
  false // Boolean default
);
```

### 3. Check Client State

```typescript
const isClient = useIsClient();

if (!isClient) {
  return <div>Loading...</div>; // Safe fallback
}

// Safe to use store values
```

### 4. Wrap with HydrationProvider

```typescript
// In your layout or root component
<HydrationProvider>
  <YourApp />
</HydrationProvider>
```

## 🐛 Debugging Tips

### 1. Check Hydration State

```typescript
const _hasHydrated = useAppStore((state) => state._hasHydrated);
console.log("Hydrated:", _hasHydrated);
```

### 2. Monitor Store State

```typescript
const store = useAppStore();
console.log("Store state:", store);
```

### 3. Use Error Boundaries

```typescript
import { ErrorBoundary } from "components/global/ErrorBoundary";

<ErrorBoundary>
  <ComponentThatMightError />
</ErrorBoundary>;
```

## ⚡ Performance Tips

### 1. Selective Store Updates

```typescript
// Only subscribe to what you need
const storiesData = useAppStore((state) => state.storiesData);
// Better than
const { storiesData } = useAppStore();
```

### 2. Memoize Selectors

```typescript
const selector = useCallback((state) => state.storiesData, []);
const storiesData = useSafeStoreValue(selector, []);
```

### 3. Avoid Frequent Re-renders

```typescript
// Use shallow comparison for objects
import { shallow } from "zustand/shallow";

const { storiesData, loading } = useAppStore(
  (state) => ({
    storiesData: state.storiesData,
    loading: state.loading,
  }),
  shallow
);
```

## 🔍 Testing

### 1. Test Hydration

```typescript
import { renderHook } from "@testing-library/react";
import { useSafeAppStore } from "hooks/useSafeStore";

test("should handle hydration safely", () => {
  const { result } = renderHook(() => useSafeAppStore());
  expect(result.current.storiesData).toEqual([]);
});
```

### 2. Test Error Scenarios

```typescript
test("should not throw on undefined store access", () => {
  expect(() => {
    const { result } = renderHook(() => useSafeAppStore());
    result.current.setStoryData([]);
  }).not.toThrow();
});
```

## 📊 Migration Checklist

- [ ] Replace all `useAppStore` with `useSafeAppStore`
- [ ] Add `HydrationProvider` to layout
- [ ] Update StoriesStoreInitializer
- [ ] Test all components for hydration errors
- [ ] Add error boundaries where needed
- [ ] Update tests to use safe hooks
- [ ] Monitor for remaining errors

## 🆘 Emergency Fixes

If you still see errors, try these quick fixes:

1. **Wrap component in client-only**:

```typescript
import dynamic from "next/dynamic";

const MyComponent = dynamic(() => import("./MyComponent"), {
  ssr: false,
});
```

2. **Add null checks**:

```typescript
const storiesData = useAppStore((state) => state.storiesData);
if (!storiesData) return <div>Loading...</div>;
```

3. **Use try-catch**:

```typescript
try {
  const { storiesData } = useAppStore();
} catch (error) {
  console.error("Store error:", error);
  // Handle gracefully
}
```

These solutions should eliminate all hydration and store-related errors in your application.
