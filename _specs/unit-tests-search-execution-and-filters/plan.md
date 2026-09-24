---
ticket: unit-tests-search-execution-and-filters
stage: plan
mode: standard          # single workflow form — no other modes (ADR-009)
status: complete        # not_started | in_progress | blocked | complete
owner: developer
updated: 2026-09-15
links:
  clickup:
  github:
---

# Plan — unit-tests-search-execution-and-filters

## In plain words

- **What we will do and why:** add one test file for the code that runs a search,
  and change nothing in the app. That file has 1,188 lines and no test today, and
  nine places in the app call it. The tests stand in the search server, the text
  analyzer, the error reporter and the search-term recorder, then drive the three
  real entry points and read **the request that was sent** as well as the answer
  that came back.
- **Each file and why it changes:**
  - `tests/services/elastic/elasticSearch.test.ts` — new, and the only file. 28
    cases, one per `AC-n`.
- **Each criterion and its test:** all 28 are `new`, all in that one file, because
  the unit has no test file today. The `Tests` table above carries one row each,
  with the reason it would be red on old code and the guard that stops it passing
  for the wrong reason. The five worth reading twice: `AC-19`, `AC-25` and `AC-26`
  (the recommendation reader swallows every error, so a request-only check passes
  while the flow is broken), `AC-27` (the wrong array shuffled proves nothing),
  and `AC-5` (the router is a map, not a queue).
- **What else touches these files:** nothing at run time — no app file changes.
  Seven other modules import the same search client, `serverRequests/meta/home.ts`
  reads the same index, and `logSearchTerm` has a second caller in
  `serverRequests/Search.tsx`. None is tested here. Four existing test files
  already stand in the same client module, each with its own copy, which is the
  convention this file follows.
- **Rollback in one line:** delete the one new file; the suite goes back to 157
  files and 2,541 tests.
- **Numbers to remember:** 28 criteria → 28 cases; 2,541 + 28 = 2,569 tests;
  157 + 1 = 158 files; 5,000 ms per test in this file, against the project's
  15,000 ms; about 1–2 s added to a 237.66 s run.
- **Revision after CHANGES_REQUESTED:** the review gate returned this plan for two
  false-green guards. Both are now fixed and both lenses confirmed them closed
  against the source. `AC-19` must show the reporter got the recommendation
  scenario **and** the refusal's own words; `AC-20` must show the raised message
  carries the refused search's text. Eight smaller follow-ups came with them, and
  the revision round raised nine more minors, all folded in.
- **Plan-check majors and what we did:** 15 majors across three rounds, all fixed,
  none kept open.
  - The file would have run in the wrong environment — fixed, `node` on line 1.
  - Two flags the plan called "off everywhere" are `true` in `.env.development` —
    fixed, the test pins them itself.
  - No green test loads the real `next/headers` — fixed, it is stood in.
  - Answers keyed by index served the wrong call in three flows — fixed, routed
    per call with a named marker, and the router throws on an unrouted call.
  - The facet cases needed an exact fixture shape or they fail as "Search
    failed:" — fixed, the shape is named field by field.
  - `AC-7` never said which request shape it drives — fixed.
  - `AC-27` was wrong twice: the field sat at the wrong level, then the wrong
    array was shuffled — both fixed.
  - The query was recorded by reference while the unit kept changing it — fixed,
    `structuredClone`.
  - A shared reply fixture would be written into by the unit itself — fixed, a
    factory per case, and replies are copied too.
  - The answer tables were never reset, so the cases would depend on order —
    fixed.
  - `AC-25` and `AC-26` could pass while the flow broke — fixed, they now also
    check the reporter and a non-empty list.
- **Easy to confuse:**
  - `noFilters` skips the facets; `noProducts` skips the products. Different
    requests, not two names for one.
  - The grid-only request returns early, before the recorder ever runs — so the
    two search-log criteria cannot use it.
  - `AC-18` raises, `AC-19` does not. Same failure, two contracts.

> Decide the approach before changing code. Plan only — no implementation here.

## Approach

Add **one** new test file for the search execution layer, and change nothing
else. It stands in the search-server client, the text analyzer, the error
reporter and the search-term recorder, then drives the three real exports and
reads **the request that was sent** as well as the answer that came back.

The query-building helpers stay **real**, because half the criteria are about a
decision those helpers encode — the order rule, the filter conditions. Standing
them in would leave the checks asserting the stand-in. Only the one helper that
reaches for request headers is replaced, through a partial stand-in.

Most cases drive the grid-only request shape, which returns early and never
touches the category aggregation machinery. That keeps the reply fixtures small.
Four criteria — the facets-only shape, the total, and the two search-log ones —
need the full facet path, and they share one fuller fixture.

Alternatives rejected: standing in the whole helpers module (the checks would
prove nothing about the query); a test per export in three files (a unit gets one
file — PL-14); adding builders to the shared fixtures folder (a bigger change,
and it would drag the fixtures parity test in).

## Steps

1. Create `tests/services/elastic/elasticSearch.test.ts` with
   `// @vitest-environment node` as **line 1**. The unit is server code and needs
   no DOM — evidence: `tests/serverRequests/product.test.ts:1`; project default is
   `jsdom` (`vitest.config.mts:84`). The shared setup file stays safe under `node`:
   its `window` block is guarded (`tests/setup.ts:70`) and the render clean-up
   no-ops with nothing mounted (`:105`).
2. Lower the per-test and per-hook timeout in the file to 5,000 ms — evidence:
   `tests/serverRequests/product.test.ts:53`; project default 15,000 ms at
   `vitest.config.mts:95`.
3. In `vi.hoisted()`, above every import, pin `ELASTIC_LISTING_PIT` and
   `LISTING_PRICE_AGG_ENABLED` to `"false"`, and `ELASTICSEARCH_NODE`,
   `ELASTICSEARCH_USERNAME`, `ELASTICSEARCH_PASSWORD` and `CEREBRAS_API_KEY` to
   fake values, with `ELASTICSEARCH_NODE` set to **loopback on a closed
   port** (`http://127.0.0.1:1`). If the client stand-in ever misses, the search
   client's own transport may not be covered by the fake network — it is
   `UndiciConnection` by default, not global `fetch` — and without this pin the
   config would fall back to `http://localhost:9200`
   (`services/elastic/elasticsearch.config.ts:7`). A closed loopback port makes
   the miss fail at once and locally, as connection-refused — **FA-6**. Do not
   swap it for a reachable host. Both flags are read once at load
   (`elasticSearch.ts:151,159`) and are `true` in `.env.development:102,107`.
   **This pin is defence in depth, not a fix for today's runner:** vitest runs in
   `test` mode, which loads `.env` and `.env.local` only, and neither holds these
   keys — so the flags are already off today. The pin is what stops that from
   being luck. The hoisted pin is the whole of it: nothing clears these stubs
   (`mockReset()` does not touch `vi.stubEnv`, and the runner sets no
   `unstubEnvs`), and the unit is loaded once, so a `beforeEach` re-apply would
   repeat work that cannot have been undone — **FA-9**. Do not add
   `vi.unstubAllEnvs()` to this file.
