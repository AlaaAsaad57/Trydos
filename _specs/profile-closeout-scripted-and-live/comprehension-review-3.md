---
ticket: profile-closeout-scripted-and-live
stage: review
attempt: 3
status: complete
owner: developer
updated: 2026-08-25
result: passed
score: 5/5
threshold: 1.0
decision: CHANGES_REQUESTED
missed:
evaluator:
  host: claude
  actor: owner
links:
  clickup:
  github:
---

# Comprehension — profile-closeout-scripted-and-live

> Gate record for the `review` stage, **round 3**. Rounds 1 and 2 were retired to
> `comprehension-review-1.md` and `comprehension-review-2.md` on entry
> (`rules/lifecycle-protocol.md` §G, E1), so this round earns `attempt: 3` —
> strictly greater than the highest retired attempt, as X5 requires.
>
> Five questions: floor 3, ceiling 5 (CG-1). One on the mandatory integration
> axis (CG-5). Nine `major` findings this round; the ceiling allows four seeded
> questions (CG-6), so the four largest blast radii were chosen. Every `major` is
> dispositioned in `review.md`.
>
> **New questions again (CG-7b).** Round 1 asked about the session lift, the
> scripted trace, `profileWrites.ts`, the run-cost floor and the media host's
> status. Round 2 asked about the `PROF-04` deletion, `AC-10`'s missing
> mechanism, `AC-4` after the owner's correction, the media host in the tree, and
> the run-wide worst case. Round 3 keeps the same five axes and asks about the
> `/api/auth/me` fake, the cross-origin media fake, the cookie mirror, the expire
> route, and wall-clock headroom.
>
> All findings were on disk in `review.md > Panel Findings` before the first
> question was asked (RP-4). Options are alphabetical.

## Review gate

| # | Question (from the artifact) | Source (plan §/AC-n/panel:lens) | Axis | Options (correct + distractors) | Owner's answer | Correct? |
|---|------------------------------|---------------------------------|------|---------------------------------|----------------|----------|
| 1 | The plan installs an `/api/auth/me` fake before navigation so `AC-2` can remove the chat record. What two faults did the panel find in that instruction? | `AC-2`; panel:senior + panel:performance (R4); `actions/auth.ts:583-602`, `services/home.ts:369,398` | **integration (CG-5)** | (a) **It blinds `signedInSession()`, which `handOnSession` gates on; and a body with no identity values makes `CheckLogin` register a fresh guest, replacing the real token** ✅ · (b) It cannot be installed before navigation, because `page.route` only attaches after the first document load · (c) It duplicates the chat read, so the chat leg is faked twice and the recorder double-counts · (d) It must be installed after navigation, matching every existing scripted case | (a) | Yes |
| 2 | `AC-3` fakes a refused upload on the media host. Why might that case go green without ever proving what it claims? | `AC-3`; panel:senior (R8); `services/auth.ts:957-965` | criterion ↔ mechanism | (a) **The media host is cross-origin, so a fulfilled response missing `access-control-allow-origin` makes the fetch throw and the case passes on a CORS error** ✅ · (b) The recorder cannot see cross-origin routes, so the used-key assertion never fires · (c) The upload is a Server Action, so `page.route` never sees it at all · (d) The upload never happens, because `GetTicket` fails first on every run | (a) | Yes |
| 3 | `AC-4` fakes the verify and all three proxied save legs. Which remaining side effect poisons the shared account for every later scripted case? | `AC-4`, C-3; panel:security + panel:senior (R1); `services/auth.ts:771-793`, `actions/mock.ts:120-129` | security / outward effect | (a) **The app writing the same values into its own cookies via `/api/auth/update-user`, which `mockBackend` passes through, after which `handOnSession` persists them** ✅ · (b) The core backend recording a refused save in its audit log · (c) The real one-time code being spent against the external limit · (d) The verify request reaching the market backend, because it is a Server Action | (a) | Yes |
| 4 | `AC-6` refuses both the save and the credential renewal. What did the panel find that actually drives? | `AC-6` (FR-6); panel:security (R2); `app/api/auth/expire/route.ts:17-70` | blast radius / shared state | (a) **`/api/auth/expire`, which runs a real `refreshMarketSession()` and a real guest registration before clearing every sub-service credential** ✅ · (b) Nothing real — both `/api/auth/refresh` and `/api/auth/expire` are already covered by the existing fakes · (c) Only a client-side store reset, so no backend is touched · (d) The wallet leg, which is switched off and therefore inert | (a) | Yes |
| 5 | The plan estimates 8-12 minutes for the new cases against a 30-minute `globalTimeout`. Why did the panel call that insufficient? | `AC-14`, NFR-4; panel:performance (R9); `playwright.config.ts:61` | cost / budget | (a) **It is a typical-case number, not headroom: the new cases' own timeouts sum to ~20-23 minutes, and the existing 54 cases' consumption is still unmeasured** ✅ · (b) It omits the build, which runs inside `globalTimeout` · (c) It uses `RECOV-01` as its basis, and that case is currently skipped · (d) The nightly and push runs must be added together | (a) | Yes |

- Score (optional, only if `comprehension_gates.ai_graded`): n/a
