# PostHog — OTP abuse insight (repeat OTP senders)

_Goal: surface the senders that request an OTP more than once (same session, or within a time
window) so abusive IPs can be blocked at the **Vercel Firewall**._

Companion: `docs/posthog-events.md` (the event registry — see §5 for the server-side stream).

---

## TL;DR

| Insight | Identity | Backed by | Live now? | Link |
|---|---|---|---|---|
| **Repeat senders by session** | `session_id` + geoip | client `send_otp` / `resend_otp` | ✅ yes | [uud6msiQ](https://eu.posthog.com/project/200119/insights/uud6msiQ) |
| **Repeat senders by IP** | raw `ip` | server `otp_send_attempt` | ⛔ after deploy | [PvSqbafm](https://eu.posthog.com/project/200119/insights/PvSqbafm) |

- **A funnel cannot do this.** Funnels measure step conversion; they can't enumerate "this
  identity fired the event N times." Both insights are **SQL (HogQL)** insights — the only PostHog
  tool that can threshold per-entity (`HAVING count > 1`).
- **You cannot get raw IPs from client events.** Verified in-project: `properties.$ip` is `null`
  on every `send_otp` — PostHog geo-enriches at ingestion then discards the IP. Only `$geoip_*`
  survives. That's why the by-IP insight needs the server-side event.

---

## The behavior (what fires, when, where)

### Client events (`posthog-js`, production + browser only)

| Event | Fires | File | Carries IP? |
|---|---|---|---|
| `send_otp` | On the WhatsApp/SMS button tap, gated by `!loading && !blocked` (the client `otpLocks` guard). Fires on **click intent**, before the server result — so it includes attempts the server later rate-limit-blocks, but **not** attempts the client guard already blocks (button disabled). | `components/Login/Enhanced/FullEnhancedLoginWidget.tsx:247` (the fullscreen login/signup widget); `components/Login/Enhanced/usePhoneVerifyFlow.ts:140` (the shared flow behind the cart's `InlineVerifyPanel`, the re-auth widget, the session-expired prompt, and settings change-phone — all via `VerifyPhoneFlow`) | No (`$ip` discarded) |
| `resend_otp` | "Resend" tap on the PIN screen. Carries an `attempts` counter. | `components/Login/Enhanced/FullEnhancedLoginWidget.tsx:397`; `components/Login/Enhanced/usePhoneVerifyFlow.ts:173` | No (`$ip` discarded) |

> Counting repeat sends needs **both** events — `send_otp` (first send to a number / re-entry) and
> `resend_otp` (PIN-screen resends). `resend_otp` currently has no data (low traffic), but the
> queries include it so they're correct once it fires.

### Server flow (the authoritative path)

`AuthService.SendOtp` (`services/auth.ts`) → **`sendOtpAction`** (`serverActions/sendOtp.ts`) →
`otpRateLimit` Lua script in Redis (`serverRequests/radis/index.ts`). The limiter enforces:
per-IP cooldown (1 OTP / 60s), per-session cap (2 distinct numbers / hour), per-IP cap (4 sends /
hour). The raw IP is resolved in `resolveOtpIdentity()` (`utils/server/otpIdentity.ts`) but only a
**hashed, normalized** form is stored in Redis keys.

### The gap the client stream can't cover

1. **No raw IP** — discarded at ingestion (proven below).
2. **Server-side blocks are invisible** — the limiter rejects before any browser event reflects it.
3. **Scripted attacks are invisible** — hitting the `sendOtpAction` RSC endpoint directly (the
   "1000 random numbers" attack) fires no `posthog-js` event at all.

→ Closed by the server-side **`otp_send_attempt`** event (`utils/server/otpTelemetry.ts`), fired
from `sendOtpAction` for every outcome (`sent` / `blocked` / `failed`) with the **raw `ip`** as an
explicit property (explicit props are not subject to the ingestion IP-discard).

### The evidence (why `$ip` is unusable)

```
-- every send_otp has a null $ip, but geoip is populated and varied:
SELECT count() AS sends, uniqExact(properties.$ip) AS distinct_ips,
       uniqExact(properties.$geoip_city_name) AS distinct_cities
FROM events WHERE event = 'send_otp' AND timestamp > now() - INTERVAL 30 DAY
-- → sends=21, distinct_ips=0, distinct_cities=5  (Singapore, Tokyo, Antakya, Haarlem, NYC, …)
```

---

## Insight 1 — repeat senders by session (live today)

[https://eu.posthog.com/project/200119/insights/uud6msiQ](https://eu.posthog.com/project/200119/insights/uud6msiQ)

```sql
SELECT properties.session_id              AS session_id,
       properties.$geoip_city_name        AS city,
       properties.$geoip_country_name      AS country,
       count()                            AS otp_sends,
       min(timestamp)                     AS first_send,
       max(timestamp)                     AS last_send
FROM events
WHERE event IN ('send_otp','resend_otp')
  AND timestamp > now() - INTERVAL 7 DAY
GROUP BY session_id, city, country
HAVING otp_sends > 1
ORDER BY otp_sends DESC
LIMIT 100
```

**How to read it:** each row is a session that requested OTP more than once. `otp_sends` is the
repeat count; `city`/`country` are the geoip-derived location. Today this already surfaces a
Singapore session with **6** sends.

**Limits:** session ≠ IP. A determined attacker who clears cookies gets a fresh `session_id`, so
this under-counts cookie-cleared abuse — and it gives you geo, not an IP to block. For blocking,
use Insight 2.

---

## Insight 2 — repeat senders by IP (after deploy)

[https://eu.posthog.com/project/200119/insights/PvSqbafm](https://eu.posthog.com/project/200119/insights/PvSqbafm)

```sql
SELECT properties.ip                                  AS ip,
       count()                                        AS total_attempts,
       countIf(properties.outcome = 'blocked')        AS blocked,
       countIf(properties.outcome = 'sent')           AS sent,
       countIf(properties.outcome = 'failed')         AS failed,
       uniqExact(properties.normalized_ip)            AS norm_ips,
       uniqExact(distinct_id)                         AS sessions,
       max(timestamp)                                 AS last_seen
FROM events
WHERE event = 'otp_send_attempt'
  AND timestamp > now() - INTERVAL 7 DAY
GROUP BY ip
HAVING total_attempts > 1
ORDER BY blocked DESC, total_attempts DESC
LIMIT 100
```

**How to read it:** each row is a raw client IP. `blocked` (sends that hit the Redis limiter) is
the strongest abuse signal — sort by it. A high `sessions` count for one `ip` means the attacker is
churning sessions (cookie-clear) behind a single address — the exact case Insight 1 misses.

**This is empty until `otp_send_attempt` is deployed to production.** The event is production-only
(mirrors the client wrapper), so it won't appear on dev or until the deploy lands.

---

## Acting on it

1. Open Insight 2, sort by `blocked` (or `total_attempts`).
2. Copy the offending `ip` values.
3. Block them at the **Vercel Firewall** (dashboard) — abuse blocking runs at the edge, not in
   PostHog or app code (see `CLAUDE.md`).

**Optional alert:** add a PostHog Alert on Insight 2 to notify when any IP crosses a threshold so
you don't have to poll the table.

**Note — PII:** `otp_send_attempt.ip` is personal data, stored deliberately for abuse forensics.
Keep retention/access in mind; the hashed `normalized_ip` is what the rate limiter actually keys on.