4. Stand in `next/headers`, as the sibling helpers test does. Step 10 loads the
   real helpers module, whose **second** import is `next/headers` — evidence:
   `tests/services/elastic/helpers.test.ts:23`; `services/elastic/helpers.ts:2`.
5. Stand in `services/elastic/elasticsearch.config` with a client whose `search`
   and `openPointInTime` are spies. The model file's stand-in has `get`, `search`
   and `count` but no `openPointInTime`, which the snapshot path calls — evidence:
   `tests/serverRequests/product.test.ts:96-101`; `elasticSearch.ts:171`. The
   factory also exports `elasticSearchComment`, as the model does (`:102`) —
   nothing in this graph reads it, so a miss would be a `TypeError`, not network.
6. **Deep-copy the query inside the spy before recording it**, and **deep-copy
   each reply before returning it**, with `structuredClone` — not
   `JSON.parse(JSON.stringify(...))`, which drops keys whose value is `undefined`
   and would weaken the three "the field is absent" checks (`AC-4`, `AC-6`,
   `AC-8`). Two different hazards:
   - The unit mutates a query object after the call on the retry path
     (`elasticSearch.ts:204`), and it pushes into the shared condition arrays in
     the related flow (`:1090`, `:1103`). The `delete searchQuery.index` at `:366`
     runs *before* the call, so it is not one of these.
   - **Every fixture is plain data** — no `vi.fn`, no getter, no class instance —
     because this rule binds every reply, not only the facet one (**FA-10**).
     `structuredClone` **throws** on a function, and that throw is swallowed at
     `elasticSearch.ts:737`, `:926-931` and `:1182` depending on the flow. A getter
     is evaluated and a class instance becomes a plain object: neither throws, but
     neither is the reply the case thought it wrote.
   - The unit writes **into the reply**: the card builder assigns a fixture's own
     brand object onto the card and then writes `is_verified` onto it
     (`services/elastic/helpers.ts:466-470`). A reply fixture shared between cases
     would be changed by whichever case ran first.
7. **Route the stand-in's answers per call, naming the marker per flow.** **Two**
   flows read `catalog_index` twice, and `size` alone cannot separate them. The
   third — the recommendation flow — reads it only once (`elasticSearch.ts:816`)
   and is handled by index alone:
   - the main listing search vs the children aggregation — both carry an
     `aggs.filtered_results` root and both can be `size: 0`; the **main** query
     carries `track_scores`, `sort` and `_source`, the children query does not
     (`elasticSearch.ts:304` vs `services/elastic/helpers.ts:2369-2379`);
   - the related-products lookup vs its related search — route on the presence of
     `sort` (`elasticSearch.ts:1026` vs `:1106`);
   - the recommendation flow — route it by **index alone**. Its three reads use
     three different indexes (`recommendation_index`, `recommendation_cold_index`,
     `catalog_index` at `elasticSearch.ts:756`, `:761`, `:816`), and no case runs
     more than one refill round now that `AC-28` is single-round, so the per-round
     `terms.id` marker has nothing left to separate — **FA-8**.

   The router **throws** `no stand-in answer for <marker>` on an unrouted call, as
   the model file does (`tests/serverRequests/product.test.ts:76-83`), so a wrong
   route fails by name instead of as `Search failed:`.
8. Stand in the text analyzer at the specifier
   `services/elastic/analyzeSearchTextCerebras`, supplying `default` because the
   module is a default export. The unit imports it relatively
   (`elasticSearch.ts:3`). A stand-in is matched by **resolved absolute path**, so
   a relative specifier written from the test file names a different path and
   throws at collection — noisy rather than dangerous, but the named specifier is
   what makes the stand-in apply at all. Evidence:
   `services/elastic/analyzeSearchTextCerebras.ts:34,9,65`.
9. Stand in the error reporter at the specifier `utils/serverErrorReporter`,
   exporting **both** `LogServerError` and `default` — evidence:
   `tests/serverRequests/product.test.ts:106-109`; calls at
   `elasticSearch.ts:177,281,733,927,1178`. Naming it matters more under the
   `node` environment of step 1: the real reporter returns early only when
   `window` is defined (`utils/serverErrorReporter.ts:97`), so without a DOM it
   would carry on and post the whole error object.
10. Stand in **only** `logSearchTerm` from the helpers module, at the specifier
    `services/elastic/helpers`, through a partial stand-in that spreads the
    original. The unit imports it relatively (`elasticSearch.ts:30`), and a
    stand-in is matched by resolved absolute path, so the named specifier is what
    makes it apply. Every other export stays real, including
    `getChildrenAndGrandchildren`, which is **not** pure — it runs its own search
    (`services/elastic/helpers.ts:2352,2369`), and step 7 routes that call.
    Evidence for standing in the recorder: its `headers()` call at
    `services/elastic/helpers.ts:2894`.
11. Import the unit under test **lazily**, inside the cases, with
    `await import(...)` — evidence: `research.md > Known traps`, row M-8.
12. Sweep every stand-in with `mockReset()` in `beforeEach`. Each dispatcher must
    be **`vi.fn`'s own argument**, not installed later with `mockImplementation`:
    `mockReset()` keeps the former and wipes the latter, and every case after the
    first would then read `undefined` — evidence:
    `tests/serverRequests/product.test.ts:85-94`; `vitest.config.mts` sets no
    `clearMocks` / `mockReset` / `restoreMocks`. Per-case answers live in tables
    the router reads, so resetting the spy never removes the routing — which is
    why `beforeEach` must **also re-initialise every answer table to empty** and
    every recorded-query variable to `null`, as the model file does
    (`tests/serverRequests/product.test.ts:159-161`). Without that, a leftover
    answer serves a call the current case never routed, the router's throw never
    fires, and the 28 cases become order-dependent.
    **Never add `vi.resetModules()`** — it would re-read the two flags after the
    stubs are gone.
13. Suppress `console.error` in the **analyzer** cases only, with
    `vi.spyOn(console, "error").mockImplementation(() => {})`, restored in the
    same case — a bare `vi.spyOn` calls through, so the noise would still print,
    and with no global restore the spy would leak into later cases. Those are the only
    branches that print (`elasticSearch.ts:243-247`, `:283`); the three failure
    criteria report through the stood-in reporter and print nothing.
14. Write `AC-1` to `AC-6`, `AC-8`, `AC-13`, `AC-14` and `AC-18` against the
    **grid-only** request (`noFilters: true`), which returns early and never
    reaches the category aggregation code — evidence: the early return at
    `elasticSearch.ts:538`, ahead of the aggregation read at `:555`.
15. Write `AC-7`, `AC-15`, `AC-16` and `AC-17` against the **facet** request
    (`noFilters: false`; `AC-7` adds `noProducts: true`). All four need code past
    the early return: the facet request keeps its aggregations, the recorder runs
    at `:685`, and a grid-only request asks for no total at all (`:309`), so a
    total asserted there would pin a reply shape production never sends.
