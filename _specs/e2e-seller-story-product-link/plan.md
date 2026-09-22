---
ticket: e2e-seller-story-product-link
stage: plan
mode: standard          # single workflow form — no other modes (ADR-009)
status: complete
owner: developer
updated: 2026-09-22
revision: 4             # third advisory round — five distinct problems closed
links:
  clickup:
  github:
---

# Plan — e2e-seller-story-product-link

> Decide the approach before changing code. Plan only — no implementation here.

> **Revision 4, 2026-09-22.** Three advisory rounds have run before the review
> gate, at the owner's request: ten majors, then twelve, then twelve more that
> collapsed to five distinct problems. All are closed, and the tables at the end
> record every round. **No review decision has been recorded** — the gate has
> not run.
>
> Revision 4 makes the plan **smaller**: one context instead of five, six cases
> instead of seven, and one hand-back instead of three.

## Approach

Add one browser journey, one actions file for the seller Stories screen, the
locators it needs, and the test hooks two screens are missing. The journey opens
the session the QA seed saved, uploads a story carrying the QA test-data link
and the seed's own product, finds it on the home stories bar, follows its
product button to the product page, checks the product page lists it, and
deletes it from the dashboard.

**Five decisions shape everything else.**

1. **Nothing is written until the account is known to be able to delete it.**
   The permissions are read from the section's own root element, which carries
   them as flags. They cannot be read from buttons: the delete button lives
   inside a story card, and at that moment the grid is empty, so an absent
   button means both "no permission" and "no story".

2. **The risky half is built and measured before the rest** (`OQ-1`).

3. **Each case names the surface it reads, and the two surfaces answer
   different questions.**
   - The **unfiltered backend feed**, read through the proxy, answers `OQ-1` and
     nothing else: did the backend file the story into the user feed.
   - The **rendered stories bar** answers `AC-3`, because it is about what a
     viewer sees. A guest reading the unfiltered feed *finds* the story, so a
     guest check must never use that read.
   - The **seller's own story list** answers `AC-9` and the sweep. It is not the
     shopper feed, and the difference is load-bearing — see the note under
     *Tests*.

4. **One seller context, held open for the whole file.** Revision 3 opened the
   saved jar four times and handed it back three times. That was the wrong
   answer to the right worry. The credential rotates the moment a case does
   anything, so *any* re-open risks a spent pair — and the four "sellers" in
   revision 3's table were one account opened four times over. A context that
   stays alive never opens a spent jar at all, costs three fewer document
   loads, and removes the failure entirely instead of sequencing around it.
   The jar is handed back once, at the end, and by the sweep.

5. **No sign-in.** The journey opens the seed's saved seller session.

## Steps

1. **Add the test hooks** — the three tables under *Files to change*, and
   nothing else.
2. **Add the locators** as a new `sellerStories` group in the shared selector
   file, reusing the existing crop-dialog locator rather than adding a hook for
   it.
3. **Write the actions file.**
4. **Write the guard, the first three cases, and the lane entry — in one
   commit.** `SST-01`, `SST-02`, `SST-03`. **The lane entry is not optional
   here and cannot wait:** the lane guard throws for *any* lane run while a spec
   file sits in no lane, and the PR-gating unit suite asserts that guard does
   not throw. A commit with the spec file and no lane entry turns `pnpm test:run`
   red for everyone.
