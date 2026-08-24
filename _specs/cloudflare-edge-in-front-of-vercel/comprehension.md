---
ticket: "cloudflare-edge-in-front-of-vercel"
stage: assess
attempt: 1
status: complete
owner: developer
updated: "2026-08-24"
result: passed
score: 4/4
threshold: 1.0
decision: PASSED
missed:
evaluator:
  host: claude
  actor: owner
---

# Decision Comprehension & Knowledge Gate

> This front matter is the gate record (`rules/lifecycle-protocol.md` §G). The
> lifecycle does not reach `decide` unless `result: passed` and `score` meets
> `threshold`.

## Knowledge Gate Result

- **Stage:** `assess` — the human proves understanding **before** signing the
  decision, never after.
- **Threshold:** 100% — every answer correct (CG-4).
- **Result:** **4/4 — PASSED**, first attempt.
- **Axes evaluated:** `recommendation_rationale`, `hard_constraints`,
  `risk_failure_modes`, `tradeoff_analysis`.

**Note on attempt numbering.** No earlier gate record exists to retire (E1/E2).
A question set was drafted earlier the same day and **never answered** — the
owner rejected the framing at that point instead, which returned the work item to
`frame` twice (see `ticket.md` state history). The questions below were written
fresh against the current conclusion, which is the reverse of the one the
abandoned set described.

## Attempt History

| # | Question | Axis | Options | Owner's answer | Correct? |
|---|----------|------|---------|----------------|----------|
| 1 | Cloudflare in front saves $0.00 this month. What makes it the recommended direction anyway? | `recommendation_rationale` | Bandwidth becomes the bill / Cloudflare's WAF is stronger / It cuts the current invoice / Vercel recommends it | **Bandwidth becomes the bill** | **Yes** |
| 2 | One thing blocks adoption today. What is it? | `hard_constraints` | An untested request path / Cloudflare Pro's $20 fee / Losing the real client IP / The Vercel Firewall rules | **An untested request path** | **Yes** |
| 3 | Which risk is rated High severity specifically because the damage is done before anyone notices it? | `risk_failure_modes` | Enabling Cache Everything / Moving nameservers to Cloudflare / Setting s-maxage to 60 seconds / Tightening the proxy.ts matcher | **Enabling Cache Everything** | **Yes** |
| 4 | Why are Cloudflare-in-front and moving /api/proxy to a Worker described as complementary rather than as alternatives? | `tradeoff_analysis` | Both cache the same responses / Both need Cloudflare Pro / One kills bandwidth, one kills origin work / They are alternatives | **One kills bandwidth, one kills origin work** | **Yes** |

## What the answers show

Each answer had a plausible distractor drawn from something this research got
wrong at some point, so a right answer distinguishes the current conclusion from
a superseded one:

- **Q1** — "It cuts the current invoice" is what revision 1 of this research
  tested for and answered *no*, then recommended the status quo on that basis.
  Getting Q1 right means holding the corrected reading: the delivery lines bill
  $0.00 **at this traffic level only**, and the allowance is 1.22× away
  (`EV-29`).
- **Q2** — "Losing the real client IP" was the framing's own stated worry and is
  **false**: Vercel auto-recognises Cloudflare as a Verified Proxy on all plans
  via `CF-Connecting-IP` (`EV-14`, conflict `C-1`). "Cloudflare Pro's $20 fee" is
  the mis-pricing the advisory panel caught — the recommendation is Cloudflare
  **Free**. The real blocker is `OQ-7`, which is a test, not a decision.
- **Q3** — three of the four options are genuine risks recorded in
  `comparison.md` §4. Only the cache-leak is rated High **because a rollback
  cannot repair it**: the nameserver move is recoverable at DNS speed, a stale
  price corrects itself, a matcher change is one file.
- **Q4** — "They are alternatives" is how revisions 2 and 3 implicitly scored
  them, which is why `CAN-5b` sat parked. The complementary reading is the
  finding that came out of the owner's own challenge (`EV-36`, `AM-13`).

## Owner positions recorded during the gate

Stated in conversation, kept here because they bear on the `decide` stage and are
not otherwise captured in an artifact:

1. **The research was biased against Cloudflare.** Upheld for revision 1 — the
   advisory panel found the same and `framing.md` §7 records the corrections
   (`AM-01`..`AM-07`). Revisions 3 and 4 reversed the conclusion.
2. **Cloudflare in front is the right decision.** Consistent with the current
   recommendation. The decision itself is recorded at `decide`, not here.
3. **Caching will be enabled later, "even for 1 minute", and will help a lot.**
   Supported, and stronger than stated: a 60-second cache collapses a page's
   requests-per-minute into one origin hit, so its value scales with concurrency
   — near zero at ~20 customers, very large at 1 M DAU. It is also what
   **unlocks** the Cloudflare saving, since without cacheable responses
   Cloudflare can only cache static assets (`EV-10`). Caching alone does not
   reduce Fast Data Transfer; caching **behind** Cloudflare does, because the
   request never reaches Vercel. This makes `CAN-2` and `CAN-3-NOW` one plan
   rather than two candidates, and should be reflected when `CAN-2` is opened as
   its own work item.
