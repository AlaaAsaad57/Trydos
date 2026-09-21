---
ticket: e2e-product-comments-and-reactions
stage: verify
mode: standard
status: complete
owner: developer
updated: 2026-09-21
result: PASSED
links:
  clickup:
  github:
---

# Verify — e2e-product-comments-and-reactions

> Read-only. No implementation file was edited here and no commit was created
> (`VF-7` / `VF-10`).

## Outcome

**`passed`.** All 26 acceptance criteria are satisfied. The browser journey runs
green end to end against real staging, and the validation profile is clean.

This is the **second** verification. The first recorded `failed` and sent the
work item back to `implement`; what it found is kept below, because the value of
that round was finding six defects that no amount of reading would have caught.

## The evidence

```
npx tsx tests/e2e/cli.ts run --lane=account --skip-build --grep "CMT-|QA seed"

  ✓ QA seed @prod-safe                                            (1.5m)
  ✓ CMT-01 likes the product and asks from both places           (29.3s)
  ✓ CMT-02 both questions edited and liked, edits survive reload  (9.1s)
  ✓ CMT-03 the seller finds the card and sees the like            (7.1s)
  ✓ CMT-04 the seller answers both questions                      (8.3s)
  ✓ CMT-05 both answers reach the shopper, who likes them         (4.5s)
  ✓ CMT-06 a reload keeps every question, edit, answer and like   (3.5s)
  ✓ CMT-07 every like is removed, and a reload keeps them off     (6.5s)
  ✓ CMT-08 both questions deleted, product unliked, and it sticks (6.1s)

  9 passed (2.9m)
```

Exit code **0**. The eight cases are about **75 seconds** together; the rest is
the seed.

## Validation commands and exit codes

Profile `full` from `.claude/project-config.yaml`, re-run on the final tree:

| Check | Command | Exit |
|---|---|---|
| lint | `pnpm lint` | **0** |
| typecheck | `node_modules/.bin/tsc --noEmit --pretty false` | **0** |
| unit-tests | `pnpm test:run` — 214 files, **3302 passed** | **0** |
| build | `pnpm build` | **0** |
| (extra) i18n parity | `pnpm lint:i18n-parity` | **0** |

No check writes to a tracked file. No user-visible string was added, so no
translation key was needed — the parity check confirms it.

## Per-criterion evidence

Every row is a step that ran and passed in the run above, except where noted.

| AC | Evidence |
|------|----------|
| AC-1 | `CMT-01` — "the shopper opens the QA product": signed in with a real one-time code, page opened with a non-empty name. |
| AC-2 | `CMT-01` — "the comments backend accepted the product like": the watched `/products/like` call answered under 400 and the footer heart then read on. |
| AC-3 | `CMT-01` — "a question asked in the page FAQ section": accepted, and the id read back off the card the strip drew. |
| AC-4 | `CMT-01` — "a question asked in the extended area": accepted, and asserted to be a **different** id from `AC-3`'s, so both places really created their own. |
| AC-5 | `CMT-02` — the two edit steps, each from the widget the question was asked in, each judging the update call itself. |
| AC-6 | `CMT-02` — "each question is liked": `data-liked` flipped and `data-likes` moved by exactly one against the number read a moment before. |
| AC-7 | `CMT-02` — the checkpoint: after a reload both questions show their edited text and both read as liked. |
| AC-8 | `CMT-02` — "the comments backend answered the translate call": judged on the status, never on the text. |
| AC-9 | `CMT-03` — "the seller opens their product list", on the seed's saved session with no sign-in. |
| AC-10 | `CMT-04` — "the seller is offered the comments section": the section drew a comment rather than the refusal screen. |
| AC-11 | `CMT-03` — the card found by walking, **plus** `tests/harness/gridWalk.test.ts` (7 cases) for the walk itself, which a one-page grid cannot exercise. |
| AC-12 | `CMT-03` — the card's reaction count answered and held the shopper's like. "Not answered yet" is a separate, named failure. |
| AC-13 | `CMT-04` — both answers written, each bound to a card proved to be this run's own, each read back against its question. |
| AC-14 | `CMT-05` — both answers on the product page, each carrying this run's token. |
| AC-15 | `CMT-05` — each answer's heart, using `data-target-type="seller_reply"`. |
| AC-16 | `CMT-05` — "an answered question offers no Edit": the menu opened and the Edit control had count 0. |
| AC-17 | `CMT-06` — one checkpoint, then one named step per question covering text, like, answer and answer-like. |
| AC-18 | `CMT-07` — all four likes removed, each with its count moving down by one. |
| AC-19 | `CMT-07` — the checkpoint: all four still off after a reload. |
| AC-20 | `CMT-08` — each question deleted through the app's own confirmation. |
| AC-21 | `CMT-08` — the product like removed. |
| AC-22 | `CMT-08` — the checkpoint: both gone, product not liked. |
| AC-23 | Proved twice. On the green run the journey removes everything itself. On an earlier **failed** run the `afterAll` did it instead — the request log shows two `/public_comment/comments/…/delete` calls and one `/products/unlike`, with no question id left behind. |
| AC-24 | `tests/harness/qaHarness.test.ts` — both cases green in `pnpm test:run`; and the rows in `docs/testing/E2E_SCENARIOS.md`, checked by reading. |
| AC-25 | The guards ran for real: on the run where the QA seed failed, all eight `CMT` cases reported `did not run` rather than failing. |
| AC-26 | Proved by reading the spec, and by the failures themselves — every red run in this ticket named its step, its widget and, where one was crossed, its backend. |