5. **Measure `OQ-1`. Build, and narrow the run correctly:**

   ```
   tsx tests/e2e/cli.ts run --lane=account --grep "SST-|QA seed"
   ```

   **Both parts of that command matter, and each has already cost this project
   time.**
   - **No positional file filter.** The lane's own file list is prepended to
     whatever is typed, and Playwright treats positional filters as *or*. So
     naming the file runs the entire lane — about 35–40 minutes, a real order,
     and real one-time codes.
   - **The seed must be named in the grep.** A grep filters the setup project
     out, measured and written down in the lane config. `--grep "SST-"` alone
     means the QA seed never runs, no seller session is saved, and `SST-01`
     fails with "there is no saved signed-in session" — a message pointing at
     the wrong cause entirely.
   - **Build.** The hooks from step 1 are compiled into the served bundle. Only
     the first iteration needs it; use `--skip-build` after that until an
     application file changes again.
   - **The seed runs every iteration, and that is unavoidable.** The run's
     teardown clears the session directory after every run, failing runs
     included, so the saved jar never survives. The seed's short path is about
     84–100 seconds. Eight debug iterations is therefore 11–13 minutes of
     seeding before any case starts. There is no cheaper correct alternative —
     written down so it is budgeted rather than discovered.

   Record the answer in `implement.md`.
   - **The story is in the unfiltered feed** → continue.
   - **It is not** → **stop and record a block** (`C-4`). Before blocking,
     confirm the served build carries the viewer allow-list, so a stale build is
     not mistaken for a backend fault.
6. **Write the rest** — `SST-05`, `SST-06`, `SST-07` and the sweep. There is
   no `SST-04`.
7. **Run the file again** and record the wall time against `NFR-3`.
8. **Update the browser suite's README**, which lists the readers of the saved
   seller session.
9. **Open the `BUG-1` ticket**, carrying the coupling note below.

**Build rule, replacing "steps 5 and 8 build".** Build after any change under
*Files to change → Application*; use `--skip-build` otherwise. Steps 6 to 8
touch only tests and the README, so the bundle at step 7 is identical to step
5's. The old rule cost about 74 seconds of idle build on every debug iteration
for no protection.

## Files to change

### Application

**`components/SellerDashboard/StoriesTab.tsx`**

| Attribute | On |
|---|---|
| `seller-stories` **+ `data-can-create` + `data-can-delete`** | the section's root element |
| `seller-stories-add` | the "Add Story" button |
| `seller-stories-grid` | the story grid container |
| `seller-story-card` | each story card, **plus `data-id={story.id}`** |
| `seller-story-delete` | the delete button on a card |
| `seller-story-delete-confirm` | the confirm button in the delete dialog |
| `seller-story-upload` | the upload dialog container |
| `seller-story-file` | the hidden file input |
| `seller-story-link` | the link input |
| `seller-story-product-pick` | the button that opens the product picker |
| `seller-story-product-row` | each row in the picker, **plus `data-id`** |
| `seller-story-product-chosen` | the chosen-product block |
| `seller-story-share` | the Share button |

The root element's two flags are the whole of approach decision 1. They read
the permission props directly, so they are correct on an empty grid — which is
the normal state before this journey uploads anything.

**`components/SellerDashboard/ui/index.tsx`** — add an optional `data-pw` prop
to the shared empty and error states, **following the pattern already in this
file**: the access-denied state takes exactly such a prop, optional, with a
default, and every other caller leaves it undefined.

This replaces revision 2's wrapper element, and revision 2's reason for refusing
it was wrong. The claim was that changing a shared state component "would reach
every section". The existing prop pattern shows it does not: an optional prop
with a default changes no DOM and no other caller. Revision 2 instead chose the
one option that *did* change DOM shape.

**The error state needs a hook, and dropping it was a mistake.** Revision 2 said
`SST-01` would judge the section's load by "grid, empty or error together". The
error state has no hook and no stable text — its only strings are the backend's
own message or a translated fallback. So a stories-backend refusal at `SST-01`
would have ended as a locator timeout rather than "the stories backend refused",
which is the exact failure `NFR-1` and `AC-1` exist to prevent.

**`components/Home/Stories/StoryViewer.tsx`** — two attributes:

| Attribute | On | Why |
|---|---|---|
| `story-actions` + `data-has-product={Boolean(product_slug)}` | the actions bar at the foot of the viewer | The bar is drawn whenever the story has a link **or** a product; the flag says which. |
| `story-product-link` | the "View Product" link | Its only label is a translated string. |

