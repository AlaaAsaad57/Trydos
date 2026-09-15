---
ticket: unit-tests-search-execution-and-filters
stage: spec
mode: standard          # single workflow form — no other modes (ADR-009)
status: complete        # not_started | in_progress | blocked | complete
owner: developer
updated: 2026-09-15
links:
  clickup:
  github:
---

# Spec — unit-tests-search-execution-and-filters

## In plain words

- **What must be true when this is done:** the search execution layer has tests
  that run without a search server. They pin the request the app sends, the
  answer it builds from the reply, and what it does when the search server
  refuses. Nothing in the app changes — this ticket adds tests only.
- **Each criterion in one line:**
  - `AC-1` — the listing search asks the catalog index — it is **not** a check on
    what the index contains.
  - `AC-2` — the page size sent equals the limit asked for — it is **not** a check
    on how many products come back.
  - `AC-3` — the shopper's chosen order reaches the search server — it is **not** a
    check that the results are in that order; the search server does the ordering.
  - `AC-4` — a page cursor is forwarded when given — it is **not** a check on the
    cursor's value.
  - `AC-5` — the cursor handed back is the last hit's sort value — it is **not**
    the same thing as `AC-4`, which is about the cursor coming in.
  - `AC-6` — a products-only request sends no facet work — it is **not** about
    `AC-7`, which is the opposite request.
  - `AC-7` — a facets-only request asks for zero products.
  - `AC-8` — with snapshot paging switched off, asking for it changes nothing —
    it is **not** a test of snapshot paging, which stays uncovered.
  - `AC-9` — a one-word search text never reaches the text analyzer.
  - `AC-10` — a multi-word search text reaches the analyzer exactly once.
  - `AC-11` — colours and sizes the analyzer finds are added to the filters with
    no duplicates.
  - `AC-12` — an analyzer failure still returns a result — it is **not** a check
    that the analyzer's answer was used.
  - `AC-13` — a product with no row in the asked-for language is left out.
  - `AC-14` — one product document becomes exactly one card, even with two rows
    for the same language.
  - `AC-15` — the total count comes from the search server's own total.
  - `AC-16` — a search term with results is recorded.
  - `AC-17` — a search term with no results is **not** recorded.
  - `AC-18` — a refused listing search raises an error that names the failure.
  - `AC-19` — a refused recommendation read returns an empty list and raises
    nothing — it is **not** the same contract as `AC-18`.
  - `AC-20` — a refused related-products search raises.
  - `AC-21` — an unknown product id gives an empty related list and asks the
    search server nothing further.
  - `AC-22` — a product with no gender-and-age pair gives an empty related list.
  - `AC-23` — the related search excludes the product the shopper is looking at.
  - `AC-24` — the related search asks for the product's own gender-and-age pairs,
    each once.
  - `AC-25` — a visitor with no account is served from the cold-start list.
  - `AC-26` — an account with no recommendation row falls back to the cold-start
    list.
  - `AC-27` — recommendation candidates are ordered by score, highest first.
  - `AC-28` — the recommendation cursor moves past everything it looked at.
- **Out of scope, in one line each:**
  - Snapshot paging and the global price aggregation, while both settings are off
    everywhere.
  - Any change to application code, including the two defects already recorded.
  - The query-building helpers, which already have 98 tests of their own.
- **Easy to confuse:**
  - `AC-4` is the cursor coming **in**; `AC-5` is the cursor going **out**.
  - `AC-6` skips the facets; `AC-7` skips the products. They are different
    requests, not two names for one.
  - `AC-18` raises, `AC-19` does not. Same kind of failure, two contracts.

> Define *what* must be true when done. **No implementation details, no file
> names, no code.**

## Feature Name

Unit tests for search execution, pagination, and filter application.

## Business Goal

Search and the listing page are how a shopper finds anything. The code that runs
the search has no test today, so a change to it reaches staging unnoticed. The
unit suite is the only check that gates a pull request, so a test here is the
only automatic warning the team gets. This ticket buys that warning.