## Did the plan's Integration surface hold?

Mostly proved, one part not.

- **The QA seller's jar** — handed back by every seller case and by the
  teardown. Across eight runs no case reported the "your session has expired"
  screen.
- **The shared shopper's code budget** — one sign-in per run, in `CMT-01`. The
  README now records the sixteenth code.
- **Shared components** — `LikeButton` and `BuyersCommentMenu` are also used by
  the buyers review card; lint, typecheck and build are clean and the unit suite
  (3302 tests) is green, so nothing they render was broken.
- **`laneConfig.ts`** — the new unit case proves the file is in a lane, and that
  no spec is in neither.
- **Not proved: the full account lane.** Only the seed and the `CMT` cases were
  run. So the interaction with `sellerDashboard.live.spec.ts`, which reads the
  same jar **after** this file, has not been exercised end to end, and the
  measured full-lane duration the plan promised is still unknown. What is known
  bounds the risk: this journey adds about **75 seconds** to a lane whose
  `globalTimeout` is 85 minutes.

## Findings

| BUG | Scenario that is wrong | Confirming test | Where it lives | Ticket |
|------|------------------------|-----------------|----------------|--------|
| BUG-1 | A refused like or unlike on a comment or a shop answer is never noticed: the result is thrown away and `fetchData` answers `{ success: false }` rather than throwing. | none — needs a backend that refuses on demand, which a live suite cannot arrange | `services/home.ts:853-872` — outside this plan's files | _(owner opens)_ |
| BUG-2 | `spec.md > E-6` is written too broadly. `ProductLikeButton` does check the answer and roll back; only the comment like has BUG-1. | `CMT-01` exercises the product like and passes | the spec text | _(owner opens)_ |
| BUG-3 | The QA seed identifies the admin row by an email it mints per run and assumes that row is Pending. It decides "a request exists" from `id`/`status`/`phone` but identifies the row by `email`, which it never checks is present. The stable seller phone is in the same row and is never used as the key. | none — reproduced once, then the state moved on | `tests/e2e/harness/qaSeed.ts:511-545` — outside this plan's files | _(owner opens)_ |
| BUG-4 | The app's `[req]` server logger prints whole backend responses to stdout. Signing in fetches the chat channel list, so one line carried **real customers' names, phone numbers, photo paths and message text**. The harness runs the app with `stdio: "inherit"`, so on CI this reaches the Actions log of a **public** repository. | none written — observed in the run output of 2026-09-21 | the request logger, outside this plan's files | _(owner opens)_ |

All four lie **outside** `plan.md > Files to change`, which is what `VF-12`
requires for `passed` to be permitted with findings open. None was fixed here.

**BUG-4 is the one to move on first.** It is a live exposure in a public
repository, it is not caused by this ticket, and every existing live spec that
signs in already triggers it.

## What the first verification found, and why it mattered

The first round recorded `failed` with 23 criteria unproven. Running the journey
for real then found six defects, and **every one was the same mistake — reading
a value before the thing that produces it had finished**:

1. the ask box is a **sibling** of the FAQ strip, so a lookup scoped inside the
   strip could never match it;
2. an empty strip has zero size and reads as hidden, which is exactly the state
   the last checkpoint sees;
3. the teardown returned early when no question id existed, although the product
   like is created before the first question;
4. `productLiked` read the footer before it had mounted;
5. the extended area was left open over a fixed footer at `z-999999999`, which
   swallowed every click meant for the strip beneath it;
6. the counts were read on arrival, then waited 15 seconds without reading, then
   **reloaded over the answer that had just arrived**.

Two more things the runs taught that were **not** defects: a `401` from any
service is the first half of a token refresh, not a refusal (now written into
`CLAUDE.md`); and a `503` from `/api/proxy` is the proxy failing to complete the
call, which `CMT-07` correctly refused and correctly did not retry.

## Scope note

One file outside `plan.md > Files to change` was edited: **`CLAUDE.md`**, on the
owner's explicit instruction during this work, to record the 401 refresh-and-retry
rule. It is project documentation, not implementation, and it changes no
behaviour. Recorded here rather than left for a reader to notice.