The flag is not decoration. The product link renders only when the story has a
product **and** the viewer is not paused — and the viewer pauses on the very
interaction used to move between stories. Without the flag, "no product" and
"paused" are identical in the page, and `AC-5` cannot prove what it claims.

### Browser suite

- `tests/e2e/selectors.ts` — new `sellerStories` group. **It reuses the existing
  crop-dialog locator**; nobody adds a hook for the crop screen.
- `tests/e2e/actions/sellerStories.ts` — **new.**
- `tests/e2e/sellerStories.live.spec.ts` — **new.**
- `tests/e2e/laneConfig.ts` — add the spec to **`ACCOUNT_LANE`**, in step 4's
  commit. Named explicitly: the seed does nothing unless the lane is `account`,
  so a `SOLO_LANE` entry would make every case skip silently on a green job.
- `tests/e2e/README.md` — the third reader of the saved seller session.

**Not changed, deliberately:** the shared story helpers and the feed finder. The
new actions file calls the finder **directly** — `findStoryByLink` and
`waitForStoryByLink`, with the feed reader bound to the page — passing its own
page bound and poll window. The convenience wrappers cannot carry those options,
which is what made revision 2's "passed at the call site" impossible. Calling
the finder directly needs no edit to either file and adds no second bound
constant.

### Workflow record

- `_specs/e2e-seller-story-product-link/implement.md` — step 5 records the
  `OQ-1` measurement in it.

## How the new cases must be written

`/implement` may not invent these.

**Serial mode and per-case budgets.** The file declares serial mode. Every case
after `SST-02` shares one uploaded story, so without it a failed upload makes
five cases fail with messages about a story that was never created, each
re-searching the same empty feed.

| Case | Surface it reads | Ceiling | Expected |
|---|---|---|---|
| `SST-01` | the dashboard screen only | 180 s | 15–25 s |
| `SST-02` | the screen, then **the seller's own list** to read the story back | 240 s | 25–40 s |
| `SST-03` | **the unfiltered user feed**, then **the rendered bar** | 240 s | 25–60 s |
| `SST-05` | the rendered bar → the viewer → the product page | 240 s | 25–40 s, up to 90 s if the bar walks |
| `SST-06` | the product page | 180 s | 10–20 s |
| `SST-07` | **the seller's own list** before and after, and the screen between | 240 s | 20–35 s |
| sweep | **the seller's own list** | 120 s | 5–15 s |

**There is no `SST-04`.** See the `AC-4` row under *Tests*: the case already
exists in this lane.

**Every row names an endpoint, not a vague "proxy".** Revision 3 wrote "proxy"
for two rows, which hid the very distinction decision 3 is built on. In
particular `SST-02` reads the story back from the **seller's list**, not the
user feed — if it read the user feed it would have answered `OQ-1` a case early
and made step 5's whole ordering pointless.

**The ceilings are the suite's own numbers, not tighter ones.** This suite
already budgets 240 s for a story upload, 180 s for finding a story and opening
its ring, 240 s for a delete with a backend proof, and 240 s for opening the QA
seller jar and driving one dashboard section. Revision 3 set 90–150 s for the
same work — 50–75% of the measured precedent — so a red case would have reported
a timeout instead of a named failure, which is precisely what a ceiling exists
to prevent. **A ceiling costs nothing on a green run.** At these numbers the
ceilings sum to 24 minutes, against an 85-minute run limit and a 100-minute job
cap, so nothing is threatened.

**The budget, recomputed honestly.** Expected sums to **125–235 s**, plus about
10–20 s of context close, video finalisation and the hand-back, giving
**135–255 s against `NFR-3`'s 240 s**. Revision 3 claimed "130–200" and was
simply wrong about its own arithmetic. Two things decide whether the budget
holds, and both are named below rather than left to chance: the poll window, and
dropping `SST-04`.

