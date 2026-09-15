---
ticket: unit-tests-search-execution-and-filters
stage: research
mode: standard          # single workflow form — no other modes (ADR-009)
status: complete        # not_started | in_progress | blocked | complete
owner: ai_agent
updated: 2026-09-15
links:
  clickup:
  github:
---

# Research — unit-tests-search-execution-and-filters

## In plain words


- **What this ticket touches:** one file, `services/elastic/elasticSearch.ts`.
  It is the code that runs a search against Elasticsearch and turns the answer
  into a listing page. It has 1,188 lines, three exported functions, and no test
  at all today. Nine places in the app call it.
- **The facts that matter most:**
  - The file is a Server Action module — `"use server"` sits on line 1
    (`services/elastic/elasticSearch.ts:1`).
  - Importing it builds two real Elasticsearch clients, because the config file
    builds them at module load (`services/elastic/elasticsearch.config.ts:26`
    and `:28`). A test must stand that module in.
  - Three settings are read **once, at module load**, not per call
    (`elasticSearch.ts:151`, `:159`, `:161`). Changing one inside a test does
    nothing unless the module is loaded again.
  - The three exports fail in **two different ways**. The two listing functions
    throw (`:729`, `:1181`); the recommendation function swallows the error and
    returns an empty list (`:921`).
  - A model already exists. `tests/serverRequests/product.test.ts:96` stands in
    the same Elasticsearch client, so the seam is proven, not guessed.
- **What I could not check:** whether `process.hrtime.bigint()` works under this
  runner's jsdom environment. The file calls it on every path
  (`elasticSearch.ts:237`), and no module with a test uses it today (`OQ-1`).
- **Easy to confuse:**
  - `services/elastic/elasticSearch.ts` (runs the search) vs
    `services/elastic/helpers.ts` (builds the query pieces, already has 98 tests).
  - `services/search.ts` (a small client-side service, tested) vs this file.
  - `noFilters` (skip the facets) vs `noProducts` (skip the product hits) — both
    exist, and they are not opposites.

> Read-only phase. **No implementation is allowed in this command.**

## Goal

Find out what a unit test for the search execution layer has to stand in, what
it can assert, and which traps have already cost an earlier ticket time.

## Relevant directories

- `services/elastic/` — the search code. The ticket's one target lives here, next
  to the helpers that already have tests.
- `tests/services/elastic/` — where the mirror test file will go if the plan
  follows the naming convention.
- `tests/serverRequests/` — holds the model file for this work,
  `product.test.ts`, which already stands in the Elasticsearch client.
- `_specs/unit-tests-product-detail-data/` — the closest earlier ticket. Its
  review found ten `major` traps, most of which apply here too.

## Relevant config files

- `vitest.config.mts` — the `unit` project: environment, setup file, env block,
  timeout (`:82`–`:95`).
- `tests/setup.ts` — what every test file gets before it runs.
- `.claude/project-config.yaml` — the validation profiles `/verify` can run
  (`:56`–`:96`).
- `services/elastic/INDEXES.ts` — the index names the queries use.

## Possibly affected services

- **None at runtime.** This ticket adds test files only. No source file changes,
  so no service behaviour moves.
- The **search and listing** path is the subject. If a test proves today's
  behaviour wrong, that is a finding and a separate ticket, not a fix here.

## Verified facts