16. Build the facet fixture from a **factory called per case**, carrying:
    - `hits.hits` (may be empty), read with no guard at `elasticSearch.ts:380`.
      `hits.total.value` is optional-chained at `:381`, so a missing total yields
      `undefined` rather than a throw — `AC-15` supplies it because it asserts it,
      not because the code needs it;
    - `top_categories.filtered_categories.categories_by_id.buckets` — the **one**
      unguarded bucket array (`:559-563`, `.buckets.map` with no `?.`). Every
      other facet bucket falls back to `[]` (`:578-581`, `:649`, `:654-655`,
      `:660-661`, `:665-666`), so only this one must be present. Keep it **empty**
      unless a case needs categories: each bucket is read as
      `s?.category_details.hits.hits[0]._source.category_id`, with no guard after
      the `s?.`, so a half-built bucket fails all four facet cases as
      `Search failed:`. A non-empty bucket must carry that whole path — **FA-3**;
    - a separate reply for the children call carrying
      `aggregations.filtered_results`, which that helper returns unguarded
      (`services/elastic/helpers.ts:2471`);
    - an **empty** `top_orig_categories.orig_categories_by_id.buckets` and no
      `global_related_scope`, so the related list stays empty and the unguarded
      enum reads at `elasticSearch.ts:704-705` never run;
    - `images`, `colors` and `sync_color_images` on each product — for a
      realistic card, **not** to avoid a throw: `parseJsonField` returns `[]` for
      a missing value (`services/elastic/helpers.ts:786-787`, used at `:432`).
      `colors` is copied straight across with no fallback (`:433`), but a missing
      one still cannot throw: the normalizer handles both shapes (`:316-321`) and
      the two colour-sort helpers guard their input (`:2771`, `:2820`).

    Any throw on this path is swallowed into `Search failed:` at
    `elasticSearch.ts:737`, which would fail these cases for a reason that is not
    theirs.
17. Write `AC-9` to `AC-12` against the analyzer spy, using the grid-only shape —
    evidence: the word-count condition at `elasticSearch.ts:240`; the catch at
    `:280-284`. `AC-12` asserts the reporter **was** called with the analyzer
    failure (`:281`) and **was not** called with the search-failure payload
    (`:733-736`). The two are distinguishable, so the criterion's second half is
    proved rather than dropped.
18. Write `AC-19` and `AC-25` to `AC-28` against the recommendation reader, with a
    small explicit `limit` and a short candidate list, so the refill loop runs a
    known number of rounds instead of the default 50 (`elasticSearch.ts:834`).
    Four things this reader forces:
    - **Every reply carries `hits.hits`** (empty allowed). `response.hits.hits` is read
      unguarded three times — `.length` at `:783`, `?.[0]?._source` at `:792`, and
      `.map` at `:823` — and any throw is swallowed (see below). `AC-26`'s first call
      answers `hits: { hits: [] }`.
    - **`AC-27`'s fixture puts `product_id` and a matching `language_code` on each
      `_source.custom_products[]` row**, because the card is a spread of that row
      (`services/elastic/helpers.ts:404`, field list at `:85`) and the final sort
      reads `product_id` off the card (`elasticSearch.ts:906-912`). On `_source`
      it is dropped and every lookup returns -1. **No row's `id` may appear anywhere in
      the candidate id list.** The in-loop sort keys on `id`
      (`elasticSearch.ts:886-889`) and `custom_products.id` is a real source field
      (`helpers.ts:84`), so any `id` that matches *some* candidate returns a real
      index, the loop re-sorts, and it can land on score order by accident — the
      very no-op this exists to stop. Every `indexOf` must return -1, so arrival
      order survives into the final sort — **FA-4**.
    - **The array that must arrive out of score order is the batch reply's
      `hits.hits`**, not the localized rows: the card builder picks the single row
      whose language matches (`elasticSearch.ts:972-973`), so row order never
      reaches the output. If `hits.hits` already arrives in score order, the final
      sort is a no-op and the case passes proving nothing.
    - **Exactly one round, in all four cases.** `limit` equals the candidate
      count and the batch reply returns every id it was asked for, so the loop
      exits at `:851` after a single pass. For `AC-28` one candidate is dropped, so
      "looked at" and "kept" differ within that one round. Leaving the round count
      open would let a short batch reply fire a second `catalog_index` read, which
      the index-keyed map would answer with the same reply — duplicated products,
      and `AC-25` / `AC-26` still passing on "non-empty".
19. Write `AC-20` to `AC-24` against the related-products search. `AC-20` lets the
    first lookup answer and only the second search refuse, then asserts both calls
    happened — otherwise the case passes on the lookup at `elasticSearch.ts:1026`
    and never reaches `:1106`.
20. Give every assertion a message naming the step, and the search server where
    one is involved. **Never assert on a whole client, config, environment or
    reporter-payload object:** the recorder is handed the live client
    (`elasticSearch.ts:685-692`), and one reporter call passes the raw search
    error, which carries connection metadata (`:177-180`). Assert named fields
    only — `scenario`, `type`, or the message string — never the object —
    **FA-7**. The `error` field may be asserted **only where the source narrows it
    to a string** (`:735`, `:929`); never on the snapshot-opener call (`:177-180`),
    where it is the raw error object. And where a payload string begins with a
    vendor name (`:281`), match the fake failure text inside it with
    `stringContaining` — never the whole literal, which would write that vendor
    into the published output. Case titles and messages name services by
    role, never by vendor — evidence: `CLAUDE.md` "Testing — MANDATORY" and
    "Stack-agnostic naming"; the notify job at `.github/workflows/tests.yml:165-175`.
21. Run the `logic-change` profile and record the exit code per `AC-n`.

## Files to change

- `tests/services/elastic/elasticSearch.test.ts` — **new.** 28 cases, one per
  `AC-n`, grouped into `describe` blocks by the requirement they map to
  (`spec.md` FR-1 to FR-11). The only file this ticket touches.

## Integration surface

- **Components / shared config touched:** none at run time. This ticket adds a
  test file and changes no application file, so nothing the app ships moves.
  - The stand-ins the new file installs are scoped to its own module graph: a
    `vi.mock` call applies to the file that declares it. Evidence that this is the
    repo's convention rather than an assumption: four separate test files each
    declare their own stand-in of the same config module (listed below), and
    `vitest.config.mts` sets no `pool` or `isolate` override, so per-file
    isolation is the default. Note this covers **modules**, not `process.env`:
    `vi.stubEnv` writes to the worker's environment and survives module
    isolation. The conclusion still holds, because no unit file reads the six
    pinned names — only the browser-suite harness does, and that is excluded from
    this run.
