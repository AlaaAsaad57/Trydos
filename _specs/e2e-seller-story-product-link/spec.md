---
ticket: e2e-seller-story-product-link
stage: spec
mode: standard          # single workflow form — no other modes (ADR-009)
status: complete
owner: developer
updated: 2026-09-22
links:
  clickup:
  github:
---

# Spec — e2e-seller-story-product-link

> Define *what* must be true when done. **No implementation details, no file
> names, no code.**

## Feature Name

A seller's story, its product, and the QA lock — proved end to end.

## Business Goal

A story with a product attached is how a seller turns attention into a visit to
what they sell. That path crosses four screens and two backends, and nothing
watches it today. When it breaks, nobody learns until a seller complains.

A second goal was claimed here while researching, and it was **wrong**. It is
left visible rather than deleted, because the record of a mistaken finding is
worth more than a tidy page — see the Correction at the end of this file.

## User Story

> As a seller, I want the story I upload with a product attached to appear where
> shoppers look and to carry a working button to that product, so that a story is
> a real way to reach what I am selling.

> As the owner of this repository, I want one browser journey that follows that
> whole path in a single run, so that a break anywhere along it names the step
> and the backend that broke — not "stories do not work".

## Functional Requirements

- **FR-1** A seller may open the Stories section of their own dashboard, and is
  told plainly when their account is not permitted to.
- **FR-2** A seller may upload a story carrying both a link and an attached
  product, and the stories backend keeps both.
- **FR-3** A story marked as test data is **shown** to a viewer on the QA viewer
  allow-list and **hidden** from every other viewer, on the **home stories
  feed**. The home feed is the surface every customer sees, and the story mark
  is the only thing keeping a test story off it. *(Narrowed on 2026-09-22 — the
  product page half of this requirement was withdrawn; see the Correction.)*
- **FR-4** A story with an attached product offers a button to that product, and
  the button leads to that product's own page.
- **FR-5** The product page's story section lists a story that is attached to
  that product.
- **FR-6** A seller may delete their own story, and the stories backend no longer
  holds it afterwards.

## Non-Functional Requirements

- **NFR-1 Every failure names its step and its backend.** This journey crosses
  the stories backend, the media server and the core backend. A failure that says
  only "the story was not found" is not finished work.
- **NFR-2 The journey leaves nothing behind.** The story it creates is removed
  even when an earlier step fails. Unlike a seller location, a story can be
  deleted, so there is no excuse for a leaked row.
- **NFR-3 A time budget.** The whole new journey completes in **4 minutes or
  less** on CI. *(Raised from 3 on 2026-09-22 — see Addendum 2.)* The reason is measured, not a preference: this work belongs in
  the lane that already sets the suite's wall time (30.3 minutes of tests against
  7 for the other lane, CI run 35664329326), so every minute added here is a
  minute added to the whole suite.
- **NFR-4 No new configuration.** The journey runs on the settings the harness
  already derives for itself. A new required setting would mean the journey
  silently skips on any machine that has not been told about it.
- **NFR-5 The journey does not spend a one-time code.** It reuses the seller
  session the QA seed already established.

## Constraints

- **C-1 The journey runs after the QA seed and takes its product from it.** It
  never searches for a product and never picks an unknown row. Stated by the
  owner, and it is also what makes the case stable: a search result changes from
  week to week, the seed's own product does not.
- **C-2 The story must be marked as test data.** It carries the QA link, so no
  real customer can ever see it. A story uploaded without that mark would be
  visible to everyone and must never be written by a test.
- **C-3 Application code may be changed** (owner, 2026-09-22), but only under the
  repository's existing rules: the fault is confirmed in the application first,
  and proved by a test that was **seen red** before the fix and green after.
- **C-4 If the stories backend does not place a seller's story into the home
  feed, that is a backend fault.** The case stays red and names the stories
  backend. It is not worked around, not skipped, and not softened. This follows
  the repository's standing rule for a backend fault and is written here because
  it is this ticket's largest risk — see `OQ-1`.