| # | Fact (one sentence) | Evidence (`path:line`) | How checked |
|---|---------------------|------------------------|-------------|
| F-1 | The file is a Server Action module: `"use server"` is its first line, so every export is async and callable from a client component. | `services/elastic/elasticSearch.ts:1` | opened file |
| F-2 | It holds three exported functions and six module-local ones. | `elasticSearch.ts:169,192,213,745,802,829,935,946,957,1008` | opened file |
| F-3 | No test imports it today; the only mention in `tests/` is a sentence inside a comment. | `tests/cache/noRuntimeReadsInCachedTree.test.ts:220` | ran search `getProductsAndFiltersFromElastic` over `tests/` |
| F-4 | Importing the client config builds **two** real Elasticsearch clients at module load. | `services/elastic/elasticsearch.config.ts:26,28` | opened file |
| F-5 | `ELASTICSEARCH_NODE` is not in the unit env block, so an unmocked client would point at `http://localhost:9200`. | `vitest.config.mts:57-75`; `elasticsearch.config.ts:7` | opened both; ran search `ELASTICSEARCH_NODE` |
| F-6 | Three settings are read at module load, not per call: the snapshot flag, its keep-alive, and the price-aggregation flag. | `elasticSearch.ts:151,152,159` | opened file |
| F-7 | The debug flag is switched off in production by the expression itself, so it can never log there. | `elasticSearch.ts:161-162` | opened file |
| F-8 | `runListingSearch` retries **once**, and only when a snapshot id was already active; with no snapshot it rethrows immediately. | `elasticSearch.ts:192-211` | opened file |
| F-9 | `openListingPit` answers `null` on failure and reports the error, rather than throwing. | `elasticSearch.ts:169-186` | opened file |
| F-10 | The search-text analyzer runs only when the text holds more than one word. | `elasticSearch.ts:246` | opened file |
| F-11 | An analyzer failure is caught, logged, and does **not** fail the search. | `elasticSearch.ts:280-285` | opened file |
| F-12 | `getProductsAndFiltersFromElastic` throws `Search failed: <message>` for any error inside its main block. | `elasticSearch.ts:729-735` | opened file |
| F-13 | `GetRecomendationsForUser` never throws — it returns `{ products: [], limit, offset: [] }`. | `elasticSearch.ts:921-927` | opened file |
| F-14 | `getRelatedProducts` returns an empty result when the product id matches nothing. | `elasticSearch.ts:1034-1042` | opened file |
| F-15 | `getRelatedProducts` returns an empty result when the product has no category carrying both a gender and an age group. | `elasticSearch.ts:1065-1073` | opened file |
| F-16 | `getRelatedProducts` excludes the product itself through `must_not`, and throws on any other error. | `elasticSearch.ts:1098`, `:1181-1186` | opened file |
| F-17 | `noFilters` drops the aggregations, asks for no total count, and returns early without any facet work. | `elasticSearch.ts:309,328,538-553` | opened file |
| F-18 | `noProducts` sets the page size to zero, independently of the price-aggregation flag. | `elasticSearch.ts:332` | opened file |
| F-19 | The search term is logged only when the text is non-empty **and** the total is above zero. | `elasticSearch.ts:677-690` | opened file |
| F-20 | `logSearchTerm` calls `headers()` from `next/headers`, inside its own `try`/`catch`, so a failure there is swallowed. | `services/elastic/helpers.ts:2,2868,2893` | opened file |
| F-21 | Importing `helpers.ts` under the unit runner already works, so `next/headers` at import time is not a problem — only calling it is. | `tests/services/elastic/helpers.test.ts` (98 cases, green) | ran `npx vitest run --project unit tests/services/elastic/helpers.test.ts` |
| F-22 | The analyzer calls a real address and reads a real key, so it must be stood in. | `services/elastic/analyzeSearchTextCerebras.ts:9,65` | opened file |
| F-23 | The unit project is `jsdom`, loads `tests/setup.ts`, and allows 15 s per test. | `vitest.config.mts:84,88,95` | opened file |
| F-24 | The fake network fails any request nobody wrote a reply for. | `tests/setup.ts:93` | opened file |
| F-25 | The runner sets no global mock reset, so a stand-in keeps its state between cases unless the file clears it. | `vitest.config.mts` — no `clearMocks`, `mockReset` or `restoreMocks` | ran search over the file |
| F-26 | A model file already stands in this exact client, with `get`, `search` and `count` — but no `openPointInTime`. | `tests/serverRequests/product.test.ts:96-101` | opened file |
| F-27 | `it.fails()` is not a strict expected-failure marker here: an earlier ticket probed it and all three failure kinds reported "expected fail". | `_specs/unit-tests-product-detail-data/plan.md:210-224` | opened file |
| F-28 | The unit suite is green before this ticket starts: 157 files, 2,541 tests. | run of `pnpm test:run`, 2026-09-15, exit code 0 | ran the command |
| F-29 | The log message for an analyzer failure still says "Gemini", although the analyzer imported is the Cerebras one. | `elasticSearch.ts:3` vs `:283` | opened file |
| F-30 | The related-categories answer reads `GroupAgeEnum[s.group_age].label` and `GenderEnum[s.gender].label` with no guard, so an age group the enum does not hold would throw inside the response builder. | `elasticSearch.ts:704-705` | opened file |
| F-31 | Five of the six targets the roadmap row names already have tests; only `elasticSearch.ts` has none. | `tests/store/searchReducer.test.ts`, `tests/store/listingReducer.test.ts`, `tests/utils/listing/filterItemState.test.ts`, `tests/utils/normalizeListingProduct.test.ts`, `tests/utils/searchPathRedirect.test.ts` | listed the test tree |
| F-32 | All three exports have live callers, so none of them is dead code. | see the Shared things table below | ran search on the three names |

