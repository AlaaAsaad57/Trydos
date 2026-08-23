/**
 * A monotonic clock that works on every runtime this app can be deployed to.
 *
 * The app used to call `process.hrtime.bigint()` directly in the request path.
 * That is a Node-only API: on the Cloudflare Workers runtime it is absent, so
 * the call throws at request time — not at build time — which is the worst
 * shape a failure can take. `performance.now()` is a web standard, present on
 * Node 16+ and on Workers, and is monotonic in both.
 *
 * Unit: milliseconds, as a float (sub-millisecond precision is preserved on
 * Node; Workers deliberately coarsens the value, which only affects the
 * resolution of the timing numbers we log, never correctness).
 *
 * Callers previously wrote `Number(end - start) / 1_000_000` to turn nanosecond
 * bigints into milliseconds. With `now()` the subtraction is already in
 * milliseconds, so that division must be dropped at every call site.
 */
export function now(): number {
  return performance.now();
}

/** Milliseconds elapsed since `start`, which must come from `now()`. */
export function since(start: number): number {
  return performance.now() - start;
}