- **C-5 The unit suite is the home for anything provable without a backend.** It
  gates pull requests; the browser suite does not. The browser journey therefore
  covers only what genuinely needs a browser.

## Edge Cases

- **E-1 The seller lacks one of the story permissions.** The journey says which
  permission is missing, rather than failing on a button that was never drawn.
- **E-2 The QA seed did not run, or did not save a seller session.** The journey
  skips with the seed's own reason. It must never fall back to a real seller.
- **E-3 The story is not on the first page of the home feed.** The feed is walked
  a bounded number of pages before the case gives up — and it says how many it
  looked at.
- **E-4 The home feed answers nothing at all.** An empty feed must not be read as
  "the story is correctly hidden". The case proves the feed had content before it
  judges anything absent.
- **E-5 The upload is refused by the media server rather than the stories
  backend.** Two backends can refuse this one step, and the message says which.
- **E-6 An earlier step fails after the story exists.** The delete still runs.
- **E-7 The product page has no stories at all.** The section is not drawn in
  that case, so "the section is missing" and "the story is missing from the
  section" are different findings and must read differently.

## Research Questions Resolved

| OQ | Answer | Lands in |
|------|--------|----------|
| OQ-1 | **Not settled by reading, and it is the ticket's main risk.** The dashboard writes and reads a seller list; the home bar reads a user feed. Whether the backend files one into the other cannot be answered from this repository. The owner's own description of the journey says it does, and the save does carry the seller's own user id, which points the same way — but neither is proof. **Deferred to `/plan`**, which must measure it before the rest of the journey is built. Whatever the measurement says, `C-4` decides what happens next. | `C-4`, `AC-3`; repeated under Open Questions |
| OQ-2 | **Three pages.** The owner said the story may sit on page 2 or 3, so three is the bound that matches the request. Past that the case fails and says how many pages it read. "Keep paging until found" is refused: it has no bound and turns a clear failure into a timeout. | `E-3`, `AC-3` |
| OQ-3 | **The lane that runs serially, and a time budget.** The journey writes real rows and depends on the seed, so it cannot share a lane with work that runs several at once. The budget lives in `NFR-3` — **4 minutes**, raised from 3; see Addendum 2. | `NFR-3` |
| OQ-4 | **A photo.** A photo fixture already exists in the browser suite; no video fixture does, and adding one would put a large binary in the repository for no gain. The cost is accepted: a photo passes through a crop step that a video skips, so the journey has one more screen to drive. | `AC-2` |
| OQ-5 | **Yes — test hooks are added to the seller Stories screen.** Without them the journey matches translated words, which ties it to English and breaks the suite in Arabic. The exact list of hooks is an approach decision, so it is **deferred to `/plan`**. | Open Questions |
| OQ-6 | **The journey checks, and says which permission is missing.** It does not grant permissions and does not assume them. If the QA seller turns out to lack one, that is a finding about the seed or the account, reported as such. | `FR-1`, `E-1`, `AC-1` |
| OQ-7 | **Out of scope — answer revised 2026-09-22, see the Correction.** It is not a customer-facing leak: the QA product is filtered out of every discovery surface, so nothing leads a customer to the page that holds the story. The inconsistency between the five readers is real and is recorded as `BUG-1` for its own ticket. | Out of Scope; `BUG-1` |
| OQ-8 | **The backend is asked, not the screen.** A row leaving a list is a statement about a list. The journey confirms the stories backend no longer holds the story. | `FR-6`, `AC-9` |

## Open Questions

- **OQ-1** *(deferred to `/plan`)* — does a story created from the seller
  dashboard appear in the home stories feed? The plan must measure this before
  the journey that depends on it is written, and must say what it will do with
  each answer. `C-4` already fixes the answer for the "no" case.
- **OQ-5** *(deferred to `/plan`)* — which test hooks are added to the seller
  Stories screen. The plan must list them, because a hook the plan does not name
  cannot be added during implementation.

## Acceptance Criteria Mapping