It also pins behaviour that is easy to break by accident and expensive to notice:
which order the shopper asked for, which page they are on, and whether a refused
search is reported or swallowed.

## User Story

> As a shopper, I want the listing and the search results to be built from what
> I asked for, so that the page I get is the page I wanted.

> As an engineer, I want a change to the search layer to break a test before it
> reaches staging, so that I learn about it from the suite and not from a
> shopper.

## Functional Requirements

- **FR-1 — The request matches the ask.** The index, the page size, the order,
  and the page cursor the app sends are the ones the caller asked for.
- **FR-2 — The two cheap request shapes stay cheap.** A products-only request
  does no facet work; a facets-only request fetches no products.
- **FR-3 — Settings that are off stay off.** Asking for a behaviour whose setting
  is switched off changes nothing about the request.
- **FR-4 — The search text is analyzed only when it is worth analyzing**, and
  what the analyzer finds is added to the filters without duplicates.
- **FR-5 — An analyzer failure never fails the search.**
- **FR-6 — The reply becomes one card per product**, in the language asked for,
  and products with no row in that language are left out.
- **FR-7 — The total and the next-page cursor are the search server's own
  values**, not values the app made up.
- **FR-8 — A search term is recorded only when it found something.**
- **FR-9 — Each of the three entry points keeps its own failure contract:** the
  two listing paths raise, the recommendation path returns an empty list.
- **FR-10 — The related-products search is built from the product's own
  categories**, excludes that product, and stops early when there is nothing to
  build from.
- **FR-11 — Recommendations fall back to the cold-start list** when there is no
  account or no row for it, and keep the candidates in score order.

## Non-Functional Requirements

- **No network.** No test may reach a real search server, a real model service or
  any other address. The runner already fails any request nobody answered.
- **No credential in any output.** Assertion text is published to the team chat
  on every push to `develop` and `main`, so no key, token or address secret may
  appear in a message.
- **Every assertion carries a message** that names the step and, where a backend
  is involved, which one. One assertion per step.
- **No assertion on a count** of steps or items where the thing meant can be
  named instead.
- **Deterministic.** No test may depend on the clock, the time zone, or the order
  test files run in.
- **The suite stays green.** 157 files and 2,541 tests pass today; this ticket
  adds to that number and breaks none of it.

## Constraints

- **No application code changes.** This ticket writes tests only. Any defect a
  test uncovers is recorded and given its own ticket.
- **One test file per unit.** The unit under test has no test file today, so a
  new one is correct; no existing test file may be duplicated.
- **The expected-failure marker may not be used.** It was probed in an earlier
  ticket and cannot tell a real defect from a broken stand-in. A recorded defect
  is written as an ordinary strict check on the value that arrives today.
- **Settings read once at start-up may not be changed mid-test.** Any criterion
  about them has to be expressed through behaviour that does not need the setting
  moved.

## Edge Cases

- A reply with no hits at all: the cursor handed back must be empty, not
  undefined.
- A product document holding two rows for the same language: exactly one card.
- A product document holding no row for the asked-for language: no card.
- A search text of exactly one word, and one of several words.
- An analyzer that answers with a single colour, and one that answers with a
  list: both must end up as a list, with no repeats.
- An analyzer that fails outright.
- A related-products lookup for an id that matches nothing.
- A product whose categories carry no gender or no age group.
- A product whose categories repeat the same gender-and-age pair.
- A recommendation candidate whose id is not a number.
- A recommendation list shorter than the page asked for.

## Research Questions Resolved

