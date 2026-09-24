---
ticket: profile-closeout-scripted-and-live
kind: spike-evidence
blocker: BLK-RUNTIME-FACTS-01
status: partial
owner: developer
updated: 2026-08-25
---

# Spike — runtime facts for `BLK-RUNTIME-FACTS-01`

The plan was blocked because five review rounds each found its picture of the
app's own network calls incomplete, and that picture cannot be obtained by
reading. This file records what was **run**, what it showed, and what is still
unknown.

## Part 1 — the interception mechanism. **Run. Settled.**

Throwaway Playwright spec, Playwright **1.62.1**, Chromium. No server and no
staging: Playwright intercepts before the network, so every request was answered
by a handler. Nothing left the machine and no one-time code was spent.

Two `page.route` handlers on one pattern (standing in for `mockBackend` and
`mockBackendSequence`), plus one `context.route` handler (the closed-mode guard).
Both page handlers call `route.fallback()` when the key does not match.

```
Q1 matched key    -> fake     (the page-level fake answers)
Q1 unmatched key  -> guard    (falls through page.route to context.route)

Q2 sequence key   -> seq      order: seq, map, seq
Q2 map key        -> map      order: seq, map
Q2 neither key    -> guard    order: seq, map, guard
```

**What this proves**, in the order the chain runs:

1. The **last-registered** `page.route` handler is tried first. Registration
   order decides which page handler sees a request first, not which one wins.
2. `route.fallback()` from that handler reaches the **earlier** page handler. So
   `mockBackend` and `mockBackendSequence` **can be composed on one page** — the
   thing four review rounds recorded as impossible, and which `SCRIPT-10` needs.
3. `route.fallback()` then crosses **from a page handler down to a context
   handler**. This is the single behaviour the closed-mode guard (C-8) depends on,
   and it was asserted in three successive plan revisions without ever being run.
   It works.
4. A request no fake claims reaches the guard. The guard is genuinely last in the
   chain, so it sees exactly what the fakes did not.

**Corrections this forces to the plan:**

- The stated reason for precedence — "the guard is registered first, so the fakes
  win" — is **wrong**, even though the outcome is right. A `page.route` outranks a
  `context.route` by level, whatever the registration order. What makes the design
  work is that the guard is a **context** route; registration order only matters
  between the two page-level fakes.
- For `SCRIPT-10`, register the **map first and the sequence second**, so the
  sequence is tried first and falls back to the map. That is the order the run
  above used.

**One caveat found in the spike itself, worth keeping:** the first run passed the
composition test and failed the fallback test, because the probe strings were
`known` and `unknown` — and `"unknown".includes("known")` is true, so the
"unmatched" key matched. `mockBackend` matches `x-proxy-url` by **substring**, so
a key that is a substring of another key will silently claim its traffic. The map
keys for the three save legs must be chosen with that in mind.

## Part 2 — the app's own call set. **Read only. Not yet run.**

These came from reading during review, with line references, and are strong but
not complete. Completeness is the part that still needs a live capture.

- `/api/auth/update-user` is POSTed after **every** leg and after **every rollback
  leg** — `services/auth.ts:710, 743, 791, 819, 898, 927`. A guard that blocks
  writes inside `/api/auth/**` and names only `/api/auth/me` as an exception would
  fail every case whose save partly succeeds.
- **Mutating GETs exist**, so a plain allow-GET rule is unsafe:
  `app/api/auth/login/route.ts:67` (spends the one-time code, writes the whole
  cookie set), `services/auth.ts:281-289` (`verify_otp`, spends a code),
  `services/order.ts:729, 857, 943`, `services/chat.ts:55`.
- **All three legs can reach the renewal path**, not only the core one:
  `utils/fetchData.ts:353-361` (chat) and `:369-377` (stories) call
  `RefreshSession`, and the exchange is single-use
  (`utils/server/authRefresh.ts:83-98`).
- Same-origin writes outside `/api/proxy` and `/api/auth/**`: `/api/ticket`,
  `/api/fcm/settings`, `/api/subscribe`, `/api/seller/comments*`.

## What is still unknown

**The complete set of calls the profile save makes.** Reading found the ones
above; only a run can show what else fires. The cheap way to get it is a
**passive** `page.on("request")` recorder — no interception, no risk of changing
behaviour — attached to the existing green `PROF-02`, which already performs a
name save across all three legs. Cost: one full live run (build, start, one real
sign-in, roughly one one-time code).

Until that is run, the allow/deny policy in the plan is a best reading, not a
measured fact.