| ID | Acceptance criterion | Maps to requirement |
|------|----------------------|---------------------|
| AC-1 | The QA seller opens the Stories section of their own dashboard. When the account lacks a story permission, the failure names **which** permission, rather than reporting a missing button. | FR-1, E-1 |
| AC-2 | A story is uploaded from that screen carrying the QA test-data link and the QA seed's own product. The stories backend afterwards holds that story with **both** the link and the product on it. A refusal names whether the media server or the stories backend refused. | FR-2, E-5 |
| AC-3 | Signed in as an account on the QA viewer allow-list, the uploaded story is found in the home stories feed within three pages. The case first proves the feed returned content, so an empty feed can never be mistaken for a hidden story. A failure names the stories backend and how many pages were read. | FR-3, E-3, E-4 |
| AC-4 | A visitor who is **not** on the QA viewer allow-list never sees that story in the home stories feed. | FR-3, C-2 |
| AC-5 | Opening the story shows a button leading to the attached product. Its absence is reported as "the story carries no product button", not as a navigation failure. | FR-4 |
| AC-6 | Pressing that button lands on the page of the QA seed's product — the same product that was attached, identified by name and not by position. | FR-4 |
| AC-7 | That product's page lists the uploaded story in its product story section, identified by the story's own id. "The section is absent" and "the section is present but does not hold this story" are reported as different findings. | FR-5, E-7 |
| AC-8 | **WITHDRAWN 2026-09-22 — see the Correction below.** The id is kept and never reused, so nothing that referenced it silently points at something else. | — |
| AC-9 | Deleting the story from the seller dashboard leaves the stories backend no longer holding it. The proof comes from the backend, not from the row leaving the screen. | FR-6 |
| AC-10 | The journey leaves no story behind on the environment, including when it fails part-way through. | NFR-2, E-6 |
| AC-11 | The new journey takes 4 minutes or less on CI, measured from the run's own report. | NFR-3 |
| AC-12 | The journey needs no setting that the harness does not already derive for itself, and spends no one-time code. | NFR-4, NFR-5 |

## Out of Scope

- **Changing who may see a test story.** The allow-list rule and the host that
  marks a story as test data both exist and are not touched.
- **The product page's story reader.** It does not apply the test-data filter,
  unlike the four other readers. That is recorded as `BUG-1` below and belongs
  to its own ticket. *(Moved here on 2026-09-22 — see the Correction.)*
- **Editing a story.** The journey uploads, reads and deletes. The dashboard's
  edit path, if any, is not covered.
- **Video stories.** See `OQ-4`.
- **The seller dashboard shell** — reaching the dashboard and moving between its
  sections is already covered by existing work and is reused, not rewritten.
- **Granting or repairing seller permissions.** The journey reports a missing
  permission; it does not fix one.
- **The story viewer's own behaviour** — timers, pausing, swiping between
  stories. Only the product button matters here.
- **Speeding up the existing suite.** Measured and discussed, but a separate
  concern; this ticket only agrees not to make it worse (`NFR-3`).

---

## Correction — 2026-09-22

**A finding recorded at `research` was wrong about its severity, and one
acceptance criterion has been withdrawn because of it.** The mistaken claim is
left in place above rather than deleted, so the next reader can see what was
believed and why it did not hold.

### What was claimed

That the product page's story section does not apply the test-data filter, and
that **therefore a test story is on a real customer's screen right now**.

### What is actually true

The first half is correct: the product page's story reader really is the only
one of five that does not apply the filter. The second half is wrong.

The owner pointed out that the product carrying the story is itself a QA
product, and a QA product is hidden from every surface a customer uses to find
anything. That is right, and the repository had already written it down. The
closed QA-lock ticket settled the exact question:

> `AC-9` — the QA product page opens by its own address for anyone, guest
> included — it is **not** a hole, because nothing links to it.
> — `_specs/e2e-production-safety-lock/spec.md:38`

So nothing leads a customer to that page. Search, the home page, the listing,
the sitemap and the catalogue route all drop the QA product. A story sitting on
that page adds nothing to an exposure the project had already looked at and
accepted.

