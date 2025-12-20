# Testing Checklist for Web Worker Implementation

## Pre-Deployment Checks

### ✅ Build & Compilation

- [ ] Project builds successfully without errors
- [ ] No TypeScript compilation errors
- [ ] No ESLint warnings related to worker files
- [ ] Worker file is properly bundled by webpack/Next.js

```bash
npm run build
# Check for errors
```

### ✅ Functionality Tests

#### Basic Initialization

- [ ] Component renders immediately on page load
- [ ] No visible delay during hydration
- [ ] Console shows no worker initialization errors

#### Country Data

- [ ] Country popup appears when needed (gb-\*, changed-country, no-country params)
- [ ] Countries data loads correctly
- [ ] SessionStorage caching works (check DevTools → Application → Storage)
- [ ] Country selection updates correctly

#### Currency

- [ ] Currency data loads from worker
- [ ] Currency is set in app store correctly
- [ ] No duplicate currency API calls

#### Login/Authentication

- [ ] Login check completes successfully
- [ ] User data is loaded if logged in
- [ ] Smartlook identification works (production only)
- [ ] Auth sections render correctly

#### Notifications

- [ ] Notification permission modal appears when appropriate
- [ ] Allow/Dismiss actions work correctly
- [ ] Topics subscription works after permission granted

#### GA Events & Analytics

- [ ] Coupon GA events fire correctly
- [ ] Referral source is tracked properly
- [ ] Screen name and path are captured
- [ ] User ID is tracked when logged in

#### Cart & Stories

- [ ] Cart opens when `?cart` parameter present
- [ ] Stories container renders correctly
- [ ] Add to cart component works
- [ ] Product selection functions properly

#### URL Parameters

- [ ] `?cart` parameter triggers cart opening
- [ ] `?coupon` parameter is processed correctly
- [ ] `?selected` parameter is handled
- [ ] URL cleanup happens without breaking navigation
- [ ] `?changed-country` and `?no-country` work

#### Event Listeners

- [ ] Scroll events work (expand/normalize view)
- [ ] Popstate events handled correctly
- [ ] Browser back/forward navigation works
- [ ] Modal closing via history works

### ✅ Performance Tests

#### Hydration Performance

```javascript
// In browser console, run before page load:
performance.mark("hydration-start");

// After hydration:
performance.mark("hydration-end");
performance.measure("hydration", "hydration-start", "hydration-end");
console.log(performance.getEntriesByName("hydration"));
```

- [ ] Time to Interactive (TTI) < 300ms
- [ ] First Contentful Paint (FCP) < 1000ms
- [ ] Main thread blocking < 100ms
- [ ] Worker initialization < 50ms

#### Chrome DevTools Checks

1. Open DevTools → Performance
2. Start recording
3. Reload page
4. Stop after page is interactive
5. Check:
   - [ ] Main thread is mostly idle during hydration
   - [ ] Worker thread shows API call activity
   - [ ] No long tasks (>50ms) during hydration
   - [ ] Layout shifts are minimal

#### Network Performance

- [ ] API calls are made (check Network tab)
- [ ] No duplicate API requests
- [ ] Requests complete successfully
- [ ] Proper error handling for failed requests

### ✅ Browser Compatibility

Test in:

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] iOS Safari (mobile)
- [ ] Chrome Mobile (Android)

### ✅ Error Handling

#### Simulate Worker Failure

```typescript
// Temporarily break worker to test error handling
// Check that:
```

- [ ] Error callbacks are triggered
- [ ] Errors are logged to console
- [ ] App doesn't crash
- [ ] Graceful fallback behavior

#### Network Errors

- [ ] Offline mode handled gracefully
- [ ] API failures don't break the app
- [ ] Error messages are user-friendly

### ✅ Developer Experience

#### Code Quality

- [ ] TypeScript types are correct
- [ ] No `any` types where avoidable
- [ ] Code is well-commented
- [ ] Follows project conventions

#### Documentation

- [ ] README.md is clear and helpful
- [ ] Examples are working and accurate
- [ ] Quick reference is up-to-date
- [ ] Implementation summary is complete

### ✅ Edge Cases

- [ ] Rapid navigation doesn't cause race conditions
- [ ] Multiple tabs don't interfere with each other
- [ ] Worker cleanup happens properly on unmount
- [ ] Memory leaks are not present (use DevTools Memory profiler)
- [ ] Component re-mounts don't create duplicate workers

### ✅ Production Readiness

- [ ] Environment variables are set correctly
- [ ] Production build works
- [ ] Source maps are available for debugging
- [ ] No development-only code in production bundle
- [ ] Sentry/error tracking captures worker errors

## Performance Benchmarks

### Target Metrics

| Metric               | Before  | After  | Target  |
| -------------------- | ------- | ------ | ------- |
| TTI                  | ~1200ms | ~300ms | <500ms  |
| Main Thread Blocking | ~800ms  | ~50ms  | <100ms  |
| FCP                  | ~200ms  | ~200ms | <1000ms |
| Worker Init          | N/A     | ~30ms  | <50ms   |

### Measure Actual Performance

```javascript
// Copy-paste in browser console:
const metrics = performance.getEntriesByType("navigation")[0];
console.table({
  "DNS Lookup": metrics.domainLookupEnd - metrics.domainLookupStart,
  "TCP Connection": metrics.connectEnd - metrics.connectStart,
  "Request Time": metrics.responseStart - metrics.requestStart,
  "Response Time": metrics.responseEnd - metrics.responseStart,
  "DOM Processing": metrics.domInteractive - metrics.responseEnd,
  "DOM Complete": metrics.domComplete - metrics.domInteractive,
  "Load Complete": metrics.loadEventEnd - metrics.loadEventStart,
});
```

## Common Issues & Solutions

### Issue: Worker not initializing

**Solution**: Check webpack config supports worker imports with `new URL(..., import.meta.url)`

### Issue: State not updating

**Solution**: Verify callbacks are registered and worker.isReady is true

### Issue: Duplicate API calls

**Solution**: Check worker cache is working, verify useEffect dependencies

### Issue: TypeScript errors

**Solution**: Ensure types.ts is up-to-date with worker message types

### Issue: Performance not improved

**Solution**: Verify operations are actually in worker (check DevTools → Sources)

## Final Sign-Off

- [ ] All tests pass
- [ ] Performance targets met
- [ ] No console errors or warnings
- [ ] Code reviewed by team
- [ ] Documentation reviewed
- [ ] Ready for deployment

---

**Tested by**: ******\_******  
**Date**: ******\_******  
**Status**: ⬜ Pass / ⬜ Fail  
**Notes**: ******\_******