**One seller context for the whole file.** It is opened once from the saved jar
before `SST-01` and stays alive through `SST-07`. It is handed back once, after
`SST-07`. Four of the seven cases are the same identity doing seller work, and
every re-open was both a cost and a chance to open a spent credential.

**The sweep opens its own context and hands it back itself.** It cannot share
`SST-07`'s: in serial mode a failure at `SST-02` skips `SST-07` entirely, so the
context the sweep was told to borrow may never have existed — and the hand-back
navigates its page away in any case. The sweep is exactly the thing that must
work when earlier cases failed, so it depends on nothing but the jar on disk.

**The poll window and the page bounds, named.**

| Where | Function | Options passed |
|---|---|---|
| `SST-03`, waiting for the row | `waitForStoryByLink` | `attempts: 6`, `waitMs: 4_000` — 24 s, not the default 60 s |
| `SST-03`, searching pages | `findStoryByLink` | `maxPages: 3`, matching `OQ-2` |
| the sweep | `findStoriesByPrefix` | `maxPages: 1` — one page holds a story made this run |

`waitForStoryByLink` pins its own page bound to one page and takes no
`maxPages`; only the two search functions take it. Revision 3 said "bounds are
passed" without saying which option goes to which function, which is how the
default 60 s poll would have crept back in.

**The rendered bar walks five pages, on purpose.** That bound is a module
constant in the shared helper, and the plan does not change it — a second bound
constant is how two bounds drift. So `AC-3`'s three-page promise is about the
**feed**, which is where the story either is or is not; the bar walk is the
rendering check on top of it.

**`SST-03` has two steps**, because `AC-3` and `OQ-1` are different claims.
First the unfiltered backend read — the `OQ-1` answer, and the only read that
can tell "the backend never filed it" from "the filter hid it". Then the
rendered bar, which is what `AC-3` promises an allow-listed viewer sees.

**`SST-05` carries two named steps** — the button is offered, and the landing
page is the seed's product by name. They can fail apart. It **polls for the
product link before judging it absent**: the link is gated on the viewer not
being paused, and the viewer pauses on the interaction used to move between
stories, so a paused viewer would otherwise be reported as a missing product
button.

**`SST-07` proves the list held the story before it proves the list does not.**
This is `E-4`'s rule applied to the absence side, and without it the case is
worthless: a mis-addressed or empty list answers "no match" and the case reports
a successful delete while the row sits on staging. The sweep carries the same
rule.

**The fixture is the suite's synthetic 1×1 PNG**, never a real photograph.

## Security rules for the new code

The repository is public and every CI log is world-readable.

- **Redaction is a per-call-site obligation, not a property of the suite.**
  Nothing enforces it downstream: the runner spawns Playwright with inherited
  output, so the list reporter's assertion text reaches the job log unredacted.
  Only the separate report step redacts, and that feeds the notifier, not the
  log.
- **The existing upload-describer interpolates the backend's message raw.** Any
  message built from it must be wrapped by the redactor before it reaches an
  assertion. The core backend also packs per-field refusals as JSON inside that
  message.
- **A failure names a status and the backend's own message, capped — never a
  header and never a body.** The value this protects is the run-minted upload
  ticket, which matches no shape rule in the redactor. *(Revision 2 named the
  media API key instead. That was wrong: it is a `NEXT_PUBLIC_` value, already
  in every browser bundle, and the redactor deliberately refuses to mask those.)*
- **Nothing read from the shared feed may be printed except this run's own token
  and its own story ids.** Those rows are real customers' stories. The run token
  itself is opaque and carries nothing identifying, so the link is safe to print.
- **Never write or attach a storage state, a response body or a header dump
  under the Playwright output directory.** The CI pack step archives that whole
  directory, and its file-type check is an emptiness guard, not a filter. The
  saved session jar is safe — it lives outside that directory and is gitignored.
