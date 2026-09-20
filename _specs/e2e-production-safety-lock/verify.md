---
ticket: e2e-production-safety-lock
stage: verify
mode: standard
status: complete
result: passed
owner: developer
updated: 2026-09-20
links:
  clickup:
  github:
---

# Verify — e2e-production-safety-lock

## In plain words

- **Both profiles ran.** The unit suite is green at **2926 tests / 189 files**,
  and the live QA lock is green at **17 of 17** against real staging.
- **The thing this ticket exists to stop is stopped.** The four BUY cases no
  longer buy a stranger's product, and QA data is absent from every shopper path
  that was checked.
- **Two acceptance criteria are proved by construction, not by a run**, and they
  are named below rather than counted as passes.
- **Two application bugs were found and fixed**, each with a test seen red first.
- **One measurement is recorded with its limit**: the filter costs under a
  millisecond on a staging-sized index, which is not a production-sized one.

## What was run

| Profile | Command | Result |
|---|---|---|
| unit | `pnpm test:run` | **189 files, 2926 tests, exit 0** |
| live | `tsx tests/e2e/cli.ts run --lane=account --grep=@prod-safe` | **17 passed, 0 failed** |
| types | `npx tsc --noEmit` | clean |
| lint | `pnpm lint` | 0 errors |
| i18n | `pnpm lint:i18n-parity` | 2243 keys in all three files |

The live run selected **16 tests in 2 files** through `--grep=@prod-safe` — the
seed plus the QA cases, and nothing else. That is the fail-closed path proving
itself: the seed's own title carries the tag, so a grep cannot silently drop it.

## Acceptance criteria

| AC | Proved by | Result |
|---|---|---|
| AC-1 | `QA-02` — an ordinary search returns no QA row | **passed** |
| AC-2 | `QA-09b` (featured listing) + `elasticSearch.test.ts` "listing hides the QA shop" | **passed** |
| AC-3 | `QA-09a` — the home page, read as served | **passed** |
| AC-4 | `elasticSearch.test.ts` "recommended excludes the QA shop" | **unit only** — see below |
| AC-5 | `QA-09c`, `QA-09d` + `sitemapService.test.ts`, both chains | **passed** |
| AC-6 | `QA-11` + five rows in `story.test.ts` | **passed** (web only, by design) |
| AC-7 | `QA-01` — QA mode finds it, and the header was observed | **passed** |
| AC-8 | `noRuntimeReadsInCachedTree.test.ts` — `qaMode` is unreachable from every cached scope | **passed** |
| AC-9 | `QA-06` — the page opens by address with no QA mode | **partly** — see below |
| AC-10 | `QA-03` — read from what the app told the seed, not the admin screen | **passed** |
| AC-11 | `QA-04` — the boutique carries the mark and is active | **passed** |
| AC-12 | the seed records `locationId`; no case asserts it separately | **by construction** |
| AC-13 | `QA-06` + the seed's own three-way product check | **passed** |
| AC-14 | `QA-07` — the second run reports `found`, not `built` | **passed** |
| AC-15 | `QA-08` — no DELETE, no write outside the seller dashboard | **passed** |
| AC-16 | `addFirstBuyableProduct` is **deleted**; all four BUY cases call `addQaProductToBag` | **by construction** — see below |
| AC-17 | same | **by construction** — see below |
| AC-18 | `QA-09a`..`QA-09e` — five shopper paths, each proving content first | **passed** (different five — see below) |
| AC-19 | `QA-10` — the index really holds it, in QA mode | **passed** |
| AC-20 | `QA-11` — the feed carried another person's story first | **passed** |
| AC-21 | `qaHarness.test.ts` — three faults, three different messages, all throwing | **passed** |
| AC-22 | `qaHarness.test.ts` — both directions plus case and spacing | **passed** |
| AC-23 | `qaHarness.test.ts` — fail-closed on three input classes | **passed** |
| AC-24 | `qaHarness.test.ts` — the secret is masked and the mask names the variable | **passed** |

**One criterion was added that the spec did not have.** `QA-02b` proves the QA
**boutique** is visible in QA mode and absent for a customer, and that the two
answers are not byte-identical. It exists because the owner corrected the design
mid-implementation: the boutique reader filtered unconditionally at first, which
hid the shop from the tests that own it.

## What is **not** fully proved, said plainly