## Shared things (found by search)

| Search term | Hits (`path:line`) | Who uses it / what it does there |
|-------------|--------------------|----------------------------------|
| `getProductsAndFiltersFromElastic` | `serverRequests/listing/index.tsx:15,81,143`; `serverRequests/home.tsx:143,170`; `app/(client)/[lang]/featured/[[...filters]]/page.tsx:107`; `app/(client)/[lang]/flashDeals/[[...filters]]/page.tsx:113`; `app/api/products/featured/route.ts:71`; `app/api/products/searchInCatalog/route.ts:99`; `components/Listing/FiltersPageContent.tsx:181` | Seven call sites across server readers, two pages, two API routes and **one client component** — the filters panel calls it as a Server Action. |
| `GetRecomendationsForUser` | `serverRequests/home.tsx:21,107`; `app/api/products/recomended/route.tsx:66` | The home page's recommended rows and the mobile route. |
| `getRelatedProducts` | `serverRequests/listing/index.tsx:203`; `app/api/related-products/[id]/route.ts:76` | The product page's related strip and its API route. |
| `elasticSearchClient` | `services/elastic/elasticsearch.config.ts:26`; `services/elastic/elasticSearch.ts:2`; `services/elastic/helpers.ts:3`; `services/elastic/elasticsearch-reader.service.ts:2`; `serverRequests/product.tsx:12`; `serverRequests/Search.tsx:5`; `serverRequests/meta/listing.tsx:1` | One shared client, imported by seven modules. Standing in the config module therefore reaches all of them at once. |
| `ELASTIC_LISTING_PIT` | `elasticSearch.ts:147,151` (`ELASTIC_LISTING_PIT_KEEPALIVE` at `:152`) | Read only here. Not set anywhere in the repo, so it is off in every environment today. |
| `LISTING_PRICE_AGG_ENABLED` | `elasticSearch.ts:159`; `docs/listing-perf-tier-c-followups.md:22`; `price-filter-es-handoff.md:27,34`; `docs/superpowers/plans/2026-07-01-listing-pages-refactor.md:622` | Read only in the source file; the rest are documents describing it. |
| `LISTING_PRICE_AGG_DEBUG` | `elasticSearch.ts:161,162,467` | The only place it is used (`:467`) is commented out. |
| `CEREBRAS_API_KEY` | `services/elastic/analyzeSearchTextCerebras.ts:65` | One read. Absent from the unit env block, so it is `undefined` in a test. |
| `ELASTICSEARCH_NODE` | `services/elastic/elasticsearch.config.ts:7`; `tests/e2e/harness/health.ts:130`; `tests/e2e/harness/env.ts:47` | The browser suite checks it; the unit suite never sets it. |
| `catalog_index` | `services/elastic/INDEXES.ts:1`; `elasticSearch.ts:172,305,808,1014,1104` | The index name every listing query carries. A test can assert against the imported constant instead of a literal. |
| `logSearchTerm` | `services/elastic/helpers.ts:2868` (definition); `elasticSearch.ts:17,682` | Called from one place, on one branch. |

## Test harness facts

- **Runner and config:** `vitest`, project `unit` — `vitest.config.mts:82`. Run
  with `pnpm test:run` (`package.json:test:run`).
- **Environment:** `jsdom` — `vitest.config.mts:84`. Note this file is server
  code; nothing in it needs a DOM, but it will run in one.
- **Setup files and global mocks:** `tests/setup.ts` — `vitest.config.mts:88`.
  It stands in `next/navigation` (`:33`), `serverActions/sendOtp` (`:42`) and
  `serverRequests/radis` (`:49`), adds `window.matchMedia` (`:70`), clears
  rendered markup after each case (`:104`), and starts the fake network (`:83`).
- **Env block / base URLs:** `vitest.config.mts:57-75`. It sets only
  `NEXT_PUBLIC_*` values. **No `ELASTICSEARCH_NODE`, no `CEREBRAS_API_KEY`, no
  listing flags** — so the client defaults to `http://localhost:9200`
  (`elasticsearch.config.ts:7`) and both feature flags are off.
