---
ticket: unit-tests-proxy-routing
stage: spec
mode: standard          # single workflow form — no other modes (ADR-011)
status: complete        # not_started | in_progress | blocked | complete
owner: developer
updated: 2026-08-10
links:
  clickup:
  github:
---

# Spec — unit-tests-proxy-routing

> Define *what* must be true when done. **No implementation details, no file
> names, no code.**

## Feature Name

Tests for the proxy — locale routing, country detection and crawler handling.

## Business Goal

The proxy runs on every single request and decides which language and country the
visitor lands on. A mistake here does not spoil one feature; it makes the whole
site unreachable for a language, or sends every visitor to the wrong country. It
has no tests today, so any change to it is a guess. This ticket turns the
behaviour it has right now into something a machine checks in seconds.

## User Story

> As a developer working on Trydos, I want the locale routing in the proxy
> covered by tests, so that a change to language or country handling is caught
> before it reaches a user.

## Functional Requirements

- **FR-1 — Which language the visitor gets.** The tests describe how the language
  is chosen: a supported language in the address wins; otherwise the browser's
  own preference is used when it is one of the four supported languages; otherwise
  it falls back to English. The four supported languages are `en`, `ar`, `tr` and
  `ku`.
- **FR-2 — Which country the visitor gets.** The tests describe how the country
  is chosen: valid saved values win; otherwise the country the request appears to
  come from; otherwise the default, `gb`. A country only counts when it is in the
  supported list, whatever letter case it arrives in.
- **FR-3 — Where the visitor is sent.** The tests describe when a request passes
  straight through and when it is redirected: a valid country-and-language pair in
  the address passes through; a missing or unsupported pair is redirected to an
  address that carries one; a saved country that differs from the address raises
  the country-change marker instead of silently switching; and a request that has
  already bounced too many times stops bouncing and lands on a default.
- **FR-4 — Crawlers.** The tests describe the separate path a crawler takes: a
  crawler that already has a valid pair passes through, and one that does not gets
  a permanent redirect to an address that has one. A crawler is never sent a
  country-change or "no country" marker.
- **FR-5 — The cookies the proxy leaves behind.** The tests describe every cookie
  it writes and the choice behind each one: the three locale cookies are readable
  by the browser on purpose; the visitor's IP address is not readable by page
  scripts, because it is personal data; the referring site is saved only when the
  visit really came from somewhere else; and the logout marker is cleared only on
  a real page render, never on a redirect hop.
- **FR-6 — The paths the proxy steps around.** The tests describe the addresses
  it deliberately leaves alone or sends elsewhere — the sitemap files, which must
  reach a crawler as raw XML and never as a redirect, and the robots address. The
  tests also describe which paths the proxy runs on at all, expressed as named
  paths that are in or out, not as the exact text of the setting.
- **FR-7 — Behaviour that is surprising but real.** Three behaviours found while
  reading are written down as tests of what the code does today, each marked in
  the test as a recorded finding rather than as wanted behaviour: any address
  containing the word `robots` is sent to the robots file; an address whose
  country-and-language pair contains a capital letter is permanently redirected to
  the lower-case form; and that redirect still carries the connection-warming
  headers meant for a page.

## Non-Functional Requirements

- **NFR-1 — No test reaches anything real.** No network call, no cache server, no
  real cookie write. A request nobody wrote a reply for must fail the test rather
  than go out.
- **NFR-2 — The same result every time.** The tests give the same result whatever
  order they run in and however many times they are run. Nothing one test leaves
  behind may change what the next one sees.
- **NFR-3 — Nothing else in the suite changes.** The tests that pass today still
  pass, in the same way, and the shared setup keeps working for every other test
  file.
- **NFR-4 — Readable when it fails.** A failing test says which rule broke in
  words, not by pointing at a number. Assertions are about the visible result —
  the address the visitor is sent to, the status, the cookie and its options — not
  about how the code is written inside.
- **NFR-5 — Fast enough to keep.** The tests stay part of the normal single run of
  the suite. None of them waits on a timer.

## Constraints

- **C-1 — The file under test never changes.** The proxy is not edited, tidied or
  refactored by this ticket. If part of it resists testing, that is written down
  as a finding and left alone.
- **C-2 — The file under test is a protected path.** Nothing inside the protected
  area may be added to or changed, so the test itself lives outside it.
- **C-3 — The tests describe `develop`.** The `main` branch carries a staging gate
  and a logo page that `develop` does not have. No test may assume that gate; it
  must stay green when the gate is reverted.
- **C-4 — Only what the file really exposes.** The proxy exposes the request
  function and its path setting, and nothing else. The tests reach the small
  helpers inside only by making requests, never by prying them open.
- **C-5 — Written in English**, like every artifact in this workflow.

## Edge Cases

- An address with no country-and-language pair at all, including the site root.
- A pair that looks right but names a country that is not supported, or a language
  that is not one of the four.
- A pair written with capital letters.
- No browser language preference sent at all, and a preference listing only
  languages the app does not have.
- Saved values that disagree with the address; saved values that are unsupported
  or damaged; the case where the address says `gb` but the saved country does not.
- A visit that carries a campaign marker, and a visit whose referring site is this
  same site.
- A request that has already bounced more than the allowed number of times.
- A crawler asking for a sitemap file under a locale-prefixed address.
- The supported-country list being unavailable, so the built-in fallback list is
  the one in use.

## Research Questions Resolved

> Required (SP-9). One row per `OQ-n` in `research.md` — none may be skipped.
> **Answered:** write the answer and where it lands (a requirement, an `AC-n`, a
> constraint, or Out of Scope). **Deferred:** the answer needs the approach, so
> `/plan` answers it (PL-12) — repeat it under Open Questions with the same ID.