- **Who else depends on them** — search term `getProductsAndFiltersFromElastic`:
  `serverRequests/listing/index.tsx:15,81,143`, `serverRequests/home.tsx:143,170`,
  `app/(client)/[lang]/featured/[[...filters]]/page.tsx:107`,
  `app/(client)/[lang]/flashDeals/[[...filters]]/page.tsx:113`,
  `app/api/products/featured/route.ts:71`,
  `app/api/products/searchInCatalog/route.ts:99`,
  `components/Listing/FiltersPageContent.tsx:181`. Search term
  `GetRecomendationsForUser`: `serverRequests/home.tsx:21,107`,
  `app/api/products/recomended/route.tsx:66`. Search term `getRelatedProducts`:
  `serverRequests/listing/index.tsx:203`,
  `app/api/related-products/[id]/route.ts:76`. **All nine are readers only.**
  None of them changes here; they are listed because a test that pins the wrong
  behaviour would mislead every one of them.
- **Overlapping flows** — search term `elasticSearchClient`: **seven** other
  modules import the same client — `services/elastic/helpers.ts:3`,
  `services/elastic/elasticsearch-reader.service.ts:2`,
  `services/elastic/sitemap.service.ts:4`,
  `utils/pagesDataRequests/ProductPageData.ts:2`,
  `serverRequests/product.tsx:12`, `serverRequests/Search.tsx:5`,
  `serverRequests/meta/listing.tsx:1` — plus the config that builds it
  (`services/elastic/elasticsearch.config.ts:26`). Two of the seven —
  `sitemap.service.ts` and `ProductPageData.ts` — were missed by the research
  table and are added here.
- **Other readers of the same index and config** — `serverRequests/meta/home.ts`
  reads `catalog_index` (`:10,159,199`) and imports `elasticSearchComment` from
  the same config file (`:3`); `logSearchTerm` has a second call site outside the
  unit at `serverRequests/Search.tsx:21,415`. Both were missed by the research
  table, and neither is tested here — search terms `catalog_index`,
  `logSearchTerm`.
- **Four test files already stand in the same config module** —
  `tests/services/elastic/helpers.test.ts:24`,
  `tests/services/elastic/sitemapService.test.ts:18`,
  `tests/serverRequests/product.test.ts:96`,
  `tests/serverRequests/meta/home.test.ts:29`. Each declares its own, which is the
  convention this file follows — search term `elasticsearch.config`. **Out of scope:** this ticket
  does not test them, and its stand-in is scoped to its own file.
- **Shared reporting artifact** — the 28 new case names join the CI unit-report
  tree that is sent to the team chat. `scripts/unit-report.mjs` clips it and
  `tests/scripts/unitReportTreeSize.test.ts:30` caps it at 131,072 bytes, so a
  much larger tree could push other files' lines off the message. 28 short names
  are far inside the cap; recorded because the artifact is shared, not because it
  needs action — search term `unitReportTreeSize`.
- **Ordering / lockstep dependencies:** none. One new file, no source change, no
  migration, nothing that must land with it.
- **What breaks if this is wrong:** a wrong assertion here does not break the
  app — it produces a test that passes while the search is broken, or one that
  fails while the search is fine. The first is the dangerous one, which is why
  every row below carries a false-green guard.
- **Out of scope from the search table, with reasons:** search terms
  `ELASTIC_LISTING_PIT`, `ELASTIC_LISTING_PIT_KEEPALIVE`,
  `LISTING_PRICE_AGG_ENABLED` and `LISTING_PRICE_AGG_DEBUG` — each is read once
  at module load (`elasticSearch.ts:151,152,159,161`), so no case can turn one on
  without reloading the module. Three of them are `true` in `.env.development` —
  `ELASTIC_LISTING_PIT` (`:102`), `LISTING_PRICE_AGG_DEBUG` (`:106`) and
  `LISTING_PRICE_AGG_ENABLED` (`:107`) — which is why step 3 pins them rather
  than assuming. The debug flag has no effect today: its only use
  (`elasticSearch.ts:467-486`) is commented out. `AC-8` pins the off behaviour instead. Search terms
  `CEREBRAS_API_KEY` and `ELASTICSEARCH_NODE` — neither is set by the runner
  (`vitest.config.mts:57-75`), and both reach a real service, which is why the
  two modules that read them are stood in (steps 3 and 5). Search term
  `catalog_index` — in scope, used by `AC-1`. Its full hit list inside the unit is
  `elasticSearch.ts:172,304,420,566,816,1026,1106`; the research table named five
  of the seven, and `:420` (the price-histogram request) and `:566` (the children
  aggregation) are added here. `:420` stays out of scope with the price
  aggregation path; `:566` is handled by step 7.

## Numbers

| Number | Value | Inputs (`path:line`) | Arithmetic |
|--------|-------|----------------------|------------|
| Acceptance criteria | 28 | `spec.md > Acceptance Criteria Mapping`, `AC-1`…`AC-28` | count of rows |
| New test cases | 28 | one case per `AC-n`, this file's Tests table | 28 criteria × 1 case = 28 |
| Test files after this ticket | 158 | 157 today (run of `pnpm test:run`, 2026-09-15) | 157 + 1 new file = 158 |
| Tests after this ticket | 2,569 | 2,541 today (same run) | 2,541 + 28 = 2,569 |
| Per-test timeout in the new file | 5,000 ms | project default 15,000 ms `vitest.config.mts:95`; model file `tests/serverRequests/product.test.ts:53` | the model's value, not the default — a stand-in that never answers fails 3× sooner (15,000 ÷ 5,000 = 3) |
| Bounded total asked for on a facet request | 10,000 | `elasticSearch.ts:309` | the source's own constant; `AC-6` asserts the grid-only request sends `false` instead |
| Page size used in `AC-2` | 7 | default limit 10 at `elasticSearch.ts:217` | any value ≠ 10; 7 chosen so a dropped argument cannot pass |
| Added wall time | about 1–2 s | suite run 237.66 s over 157 files, 2026-09-15 | 237.66 ÷ 157 ≈ 1.5 s per file, nearly all of it environment plus module load; the `node` environment (step 1) is the cheaper of the two |

## Tests

