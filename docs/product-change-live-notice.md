# Product change notice — tell viewers that a product changed

Status: **design, not built yet.** Written 2026-10-21.

## The problem

The storefront keeps product data in Redis. When a product changes, the backend
deletes the product's Redis keys (see `docs/redis-cache-keys-backend-guide.md`).
A shopper who already has the product page open still sees the old data. We
want to tell that shopper: "This product has been updated."

Rules from the request:

- The backend must not take part. It keeps deleting keys, as it does today.
- The solution must not slow the site down under heavy load.
- Every viewer must get fresh data, edge cases included.

## Facts from the code

- The storefront never deletes product keys itself. So a delete on a
  `product-id-*` key always means "the backend changed this product"
  (`serverRequests/radis/index.ts`).
- A page view fills a deleted key again at once. So "the key is missing" lasts
  only a moment and cannot be the signal (`serverRequests/product.tsx`).
- Product keys live 120 s (`PRODUCT_REDIS_TTL_SECONDS`). A key that runs out of
  time sends an `expired` event, not `del`, so the two never mix.
- `/cart/add` sends no price. The backend prices the item itself, so a stale
  page cannot make a shopper pay an old price (`services/cart.ts`).
- The client router cache keeps a dynamic page for 30 s (`next.config.ts`).
- The CSP has no `connect-src` rule, so a WebSocket to a new host is allowed.

## What professional e-commerce sites do

Most big stores do **not** push product changes to an open product page. They
check again at the moment the shopper acts:

- **Amazon, Walmart, Best Buy.** Product pages are cached for a short time.
  Price and stock are read again on add-to-cart and again at checkout. The
  cart shows a clear line: "The price of this item changed from X to Y since
  you added it" or "This item is no longer available". No live banner.
- **Shopify stores.** The storefront is CDN cached. Checkout re-reads price and
  inventory from the source and shows a message if something changed.
- **Airlines and hotel booking.** A "the price changed" step appears before
  payment, not while the shopper browses.
- **Flash sales, auctions, live shopping** (Taobao Live, TikTok Shop, Whatnot).
  These do use WebSocket or SSE: live stock counters, price drops during a
  stream, countdowns. The push is scoped to the live session, not to every
  product page.

The common pattern: short cache, re-check when the shopper acts, say it clearly
in the cart or checkout, and use push only where seconds matter.

**What this means for us.** The version check (Part 5 below) is the part the
big stores do, and it works with no new server. Push (Parts 1–3) is the live
shopping upgrade. Build Part 5 first; add push when a live-session use case
needs it.

## The key idea: push is a fast hint, the version code is the truth

A pushed message can be lost: the phone sleeps, the network drops, a proxy
blocks WebSocket, our listener is down. So the design has two layers:

1. **Version code (the truth).** The page carries a short hash of the product
   data. At every important moment it asks "is my hash still current?".
2. **Push (the speed).** When the product changes, a message tells the open
   pages at once, so most shoppers see the notice in about 1–3 seconds.

## Chosen design: Centrifugo on our EC2 server

```
backend deletes product key ──▶ Redis ──"key deleted"──▶ listener (EC2)
                                                            │ "product 4821 changed"
                                                            ▼
shopper's browser ◀──── WebSocket ──── Centrifugo (EC2)
   │
   └─ banner: "This product has been updated  [Refresh]"
```

### Part 1 — Redis setting (ops)

`CONFIG SET notify-keyspace-events Eg`, and the same line in `redis.conf` so a
restart keeps it. Redis then publishes the key name on `__keyevent@0__:del`.
If Redis is a cluster, the listener must subscribe on every node.

### Part 2 — Centrifugo on EC2

One binary or Docker container. Anonymous connections allowed (guests view
products). One namespace, `product`, subscribe-only from the browser. Short
history on the channel so a reconnecting browser gets the message it missed.
API key for publishing. Allowed origins = storefront domains. Public TLS
address, for example `wss://realtime.trydos.com`. SSE fallback on. About
100–200 MB of memory for 10,000 viewers; raise the open-files limit.

### Part 3 — The listener (new worker on EC2, about 50 lines of Node)

1. Subscribe to Redis delete events; keep only `product-id-<id>-…` keys.
2. Delete the key **again after 1.5 s** (refill race, see edge cases), ignoring
   the events this second delete causes.
