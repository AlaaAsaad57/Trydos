import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";
import d1NextTagCache from "@opennextjs/cloudflare/overrides/tag-cache/d1-next-tag-cache";
import doQueue from "@opennextjs/cloudflare/overrides/queue/do-queue";

// Tell next.config.ts that this build targets a Worker, before the adapter
// spawns `next build` as a child process (which inherits this environment).
// Named for the target runtime, not the vendor -- see CLAUDE.md on naming.
process.env.WORKER_BUILD = "1";

/**
 * How this app caches when it runs as a Cloudflare Worker.
 *
 * On Vercel, ISR and `revalidateTag` need no configuration — the platform owns
 * the cache. A Worker owns nothing, so each piece has to be pointed at real
 * storage. All three below are required by what this app already does:
 *
 *   incrementalCache (R2)  — where rendered pages and fetch results are kept.
 *                            R2 rather than KV: KV is eventually consistent,
 *                            which OpenNext explicitly warns against for a
 *                            cache a shopper reads right after a write.
 *
 *   tagCache (D1)          — what `revalidateTag` needs to know which pages a
 *                            tag touches. `app/api/revalidate/route.ts` fires
 *                            about a dozen tag revalidations (stories, listing,
 *                            flash-deals, featured, countries, boutiques), so
 *                            without this that route silently does nothing.
 *
 *   queue (Durable Object) — runs time-based revalidation, i.e. anything with a
 *                            `revalidate` window rather than an explicit call.
 *
 * The matching bindings live in `wrangler.jsonc`; the names there are fixed by
 * OpenNext and must not be renamed.
 */
export default defineCloudflareConfig({
  incrementalCache: r2IncrementalCache,
  tagCache: d1NextTagCache,
  queue: doQueue,
});