| AC | Existing coverage found | Disposition | Test file | Test case / name | Red on old code because | False-green guard |
|------|-------------------------|-------------|-----------|------------------|-------------------------|-------------------|
| AC-1 | `none — searched tests/ for getProductsAndFiltersFromElastic; only a comment at tests/cache/noRuntimeReadsInCachedTree.test.ts:220` | new | `tests/services/elastic/elasticSearch.test.ts` | asks the catalog index | No case reads the request today; with no call recorded the assertion has nothing to read | Compares against `catalog_index` imported from `services/elastic/INDEXES`, never a literal string |
| AC-2 | `none — same search` | new | same | sends the page size that was asked for | Nothing asserts the request's size today | Asks for 7, not the default 10 (`elasticSearch.ts:217`), so a dropped argument cannot pass |
| AC-3 | `none — same search` | new | same | sends the order the shopper chose | Nothing asserts the order rule reaches the server | Asserts the price rule by name, not "an order was sent"; the relevance fallback is asserted as a **different** value in the same case |
| AC-4 | `none — same search` | new | same | forwards a page cursor, and sends none on the first page | Nothing reads the request's cursor | Two assertions in one step: present with a cursor, **absent** without one |
| AC-5 | `none — same search` | new | same | hands back the last hit's sort value, and an empty cursor with no hits | Nothing reads the returned cursor | Three hits with different sort values, so first and last differ. The no-hit half re-points the answer table before the second drive (`elasticSearch.ts:385`) — the router is a marker-to-answer map, not a queue, so without re-pointing the second drive would read the three-hit reply |
| AC-6 | `none — same search` | new | same | a grid-only request sends no facet work | Nothing reads the request today | Starts from a request that would carry facets, then asserts both the missing aggregations and the unbounded-total flag |
| AC-7 | `none — same search` | new | same | a facets-only request asks for zero products | Nothing reads the request today | Drives the real facets-only shape (`noProducts: true`, `noFilters: false`), so the aggregations are still present; reads the request's size, not the answer's product count |
| AC-8 | `none — same search` | new | same | asking for snapshot paging while it is off changes nothing | Nothing exercises this path | The case **asks** for snapshot paging, and asserts the snapshot opener was never called as well as the request still naming the index. Step 3 pins the flag to `"false"`, so this pins the **code path**, not the environment — it cannot catch a flag switched on in a deployment |
| AC-9 | `none — same search` | new | same | a one-word search text does not reach the analyzer | The analyzer spy does not exist yet | Asserts the spy was not called, and `AC-10` proves the same spy is reachable |
| AC-10 | `none — same search` | new | same | a multi-word search text reaches the analyzer once | Same | Asserts the analyzed name arrives in the request's conditions, so a call that was ignored still fails |
| AC-11 | `none — same search` | new | same | analyzer colours and sizes merge with no repeats | Same | Starts from filters already holding the colour the analyzer returns, and runs once with a single value and once with a list, re-pointing the answer table between the two drives |
| AC-12 | `none — same search` | new | same | a failing analyzer still returns a result | Same | Asserts the call resolved, the spy was called, the reporter got the **analyzer** failure (`elasticSearch.ts:281`), and the reporter did **not** get the search-failure payload (`:733-736`) — so "not reported as failed" is proved, not dropped |
| AC-13 | `none — same search` | new | same | a product with no row in the language gives no card | Nothing drives the reply shaping today | The reply holds a product that **has** rows, in another language |
| AC-14 | `none — same search` | new | same | two rows for one language give one card | Same | Asserts the surviving card's name, not a count |
| AC-15 | `none — same search` | new | same | the total is the search server's own | Same | Uses the facet request, which is the only shape that asks for a total (`elasticSearch.ts:309`); the reply's total differs from the number of hits it carries |
| AC-16 | `none — same search` | new | same | a term with results is recorded | The recorder spy does not exist yet | Watches the recorder call, not a side effect; the recorder's own error handling would hide a real call |
| AC-17 | `none — same search` | new | same | a term with no results is not recorded | Same | `AC-16` is asserted green with the same spy, so a broken spy cannot pass both |
| AC-18 | `none — same search` | new | same | a refused listing search raises, naming the failure | Nothing drives the failure path | Asserts the raised message carries the refusal's own text, not merely that something was raised |
| AC-19 | `none — searched tests/ for GetRecomendationsForUser` | new | same | a refused recommendation read returns an empty list | Same | The refusal is a **routed** Error on the recommendation index, and the case asserts the stood-in reporter was called with `scenario: "getRecomendationsForUser in elasticSearch"` **and** an `error` string carrying the refusal's own text. Routing alone is not enough: step 7's router throws too, and that throw is swallowed identically (`elasticSearch.ts:926-931`), so only a message the router cannot produce separates a real refusal from a forgotten route — **FA-1** |
| AC-20 | `none — searched tests/ for getRelatedProducts` | new | same | a refused related search raises | Same | The first lookup answers and only the second search refuses, **both recorded queries are non-null** — named, not counted (`spec.md:136`) — **and the raised message is shown to carry the refused search's own text** — as `spec.md:211` requires and `AC-18` already does. Without the message check the router's own throw is wrapped as `Related products search failed: …` (`elasticSearch.ts:1182-1186`) and a forgotten route passes — **FA-2** |
| AC-21 | `none — same search` | new | same | an unknown product id gives an empty result and stops | Same | Asserts the **related-search marker was never asked for** — its recorded query stays `null` — which names the call that must not happen instead of counting calls (`spec.md:136`) — **FA-5** |
| AC-22 | `none — same search` | new | same | no gender-and-age pair gives an empty result and stops | Same | The same named-call check as `AC-21` (**FA-5**): the related-search marker's recorded query stays `null`. The product **has** categories, just without the pair, so a missing field cannot pass instead |
| AC-23 | `none — same search` | new | same | the related search excludes the product itself | Same | Reads the request's exclusion list, not the answer |
| AC-24 | `none — same search` | new | same | the related search asks for each pair once | Same | The product carries the same pair twice, so a missing de-duplication fails |
| AC-25 | `none — same search` | new | same | a visitor with no account reads the cold-start list | Same | Asserts which index was asked for, since both lists answer the same shape — **and** that a non-empty product list came back and the reporter received no recommendation-failure payload. The reader swallows every throw into an empty list (`elasticSearch.ts:926-931`), so a request-only assertion passes even when the flow broke after the call |
| AC-26 | `none — same search` | new | same | an account with no row falls back to the cold-start list | Same | Asserts the account's own list was asked for **first**, then the cold-start one — the order read from the client spy's own `mock.calls`, since the router is a marker-to-answer map and carries no order — with the same two anti-swallow checks as `AC-25` |
| AC-27 | `none — same search` | new | same | candidates are ordered by score, highest first | Same | `product_id` and a matching `language_code` sit on each `_source.custom_products[]` row, because the card is a spread of that row (`services/elastic/helpers.ts:404`); on `_source` it would be dropped and every lookup would return -1. The **reply's `hits.hits`** arrive out of score order — not the localized rows, whose order never reaches the output (`elasticSearch.ts:972-973`) |
| AC-28 | `none — same search` | new | same | the cursor moves past every candidate looked at | Same | At least one candidate is dropped, so "looked at" and "kept" are different numbers. One round is enough: with `limit` equal to the candidate count the loop exits at `elasticSearch.ts:851` after a single pass |

## Validation strategy

- Validation profile: `logic-change`
- It runs `pnpm lint`, `tsc --noEmit --pretty false` and `pnpm test:run` — the
  last of which executes every row in the Tests table above (VF-11).
  `pnpm test:run` is `vitest run`, the non-writing mode, so it is deterministic
  and read-only.
- `full` is not used: this ticket changes no application file, so a production
  build would prove nothing that types and the unit suite do not already prove.
  This answers `OQ-6`, which `spec.md` deferred here (PL-12).
- Each `AC-n` is recorded with the exit code of the run that proved it.

## Rollback

Delete `tests/services/elastic/elasticSearch.test.ts`. Nothing else changes, so
there is nothing else to undo, and the suite returns to 157 files and 2,541
tests.

## Plan check

