import { cache } from "react";

/**
 * Per-request memoization store.
 *
 * `cache(() => new Map())` returns the SAME Map for the duration of one server
 * render pass, and a fresh one on the next request. That gives us a request-
 * scoped place to stash in-flight promises so identical work runs only once.
 *
 * Why we need it: the listing/product routes render their content twice in a
 * single request — once as the real page (`children` slot) and once as the
 * intercepting `@modal` slot (see components/ModalRoute/ModalSlot). On a hard
 * load the modal copy is discarded on the client, but its server render still
 * executed. For calls that go through `fetch()`, Next's automatic request
 * memoization already collapses the duplicate. For calls that hit the
 * Elasticsearch client directly (and open a PIT snapshot) it does NOT — so the
 * duplicate query runs and a second, unused PIT is opened and leaked. This
 * helper collapses those to a single execution per request.
 */
const requestMemo = cache(() => new Map<string, Promise<unknown>>());

export function dedupeRequest<T>(
  key: string,
  run: () => Promise<T>,
): Promise<T> {
  const store = requestMemo();
  const existing = store.get(key) as Promise<T> | undefined;
  if (existing) return existing;
  const promise = run();
  store.set(key, promise);
  return promise;
}
