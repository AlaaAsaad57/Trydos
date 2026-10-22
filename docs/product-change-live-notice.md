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

| Fact | Where |
|---|---|
| The storefront never deletes product keys. `removeRedis` has no caller; the only other `del` is the OTP cleanup (`otp:*`). So a delete on a `product-id-*` key always means "the backend changed this product". | `serverRequests/radis/index.ts` lines 89, 291 |
| A page view fills a deleted key again at once. So "the key is missing" lasts only a moment and cannot be the signal. | `serverRequests/product.tsx` lines 185–189, 247–251 |
| Product keys live 120 s (`PRODUCT_REDIS_TTL_SECONDS`), meta keys 3600 s. A key that runs out of time sends an `expired` event, not `del`, so the two never mix. | `serverRequests/radis/index.ts` `RedisSet` |
| `/cart/add` sends no price. The backend prices the item itself, so a stale page cannot make a shopper pay an old price. The cart in the browser stores `offer_price` for display only. | `services/cart.ts` lines 35–45, 72 |
| The client router cache keeps a dynamic page for 30 s. Going back to a product inside the app can show the old page. | `next.config.ts` line 266 |
| The CSP has no `connect-src` rule, so the browser may open a WebSocket to a new host. `next.config.ts` needs no change. | `next.config.ts` line 132 |
| Firebase Realtime Database is already used by chat. | `utils/firebaseInitv1.tsx`, `services/chat.ts` |

## The key idea: push is a fast hint, the version code is the truth

A pushed message can be lost: the phone sleeps, the network drops, a proxy
blocks WebSocket, our listener is down. **No push service promises that every
message arrives.** So the design has two layers:

1. **Version code (the truth).** The page carries a short code built from the
   product data. At every important moment the page asks "is my code still
   current?". A lost message cannot break this check.
2. **Push (the speed).** When the product changes, a message tells the open
   pages at once, so most shoppers see the notice in about 1–3 seconds.

## Chosen design: Centrifugo on our EC2 server

```
backend deletes product key ──▶ Redis ──"a key was deleted"──▶ listener (EC2)
                                                                  │ "product 4821 changed"
                                                                  ▼
shopper's browser ◀──── WebSocket ──── Centrifugo (EC2)
   │
   └─ shows banner: "This product has been updated  [Refresh]"
```

### Part 1 — Redis setting (ops)

```
CONFIG SET notify-keyspace-events Eg
```

Put the same line in `redis.conf` too, or a Redis restart turns it off. Redis
then publishes the key name on `__keyevent@0__:del` and `__keyevent@0__:unlink`.
Do not turn on `x` (expired) — we do not need it.

The `g` class also sends an `expire` event on every `SET … EX` (every cache
fill). The listener drops those. The cost is one tiny message per cache fill.

If Redis runs as a **cluster**, each node sends only its own events, so the
listener must subscribe on every node.

### Part 2 — Centrifugo on EC2

One program, run with Docker or as a single binary, next to the other workers.

- **Anonymous connections allowed** — guests view products too.
- **One namespace, `product`.** Browsers may only subscribe. Publishing from
  the browser stays off.
- **History on the namespace** (`history_size: 1`, `history_ttl: 300s`,
  `force_recovery: true`). After a short disconnect, the browser gets the
  message it missed. If recovery is not possible, the browser is told so, and
  it runs the version check.
- **API key** — only the listener may publish.
- **Allowed origins** — the storefront domains only.
- **Public address with TLS**, for example `wss://realtime.trydos.com`, behind
  the existing nginx or load balancer, port 443.
- **Fallback transports** (SSE / HTTP-streaming) on, for networks that block
  WebSocket.

Size: a few KB of memory per connection — about 100–200 MB for 10,000 viewers.
Raise the open-files limit (`ulimit -n`) to about 65,000; each socket is one
open file.

### Part 3 — The listener (new worker on EC2, about 50 lines of Node)

1. Subscribe to Redis delete events.
2. Keep only `product-id-<id>-<country>-<lang>-global` and `-qtyPrices`; read
   the product id from the key name.
3. **Delete again after 1.5 s** (see edge case 7 below), then publish.
   Ignore the delete events that this second delete causes, or the listener
   loops.
4. Send **one** message per product per few seconds — one change deletes many
   keys (4 languages × N countries × 2 parts).
5. Publish `{ id: 4821 }` to channel `product:4821` through the Centrifugo API
   on `localhost`. No product data in the message.
6. Run it like the other workers (pm2 or systemd), with a health alert.

### Part 4 — Product page (this repo)

A hook, `useProductUpdates(productId)`:

- Loads the `centrifuge` client with a dynamic import, so the first page load
  stays small.
- Connects to `NEXT_PUBLIC_REALTIME_URL` (a role name, not a tool name — see the
  stack-agnostic naming rule) and subscribes to `product:<id>`.
- On a message: wait a random 0–3 s, then show the banner with a **Refresh**
  button that calls `router.refresh()`. The random wait stops 5,000 viewers
  from refreshing in the same second and sending all those renders to the
  backend together.
