---
ticket: e2e-seller-story-product-link
stage: review
mode: standard          # single workflow form — no other modes (ADR-009)
status: complete
owner: developer
updated: 2026-09-22
links:
  clickup:
  github:
---

# Review — e2e-seller-story-product-link

> Written in two passes (`RP-4`). **Panel Findings** below are on disk before
> any comprehension question is asked, so the owner can read them first. The
> **Decision** section is empty until the gate has run.

## Review scope

`spec.md` and `plan.md` (**revision 4**). The plan has been revised three times
before this gate, at the owner's request: rounds 1, 2 and 3 raised 34 majors,
all recorded and closed in the three `## Panel revision` tables at the end of
`plan.md`. This panel read revision 4, which **no lens had seen** — it differs
materially from revision 3.

## Step 1 — Validation (passed)

| Check | Result |
|---|---|
| `PL-11` Integration surface stated explicitly | pass — present, with the lane-guard and shared-jar couplings named |
| `PL-12` No `OQ-n` left open | pass — `OQ-1` and `OQ-5` were deferred by `spec.md` and both are answered in `plan.md` |
| `PL-13` A Tests row per `AC-n`; named test files also under Files to change | pass — `AC-1`…`AC-12` all present, `AC-8` withdrawn with a reason, and the one new test file is in scope |
| `PL-14` Existing coverage searched, one disposition per row | pass — every row records a search; no `extend` row, so no parallel-file defect |
| Validation profile named and exists | pass — `logic-change`, pre-existing |
| plan ↔ REQ/AC traceability | pass |

Validation is atomic and it passed, so this file may be written (`RV-8`).

## Panel Findings

Three read-only lenses over `spec.md` and `plan.md`. **Advisory only** (`RP-2`):
a finding never blocks the decision, not even a `major`. It informs the owner,
who decides.

**Seven majors.** Four of them are faults that revision 4 itself introduced or
left behind; three are pre-existing facts about the repository that revision 4
relies on without checking.

### PF-1 — major — security — the sweep opens a stale jar exactly when it is needed

`plan.md` decision 4, the sweep row, and the hand-back bullets.

Revision 4 removed the mid-file hand-backs, which is what kept the saved jar
fresh. The file is serial, so a failure at `SST-02` skips `SST-07` **and its
hand-back**. The sweep then opens the jar as the previous spec file left it —
after this file has already done authenticated seller work. That snapshot is
what `harness/liveSession.ts:112-126` documents as spent: the app recovers it as
a guest, `accountId` is absent, the seller list is queried with an empty
`user_id`, and it answers "no match".

**The sweep reports clean over a live QA story.** `AC-10` and `NFR-2` pass while
failing. The plan states this exact failure mode two paragraphs away, about a
different read, and does not connect it.

**This is a regression created by closing round 3's finding #23**: revision 3's
per-case hand-backs were the thing keeping the jar fresh, and they were removed
without re-checking round 2's finding #16.

The plan also contradicts itself on how many hand-backs there are — "once, at
the end, and by the sweep" (twice) versus "once, after `SST-07`". One of the two
readings is the bug above, and `/implement` has to guess.

### PF-2 — major — senior — `STORY-03b` passes for the wrong reason, so `AC-4` rests on nothing

`plan.md > Tests`, the `AC-4` row (`existing — write nothing`).

`tests/e2e/stories.live.spec.ts:313-321` proves absence by collecting every `<a>`
href on the guest home page and filtering for the story link. **No home page
anchor ever carries a story link.** The bar tile is a `div`
(`components/Home/Stories/Story.tsx:14-22`); the `<a href={link}>` exists only
inside the opened viewer (`components/Home/Stories/StoryViewer.tsx:403`). The
filter therefore returns `[]` whether or not the guest can see the ring.

Two consequences, and the second is larger than this ticket:

1. `AC-4`'s `existing` disposition cites a check that cannot fail.
2. **An existing, passing test in this suite proves nothing** — and it is the
   guest-side proof the QA story lock leans on.

Round 3's finding #26 established only that `STORY-03b` runs when a story
exists. Its mechanism was never checked, by that round or by me.

### PF-3 — major — senior — `AC-2` cannot name the backend that refused