| OQ   | Answer | Lands in |
|------|--------|----------|
| OQ-1 | **Yes.** The runner keeps Node's own `process` object: its jsdom setup copies browser keys onto the global and never replaces `process` (`node_modules/vitest/dist/chunks/index.DC7d2Pf8.js:236-248`). Two tests that pass today already call `process.cwd()` at run time (`tests/components/NewLoginLogo.test.tsx:316`, `tests/scripts/unitReportTreeSize.test.ts:32`). So the high-resolution clock the unit under test calls on its first line is available, and nothing is blocked. | Constraints — no longer a risk. |
| OQ-2 | **All three entry points.** The listing search, the related-products search and the recommendation reader share one set of stand-ins, so the two smaller ones cost little once the first is set up. Leaving them out would leave the file half covered and need a second roadmap row. | `AC-19` to `AC-28`. |
| OQ-3 | **No — both stay out.** Snapshot paging and the global price aggregation are switched off in every environment, and their settings are read once at start-up, so a criterion about them cannot be written without moving the setting. `AC-8` pins the **off** behaviour instead, so a setting turned on by accident breaks a test. | `AC-8`; Out of Scope. |
| OQ-4 | **Record, do not fix.** This plan changes no application file, so nothing is in the change list and every defect found is a finding by the scope rule. If a check shows the related-categories reply raises for an age group or gender the list does not hold, it is recorded as a numbered defect with its own ticket. | Constraints; Out of Scope. |
| OQ-5 | **Record, do not fix.** The wrong label on the analyzer failure log is the same case as `OQ-4`: a finding, with its own ticket. It is not a criterion, because a shopper cannot see it. | Out of Scope. |
| OQ-6 | **`logic-change`.** No application file changes, so a production build would prove nothing that types and the unit suite do not already prove. | Deferred to `/plan`, which names the profile (PL-13). |
| OQ-7 | **Yes — the request is asserted, not only the answer.** The order, the page size, the cursor and the two cheap request shapes are all decisions carried in the request, and a criterion that reads only the returned object cannot see them. | `AC-1` to `AC-8`, `AC-23`, `AC-24`. |

## Open Questions

- **OQ-6** — deferred to `/plan`. The answer above is the intended profile, but
  naming a validation profile is the plan's job, not the spec's (PL-13).

## Acceptance Criteria Mapping