> Round 1 ran all four read-only agents in parallel. Every `major` and every
> `WRONG` was re-checked against the source by the owner before being accepted;
> none was taken on the agent's word.
>
> **Corrections to earlier artifacts are recorded here, not by rewriting them.**
> `research.md` and `spec.md` belong to stages that have already recorded an
> outcome, so a wrong fact in one is corrected in this table and the plan is
> written from the corrected fact.

| Round | Checker / lens | Severity or status | Finding (short) | What changed in the draft |
|-------|----------------|--------------------|-----------------|---------------------------|
| 1 | performance | **major** | The file would run under `jsdom`; the model file it names uses the `node` environment (`tests/serverRequests/product.test.ts:1`) | Step 1 now puts `// @vitest-environment node` on line 1. **Verified.** |
| 1 | performance | **major** | The facet path fires a second `catalog_index` search through the children helper, whose reply is read with no guard (`services/elastic/helpers.ts:2471`) | Steps 7 and 16: answers routed per call, and the children call gets its own reply. **Verified.** |
| 1 | performance | **major** | `F-21` is wrong — no green test loads the real `next/headers`; both sibling files stand it in (`tests/services/elastic/helpers.test.ts:23`) | New step 4 stands in `next/headers`. **Verified; corrects `research.md` F-21.** |
| 1 | senior | **major** | Answering by index alone cannot serve the flows that read `catalog_index` twice (`elasticSearch.ts:1026` and `:1106`; `:566`; `:816`) | Step 7 routes on index plus a body marker. **Verified.** |
| 1 | senior | **major** | `AC-16`/`AC-17` are not provable with "a fuller fixture" alone — an unguarded read throws and is swallowed into `Search failed:` at `:737` | Step 16 names the exact fixture shape and the second reply. **Verified.** |
| 1 | senior | **major** | `AC-7` never said which flags it drives; a real facets-only request is `noProducts: true` with `noFilters: false` | Step 15 and the `AC-7` row now state the flags. **Verified.** |
| 1 | senior | **major** | `AC-27` could pass with no sorting: the final sort reads `product_id` (`:906-912`), the in-loop sort reads `id` (`:886-889`) | Step 18 and the `AC-27` row now fix the fixture shape and order. **Verified.** |
| 1 | security | **major** | The premise "both flags are set in no environment" is false — `.env.development:102` and `:107` both set them to `true` | Step 3 pins both flags with `vi.stubEnv` in `vi.hoisted()`. **Verified by reading the file.** **Corrects `research.md > Shared things` and `spec.md > OQ-3`.** |
| 1 | security | **major** | "No network" rested on two stand-ins; the fake network does not intercept the search client's own transport, and an escaped analyzer call is swallowed at `:280-284` | Step 3 also pins the four address and key variables to fakes; step 17's `AC-12` asserts the spy was called. **Kept in part:** a per-case "the stand-in received it" assertion is already how every request criterion reads the call. |
| 1 | security | **major** | The query is recorded by reference while the unit keeps mutating it (`:204`, `:366`) | New step 6 deep-copies inside the spy. **Verified.** |
| 1 | claim-checker | WRONG ×13 | Line anchors off by a few in `research.md` and the draft: the empty-list return is `:931` not `:921`; the throws are `:737` and `:1182`; the reporter calls are `:177,281,733,927,1178`; the word-count condition is `:240`; the default limit is `:217`; the recorder call is `:685`; the `must_not` push is `:1103`; the snapshot call is `:171`; the "Gemini" string is `:281` | Every anchor in the draft corrected. The `research.md` anchors are corrected here and the plan no longer repeats them. |
| 1 | claim-checker | MISSING-HIT ×3 | `elasticSearchClient` also imported by `services/elastic/sitemap.service.ts:4` and `utils/pagesDataRequests/ProductPageData.ts:2`; `catalog_index` also at `:420` and `:566` | Both added to the Integration surface, with `:420` named out of scope and `:566` handled by step 7. |
| 1 | claim-checker | WRONG | `spec.md > Business Goal`: "the unit suite is the only check that gates a pull request" — `.github/workflows/tests.yml:32` also gates on lint, parity and types | **Corrects `spec.md`.** The accurate claim: the unit suite is the only **test** suite that gates a pull request; the browser suite never runs on one. The plan's Validation strategy already names all three checks. |
| 1 | claim-checker | WRONG | `spec.md > Out of Scope`: the price-sort invariant belongs to roadmap **Phase 22**, not this row | **Corrects `spec.md`.** It stays out of scope here either way; the reason is that it is another phase's, not this one's to record. |
| 1 | claim-checker | UNVERIFIED | "2,541 tests today" could not be re-run by the checker | Left as is. The number comes from a run in this session, exit code 0, and the file count (157) was independently confirmed. |
| 1 | claim-checker | UNVERIFIED | "28 cases in five `describe` blocks" — `spec.md` names no five groups | Files to change now says the blocks follow FR-1 to FR-11. |
| 1 | senior | minor | Three evidence anchors off (steps 3, 6, 12) | Corrected. |
| 1 | senior | minor | `AC-15` on the grid-only path pins a reply shape production never sends (`:309`) | Moved to the facet request — step 15. |
| 1 | senior | minor | `AC-20` could pass on the first call | Step 19 and the `AC-20` row. |
| 1 | performance | minor | The recommendation loop with the default limit of 50 (`:834`) would run until the candidates run out | Step 18 uses a small explicit limit. |
| 1 | performance | minor | No run-time row in Numbers | Added: about 1–2 s. |
| 1 | performance | minor | Three cases print to stderr un-stubbed (`:243-247`, `:283`) | New step 13 spies on `console.error`. |
| 1 | security | minor | Vitest loads `.env` and `.env.local` into `process.env`; `.env.local` holds a real token | Handled by step 3 pinning the variables this file depends on. `.env.development` is not loaded in `test` mode, but the mechanism exists, which is why the flags are pinned rather than assumed. |
| 1 | security | minor | Failure text is published to the team chat | Step 20; fixture search terms stay plainly fake. |
| 1 | security | info | `AC-12` must not assert "nothing was reported" — the unit does report (`:281`) | Step 17 and the `AC-12` row. |
| 1 | security | info | Vendor names must stay out of case titles | Step 20. |
| 1 | senior | info | The analyzer is a default export (`analyzeSearchTextCerebras.ts:34`) | Step 8. |
| 1 | senior | info | The unit-report tree is a shared artifact | One line added to the Integration surface. |
| 1 | senior | info | No over-engineering: one file, no source change, a real rollback | No change. |
| 1 | performance | info | `OQ-1` confirmed: vitest never replaces `process` | No change; `spec.md` already records it. |
| 1 | performance | info | The app builds aggregations then deletes them for a grid-only request (`:318-328`) | `AC-6` stays about the request, not CPU. |