`plan.md > Files to change` ("Not changed, deliberately: the shared story
helpers") and the upload-describer bullet under *Security rules*.

`tests/e2e/actions/story.ts:147` hardcodes
`ADD_STORY_PATH = "/api/v1/stories/add_story"`, and the describer prints that
constant. The seller dashboard posts to **`/api/v1/stories/add-seller-story`**
(`services/sellerDashboard/index.ts:401`). Reusing the describer therefore
reports *"the browser never sent /api/v1/stories/add_story"* on every seller
upload — a wrong backend named on a **healthy** run, which is the precise
failure `NFR-1` exists to prevent. The screen cannot help: the tab collapses
both the media failure and the save failure into one translated toast.

`watchUpload` is also not exported, so a watcher must be written regardless —
and `actions/story.ts` is **not** in *Files to change*, so `/implement` may
neither edit it nor reuse it (`IM-4`).

### PF-4 — major — senior — `AC-1` cannot name a missing `READ_STORY`

`plan.md` decision 1 and the `StoriesTab.tsx` hook table.

The two root flags cover `CREATE_STORY` and `DELETE_STORY` only. Without
`READ_STORY` the tab body is never rendered and the menu entry is hidden
(`…/sellerDashboard/[sellerId]/page.tsx:2040, 2346, 2547`) — and unlike
products, boutiques and users, **stories has no `AccessDenied` block**. So there
is no section root to carry the flags. The natural implementation waits for the
root, times out, and reports "the section never appeared", which is exactly what
`E-1` and `AC-1` exist to prevent.

The fix needs no new hook: the existing `seller-dashboard-menu-stories` entry is
already gated on the permission.

### PF-5 — major — performance — the budget drops a branch its own table names

`plan.md`, the per-case table and the budget paragraph.

`SST-05` is priced "25–40 s, **up to 90 s if the bar walks**", but the sum counts
only the 40. The walk is real and measured: up to five pulls at 10 s each plus a
final 30 s assertion (`actions/story.ts:335, 356-387`). With it the sum is
**295–305 s against a 240 s budget**. Worse, `SST-03` reads the same bar with
the same account and is priced 50 s lower with no walk allowance at all — the
same operation priced twice, differently.

A mitigation exists in the helper's own comment: the uploading account sees its
own ring at the front, so read inside the held seller context the walk should
not happen. The plan does not say so.

### PF-6 — major — performance — the shortened poll window buys a false block

`plan.md`, "The poll window and the page bounds, named", used by step 5.

`waitForStoryByLink` returns on the first hit (`harness/storyFinder.ts:165-175`),
so on a green run the window costs **one read whatever its length** — shortening
it saves nothing. All it shortens is the window before the case declares the
story absent, and step 5 escalates that absence into a **`C-4` block**. So the
change makes the one measurement nobody has taken yet (`OQ-1`) more likely to
lie, for no gain. The suite's precedent for this same wait is the full default.

Two smaller errors in the same bullet: 6 attempts at 4 s is 5 gaps = **20 s**,
not the 24 s written; and the budget paragraph calls the poll window one of "two
things that decide whether the budget holds", which cannot be true of a poll
that exits on first hit.

### PF-7 — major — performance — `AC-11`'s number is undefined

`plan.md` step 7 and the seed note in step 5; `spec.md > AC-11` ("measured from
the run's own report").

The seed is a setup project every live case depends on, and the plan itself says
the teardown clears the session directory so the seed runs **every** iteration
at 84–100 s. If the `AC-11` figure is the run's total, it is 219–355 s against a
240 s budget — so `AC-11` passes or fails on which number was read, not on the
journey. One sentence fixes it: the figure is this file's own case durations,
seed excluded.

### Minors

| # | Lens | Finding |
|---|---|---|
| PF-8 | security | `AC-4`'s cell claims `STORY-03b` covers the seller path. It creates a **shopper** story through a different endpoint; nothing in revision 4 runs the guest branch of the filter over a seller-created row. |
| PF-9 | security | The "video off for the guest case" rule refers to a case revision 4 deleted, and `recordVideo` is fixed at context creation — with one shared context there is no per-case choice left. |
| PF-10 | performance | Three lines still describe revision 3's shape: "five cases" after `SST-02` (four now), "four of the seven cases" (six now), and the guest-case video bullet. An implementer honouring the last one opens a context that no longer exists. |
| PF-11 | performance | One context plus `video: "on"` yields **one** long film attached where the context closes. A red `SST-02` then has no video of its own. |
| PF-12 | performance | The plan never states that the held seller context is itself on the viewer allow-list. Unstated, an implementer may reach for a second identity — a second context, or a sign-in that spends a one-time code and breaks `NFR-5`. |
| PF-13 | senior | "Newest first" is assumed for the seller list and never established; nothing fixes an order. If it is ascending, the sweep's one-page bound matches nothing and reports clean. |
| PF-14 | senior | The product picker pages behind a "Load more" button whose only label is translated, and the plan forbids adding a hook for it. If the seed product falls past page 1 the journey cannot reach it. |

### What the panel found sound

Recorded so the next reader does not re-check it: the per-function bounds match
the real signatures; the ceilings sum to 24 minutes against an 85-minute run
limit and a 100-minute job cap, with the lane at 35–40 minutes; the house
numbers cited are real; the lane-guard-is-a-unit-test claim holds; the jar
ordering holds (this file sorts last among the three readers); the optional-prop
pattern exists; the crop hook is shared and reusable; the redaction reasoning is
accurate, including the `NEXT_PUBLIC_` correction; the output-directory rule
matches the CI pack step; and the seller-list read is spelled out correctly.

## Risks and assumptions

- **`OQ-1` is still unanswered and no review can answer it.** Only steps 1–5
  can. Every finding above is about whether the journey would report the truth
  once it runs, not about whether it will run.
- **Three rounds have now each introduced a fault while fixing another** — the
  dropped error hook, "handed back once", the wrapper element, the sweep reading
  the wrong list, and now `PF-1`. That pattern is itself evidence about the plan,
  and it is the owner's to weigh.

## Decision

**APPROVED** — recorded by the owner on 2026-09-22, after the comprehension gate
passed 2/2 (`comprehension.md`, administered short under `CG-8`).

The panel is advisory and never blocks (`RP-2`); seven majors stood open at the
moment of the decision and the owner approved with them open. That is a legal
outcome, and the dispositions below are what carries them — **`/implement` reads
this section as part of its brief.**

**One thing is stated plainly because it is a consequence, not an objection.**
Two findings, `PF-6` and `PF-7`, are dispositioned in a way that **supersedes
specific text in the approved plan**. Where this section and `plan.md` disagree,
this section is the later decision. Every disposition below is achievable inside
the approved *Files to change* list; none of them needs a file the plan does not
already name, so none forces an `IM-4` stop.

## Major finding dispositions

| # | Disposition | What `/implement` does |
|---|---|---|
| PF-1 | **mitigate** | The hand-back moves into a `test.afterAll` that runs **before** the sweep, so the last case that actually ran writes the jar — not `SST-07` specifically. The sweep asserts its own identity before it believes an empty list, and fails with "the sweep opened a spent jar and fell back to a guest" rather than reporting clean. Both changes are inside `sellerStories.live.spec.ts`, which is in scope. The plan's three contradictory hand-back sentences are resolved this way. |
| PF-2 | **accept, and mitigate in part** | `AC-4` may **not** rest on `STORY-03b`. The new file carries its own guest check, reading the bar tile by `data-pw` and `data-id` after proving the bar drew content (`E-4`). That sits in `sellerStories.live.spec.ts`, in scope. The broken existing case is **not** fixed here — `stories.live.spec.ts` is out of scope — and becomes `BUG-2`. |
| PF-3 | **mitigate** | `tests/e2e/actions/sellerStories.ts` carries **its own** request watcher and describer for `/gated/upload` and `/api/v1/stories/add-seller-story`. It does not reuse the shared describer, whose story path is hardcoded to the shopper endpoint. The new actions file is in scope, so no `IM-4` stop. |
| PF-4 | **mitigate** | `AC-1` reads the existing `seller-dashboard-menu-stories` entry first and reports "the account has no `READ_STORY`" when it is absent. No new hook, and the actions file is in scope. |
| PF-5 | **mitigate** | The rendered bar is read **inside the held seller context**, where the uploading account's own ring is at the front, so the walk should not happen. `SST-03` and `SST-05` are priced the same way. If the walk does happen, `/verify` records `AC-11` against the measured number rather than the estimate. |
| PF-6 | **accept — supersedes the plan** | The poll window stays at the shared default (12 attempts), **not** the 6 × 4 s written in the approved plan. Shortening it saves nothing on a green run and only shortens the window before the case declares the story absent — which step 5 escalates into a `C-4` block on the one measurement nobody has taken. |
| PF-7 | **accept — supersedes the plan** | The `AC-11` figure is **this file's own case durations from `e2e-results.json`, seed excluded**. The plan left the boundary undefined, which moved the answer between three and six minutes. |

Minors `PF-8` … `PF-14` are accepted as recorded. Three of them (`PF-9`,
`PF-10`) describe plan text still carrying revision 3's shape — a guest case that
no longer exists and two stale case counts. `/implement` follows this section,
not those sentences.

## Follow-up actions

| # | Action | Owner | When |
|---|---|---|---|
| FU-1 | Open **`BUG-1`** — the product page's story reader applies no test-data filter, unlike the four other readers. Carry the coupling note from `plan.md > Integration surface`: a fix that drops test stories unconditionally turns `SST-06` red. | developer | before `/verify` |
| FU-2 | Open **`BUG-2`** — `stories.live.spec.ts::STORY-03b` passes for the wrong reason. It collects `<a>` hrefs on the guest home page; no home page anchor carries a story link, so its filter returns empty whether or not the guest can see the ring. This is the guest-side proof the QA story lock leans on. | developer | before `/verify` |
| FU-3 | Record the `OQ-1` measurement in `implement.md` at plan step 5, with both branches already written out. | ai_agent | at `/implement` |
| FU-4 | At `/verify`, judge `AC-11` by `FU`-`PF-7`'s definition, and record the account lane's own total from the next full CI run so the next ticket does not inherit a stale baseline. | developer | at `/verify` |

## Notes on the gate itself

Recorded because it bears on how much assurance this approval carries: the
comprehension gate was **degraded**. Two questions were administered against a
floor of three, and the `CG-5` integration question was among those excluded —
its fact was reachable from a file the host injects into the falsifier's context,
which is an authoring miss. Both administered questions were two-hop and both
were answered correctly. `comprehension.md` carries the full account.