| ID   | Acceptance criterion | Maps to requirement | Could pass wrongly if |
|------|----------------------|---------------------|-----------------------|
| AC-1 | The listing search asks the catalog index, taken from the shared index name rather than written out again | FR-1 | The check compares against a literal copied from the source, so a renamed index passes on both sides. It must compare against the shared name the app itself imports. |
| AC-2 | The page size sent equals the limit the caller asked for | FR-1 | The default limit and the asked-for limit are the same number, so the request would look right even if the caller's value were dropped. The value asked for must differ from the default. |
| AC-3 | The order the shopper chose reaches the search server as that order's rule | FR-1 | The relevance fallback is used for an order nobody recognises, and it is also the default. A check that only asserts "an order was sent" goes green when the chosen one was thrown away. |
| AC-4 | A page cursor given by the caller is forwarded with the request, and no cursor is sent when none was given | FR-1 | Both halves must be checked. Asserting only that a cursor arrives cannot see the app sending an empty one on the first page, which the search server reads as a real position. |
| AC-5 | The cursor handed back is the sort value of the last hit, and is empty when there are no hits | FR-7 | A reply built with one hit makes "the last hit" and "the first hit" the same object, so the check passes even if the wrong end is read. The reply must hold more than one hit, with different sort values. |
| AC-6 | A products-only request sends no facet work and asks for no bounded total | FR-2 | Facet work is absent from a request that never had any, so the check must start from a request that would have carried it. |
| AC-7 | A facets-only request asks for zero products | FR-2 | Zero products also come back when the reply is empty. The check has to read the request, not the answer. |
| AC-8 | Asking for snapshot paging while the setting is off leaves the request unchanged: it still names the index and carries no snapshot | FR-3 | The request is also unchanged when snapshot paging is never asked for. The caller must ask for it, so the check sees the setting refuse rather than the feature go unused. |
| AC-9 | A search text of one word does not reach the text analyzer | FR-4 | An analyzer stand-in that was never going to be called passes this by accident. The same stand-in must be shown to be reachable by a case that does call it. |
| AC-10 | A search text of several words reaches the analyzer exactly once | FR-4 | Counting calls proves little on its own; the check must show the analyzed text reached the filters, so a call that was made and ignored is still a failure. |
| AC-11 | A colour or size the analyzer returns is added to the filters, whether it answers with one value or a list, and a value already present is not repeated | FR-4 | A case using a colour the caller did not already ask for cannot see a duplicate being made. One case must start from filters that already hold the value. |
| AC-12 | A failing analyzer still produces a result, and the search is not reported as failed | FR-5 | The search would also succeed if the analyzer were never called. The failure must come from a call the check can show happened. |
| AC-13 | A product with no row in the language asked for produces no card | FR-6 | An empty card list is also what an empty reply gives. The reply must hold a product that has rows — just not in that language. |
| AC-14 | A product document holding two rows for the same language produces exactly one card | FR-6 | Asserting a count of one is the weak form; the check must name the card that survived, so the wrong row winning still fails. |
| AC-15 | The total reported is the search server's own total | FR-7 | The number of hits in the reply and the total are easy to make equal by accident. The reply must carry a total that differs from the number of hits it holds. |
| AC-16 | A search term that found products is recorded | FR-8 | The recorder reads the visitor's request headers, which are absent in a test and swallowed by its own error handling. A check that watches for the recording's side effect would see nothing either way; it must watch the call. |
| AC-17 | A search term that found nothing is not recorded | FR-8 | A recorder stand-in that is broken records nothing for every case. `AC-16` must be shown green with the same stand-in. |
| AC-18 | A refused listing search raises an error carrying the search server's own message | FR-9 | Asserting only that something was raised passes for a mistake in the test itself, such as a missing stand-in. The message must be shown to carry the refusal's own text. |
| AC-19 | A refused recommendation read returns an empty product list and raises nothing | FR-9 | An empty list is also the answer when there are no candidates at all. The check must show the refusal happened. |
| AC-20 | A refused related-products search raises | FR-9 | Same trap as `AC-18`: the raised error must be shown to carry the refusal's message. |
| AC-21 | A related-products lookup for an id that matches nothing returns an empty result, and no second search is made | FR-10 | The empty result alone does not prove the app stopped early. The check must show only one search was made. |
| AC-22 | A product whose categories carry no gender-and-age pair returns an empty result, and no second search is made | FR-10 | Same as `AC-21`, and it must use a product that **has** categories, so the check does not pass on a missing field instead of a missing pair. |
| AC-23 | The related search excludes the product the shopper is looking at | FR-10 | The product is also absent from a reply that never held it. The check must read the request. |
| AC-24 | The related search asks for the gender-and-age pairs the product's own categories carry, each pair once | FR-10 | A product with one pair cannot show duplicates being removed. The product must carry the same pair twice. |
| AC-25 | A visitor with no account is served from the cold-start list | FR-11 | Both lists answer the same shape, so the check must name which list was asked for. |
| AC-26 | An account with no recommendation row falls back to the cold-start list | FR-11 | The fallback and the no-account path end in the same place. The check must show the account's own list was asked for first. |
| AC-27 | Recommendation candidates are ordered by score, highest first | FR-11 | Candidates supplied already in order pass without any sorting happening. The supplied order must be wrong on purpose. |
| AC-28 | The recommendation cursor moves past every candidate the reader looked at, not only those it kept | FR-11 | With every candidate kept, the two numbers are the same. At least one candidate must be dropped. |

## Out of Scope

- **Any change to application code.** This ticket writes tests only.
- **Snapshot paging** (the point-in-time path, including its one retry) — its
  setting is off everywhere and is read once at start-up. `AC-8` pins the off
  behaviour; the on behaviour stays uncovered, and this spec says so rather than
  implying otherwise.
- **The global price aggregation path** — same reason, same setting shape.
- **The query-building helpers** — already covered by 98 tests. Their file must
  not gain a second test file.
- **The two defects already found** — the analyzer failure log naming the wrong
  service, and the unguarded reads in the related-categories reply. Both are
  recorded as findings with their own tickets, and neither is fixed here.
- **The listing price-sort mismatch** — the known defect where the order key and
  the shown price disagree. The roadmap says a test here records it and does not
  fix it.
- **The browser suite.** Nothing in this ticket runs a browser or reaches
  staging.