| 2 | security | **major** | The four facet cases share one reply fixture, and the unit writes **into** the reply — the card builder assigns the fixture's brand object then sets `is_verified` on it (`services/elastic/helpers.ts:466-470`), so case order changes what a later case reads | Step 6 now deep-copies each reply as well as each query, and step 16 builds the fixture from a factory called per case. **Verified.** |
| 2 | senior | **major** | `AC-27`'s fixture was declared at the wrong level: the card is a spread of the localized row (`services/elastic/helpers.ts:404`), so a `product_id` on `_source` is dropped and every lookup returns -1, making the sort a no-op and failing the case for a reason that is not its own | Step 18 and the `AC-27` row now put `product_id` and a matching `language_code` on the `custom_products[]` row. **Verified against `helpers.ts:404` and the field list at `:85`.** |
| 2 | senior + performance | minor | The "body marker" was never named, and `size` collides in exactly the two places step 7 exists for | Step 7 now names the marker per flow, and the router throws on an unrouted call. |
| 2 | performance | minor | ~~The recommendation rounds cannot be told apart by index or shape~~ | **SUPERSEDED by FA-8 (revision round).** Step 7 now routes the recommendation flow by index alone, and `AC-28` is single-round. Do not follow the old instruction. |
| 2 | performance | minor | Step 16 pinned the aggregations but not `hits.hits` / `hits.total.value`, read earlier and unguarded (`elasticSearch.ts:380-381`) | Added to step 16. |
| 2 | performance | minor | The facet fixture could reach the recorded enum defect at `:704-705` and fail as `Search failed:` | Step 16 keeps the related list empty so those lines never run. |
| 2 | performance | minor | `mockReset()` wipes an implementation installed with `mockImplementation`; only `vi.fn`'s own argument survives | Step 12 now requires the dispatcher to be `vi.fn`'s argument, and forbids `vi.resetModules()`. |
| 2 | security | minor | ~~The env pin would not survive case 1~~ — the premise was false; nothing clears `vi.stubEnv` | **SUPERSEDED by FA-9 (revision round).** Step 3 keeps the hoisted pin only. Do not follow the old instruction. |
| 2 | security | minor | Step 8 did not name the analyzer's module specifier; a relative one would resolve elsewhere and load the real module | Step 8 names `services/elastic/analyzeSearchTextCerebras`. |
| 2 | security | minor | A whole-object assertion on the recorder's argument would publish the client's address block (`elasticSearch.ts:685-692`) | Step 20 forbids whole-object assertions on the client, config or environment. |
| 2 | security | minor | Step 16 named the aggregation fields but not the product fields the normalizer reads unguarded (`helpers.ts:332-335`) | `images`, `colors` and `sync_color_images` added to step 16. |
| 2 | senior | minor | `AC-12` dropped half its criterion instead of making it provable | Step 17 and the `AC-12` row now assert the reporter got the analyzer failure and **not** the search failure. |
| 2 | senior | minor | `AC-5`'s second half (empty cursor with no hits) was not declared | Added to the `AC-5` row. |
| 2 | senior | minor | `AC-8`'s guard text claimed it catches a flag switched on by accident, which step 3's pin makes impossible | Guard text corrected: it pins the code path, not the environment. |
| 2 | senior | minor | The plan contradicted itself — step 3 proved the flags are `true`, Out of scope still said "set in no environment" | Out of scope rewritten; the reason is now "read once at module load". |
| 2 | senior | info | Step 13 over-counted the printing branches | Narrowed to the analyzer cases. |
| 2 | claim-checker | WRONG ×15 | Cross-references I introduced in the round-1 rewrite: step 4 cited "step 7" for the helpers stand-in (it is step 10) and called `next/headers` the first import (it is the second); step 10 called every other helper "pure" when `getChildrenAndGrandchildren` runs a search; step 7 mis-described the recommendation batch; the `AC-2` row kept `:216`; Out of scope kept `:283`, "six modules" and "set in no environment"; "step 15" should be step 20 | All corrected in this revision. |
| 2 | claim-checker | MISSING-HIT ×3 | `logSearchTerm` also at `serverRequests/Search.tsx:21,415`; `catalog_index` also in `serverRequests/meta/home.ts:10,159,199`; four test files already stand in the same config module | All three added to the Integration surface. |
| 2 | claim-checker | UNVERIFIED | The `vi.mock` scoping claim leaned on a run the checker could not reproduce | Reworded: the evidence is now the four sibling files plus the absence of a `pool`/`isolate` override. |
| 2 | claim-checker | UNVERIFIED | "2,541 tests today" cannot be re-run by the checker | Left as is; the number comes from a run in this session with exit code 0, and the 157-file count was independently confirmed. |
| 2 | performance | info | The `node` environment is safe with the shared setup file; 28 files already use it | No change. |
| 2 | senior | info | No `pool` / `isolate` override, so the env stubs cannot leak to the other 157 files | No change. |

| 3 | security | **major** | Step 12 reset the spies but not the routing tables, so a leftover answer could serve a call the current case never routed and the router's throw would never fire — the 28 cases would be order-dependent | Step 12 now re-initialises every answer table and recorded-query variable in `beforeEach`, as the model file does (`tests/serverRequests/product.test.ts:159-161`). **Verified.** |
| 3 | senior | **major** | `AC-27` named the wrong array: shuffling the localized rows proves nothing, because the card builder picks the single row whose language matches (`elasticSearch.ts:972-973`). The array that must arrive out of score order is the reply's `hits.hits` | Step 18 and the `AC-27` row corrected. **Verified.** |
| 3 | performance | **major** | `AC-25` and `AC-26` could pass while the flow broke: the reader swallows every throw into an empty list (`elasticSearch.ts:926-931`), and both cases asserted only the request, which was recorded before the throw | Both rows now also assert a non-empty product list and that the reporter received no recommendation-failure payload. **Verified.** |
| 3 | security | minor | Step 9 left the reporter's specifier unnamed, and step 1's `node` environment removes the guard that made a miss harmless — the real reporter returns early only when `window` exists (`utils/serverErrorReporter.ts:97`) | Step 9 names `utils/serverErrorReporter` and requires both `LogServerError` and `default`. **Verified.** |
| 3 | senior | minor | Step 10 left the helpers specifier unnamed — the same trap step 8 exists to close; the unit imports it relatively (`elasticSearch.ts:30`) | Step 10 names `services/elastic/helpers`. |
| 3 | security | minor | `vi.spyOn` calls through, so the analyzer branches would still print, and with no global restore the spy would leak | Step 13 now uses `.mockImplementation(() => {})` and restores in the same case. |
| 3 | security | minor | "Deep copy" was unnamed; `JSON.parse(JSON.stringify(...))` drops `undefined` keys and would weaken the three absent-field checks | Step 6 names `structuredClone`. |
| 3 | performance | minor | `AC-5` and `AC-11` drive the same marker twice in one case, and the router is a map, not a queue | Both rows now re-point the answer table between the two drives. |
| 3 | performance | minor | The recommendation and batch replies had no pinned shape; `hits.hits` is read unguarded at `:783`, `:792`, `:823` | Step 18 requires `hits.hits` on every such reply. |
| 3 | senior | minor | `AC-19` could be satisfied by the router's own throw rather than by a refusal | The `AC-19` row now requires a routed Error on the recommendation index. |
| 3 | senior | minor | `AC-28` did not need two refill rounds | Step 18 and the `AC-28` row: one round, one fixture. |
| 3 | senior | minor | Step 16's reason for pinning `images` was wrong — `parseJsonField` returns `[]` for a missing value (`helpers.ts:786-787`, used at `:432`) | Reason corrected: the fields are there for a realistic card, not to avoid a throw. |
| 3 | claim-checker | WRONG ×4 | Step 3's reason for re-applying the env stubs was false (nothing clears them); `hits.total.value` **is** optional-chained at `:381`; only **one** bucket array is unguarded, not all of them (`:559-563`); three flags are `true` in `.env.development`, not two | All four corrected. Three were in the "asks for more than the code needs" direction; the step 3 reason was simply untrue. |
| 3 | claim-checker | UNVERIFIED-BUT-FOUND ×3 | Three anchors pointed beside the proof rather than at it: the dispatcher pattern is `product.test.ts:85-94` not `:68-69`; the four config stand-ins are at `:24`, `:18`, `:96`, `:29`; the retry runs `:192-208` | All corrected. |
| 3 | claim-checker | UNVERIFIED | The suite numbers could not be re-run (Bash disabled in that session) | Left as is. The 157-file count was independently confirmed by glob, and every sum in the row was re-checked and is right. |
| 3 | claim-checker | OK ×61 | Every `elasticSearch.ts` and `helpers.ts` anchor in steps 1-21 confirmed; both grep lists exact; seven other client importers, no eighth; **no MISSING-HIT this round** | No change. |
| 3 | performance + senior | info | No stall risk; the routing markers hold against the source; the numbers re-sum correctly | No change. |

