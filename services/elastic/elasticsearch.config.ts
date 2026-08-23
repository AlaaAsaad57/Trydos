import { Client } from "@elastic/elasticsearch";
import { isWorkerRuntime } from "utils/runtime/platform";

const createElasticsearchClient = (): Client => {
  // During build time, ELASTICSEARCH_NODE might not be available
  // Provide a placeholder node to prevent "Missing node(s) option" error
  // The client won't actually be used during build, only at runtime
  const node = process.env.ELASTICSEARCH_NODE || "http://localhost:9200";

  return new Client({
    node,
    auth: {
      username: process.env.ELASTICSEARCH_USERNAME,
      password: process.env.ELASTICSEARCH_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false,
    },
    // Hard ceiling so a slow/hung ES query can't stall a blocking server
    // render. Generous for the navbar/listing queries we run.
    requestTimeout: 8000,
    // Cap client-side retries; the render path also has its own fallbacks.
    maxRetries: 2,
  });
};

/**
 * Build a client that is created on first use rather than at module load, and
 * that is never shared across requests on runtimes which forbid it.
 *
 * These two clients used to be constructed eagerly at import time and reused by
 * every request. On Node that is what you want -- one client, one connection
 * pool. The Cloudflare Workers runtime rejects it: an I/O object made during
 * one request may not be touched by another ("Cannot perform I/O on behalf of a
 * different request"), and module scope outlives a request.
 *
 * A Proxy keeps that decision here instead of at the ~30 call sites that do
 * `elasticSearchClient.search(...)`. Property access resolves a client first:
 * the cached one on Node, a fresh one per access on Workers. Nested namespaces
 * (`client.indices.exists`) keep working because after the first hop the caller
 * holds the real client's own object.
 *
 * Building eagerly also meant an unusable client during `next build` when
 * ELASTICSEARCH_NODE was unset; now nothing is built until something asks.
 */
const lazyClient = (): Client => {
  let cached: Client | null = null;

  const resolve = (): Client => {
    if (isWorkerRuntime()) return createElasticsearchClient();
    if (!cached) cached = createElasticsearchClient();
    return cached;
  };

  return new Proxy({} as Client, {
    get(_target, property) {
      const client = resolve();
      const value = Reflect.get(client as object, property, client);
      // Methods must keep their `this`, or the transport is lost.
      return typeof value === "function" ? value.bind(client) : value;
    },
  });
};

export const elasticSearchClient = lazyClient();

export const elasticSearchComment = lazyClient();
