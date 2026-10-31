# Browser suite — causes we have already met

Moved out of `CLAUDE.md`. Read it when a browser (`tests/e2e/`) test goes red.

Check these **before** you suspect the app. Each one has turned a green app red.

| Symptom in the run | Real cause | What the test must do |
|---|---|---|
| Shopper becomes a guest mid-journey; later calls say `Token is missing` | The test navigated while `/api/auth/refresh` was in flight; the new pair never landed | `waitForRenewalSettled(page)` before any `goto` / reload on a signed-in page (`harness/renewalGate.ts`) |
| A write "did not land", but a later read shows it did not happen either | The test moved on after clicking Save; the write got a 401 and its retry was cancelled | Wait for the write's first non-401 answer before the next step (`watchCommentCall`, `addAddress`) |
| A deleted / edited item is still shown after one reload | Elasticsearch had not caught up yet | Bounded reloads: 6 × 10 s, none after 60 s (`checkpoint`); read at `load`, not `domcontentloaded` |
| "Not shown" passes too easily | The section had not streamed in yet | Wait for `load` or for the section itself before asserting absence |
| Checkout shows no address | Addresses exist, but none has `is_default: 1` | Pick one from the list, as a shopper does |
| No cash-on-delivery offered | COD exists only in `sy`; the live suite defaults to `iq` | Seed `sy` for any paying case |
| Every journey fails on the nav logo | Staging Elasticsearch is down; one ES throw blanks the page | `pnpm e2e:health` first |
| `ERR_ABORTED` on a `page.goto` | A popup (cart / login / stories) that just closed cancelled it | `waitForPopupHistorySettled` |
| A dispatched E2E run shows `cancelled` without starting | `test-e2e.yml` uses one global `live-suite` group; GitHub keeps only one run waiting, so a third run drops the one already waiting | Start one run at a time, and wait for it |
| **AUTH-01** red | The wallet backend answers `502` on sign-in | Stays red on purpose — a backend fault |

The shopper account is shared by every case. A killed run can leave its data
behind (probe addresses, a moved default address). Name the leftover in the
message; never assume the account is clean.