- **The QA view header's value is never written into the new file.**
- **The jar is handed back once, at the end, and by the sweep.** With one live
  context there is no mid-file re-open to protect. This file is also the **last**
  reader of the jar in the lane — it sorts after both existing readers, and the
  run's teardown clears the session directory afterwards — so a stale jar here
  cannot reach them. Worth recording so nobody re-argues it; renaming the file
  would change it.
- **`C-2` is narrower than it reads.** The test-data mark is a filter applied by
  readers *in this repository*. The row is real on a shared backend, so any other
  consumer of that feed is unfiltered. The story is deleted in `SST-07` rather
  than left to the sweep, which keeps the window to **a few minutes** — not, as
  revision 2 put it, "the shortest possible window". Four cases sit between the
  upload and the delete.
- **Video stays on for the bar-walking cases and off for the guest case, and the
  reason is artifact cost, not exposure.** Turning it off for one context does
  work as assumed. Worth recording honestly: the cases still recording are the
  ones that scroll the real stories bar, so they film real customers' rings and
  media. Those files are encrypted at upload but sit in the clear on the runner
  and on every developer's disk. That is pre-existing, and this ticket adds to it
  rather than creating it.
- **A killed run still leaks one story.** The sweep runs in-process, and a
  cancelled CI job never reaches it. Recorded as a follow-up.

## Integration surface

- **Touched beyond its own files:** two live screens, the shared dashboard state
  components, the shared selector file (read by every browser spec), the lane
  tables (read by both CI lane jobs **and by the PR-gating unit suite**), and the
  suite README.
- **Who else depends on them:**
  - The lane guard is asserted by the unit suite. A spec file in no lane turns
    `pnpm test:run` red — which is why the lane entry is in step 4.
  - The shared state components are rendered by every dashboard section. The
    optional-prop change leaves all of them byte-identical.
  - The tab's existing unit test queries by text, alt text and role. With the
    optional-prop approach there is no DOM change at all, so the risk revision 2
    claimed here was overstated.
  - The story viewer is used by the home bar and the product page strip. Two
    inert attributes.
- **Overlapping flows:** the saved seller session is shared with two existing
  spec files, both of which hand it back after use. **Still the single most
  likely way this ticket breaks an existing test** — and revision 2's
  "handed back once" would have caused exactly that.
- **Ordering:** hooks and locators before the actions file; **spec file and lane
  entry in one commit**; build after any application change.
- **Cross-ticket coupling — for `BUG-1`'s author:** `SST-06` passes today partly
  because the product page's story reader applies no test-data filter. When
  `BUG-1` adds it, `SST-06` stays green **only if the fix keeps the viewer
  allow-list path on the server reader**. If it drops QA stories unconditionally,
  `SST-06` goes red and the cause will look like this ticket.

## Tests