- **Polyfills present / missing:** `window.matchMedia` present
  (`tests/setup.ts:70`). Nothing else is added — an earlier ticket found
  `IntersectionObserver` missing (`_specs/unit-tests-price-resolution/review.md`,
  performance `major`). Not needed by this ticket's target.
- **Timers:** real. Nothing in `tests/setup.ts` or `vitest.config.mts` enables
  fake timers, so a file that wants them switches them on itself.
- **Module reset:** no global reset. `vitest.config.mts` sets none of
  `clearMocks`, `mockReset`, `restoreMocks` (F-25), so each file clears its own
  stand-ins. `mockClear()` does **not** drain a queued `mockResolvedValueOnce`;
  only `mockReset()` does — `_specs/unit-tests-product-detail-data/review.md:71`
  (M-9).
- **Default timeouts:** test 15,000 ms — `vitest.config.mts:95`. Hook timeout is
  not set, so it is vitest's default. The model file lowers both to 5,000 ms in
  the file itself — `tests/serverRequests/product.test.ts:53`.
- **Strict expected-failure marker:** **there is none that works.** `it.fails()`
  was probed and rejected (F-27). The repo's accepted pattern for a `BUG-n` is an
  ordinary strict case asserting the value that arrives today, with a message
  naming the bug id and saying a change here means the bug is fixed —
  `_specs/unit-tests-product-detail-data/plan.md:204-207`.
- **Test layout and naming:** every test lives under `tests/`, mirroring the
  source path — `tests/services/elastic/helpers.test.ts` covers
  `services/elastic/helpers.ts`. As of this session no test file sits beside its
  source (checked with `git ls-files "*.test.ts" | grep -v "^tests/"` → empty).
  So the mirror path for this ticket is
  `tests/services/elastic/elasticSearch.test.ts`.

## Test / validation commands available

- `pnpm test:run` — the unit suite, the only check that gates a pull request.
- `pnpm lint` — ESLint, including the i18n key rules.
- `node_modules/.bin/tsc --noEmit --pretty false` — types.
- `pnpm lint:i18n-parity` — translation files stay key-parallel.
- `pnpm build` — production build; catches server/client boundary errors.
- Profiles that group these: `ui-change`, `logic-change`, `full` —
  `.claude/project-config.yaml:56-96`. A plan names at most one.

## Known traps

| Trap | Source (`CLAUDE.md` section / `_specs/<slug>/review.md` row) | What the plan must do |
|------|--------------------------------------------------------------|-----------------------|
| An assertion message is **published** to the team chat on every push to `develop`/`main`. | `_specs/unit-tests-product-detail-data/review.md:63` (M-1) | Put no token, phone number, key or other credential in a message. Nothing this file handles is a credential, but the rule still binds. |
| `it.fails()` cannot tell "the defect is still here" from "my stand-in is broken". | `_specs/unit-tests-product-detail-data/review.md:64` (M-2) | If a `BUG-n` is found, write it as a strict case on today's value with the bug id in the message. Never `it.fails()`. |
| Stand-ins leak between cases, because the runner resets nothing globally. | `_specs/unit-tests-product-detail-data/review.md:67` (M-5), `:68` (M-6) | Sweep every stand-in with `mockReset()` in `beforeEach` — not `mockClear()`. |
| A value frozen at module load cannot be changed by a `beforeEach` stub. | `_specs/unit-tests-product-detail-data/review.md:69` (M-7) | The two listing flags and the keep-alive are read at load (F-6). To test a flag-on path, stub the env in `vi.hoisted()` above the imports, or load the module again. |
| A static top-level import runs before the stand-in factory is ready, giving a `ReferenceError`. | `_specs/unit-tests-product-detail-data/review.md:70` (M-8) | Import the module under test lazily with `await import(...)`, the pattern the model file uses. |
| A test may not reach a real backend; an unhandled request fails the run. | `CLAUDE.md` — "Data fetching"; `tests/setup.ts:93` | Stand in `services/elastic/elasticsearch.config` **and** the Cerebras analyzer. Neither may be left real. |
| A test for code with no caller is forbidden. | `CLAUDE.md` — repository rules; memory `no-tests-for-dead-code` | Satisfied: all three exports have callers (F-32). Record it in the spec rather than re-proving it. |
| A failure must name the step and, when a backend is involved, which backend. | `CLAUDE.md` — "Testing — MANDATORY" | Every assertion carries a message. One assertion per step. Never assert on a count. |
| A test proving existing behaviour wrong is a finding, not a fix. | `CLAUDE.md` — workflow section (IM-12 / VF-12, ADR-027); `docs/testing/UNIT_TEST_ROADMAP.md:379` | F-29 and F-30 are candidates. Record as `BUG-n` and open a separate ticket; do not change the source here. |
| A second test file for a unit that already has one is a defect. | `CLAUDE.md` — workflow section (PL-14) | `services/elastic/elasticSearch.ts` has no test file, so a **new** file is right. Do not touch `tests/services/elastic/helpers.test.ts`, which covers a different module. |
| Never name the backing technology in anything that reaches the client. | `CLAUDE.md` — "Stack-agnostic naming" | Test names and messages describe the search server by role, not by vendor. |

