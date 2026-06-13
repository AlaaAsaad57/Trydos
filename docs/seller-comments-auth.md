# Seller Dashboard — Comments & Reviews Authentication

> **Scope:** how the seller dashboard comments/reviews tab authenticates a user,
> decides what they're allowed to do, and stops one shop from reading or mutating
> another shop's comment data — now that there is **no dedicated comments backend**.

**Files that matter:**

| File | Role |
|---|---|
| `services/elastic/sellerComments.ts` | The real security boundary (`"use server"` actions, the un-skippable guard) |
| `services/sellerDashboard/commentPermissions.ts` | Permission string constants |
| `services/sellerDashboard/comments.ts` | Thin wrapper class over the server actions |
| `components/SellerDashboard/CommentsTab.tsx` | UI — gating here is cosmetic only |
| `app/(client)/[lang]/sellerProfile/sellerDashboard/[sellerId]/page.tsx` | Feeds the UI permission flags |
| `serverRequests/HandleAuthedFetch.ts` | Bridges the auth token to the Go backend |
| `serverRequests/radis/index.ts` | Redis: permission cache + `fixedWindowRateLimit` |
| `services/elastic/elasticsearch.config.ts` | Elasticsearch client (server-only credentials) |

---

## Implementation status (what was hardened)

The recommendations from the original review have been applied, **except the ES TLS
change**, which was intentionally left out, and the **audit-field change**, which was
declined.

| # | Recommendation | Status | Where |
|---|---|---|---|
| 1 | Make the gate un-skippable | ✅ Done | `withSellerCommentAccess` HOF wraps every action |
| 2 | Cache the permissions lookup | ✅ Done | React `cache` + short-TTL Redis (`getVerifiedShops`) |
| 3 | Fix ES TLS (`rejectUnauthorized: false`) | ⛔ Intentionally not done | — |
| 4 | Rate-limit the actions | ✅ Done | `fixedWindowRateLimit`, per shop+session |
| 5 | Confirm/sanitize `seller_reply` render path | ✅ Done | Render path verified safe + `sanitizeReply` on write |
| 6 | Add `seller_user_id` audit field | ⛔ Declined | Not added by request |
| 7 | Plan for Go downtime | ✅ Done | Stale Redis fallback in `getVerifiedShops` |

**New environment variables** (all optional, sensible defaults shown):

| Variable | Default | Purpose |
|---|---|---|
| `SELLER_COMMENTS_PERMS_TTL` | `30` | Fresh permission-cache TTL (seconds) |
| `SELLER_COMMENTS_PERMS_STALE_TTL` | `3600` | Stale fallback copy TTL, used only during a Go outage |
| `SELLER_COMMENTS_READ_LIMIT` / `_READ_WINDOW` | `60` / `60` | Read rate limit (requests / seconds) |
| `SELLER_COMMENTS_WRITE_LIMIT` / `_WRITE_WINDOW` | `20` / `60` | Reply/edit/delete rate limit |

---

## Framing: what "no backend" actually means

It's worth being precise, because the phrase oversells it:

- There **is** still a backend. The **Go market backend** remains the source of truth
  for *who owns which shop and with what permission* (`GET /shop/auth/permissions`).
- What was removed is the **dedicated comments microservice**. The dashboard now talks
  **directly to Elasticsearch** (`comments_develop` index).