| AC | Existing coverage found | Disposition | Test file | Test case / name |
|------|-------------------------|-------------|-----------|------------------|
| AC-1 | `none — searched tests/e2e/; sellerDashboard.live.spec.ts has no story case` | new | `tests/e2e/sellerStories.live.spec.ts` | `SST-01 the seller opens their Stories section and may both add and delete` |
| AC-2 | `none — searched tests/e2e/actions/; story.ts covers only the shopper's upload widget` | new | `tests/e2e/sellerStories.live.spec.ts` | `SST-02 a story uploads with its test-data link and the seed's product, and the backend keeps both` |
| AC-3 | `none — qaLock.live.spec.ts::QA-11 reads the same feed but proves ABSENCE` | new | `tests/e2e/sellerStories.live.spec.ts` | `SST-03 the story is in the feed and on the allow-listed viewer's bar, within three pages` |
| AC-4 | **`tests/e2e/stories.live.spec.ts::STORY-03b a guest never sees this run's story, while it is live`** — in this same lane, and already non-vacuous: it uploads first, so absence means hidden and not missing. Its own comment makes the identical argument about `QA-11`. Plus `tests/utils/qaStoryFilter.test.ts` for the filter itself. | **existing — write nothing** | — | — |
| AC-5 | `none — searched tests/e2e/ and tests/components/Home/Stories/` | new | `tests/e2e/sellerStories.live.spec.ts` | `SST-05`, step "the story offers a button to its product" |
| AC-6 | `none — searched tests/e2e/` | new | `tests/e2e/sellerStories.live.spec.ts` | `SST-05`, step "the button lands on the seed's product" |
| AC-7 | `none — tests/components/products/ProductStories.test.tsx renders from fixtures and asks no backend` | new | `tests/e2e/sellerStories.live.spec.ts` | `SST-06 the product page lists the story in its product story section` |
| AC-8 | — | **withdrawn** | — | See the Correction in `spec.md`; recorded as `BUG-1`. |
| AC-9 | `none — searched tests/e2e/; deleteShowingStory is the SHOPPER viewer's delete, not the dashboard's` | new | `tests/e2e/sellerStories.live.spec.ts` | `SST-07 the seller list holds the story, the dashboard deletes it, and the list no longer holds it` |
| AC-10 | `none — the nearest pattern is the module-scope afterAll sweep in stories.live.spec.ts, but it sweeps the SHOPPER feed` | new | `tests/e2e/sellerStories.live.spec.ts` | the file's `test.afterAll` sweep, **reading the seller list** |
| AC-11 | `none — no test measures its own duration` | none — measured from the run's own report at `/verify`, against `NFR-3` as amended to four minutes | — | — |
| AC-12 | `none — searched tests/; the lane guard case proves lane membership only, and nothing there touches settings or one-time codes` | none — holds by construction: the journey opens the saved jar, never signs in, and needs no setting the harness does not derive. Checked by reading, not by running. | — | — |

**`AC-9` and `AC-10` read the seller's own list, and that read must be spelled
out or it fails silently.**

The suite's existing sweep and delete helpers are the shopper-side path: the
delete presses an icon inside the story viewer, and the sweep reads the user
feed. A seller story is written and listed through the seller's own endpoints,
and whether one list feeds the other **is `OQ-1`**. Had the sweep kept reading
the user feed, an `OQ-1` answer of "no" would have made it read an empty result,
report clean, and leave the row on staging — `AC-10` passing while failing.
Reading the seller list works in **both** branches of `OQ-1`.

Three things the plan must name, because the natural implementation of "read the
seller list" gets each of them wrong:

- **The endpoint and its arguments.** `/api/v1/stories/seller-stories`, through
  the in-page proxy helper, with `seller_id` **and** `user_id` as query
  parameters. The app's own service sends both.
- **Where `user_id` comes from.** The seed state carries `sellerId` but **no user
  id**. It comes from the signed-in session the app reports (`accountId`), never
  from the profile cookie inside the saved jar. An empty `user_id` returns "no
  match", which reads exactly like a successful delete.
- **The row shape.** The shared finder expects grouped rows and skips any story
  whose group carries no id; the seller list may come back flat — the app's own
  tab flattens defensively for that reason. So the new actions file normalises
  the shape itself, or asserts it, rather than handing an unknown shape to a
  helper that will quietly return nothing.

All three have the same failure mode: **a clean report over a row that is still
there.** That is why `SST-07` and the sweep both prove the list *held* the story
before they prove it does not.

## Validation strategy

- Validation profile: `logic-change`
- Profile source: `pre-existing` — not touched.
- **Why this profile.** The application change is test attributes plus two
  optional props. It adds no user-visible string, so the translation-parity
  check has nothing to see, and it crosses no server/client boundary, so a build
  check would be paid for and prove nothing. The unit suite is in the profile
  for a plainer reason than revision 2 gave: **the lane guard is a unit test**,
  and this ticket adds a file to a lane.