3. Send one message per product per few seconds (one change deletes many keys).
4. Publish `{ id }` to channel `product:<id>` through the Centrifugo API on
   `localhost`. No product data in the message.
5. Run it like the other workers, with a health alert.

### Part 4 — Product page (this repo)

A hook, `useProductUpdates(productId)`:

- Loads the `centrifuge` client with a dynamic import.
- Connects to `NEXT_PUBLIC_REALTIME_URL` (a role name, not a tool name) and
  subscribes to `product:<id>`.
- On a message: wait a random 0–3 s, then show the banner with a **Refresh**
  button that calls `router.refresh()`. The random wait stops thousands of
  viewers from refreshing in the same second.
- Disconnects when the tab is hidden; connects again when visible.
- Banner text goes into `translations.{ar,tr,ku}.js`.

### Part 5 — Version check (this repo)

- The page renders with a short hash of the fields a shopper cares about
  (price, stock, status, name, images, variants). Timing fields stay out.
- `GET /api/products/<id>/version?country=..&lang=..` returns `{ v }`. It
  reads through Redis like the page, with
  `Cache-Control: public, s-maxage=2, stale-while-revalidate=10`.
- The page checks: on mount, when the tab becomes visible, on `pageshow` with
  `persisted`, when the socket reconnects without recovery, just before
  add-to-cart and buy-now, and every 120 s while visible.
- On 429 / 5xx the page doubles its wait. One setting sets the interval; `0`
  turns polling off.

## Edge cases

| Case | What covers it |
|---|---|
| Tab in background, phone asleep, network drops | Reconnect + channel history, else version check on visible |
| Proxy blocks WebSocket | SSE fallback, else the 120 s check |
| Listener or Centrifugo down | 120 s check + health alert |
| Back button (bfcache or 30 s router cache) | Version check on `pageshow` and on mount |
| **Refill race**: a page view writes old data just after the backend's delete | Listener deletes again after 1.5 s, then publishes |
| Many viewers refresh at once | Random 0–3 s wait |
| Product removed or disabled | Refresh shows the "not available" page |
| Cart shows the old `offer_price` | Display only; the backend charges the current price. Cart notice is a later step |
| Listing and search cards are stale for seconds | Out of scope; Elasticsearch lags by design |
| Backend overwrites a key instead of deleting it | No `del` event; the version check still catches it. Confirm with the backend team |

## Other options we looked at

| Option | Missed messages | Cost model | Verdict |
|---|---|---|---|
| **Version check only** (polling + CDN) | Cannot miss | CDN requests grow with viewers | Good first step and backup; 2–12 s alone |
| **Centrifugo** (self-hosted) | Recovery from history | Our server only | **Chosen for push** |
| **Pusher Channels** | Lost, no history | Per connection and message | Weakest on edge cases |
| **Ably** | History + reconnect recovery | Per message and connection minute | Best managed choice |
| **Firebase Realtime Database** | Cannot miss (stores a value) | Per GB downloaded | Strong managed choice; large client library |
| **SSE from a Vercel function** | Lost | Every open connection is function time | Rejected |

All managed options still need our listener on EC2, because none can read our
Redis.

## Who does what

| Part | Who | Where |
|---|---|---|
| 1. Redis setting | ops | Redis server |
| 2. Centrifugo | ops / us | EC2 |
| 3. Listener | us | EC2 (new worker) |
| 4. Hook + banner + translations | us | this repo |
| 5. Version route + checks | us | this repo (`app/api/products/...`) |

Part 5 is the first `development` ticket in this repo. Part 4 is a second
ticket, after Parts 1–3 exist outside the repo.

## Test on staging

1. Open a product page, then run `DEL product-id-<id>-sy-en-global` in Redis.
   The banner should show in under 5 s.
2. Stop the listener, repeat. The banner should show within 120 s, or at once
   on tab focus.
3. Put the phone to sleep, change the product, wake it. The banner should show
   on wake.

## Open questions

1. Can ops set `notify-keyspace-events` on our Redis? One node or a cluster?
2. Does the backend always **delete** the keys, or does it ever overwrite them?
3. Do guests (gateway) and verified users (core) get the same product data? If
   not, the version route needs an `audience` part in its cache key.
