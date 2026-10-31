# Sessions and tokens — read before you judge any 401

Moved out of `CLAUDE.md` so that it loads only when a task needs it.

**Lifetimes (staging, all services).** Access token: **60 seconds**. Refresh
token: **2 days**, **single-use** — every exchange rotates the pair, and the old
refresh token is dead the moment the backend answers. So any signed-in page
older than a minute meets a 401 on its next call. That is normal.

**One pair per service.** A 401 on one never means another is broken.

| Service | Cookies | On a 401 |
|---|---|---|
| market (core / gateway) | `MARKET-TOKEN` + `COOKIE_NAMES.MARKET_REFRESH_TOKEN` | exchange, then retry at once |
| chat | `CHAT-TOKEN` + its refresh cookie | exchange, wait 2 s, retry |
| stories | `STORIES-TOKEN` + its refresh cookie | exchange, wait 2 s, retry |
| comments | `USER_ID_HASH` + `COMMENTS-REFRESH-TOKEN` | exchange, wait 2 s, retry |
| wallet | `WALLET-TOKEN` (no refresh) | `need_auth` prompt |

`STALE_TOKENS_FOR` in `utils/fetchData.ts` keys the cleanup per service.

**The client path (`utils/fetchData.ts` → `services/auth.ts` `RefreshSession`).**
1. The call answers **401** (first attempt only, `authAttempt === 0`).
2. The client posts `/api/auth/refresh` `{url, server}`. The route exchanges on
   the server (`utils/server/authRefresh.ts`) — verified user → core, guest →
   gateway — and sets the new pair **on its own response** (`Set-Cookie`).
3. The same call is sent again. **That answer is the real one.**
4. Parallel 401s share one exchange. A 401 from a call sent **before** the
   last rotation retries with the stored pair and exchanges nothing
   (`sentAt`, commit `aa6cc51b`).

**When the market exchange is refused**, the retry gets 401 again →
`ExpiredUser` → `/api/auth/expire` (one last exchange) → `register-guest`.
**The shopper becomes a new guest, and every sub-service cookie is deleted.** A
verified shopper also gets the "please sign in again" prompt. Chat, stories and
comments fall through to the `need_auth` prompt instead.

**The server path (`HandleAuthedFetch`).** On a market 401 it exchanges
(`refreshMarketSession`, single-flight per refresh token) and retries. On a
refused exchange it returns the 401 — it does **not** make a guest. It
registers a guest only when there is **no** refresh cookie and the user is not
verified.

**The new pair is lost if the page leaves mid-exchange.** A `page.goto`, a
reload or a closed tab cancels the `/api/auth/refresh` answer. The backend has
already spent the old refresh token, the jar still holds it, and the next
exchange is refused → guest. `tests/e2e/harness/renewalGate.ts` exists for this.

**In practice:**
- Never treat the first 401 as a refused write. Judge the **first answer that is
  not a 401**, and say so when only 401s came (`watchCommentCall` in
  `tests/e2e/actions/productComments.ts`).
- A 401 in a log is not a bug. Read what followed it: `refresh-token 200` + a
  good retry is the normal path; `refresh-token 401` + `register-guest` is a
  lost session.
- `/api/proxy` sets `x-market-backend: gateway|core` — read it, never guess.
- A retry adds one round trip (plus 2 s for chat/stories/comments). That is not a
  slow backend.