- **What the profile does not run.** The browser journey is in no profile — the
  browser suite gates no pull request and is red whenever staging is down. It is
  run by hand at steps 5 and 7 with the command in step 5. `/verify` records
  those runs against `AC-1` … `AC-10`; a declared case that never ran is a failed
  verification.

## Answers to the questions the spec deferred

- **OQ-1** — answered by measurement at steps 4 and 5, reading the **unfiltered**
  backend feed, with a build and the narrowed command. Both outcomes are written
  out so neither is improvised.
- **OQ-5** — the thirteen attributes on the seller tab, two optional props on the
  shared state components, and two attributes on the story viewer. Named
  individually. `/implement` may add those and no others.

## Rollback

- The three new test files can be deleted with no effect on the application.
- The lane entry and the spec file are one commit, so one revert takes both. A
  revert of only one turns the unit suite red.
- The selector change is a new group; removing it touches no other group.
- Every application change is inert: two attributes on the story viewer,
  thirteen on the seller tab, and two optional props that default to today's
  behaviour. **No DOM shape changes anywhere**, which is what revision 2's
  wrapper would have done.

## Out of scope

- **Fixing the product page's story reader** — `BUG-1`, its own ticket.
- **A sweep for stories left by a killed CI job** — real, recorded, and a change
  to the seed rather than to this journey.
- **Changing the shared feed finder's defaults.** The call site passes its own.
- **Re-baselining the whole lane.** Step 7 measures the new file; the lane's own
  total is recorded from the next full CI run and left for whoever next argues
  about suite time.
- **Video stories**, story editing, viewer timers and gestures.
- **Any change to the QA test-data rule** or the viewer allow-list.

## Panel revision — round 1

Ten majors, all closed in revision 2.

| # | Lens | Finding | Closed by |
|---|---|---|---|
| 1 | perf | 3-minute budget was happy-path only | call-site bounds, shared contexts, budget re-baselined |
| 2 | perf | No serial mode, no per-case timeouts | both now required, with numbers in revision 3 |
| 3 | perf | `--skip-build` cannot contain new hooks | build rule |
| 4 | sec | Uploaded before knowing it could delete | permission check before first write |
| 5 | sec | Redaction never stated | *Security rules* section |
| 6 | sec | `C-2` overstated | narrowed honestly |
| 7 | senior | `selectors.ts` missing from scope | added |
| 8 | senior | Story viewer's button had no hook | `StoryViewer.tsx` added |
| 9 | senior | `AC-5` unprovable | `data-has-product` flag |
| 10 | senior | `OQ-1` measurement imprecise | unfiltered read + mandatory build |

## Panel revision — round 2

Twelve majors against revision 2's fixes. All closed in revision 3.

| # | Lens | Finding | Closed by |
|---|---|---|---|
| 11 | perf | The run command does not narrow: the lane's file list is prepended and Playwright *or*s positional filters, so it runs the whole lane | step 5's exact command |
| 12 | perf | `--grep "SST-"` filters the setup project out, so the seed never runs and `SST-01` fails pointing at the wrong cause | the grep names the seed |
| 13 | perf | The bound and poll window **cannot** be passed through the convenience wrappers | the actions file calls the finder directly |
| 14 | perf | Per-case timeouts had no numbers, and the two requirements pull opposite ways | the table, with ceiling and expected separated |
| 15 | perf | 3 minutes was a coin flip: 180–200 s typical | `NFR-3` amended to 4 minutes |
| 16 | sec | One hand-back for four contexts re-opens a spent jar; the delete then silently no-ops | hand back after every authenticated case |
| 17 | sec | The sweep and delete proof read the **shopper** feed, so an `OQ-1` "no" makes the sweep report clean and leave the row | both read the seller list |
| 18 | sec | The redaction rule is enforced nowhere, and the helper reused breaks it | stated as a per-call-site obligation |
| 19 | senior | Step 5 could not run at all — spec file at step 4, lane entry at step 7, and the lane guard is a **unit test**, so the PR gate went red in between | lane entry moved into step 4 |
| 20 | senior | `SST-01` could not read `DELETE_STORY` before the first write — the button lives in a card, and the grid is empty | flags on the section root |
| 21 | senior | Dropping the error hook broke the load check that was meant to replace it | error hook restored, via the existing optional-prop pattern |
| 22 | senior | `SST-04` had no stated surface, and the default read would have made a guest **find** the story | surface named per case; `E-4` written in |