**AC-16 and AC-17 — by construction, not by a run.** `addFirstBuyableProduct` no
longer exists (the only mention left is a comment saying what replaced it), and
all four BUY call sites read `addQaProductToBag`. So the criterion — *every case
that fills a bag uses the QA product* — is true of the code as written. What has
**not** happened is a run of `shopper.live.spec.ts` since the migration, so it is
not yet known that those four cases still pass. That is a different claim from
the criterion, and it is the first thing the next ticket should do.

**AC-4 — unit only.** The recommended row is proved at unit level. No live case
drives related or recommended products, so there is no end-to-end evidence for
that path.

**AC-9 — partly.** The QA product's page opens by address with no QA mode
(`QA-06`). "Can be put in a bag by a guest" is carried by the same unrun BUY
path as AC-16.

**AC-12 — by construction.** The seed creates the location and records its id;
no case asserts the location separately.

**AC-18 — five paths, but not the five the spec named.** The spec said search,
listing, home, related and recommended. What `QA-09a`..`QA-09e` actually prove
is the home page, the featured listing, the product sitemap, the sitemap index
and the mobile catalogue route. Search is covered by `QA-02` and the sitemap by
`AC-5`; related and recommended are not covered live.

## Findings

Two bugs in application code, both **outside** this plan's files, both fixed
here at the owner's direction rather than deferred. Each has a test that was
**seen red before the fix and green after**.

**BUG-1 — the password confirmation reached Sentry in clear.**
`utils/fetchData.ts` scrubs a request body before it is attached to an error
report. `CREDENTIAL_FIELDS` listed `password` but not `repeat_password`, and the
match is by exact key — so every failed "become a seller" submit sent the
shopper's password confirmation, which is the same value as their password.
Found by reading a live run's own log.
Test: `tests/utils/fetchData.test.ts`, "masks the password confirmation, not
only the password". Two controls stayed green throughout, which is what rules
out a scrubber that simply redacts everything.

**BUG-2 — the form's length limits did not match the backend's.**
`MAX_LENGTH_FIELDS` in `BecomeSellerModal.tsx` carries a comment saying it
mirrors the backend's vendor-request validation. It missed `location_name`,
which the backend also caps at 10 — so a seller typing a longer name got no
inline warning, filled the whole form, submitted, and was handed a raw 422.
Test: `tests/components/settings/becomeSellerLimits.test.ts`. Only the
`location_name` row was red; the three already in the map passed, as did the
control that fails if the form ever caps `shop_address`, which the backend does
not.

## Runtime impact

**Query cost, measured** on 2026-09-20 against the staging index — 40 paired
queries per shape, alternating, after warming both:

| Query | Without the clause | With it | Difference |
|---|---|---|---|
| listing | 3.40 ms | 4.13 ms | **+0.73 ms** |
| suggestion | 3.67 ms | 3.20 ms | none measurable |

Read the absolute numbers. The plan set a 20 % threshold before anyone knew the
base was about 3 ms, so "+21 %" there is under a millisecond; the suggestion
query came out faster with the clause, which is what noise looks like at this
scale.

**The limit of that figure:** the staging index holds about 121 products
matching the base query. A nested `must_not` is evaluated per document, so this
is a staging-scale measurement. Re-measure at production scale before assuming
it stays under a millisecond.

**What is filtered.** The catalogue base query exists **six** times; four carry
the clause. The two that do not were checked field by field and select **only**
`custom_categories.*` — id, name, slug, position, photos. No product, no
boutique, no shop slug. A QA product can make a category exist in a list; it
cannot put the shop or the product in front of anybody.

**What writes to staging.** Every `/shop/*` write in the suite comes from
`qaSeed.ts`, bound to the QA slug. The only other write in the suite is
`actions/wishlist.ts` deleting `/checklist/{id}` — the shopper's own saved list,
not the product. No test writes to a real product or boutique.

## Left for the next ticket

1. **Run the account lane** — `BUY-01`..`BUY-04` have not run since they were
   moved onto the QA product. This closes AC-16, AC-17 and the rest of AC-9.
2. **`QA_VIEW_SECRET` into repository secrets**, and never onto the deployed
   staging app.
3. **Re-measure the query cost** on a production-sized index.
4. **The seller-dashboard suite** builds on `harness/sellerDashboard.ts`; the
   helpers and the rules they encode are documented in `tests/e2e/README.md`.