**One nuance kept on the record, because it cuts the other way:** the page is
not *blocked*. Anyone holding the address opens it. That was a deliberate
choice, not an oversight, and this ticket does not revisit it.

### What changed in this spec

| | |
|---|---|
| `FR-3` | Narrowed to the home stories feed only. |
| `AC-8` | Withdrawn. The id is retired, never reused. |
| `OQ-7` | Answer reversed — out of scope, recorded as `BUG-1`. |
| `C-5` | No longer refers to a QA-filter fix. |
| Out of Scope | The product page's story reader moved here. |
| Business Goal | The second goal removed, with a pointer to this section. |

The ticket gets smaller and faster as a result, which serves the owner's stated
"stable and fast and correct".

### What did **not** change, and why

The home stories feed checks (`AC-3`, `AC-4`) stand exactly as written. A story
feed is not a product feed: the uploaded story appears under the seller's own
ring on the home page whatever the attached product's visibility is. The product
lock cannot reach it. The story mark is the only thing that keeps a test story
off a real customer's home page, which is precisely why the story lock was built
as a separate mechanism. Removing those checks because the product is hidden
would be reasoning from the wrong feed.

`AC-7` — the product page lists the story — also stands. It holds whether or not
the filter is ever added, because the test account is on the viewer allow-list
either way.

### BUG-1 — the product page's story reader skips the test-data filter

- **Where:** the server-side reader that fetches a product's stories, and the
  client component that pages it.
- **What:** it returns the backend's rows unchanged. The four other readers of a
  story feed all drop test stories first.
- **Impact today:** none that a customer can reach. Every story attached to a QA
  product sits behind `AC-9` above; and only a test ever creates a test story, so
  there is no path by which one lands on a real product.
- **Why it is still worth a ticket:** five readers of the same rule, and one
  behaves differently with nothing saying so. The next person to attach a story
  to something will not know which of the five they are looking at.
- **Disposition:** its own ticket. Not fixed here.

---

## Addendum — 2026-09-22, after the advisory panels

`NFR-3` quotes a measured baseline of 30.3 minutes for the serial lane, taken
from CI run 35664329326. **That number is stale.** The lane holds twelve spec
files today, and `orderRating.live.spec.ts` was not in the run behind the
figure. `AC-11` is judged against a fresh measurement rather than against 30.3
minutes. *(The budget itself was 3 minutes when this was written. Addendum 2
below raised it to 4 — read that one.)*
`plan.md`'s timing step takes that measurement.

The panels also confirmed that `AC-5` needed more than the spec implied. The
product button is drawn only when the story has a product **and** the viewer is
not paused, so "no product button" and "paused" look identical in the page.
`AC-5` still reads as written; the plan now names the test hook that makes it
provable.

---

## Addendum 2 — 2026-09-22, after the second advisory round

**`NFR-3` and `AC-11`: the budget moves from 3 minutes to 4.** The performance
lens estimated the journey case by case and got 125–215 seconds happy-path,
180–200 typical — so 3 minutes was a coin flip, not a budget. The two savings
revision 2 claimed (shared contexts, a shorter poll window) are worth about
15–25 seconds together, and the largest single cost, walking the stories bar,
was untouched. A budget that is met only on a good day tells `verify` nothing.
**4 minutes**, and `plan.md` carries the per-case numbers behind it.

**`AC-3` and `AC-4` read different surfaces, and the spec did not say so.**
`AC-3` is about what an allow-listed viewer sees, which is the rendered feed;
`AC-4` is about what a guest sees, which is also the rendered feed. The
unfiltered backend read answers neither — it answers `OQ-1`. A guest reading it
**finds** the story, so using it for `AC-4` would fail the case for the wrong
reason. Both criteria stand as written; `plan.md` now names the surface per
case.

**`E-4` applies to `AC-4` as well as `AC-3`.** Proving the feed had content
before judging a story absent matters most in the case that expects absence.