Minors folded in: the crop locator is reused rather than re-hooked; `AC-5`/`AC-6`
split into two named steps; the sweep passes its own page bound; the build rule
narrowed to application changes only; a context named for all seven cases and
the sweep; the output-directory rule; the media API key correction; and the
honest note about what the bar-walking videos record.

Three facts the panels corrected in my own earlier work:

- **`tests/e2e/harness/storyFinder.ts` exists** and already solves feed walking.
  `research.md` missed it and revision 1 planned to rebuild it.
- **The serial lane holds twelve spec files, not eleven**, and the extra one was
  not in the run behind the original baseline — so that baseline was stale.
- **The `--lane=<lane> <file>` command form is wrong**, and this project had
  already learned that once. Repeating it in a plan is how it gets learned a
  third time.

## Panel revision — round 3

Twelve majors, which **collapsed to five distinct problems** — the three lenses
were agreeing rather than finding fresh ground, which is what convergence looks
like. Three of the five made the plan smaller.

| # | Problem | Raised by | Closed by |
|---|---|---|---|
| 23 | Context strategy: revision 3 opened the jar four times as four "sellers" that were one account, handed back three times, and gave the sweep a context that may never exist | security, senior ×2, perf | **One live context** for the whole file; the sweep opens its own from the jar. Decision 4 rewritten. |
| 24 | The "seller list" read was undefined and its natural implementation fails **silently** — wrong endpoint, no `user_id` source, and a row shape the shared finder skips | security, senior | All three named under *Tests*, plus `E-4`'s rule applied to the absence side in `SST-07` and the sweep. |
| 25 | The budget did not add up: expected summed to 125–235 s, not the "130–200" claimed, and the ceilings were 50–75% of this suite's own measured numbers for the same work | perf ×2, senior | Ceilings raised to the house numbers; the poll window named at 6 × 4 s; arithmetic redone and shown. |
| 26 | `SST-04` duplicated an existing case — `STORY-03b` already proves a guest never sees this run's QA story, non-vacuously, **in this same lane** | perf | `AC-4` disposition is now `existing`. One case, one context and 20–35 s removed. |
| 27 | The Surface column said "proxy" for two rows, hiding the distinction decision 3 is built on — and `SST-02` reading the user feed would have answered `OQ-1` a case early | senior | Every row names its endpoint. |

Minors folded in: `ACCOUNT_LANE` named explicitly; the seed's 84–100 s per-iteration
cost written into step 5; the sweep given its own ceiling and context; `SST-05`
polls for the product link before judging it absent, since paused and missing are
otherwise identical; `AC-12`'s citation corrected — the lane-guard case proves
lane membership and nothing about settings or one-time codes; context-close and
video-finalisation cost added to the budget; and the bar's own five-page bound
stated as deliberate.

`spec.md` was corrected too: the body still said 3 minutes in `NFR-3` and `AC-11`
while Addendum 2 said 4. `/verify` must read one number.

### Where this leaves the plan

Three rounds found 34 majors. The first two rounds each introduced new faults
while fixing old ones — the dropped error hook, "handed back once", the wrapper
element, the sweep reading the wrong list were all *created* by a fix. Round 3
did not: its twelve findings collapsed to five problems, two lenses called the
plan implementable after specific edits, and one declined to manufacture
findings.

**A fourth round is not the best use of the next hour.** The remaining risk is
`OQ-1`, and no amount of reading settles it — only steps 1 to 5 do. If round 4
is wanted, it should read the *implementation*, not the plan.