| R | claim-checker | OK | **FA-1 … FA-10 each do what `review.md` asked**, checked against source — `AC-19`'s scenario literal and string `error` at `elasticSearch.ts:928-929`; `AC-20`'s wrap at `:1182-1186` against `spec.md:211`; the bucket path at `:562`; the two sorts at `:886-889` and `:906-912` | No change — this is the confirmation the revision was for. |
| R | security | **major CLOSED** | The `AC-19` false-green is closed. The scenario alone would not have done it (the router's throw is caught in the same place with the same scenario); the message half is what separates them. | No change. |
| R | senior | **major CLOSED ×2** | Both `AC-19` and `AC-20` are closed, verified against the source rather than the wording. | No change. |
| R | performance | no major | FA-8 proved call by call: no recommendation case reads one index twice, so the `terms.id` marker had nothing left to separate. | No change. |
| R | performance | minor | `FA-4` was necessary but not sufficient: an `id` matching *another* candidate's id still returns a real index, so the in-loop sort can land on score order by accident. | Tightened: **no** row `id` may appear anywhere in the candidate list. |
| R | performance | minor | The round count was pinned only for `AC-28`; a short batch reply would fire a second read that the index-keyed map answers with the same reply. | Step 18 now states one round for all four recommendation cases. |
| R | performance | minor | `FA-10` sat inside step 16, so it bound only the facet fixture; the recommendation and related fixtures have their own swallow points. | Moved to step 6, where the clone rule lives, so it binds every reply. |
| R | performance | minor | `AC-26` asserts "first, then" but the router is a map and carries no order. | The order is read from the client spy's own `mock.calls`. |
| R | senior | minor | `AC-20` still read as a call count, which `FA-5` had just removed from `AC-21` / `AC-22`. | Reworded to the same named-query form. |
| R | senior | minor | Three round-2 plan-check rows gave the opposite instruction to the revised steps. | Two rows marked **SUPERSEDED**; this revision round is recorded. |
| R | senior | info | `AC-12`'s reporter payload begins with a vendor name, so a naive assertion would write it into the published output. | Step 20: match the fake text inside it, never the whole literal. |
| R | security | minor | `FA-7`'s allowed-field list did not name `error`, yet `FA-1` asserts exactly that field. | Step 20 now says `error` may be asserted only where the source narrows it to a string, never the raw object at `:177-180`. |
| R | claim-checker | WRONG ×5 | Framing sentences, not instructions: step 7 said three flows read the catalog index twice (two do); step 18 mis-described `:792`; step 16 mis-cited the `colors` guard; two round-2 rows described drafts that no longer exist. | All corrected; the two rows marked superseded. |
| R | claim-checker | UNVERIFIED-BUT-FOUND | Step 20 cited `tests.yml:184`, which is a variable pass-through, not the publication. | Re-anchored to the notify job at `:165-175`. |

- **Revision round (R), after `CHANGES_REQUESTED`:** both majors **closed**, confirmed independently by the security and senior lenses against the source. The claim checker confirmed all ten follow-ups do what the brief asked. No new major. Nine minors raised on the revision itself, all fixed in it — most sharpening a guard rather than correcting a fact.
- **Final round result (earlier rounds):** **3 rounds run; the loop stopped there (EV-6 allows three).**
  Round 1: 10 majors, 16 wrong claims, 3 missed hits. Round 2: 2 majors, 15 wrong
  claims, 3 missed hits. Round 3: 3 majors, 4 wrong claims, 3 imprecise anchors,
  **0 missed hits**.
  **Every finding is fixed in the draft, and none is kept open on purpose.**
  Round 3's three majors were fixed after the round ran, so they are corrected but
  not re-checked by a fourth round — the rule stops at three, and this line is
  where that is said rather than implied. Each of the three was verified against
  the source by the owner before the fix was written, and the fixes are named in
  the rows above. The trend across rounds — majors 10 → 2 → 3, missed hits
  3 → 3 → 0 — is the honest picture: the integration surface converged, the
  false-green risks did not fully converge, and `/review` should read the `AC-19`,
  `AC-25` and `AC-27` rows hardest.

## Out of scope

- **Any application code change.** No source file is in Files to change, so by
  the scope rule every defect found is a finding with its own ticket.
- **Snapshot paging when it is on**, including its one retry
  (`elasticSearch.ts:192-208`) — the setting is read once at module load
  (`:151`), so no case can turn it on without reloading the module. It is `true`
  in `.env.development:102`, so this path is live in local development rather
  than dead everywhere.
- **The global price aggregation path** (`elasticSearch.ts:342-487`) — same
  reason.
- **The query-building helpers** — already covered by 98 cases in
  `tests/services/elastic/helpers.test.ts`. That file is not touched, and no
  second file for it is created (PL-14).
- **The seven other modules that import the same search client** — listed in the
  Integration surface, none tested here.
- **The two recorded defects** — the analyzer failure log naming the wrong
  service (`elasticSearch.ts:3` vs `:281`) and the unguarded reads at
  `elasticSearch.ts:704-705`. Recorded as findings at `/implement`, fixed in
  their own tickets.
- **Known traps handled elsewhere:** the trap about credentials in assertion text
  is handled by step 20 and the spec's non-functional rules; nothing this file
  handles is a credential.