| OQ | Answer | Lands in |
|------|--------|----------|
| OQ-1 | **Pushed back.** Which environment the tests run in is a matter of approach, and the spec must not choose it. What the spec does fix is the outcome: whatever is chosen must leave every other test file running exactly as it does today. | Open Questions (for `/plan`), bounded by NFR-3 and AC-14 |
| OQ-2 | **Pushed back.** How a test stops the background country lookup and clears what the file remembers between runs is an approach question. The spec fixes only the result it has to produce: nothing real is contacted, and the order tests run in makes no difference. | Open Questions (for `/plan`), bounded by NFR-1, NFR-2, AC-12 and AC-13 |
| OQ-3 | **Answered.** The path setting is described by naming paths that are in and paths that are out — an app address is in, and the excluded ones such as the API area, static files and the sitemap files are out. The exact text of the setting is **not** asserted, because a harmless edit to it would break the test for no reason. | FR-6, AC-11 |
| OQ-4 | **Answered.** There is no rewrite in the file, so no criterion covers one. The scope is: pass straight through, or redirect. The wording in the roadmap is wrong on this point and the ticket records that as a finding. | FR-3, AC-4, and Out of Scope |
| OQ-5 | **Answered.** This ticket changes no coverage setting — the file under test is already measured. The disagreement between the two testing documents (one says the measured list names files, the other now names whole folders) is recorded as a finding for someone to settle in its own ticket. | Out of Scope, plus a recorded finding |
| OQ-6 | **Answered.** The three surprising behaviours are pinned by tests, as what the code does today. Each is marked in the test as a recorded finding, so nobody reads it as wanted behaviour, and none of them is fixed here. | FR-7, AC-9, AC-10 |

## Open Questions

- **OQ-1** — Which environment do these tests run in, given that the file under
  test is server code and the whole suite runs in a browser-shaped one today?
  `/plan` answers this, and whatever it picks must satisfy NFR-3.
- **OQ-2** — How does a test stop the background country lookup from being
  attempted, and how does it clear what the file remembers between tests?
  `/plan` answers this, and whatever it picks must satisfy NFR-1 and NFR-2.

## Acceptance Criteria Mapping

> Give each criterion a stable ID (AC-1, AC-2, …); `verify.md` references these.

| ID | Acceptance criterion | Maps to requirement |
|------|----------------------|---------------------|
| AC-1 | Each of the four supported languages in the address is kept, and an unsupported one is not. | FR-1 |
| AC-2 | With no language in the address, the browser's stated preference is used when it is supported; when it is missing, empty or names only unsupported languages, English is used. | FR-1 |
| AC-3 | A supported country is accepted whatever letter case it arrives in; an unsupported one is refused and the default `gb` is used. Saved values are preferred over the country the request appears to come from, which is preferred over the default. | FR-2 |
| AC-4 | A request that already carries a valid country-and-language pair passes straight through with no redirect. A request without one is redirected to an address that has the pair in front of the original path, with the rest of the path and the query kept. No test asserts a rewrite, because the file performs none. | FR-3 |
| AC-5 | When the saved country differs from the one in the address, the visitor is redirected with the country-change marker naming both countries, instead of being switched silently. When the address says `gb` and the saved country is something else, the visitor is redirected to the saved country. | FR-3 |
| AC-6 | A request that has already bounced more than the allowed number of times is not bounced again by the same rule: it lands on a default address carrying the "no country" marker. | FR-3 |
| AC-7 | A crawler with a valid pair in the address passes through. A crawler without one gets a permanent redirect to an address that has one, and no country-change or "no country" marker is ever added for a crawler. | FR-4 |
| AC-8 | The three locale cookies are written so the browser can read them; the visitor's IP address is written so it cannot; the referring site is saved when the visit came from elsewhere and not when it came from this same site; and the logout marker is cleared on a pass-through but kept on a redirect hop. | FR-5 |
| AC-9 | A sitemap address passes straight through untouched, including when it sits behind a country-and-language prefix, so a crawler receives the raw file and never a redirect. | FR-6 |
| AC-10 | The three surprising behaviours are each covered by a test that states, in the test itself, that it records today's behaviour and not wanted behaviour: any address containing `robots` goes to the robots file; a pair containing a capital letter is permanently redirected to the lower-case form; and that redirect still carries the connection-warming headers. | FR-7 |
| AC-11 | The path setting is checked by naming paths that are in and paths that are out — an ordinary app address is in, and the API area, static files and the sitemap files are out. The exact text of the setting is not asserted. | FR-6 |
| AC-12 | Run the whole suite twice, and once more with the order shuffled: the result is the same every time. | NFR-2 |
| AC-13 | No test contacts anything outside the process. A request that nobody wrote a reply for fails the test instead of going out. | NFR-1 |
| AC-14 | The tests that passed before this ticket still pass afterwards, and no other test file has to change for the new one to run. | NFR-3 |
| AC-15 | Nothing inside the protected area is added to or changed, and the file under test is byte-for-byte the same as before. | C-1, C-2 |

## Out of Scope

- **Fixing anything.** Every oddity this ticket finds is pinned or written down,
  never corrected. A fix is its own ticket, with its own review.
- **Rewrites.** The file performs none, so no criterion covers one.
- **Coverage settings.** Nothing about how coverage is measured changes here, and
  settling which of the two testing documents is right about it belongs to its own
  ticket.
- **The staging gate on `main`.** Not described, not asserted.
- **The pages the proxy redirects to.** What the app renders once the visitor
  lands on a locale address is a different journey and a different phase.
- **Anything the proxy calls out to for real.** The behaviour of the country list
  service itself is not under test; only what the proxy does with what it gets
  back.
- **Speed and load.** How long the proxy takes on a real request is not measured
  here.