- So the "backend" for comments is now the **Next.js server actions** on Vercel. That
  code *is* the security boundary. If it has a gap, there is no second service behind
  it to catch the mistake — which is exactly why the gate is now enforced *by
  construction* (see recommendation #1 below) rather than by convention.

Keep that in mind: **the server action is the only wall.**

---

## How it works, end to end

The diagram below traces a single reply from the browser all the way to
Elasticsearch and back, including the permission cache and rate-limit gate that were
added. Read it top to bottom.

```mermaid
sequenceDiagram
    autonumber

    participant U as Browser<br/>(CommentsTab.tsx)
    participant SA as Server Action<br/>(withSellerCommentAccess)
    participant RL as Redis<br/>(cache + rate limit)
    participant GO as Go Market Backend
    participant ES as Elasticsearch<br/>(comments_develop)

    Note over U: User clicks "Reply". sellerId + commentId<br/>come from the browser = UNTRUSTED input.

    U->>SA: replyToComment({ sellerId: 42, commentId: 99, replyText })

    rect rgb(31, 58, 37)
        Note over SA,GO: STEP 1 — Resolve & verify identity (cached)
        SA->>SA: hash auth token (cache / limit key)
        SA->>RL: GET seller:perms:&lt;hash&gt;

        alt Fresh cache hit
            RL-->>SA: shops[] (no Go hop)
        else Cache miss
            SA->>GO: GET /shop/auth/permissions<br/>(HttpOnly MARKET-TOKEN)
            alt Go reachable
                GO-->>SA: shops[] + permissions[]
                SA->>RL: SET fresh (30s) + stale (1h)
            else Go DOWN
                SA->>RL: GET seller:perms:stale:&lt;hash&gt;
                RL-->>SA: stale shops[] (degraded, not dead)
            end
        end

        SA->>SA: is shop 42 in my list? has REPLY_COMMENT / SUPER_ADMIN?
    end

    rect rgb(58, 31, 31)
        Note over SA,U: STEP 2 — Fail closed, then rate limit
        alt Not a member, OR permission missing, OR no perms at all
            SA-->>U: { success: false, "Not authorized" }
        end
        SA->>RL: INCR seller:cmt:rl:write:42:&lt;hash&gt;
        alt Over the write limit
            RL-->>SA: blocked
            SA-->>U: { success: false, "Too many requests" }
        end
    end

    rect rgb(31, 42, 58)
        Note over SA,ES: STEP 3 — Sanitize + enforce ownership at the data layer
        SA->>SA: sanitizeReply() — strip HTML/control chars, cap length
        SA->>SA: ownerFilter(42) from the VERIFIED id, never client input
        SA->>ES: update_by_query<br/>WHERE comment_id = 99<br/>AND owner_id = 42<br/>AND owner_type = "seller"

        alt Comment is not owned by shop 42
            ES-->>SA: { updated: 0 }
            SA-->>U: { success: false, "not found or not permitted" }
        else Comment belongs to shop 42
            ES-->>SA: { updated: 1 }
            SA-->>U: { success: true }
        end
    end

    Note over U,ES: A forged sellerId fails STEP 1.<br/>A forged commentId survives to STEP 3<br/>but matches zero documents (updated: 0).
```

---

## The checks (run on every read and write)

1. **Un-skippable gate** — every exported action is produced by
   `withSellerCommentAccess(...)`. The handler body only runs after verification and
   receives the *verified* shop, never raw client input. There is no other code path
   to the Elasticsearch helpers, so a new action cannot accidentally forget the check.
2. **Identity** — resolved from the **HttpOnly `MARKET-TOKEN`** cookie. The browser
   cannot read or fake it. The permission lookup is **cached** (React `cache` per
   request + short-TTL Redis), so a burst of actions does not hammer Go.
3. **Ownership** — the client-supplied `sellerId` is accepted *only if* the verified
   permission list contains a shop with that `seller_id`. A forged `sellerId` matches
   nobody.
4. **Permission** — the specific action string (`READ_COMMENTS`, `REPLY_COMMENT`,
   `EDIT_REPLY`, `DELETE_REPLY`), or a `SUPER_ADMIN` bypass.
5. **Rate limit** — per verified shop + session, looser for reads, stricter for
   writes. Fails open if Redis is down (the permission check is still the real wall).

Ownership is then enforced **a second time at the data layer**: `ownerFilter()`
(`owner_id == verifiedShopId` and `owner_type == "seller"`) is part of every
Elasticsearch query and `update_by_query`. Even past the gate, you physically cannot
match another shop's documents — a wrong `commentId` simply returns `updated: 0`.

---

## How seller data is protected

| Layer | What it does | Strength |
|---|---|---|
| ES credentials in server-only env (`ELASTICSEARCH_*`) | Browser can never reach the index directly | **Strong** — real isolation |
| Access only via the `withSellerCommentAccess` guard | No ES helper is reachable without verification | **Strong** — now enforced by construction, not convention |
| Go permission check (cached) | Decides ownership + role; cached to cut load | **Strong** — short TTL trade-off documented |
| Stale fallback during Go outage | Comments keep working briefly if Go blips | **Medium** — degraded but available |
| `ownerFilter` on every query | Scopes data to the verified shop | **Strong** — forged ids return 0 rows |
| Per shop+session rate limit | Throttles reply spam / endpoint hammering | **Medium** — fails open by design |
| `sanitizeReply` on write | Stored reply can never contain markup | **Strong** — defense-in-depth |
| Fail-closed on any non-2xx | 401 / 403 / timeout → denied | **Strong** — correct default |
| UI permission flags | Hide buttons in the dashboard | **None** — cosmetic, re-checked server-side (by design) |

The thing actually protecting the data is not "no backend" — it's that **ES
credentials never leave the server and every action re-verifies against Go.**

---

## Pros, cons, and recommendations

### Pros

| Pro | Why it holds up |
|---|---|
| ES credentials are server-only | Browser cannot touch the index. A real boundary, not theater. |
| Gate is un-skippable by construction | New actions must go through `withSellerCommentAccess`; no bypass path exists. |
| Ownership re-verified server-side | Client `sellerId` is only a hint; Go is the source of truth. |
| Permission lookup cached | Avoids a Go round-trip per action; a burst no longer hammers the backend. |
| Survives a Go blip | Stale cache fallback keeps the tab usable during a short outage. |
| Double enforcement via `ownerFilter` | Even past the gate, a wrong `commentId` returns `updated: 0`. |
| Rate-limited writes | Reply/edit/delete spam and endpoint hammering are throttled. |
| Reply sanitized on write | No markup can be stored; render path also verified to escape. |
| Fails closed | Any non-2xx, guest token, or timeout results in "Not authorized". |
| UI flags are honestly cosmetic | Code states they are UX-only and re-enforced server-side. |

### Cons / risks (current state)

| Con | Severity | Status |
|---|---|---|
| `rejectUnauthorized: false` on ES TLS | **Medium** | **Open — intentionally not changed.** Certificate validation is still disabled in `elasticsearch.config.ts`. Acceptable only because ES is reachable over a trusted private network; revisit if that changes. |
| Cached permissions can lag a revocation | **Low** | New trade-off introduced by caching. A permission revoked on Go is honoured after the fresh TTL (default 30s), and up to the stale TTL (default 1h) during a Go outage. Tune via env; acceptable for a low-risk comment surface. |
| No audit of *which user* replied/deleted | **Low** | **Declined.** `seller_user_id` stamping was intentionally not added. `seller_name` + timestamps are still recorded. |
| Same index read publicly without owner filter | **Low (by design)** | `comments_develop` is read on the public product page with no `owner_id` scope — correct for public reviews. The index is not secret; protection is logical. Never store private fields on these docs. |
| `refresh: true` on every write | **Low** | Forces an ES refresh per reply/delete. Fine at current volume; revisit under heavy load. |
| Rate limiter fails open | **Low (by design)** | If Redis is down, throttling is skipped so legitimate sellers aren't locked out. The permission check still gates every action. |

### Recommendations recap

1. **Make the gate un-skippable.** — ✅ Implemented via `withSellerCommentAccess`.
2. **Cache the permissions lookup.** — ✅ Implemented (React `cache` + Redis TTL).
3. **Fix ES TLS.** — ⛔ Intentionally not done. Still relies on a trusted private
   network; document loudly and revisit if ES ever becomes reachable over open links.
4. **Rate-limit the actions.** — ✅ Implemented (`fixedWindowRateLimit`).
5. **Confirm/sanitize the render path.** — ✅ Render path verified to escape
   (`{seller_reply}` JSX text + `innerText`, no `dangerouslySetInnerHTML`) and
   `sanitizeReply` now strips markup on write.
6. **Add `seller_user_id` audit field.** — ⛔ Declined by request.
7. **Plan for Go downtime.** — ✅ Implemented via the stale-cache fallback.

---

## Summary

The design was already solid: Elasticsearch credentials never reach the browser,
ownership is verified twice (against Go and again in the query filter), and the system
fails closed. The hardening pass closed the two structural gaps from the original
review — the security boundary is now **enforced by construction** (`withSellerCommentAccess`)
rather than by convention, and the **Go dependency is cached** with a stale fallback so
it is neither a latency tax on every click nor a single point of failure during a brief
outage. Rate limiting and write-time sanitization were added as defense-in-depth. The
one knowingly accepted residual risk is the disabled ES TLS verification, which is left
to a trusted private network by choice, and the audit-field addition was declined.