- Disconnects when the tab is hidden; connects again when it is visible.
- Banner text goes into `translations.{ar,tr,ku}.js`.

### Part 5 — Version check (this repo)

- The page renders with a short hash of the fields a shopper cares about (price,
  stock, status, name, images, variants). The timing fields
  (`globalFromRedis`, `globalDataTime`) stay out of the hash.
- A route `GET /api/products/<id>/version?country=..&lang=..` returns
  `{ v: "<hash>" }`. It reads through Redis, like the page does. It sends
  `Cache-Control: public, s-maxage=2, stale-while-revalidate=10`, so the CDN
  answers most checks.
- The page runs the check:
  - when the tab becomes visible again,
  - when the socket reconnects and Centrifugo says it could not recover,
  - on `pageshow` with `persisted = true` (the back button showed a saved page),
  - when the component mounts (covers the 30 s router cache),
  - just before add-to-cart and buy-now,
  - every 120 s while the tab is visible, as a last backup.
- On a failed check (429 / 5xx) the page doubles its wait time. One setting
  sets the interval; `0` turns polling off.

## Edge cases

| # | Case | What covers it |
|---|---|---|
| 1 | Tab in background, phone asleep — the socket is closed | On visible: Centrifugo recovery, else version check |
| 2 | Network drops, Wi-Fi to 4G | Reconnect + recovery from channel history |
| 3 | A proxy or firewall blocks WebSocket | SSE / HTTP-streaming fallback; else the 120 s check |
| 4 | Listener or Centrifugo is down | 120 s check + health alert on the listener |
| 5 | Back button shows a page from the browser's back/forward cache | `pageshow` + `persisted` → version check |
| 6 | Back inside the app shows the router-cached page (30 s) | Version check on mount |
| 7 | **Refill race.** A page view asked the backend for data just before the change, and writes the **old** data into Redis just after the backend deleted the key. The refresh then shows old data again, for up to 120 s. | The listener deletes the key a second time after 1.5 s, and only then publishes |
| 8 | Many viewers refresh at once | Random 0–3 s wait before the banner |
| 9 | Product removed or disabled | Refresh shows the "not available" page |
| 10 | Cart in the browser shows the old `offer_price` | Display only — `/cart/add` sends no price, so the backend charges the current price. Cart page notice is a later step. |
| 11 | Listing and search cards show the old price for some seconds | Out of scope — those read Elasticsearch, which lags by design |
| 12 | Redis restarts and loses the setting | Setting saved in `redis.conf` |
| 13 | The backend changes a product by **overwriting** a key instead of deleting it | No `del` event. The version check still catches it. Confirm with the backend team that they always delete. |
| 14 | A phone with no network at all | Nothing can reach it. The check runs on its next action, and the backend prices the cart anyway. |

## Other options we looked at

| Option | Speed | Missed messages | Who runs it | Cost model | Verdict |
|---|---|---|---|---|---|
| **Version check only** (polling + CDN) | 2–12 s | Cannot miss | Vercel only | CDN requests grow with viewers | Good backup, too slow alone |
| **Centrifugo** (self-hosted) | ~1 s | Recovery from history | Our EC2 | Our server only, no per-message fee | **Chosen** |
| **Pusher Channels** | ~1 s | Lost — no message history | Managed | Billed on peak connections and messages; a message counts once per subscriber who gets it | Works, but weakest on edge cases, and the bill grows with viewers |
| **Ably** | ~1 s | History, rewind, about 2 min connection recovery | Managed | Billed on messages and connection minutes | Best managed choice if we do not want a server |
| **Firebase Realtime Database** | ~1 s | Cannot miss — it stores a **value**, not a message. A reconnecting client reads the current value. | Managed (already in the app for chat) | Billed on GB downloaded; about 200,000 connections per database | Strong managed choice; client library is large, load it late |
| **SSE from a Vercel function** | ~1 s | Lost | Vercel | Every open connection is billed function time | Rejected — cost grows with viewers |

All managed options still need our listener on EC2, because none of them can
read our Redis.

## Who does what

| Part | Who | Where |
|---|---|---|
| 1. Redis setting | ops | Redis server |
| 2. Centrifugo | ops / us | EC2 |
| 3. Listener | us | EC2 (new worker) |
| 4. Hook + banner + translations | us | this repo |
| 5. Version route + checks | us | this repo (`app/api/products/...`) |

Parts 4 and 5 are one `development` ticket in this repo. Parts 1–3 live outside
the repo.

## Test on staging

1. Open a product page.
2. Run `DEL product-id-<id>-sy-en-global` in Redis.
3. The banner should show in under 5 s (1.5 s second delete + under 1 s message
   + 0–3 s random wait).
4. Stop the listener, repeat. The banner should show within 120 s, or at once on
   tab focus.
5. Put the phone to sleep, change the product, wake it. The banner should show
   on wake.

## Open questions

1. Can ops set `notify-keyspace-events` on our Redis? Is it one node or a
   cluster?
2. Does the backend always **delete** the keys, or does it ever overwrite them?
3. Do guests (gateway) and verified users (core) get the same product data? If
   not, the version route needs an `audience` part in its cache key.