## Risks and unknowns

- **The file is large and does several jobs at once.** 1,188 lines, three
  exports, and a main function of about 520 lines (`:213`–`:737`). One ticket
  covering all of it may be too big; the roadmap allows a re-cut here
  (`docs/testing/UNIT_TEST_ROADMAP.md:462-465`). Likelihood: high. Impact:
  a plan that cannot be finished in one go.
- **The snapshot pagination path has never run anywhere.** `ELASTIC_LISTING_PIT`
  is set in no environment (Shared things table), so the code at `:353`–`:368`
  and the retry at `:192`–`:211` are unexercised in production as well as in
  tests. A test would be the first thing to run it, and may find it broken.
  Likelihood: medium. Impact: a finding, not a fix.
- **The price-aggregation path is also flag-off.** Same shape as above, at
  `:342`–`:487`.
- **`process.hrtime.bigint()` under jsdom is unverified** — see `OQ-1`. If it is
  missing, every test of every export fails at the first line of the function
  body, and the fix is a runner-level decision, not a test-level one.
  Likelihood: low. Impact: high if it happens.
- **A stale comment now points at nothing.** `vitest.config.mts:87-90` explains
  the default include pattern by naming "utils/functions.test.tsx, the one
  colocated leftover". That file was moved into `tests/` earlier in this session,
  so no colocated test remains. The comment is wrong but harmless, and fixing it
  is outside this ticket's scope. Recorded so nobody reads it as a fact.

## Open questions

| ID   | Question | Why it matters |
|------|----------|----------------|
| OQ-1 | Does `process.hrtime.bigint()` work in the `unit` project's `jsdom` environment? | Every export calls it on its first line (`elasticSearch.ts:237`, `:838`, `:1022`). No module with a test uses it today, so this is unproven (EV-10). If it does not work, the whole ticket is blocked until the runner question is answered. |
| OQ-2 | Does this ticket cover all three exports, or only `getProductsAndFiltersFromElastic`? | The two smaller exports are about 90 and 180 lines and fail in different ways (F-12, F-13). Covering all three roughly doubles the work; covering one leaves two untested and needs a follow-up row in the roadmap. |
| OQ-3 | Do the two flag-on paths — snapshot pagination and price aggregation — belong in this ticket? | They are read at module load (F-6), so testing them needs `vi.hoisted()` env stubs or a second module load, and the client stand-in needs `openPointInTime`, which the model file does not have (F-26). Both are off everywhere today. |
| OQ-4 | `GroupAgeEnum[s.group_age].label` and `GenderEnum[s.gender].label` have no guard (F-30). If a test shows it throws for an age group the enum does not hold, is that a `BUG-n` recorded here, or out of scope? | The file is the one under test, so the scope rule says a fault inside it is this ticket's to record. The fix would still be a separate ticket, because this plan changes no source. |
| OQ-5 | The analyzer failure log says "Gemini" while the analyzer is Cerebras (F-29). Record it as a finding, or leave it? | It is a wrong log label, not wrong behaviour. It costs one line to record and nothing to ignore, but a silent skip is how it survives another year. |
| OQ-6 | Which validation profile does `/verify` run — `logic-change` or `full`? | This ticket adds test files only and changes no source, so `full` would run a production build for nothing. `logic-change` covers lint, types and the unit suite. |
| OQ-7 | Should the ticket assert the **query sent** to the search server, as well as the answer returned? | The query is where sorting, pagination and filters are decided, and the stand-in can capture it (the model file keeps `lastCountQuery`, `product.test.ts:91`). Asserting only the returned shape would leave the sort key and the snapshot scoping unproven. |

## Notes

- No code was changed during research.
- No observability runtime configs were modified.
- The only file written in this stage is this artifact.
