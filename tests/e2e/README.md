# Browser tests — against the real staging backend

**The design is `docs/testing/E2E_TEST_DESIGN.md`.** This file is how to run
them and how to add one.

**The list of cases is `docs/testing/E2E_SCENARIOS.md`.** Add a row there when
you add a case.

A browser drives a real `next build` + `next start` against the real staging
backends. Nothing is simulated.

## Run them

```bash
pnpm test:e2e             # preflight, build, then every spec
pnpm test:e2e:live        # only the real-staging specs
pnpm test:e2e:scripted    # only the specs with faked backend answers
pnpm e2e:preflight        # just "is this configured, and is it staging?"
pnpm e2e:report           # open the last local HTML report
```

CI runs one more command, `tsx tests/e2e/cli.ts report`. It reads the JSON
reporter's `e2e-results.json` and produces the two lines the Telegram message
needs — the counts, and up to four failing tests with the reason each failed.
Everything it emits goes through `redact()` first.

First time on a machine:

```bash
pnpm exec playwright install chromium
```

**Every run builds**, because the suite only ever talks to a server it built and
started itself. An occupied port 3100 is a hard error, not something it adopts.

**Nothing is built when nothing is configured.** With no staging addresses,
preflight exits straight away and every spec skips. `pnpm test:e2e` on a fresh
checkout is fast and green.

## The three projects

| Project | File name | Backend | Records artifacts |
|---|---|---|---|
| `setup` | `harness/qaSeed.ts` | real staging, **writes** | video on failure |
| `live` | `*.live.spec.ts` | real staging | **nothing** |
| `scripted` | `*.scripted.spec.ts` | real staging, named answers faked | traces and video on failure |

`live` declares `dependencies: ["setup"]`, so the QA seed always runs first. See
**The QA safety lock** below for what it builds and when.

The artifact split is a security rule, not a preference. **This repository is
public, so anything CI uploads is world-readable.** A Playwright trace archives
every request header, which is the auth token; a screenshot of a failed login
shows the phone number. Debug a live failure locally instead:

```bash
pnpm test:e2e -- --trace on
```

## Writing one

A spec should read like the journey. It never names an element, never builds a
URL, and never waits.

```ts
import { expect, test } from "./fixtures";
import { gotoHome, gotoFirstProduct } from "./actions/nav";

test("a listing leads to a product page", async ({ page }) => {
  await gotoHome(page);
  const opened = await gotoFirstProduct(page);
  expect(opened.url).toContain("/products/");
});
```

Where things go:

| Need | Put it in |
|---|---|
| a locator | `selectors.ts` — never in a spec |
| a thing a user does | `actions/` |
| a faked backend answer | `scenarios/` |
| starting a server, secrets, the target guard | `harness/` |

The rules actions follow are in the design doc, section 7. The short version:
`page` first then one options object, assert your own success, return what the
spec needs, never take a raw selector, and put a failing case in a separate
`attempt*` function that returns an outcome instead of adding a flag.

## Locators use `data-pw`

`getByTestId()` is pointed at `data-pw` in `playwright.config.ts`. Use it.

Do **not** match on visible text. Every string in this app goes through
`translateFunction`, so `getByRole("button", { name: "Add to cart" })` passes in
English and fails in Arabic. If something has no hook, add a `data-pw` to the
component rather than writing a cleverer selector.

## The rules

**1. It never gates a pull request.** It is red when staging is down, when a
deploy is mid-flight, or when someone changed a response shape. All useful to
know, none of it a reason to block a pull request. It runs on push to `develop`
and `main`, and nightly — see `.github/workflows/test-e2e.yml`.

**2. The target guard is not optional.** Preflight refuses to run unless every
configured backend address is a known staging host, and it runs before anything
is built. Adding a host to `ALLOWED_HOSTS` in `harness/guard.ts` is a deliberate
act. **Never production, under any flag.**

**3. Assertions stay loose.** A status, a shape, a count being non-zero. Never an
exact response body or a specific product name — that turns an ordinary
catalogue change into a red suite, which teaches everyone to ignore it.

**4. Never assert, log or snapshot a token, an OTP, a phone number, an email or
a password.** `harness/redact.ts` masks all of them; use it on anything printed.

**5. Reads may retry. Writes never.** `retries: 0` is set in the config, because
a retried checkout is a duplicated order.

**6. Everything you create, you tag and you register for teardown** — at the
moment it is created, not after the assertions, so a failed assertion still
cleans up.

> **One accepted exception: guests.** `session.live.spec.ts` registers guests on
> purpose — that is the behaviour it tests — and there is no way to remove one.
> Roughly five per run, so about ten a day from the push and nightly schedules.
> Decided when that ticket was opened; nothing else in this suite may claim the
> exception without the same decision.

**7. One login per identity per run.** The OTP send is rate limited for real.
Each spec that needs a session creates one and saves it to `tests/e2e/.auth/`,
where its own later cases open it. (It is not created in global setup — that
sentence used to say so and was never true.)

> **One accepted exception: Shopper A signs in twice.** `profile.scripted.spec.ts`
> keeps its own session rather than borrowing the live spec's, because a snapshot
> shared across two projects is exactly the stale-credential trap that handing a
> session on exists to avoid. The `live` project is declared before `scripted` in
> `playwright.config.ts` and `workers` is 1, which is what keeps the two sign-ins
> from superseding each other. **Reordering the project list would break that.**

### What a full run spends in real one-time codes

Fifteen sends: `AUTH-01`, `PROF-01`, `RECOV-01`, five in `auth.scripted.spec.ts`,
and **seven** added by the profile branches — one sign-in for each of
`SCRIPT-07` to `SCRIPT-12`, plus `SCRIPT-12`'s change-number send, which is a
server action and cannot be intercepted.

**Why six sign-ins and not one.** Those cases may not share a session: several
damage their own on purpose, and none may hand that on. A shared session was
tried and measured — nothing renews it, because these cases also fake
`/api/auth/refresh`, so it ages out mid-run and every later case opens as a
guest. Signing in per case is what the constraint costs.

The identities **alternate** between the two configured accounts, because six
sign-ins on one number inside one run is throttled by the per-number cooldown and
a throttled case fails for a reason unrelated to what it tests. `SCRIPT-12` is
pinned to the first identity: it types the second one's number into the
change-number overlay, so that number has to belong to somebody else.

**Fifteen is the best case, not the number.** `sendOtpWithRetry` re-sends after
sleeping the server's own cooldown, so each send is really bounded by the case
timeout rather than by its attempt count. `profile.scripted.spec.ts` passes
`maxAttempts: 2`; the eight older sends still run at the default of five. The
worst case is therefore a function of the backend's cooldown, which nobody has
measured — if you measure it, put the number here rather than a guess.

The suite runs on every push to `develop` and nightly.

### Accepted drift, and what it costs

- **Analytics and error reporting are not blocked**, including in the faked
  cases. Turning them off would mean editing `instrumentation-client.ts` or
  `sentry.*.config.ts`, which are protected runtime paths. So the deliberate
  500s and 401s these cases cause **appear in Sentry as real errors**, and
  because `scrubRequestBody` redacts tokens and one-time codes but **not
  `phone`, `alternative_phone` or `email`**, the failed save's body carries the
  shopper's phone number and e-mail with them. That noise is expected, not a
  signal. It is the one place this suite knowingly does not meet its own rule
  about credentials in kept output.
- **`PROF-05` uploads a real file to the media store on every run.** Removing the
  picture unlinks it from the profile; it does not delete the stored object. The
  probe file is tiny and named `trydos-e2e-probe-picture.png` so an orphan can be
  found later. There is no sweeper.

## The QA safety lock

**The problem it solves.** This suite has to create real data on a real
environment: a seller, a shop, a product, an order, a story. None of it may
reach a shopper. Before this existed, the four BUY cases each bought a **random
real seller's product** every night.

**How it works, in one sentence.** The mark travels inside the data — a QA
shop's slug starts `trydos-qa-`, a QA story links to the QA host — and every
query that *finds* things filters that mark out.

Three consequences worth knowing before you write a case:

1. **Discovery is filtered; a direct lookup is not.** Search, listing,
   recommended, the boutique list and both sitemaps hide QA data. Opening the QA
   product **by address** works for anybody, including a guest, and that is the
   design: it is what lets a guest case add the QA product to a bag instead of a
   stranger's.
2. **QA mode is the only way to see QA data in a search**, and it is one header,
   `x-qa-view`, compared to `QA_VIEW_SECRET`. The app treats QA mode as **off**
   unless that secret is set and at least 32 characters. **Never set
   `QA_VIEW_SECRET` in the deployed staging app** — it belongs only in the
   environment this harness builds and starts.
3. **The seed is a setup project, and it runs only in the account lane.** Both
   lane jobs load the same config and a setup project cannot be excluded by a
   file filter or by `--project`, so `E2E_LANE` (set by `cli.ts`) is the gate.
   Unset means "do not seed", so `playwright test` by hand never writes.

What it needs, on top of the usual live variables:

| Variable | What for |
|---|---|
| `TEST_ACCOUNT_PHONE_2` | Shopper B, who becomes the QA seller |
| **`TEST_ACCOUNT_OTP_2`** | **Shopper B's own one-time code — see below** |
| `ADMIN_DASHBOARD_BASE_URL` / `_EMAIL` / `_PASSWORD` | the two approvals the seed cannot do any other way |
| `NEXT_PUBLIC_MEDIA_SERVER_BASE_URL` and friends | the product image, which activation needs |
| `QA_VIEW_SECRET` | QA mode. At least 32 characters or it is ignored |

Missing any of them is a clean **skip**, and the skip names which one. That
matters more than usual here: the `live` project **depends** on the seed, so a
*failing* setup stops every live case in the lane, while a *skipped* one lets
the rest of the suite run.

**The other half of that contract: a case that needs the QA product skips too.**
When the seed skips it writes no record, and `qaSeedRan()` in
`harness/qaSeedState.ts` is how a case asks. `shopper.live.spec.ts` skips all
four BUY cases on it, with the shared reason `NO_QA_SEED_REASON`.

Write that line into any new spec that fills a bag. Leaving it out does not fail
safe — it fails *confusingly*. On CI run 35496319099 the seed skipped, the four
BUY cases ran anyway, `gotoQaProduct` fell back to a guessed slug, and all four
reported `ERR_ABORTED` on a product address. That reads as "the QA product is
broken" about a product nobody had asked for. `gotoQaProduct` no longer guesses:
with no slug from the caller it reads the seed's record, and says so when there
is none.

**In CI the two settings this ticket added are their own named secrets**, not
part of the `E2E_ENV_FILE` blob — see the `Add the QA settings` step in
`.github/workflows/e2e-lane.yml`:

| Repository secret | Without it |
|---|---|
| `QA_VIEW_SECRET` | QA mode is off, the seed skips, every QA case and every BUY case skips with it |
| `TEST_ACCOUNT_OTP_2` | nothing can sign in as Shopper B, so the seed skips |

The stories journey adds **no** third setting — see "who is allowed to see a test
story" below. It is worked out from the test phones when the app is built.

Adding the secret is not enough on its own — a step has to read it. The
`QA_VIEW_SECRET` secret sat in this repository's settings for a day with nothing
reading it, and the whole QA lock skipped in CI while passing locally.

**The run now prints why it skipped.** `cli.ts` reads the skip reason back out
of the Playwright JSON and logs one line per distinct reason, with a count. The
list reporter prints a bare `-`, so before this a lane could skip seventeen
tests and give no clue which setting was missing.

**`TEST_ACCOUNT_OTP_2` is not optional, and it caught a real gap.** Measured
against staging on 2026-09-19: signing in as Shopper B with `TEST_ACCOUNT_OTP`
— which is Shopper A's allow-listed code — is refused by the **core** backend
with `422 invalid_code` on `/auth/phone/verify_otp_from_guest`. The two accounts
do not share a code.

Nothing had ever noticed, because the only specs that used Shopper B are
*scripted* ones that fake every backend answer and never get past the PIN
screen. So until this variable holds a working code, **nothing in this suite has
ever really signed in as Shopper B**. Either set it to the code that account
accepts, or have that number allow-listed with the shared one.

**The admin screens** belong to a separate product, so nothing in this
repository describes them. They were read directly on 2026-09-19, and
`harness/adminApprove.ts` carries what was found:

* `/admin/vendor-requests` has a plain GET filter form with `email` and
  `status`, so the seed narrows the pending list to the one address it
  generated. The row's EMAIL is the 4th cell; the control is
  `select.status-select`, value `1` to approve, and it is `disabled` on a row
  already decided.
* `/admin/boutique/seller?status=0` shows NAME in the 4th cell and an approve
  `<select>` (`0 New / 1 Approved / 2 Denied`) in the 14th. **The slug is not on
  that screen**, so the shop's marked NAME is what is matched there; every write
  the seed makes to a backend is still bound by slug.

Every locator can still be overridden from the environment (`ADMIN_SELECTOR_*`,
`ADMIN_VENDOR_REQUESTS_PATH`, `ADMIN_SELLER_BOUTIQUES_PATH`), because that
dashboard can change without this repository hearing about it. Every step fails
by name, and **a row whose identity cannot be read is refused rather than
approved** — the rows beside the QA one belong to real sellers waiting for a
real decision.


## The stories journey, and who is allowed to see a test story

A story is test data when its **link points at the QA host**
(`utils/qaStoryFilter.ts`). That mark hides it from every reader of the feed —
which, until this ticket, included the suite itself. A safe story was an
invisible story, so nothing could open, report or delete one.

`NEXT_PUBLIC_QA_STORY_VIEWER_PHONES` is the way out: the accounts that still see
test stories, named by **phone number**. Everyone else, signed in or not, sees
exactly what they saw before.

**You do not set it.** `harness/server.ts` fills it in when it builds the app,
from `TEST_ACCOUNT_PHONE` and `TEST_ACCOUNT_PHONE_2` — the numbers the suite
already signs in with. There is no second setting to add, nothing to look up, and
nothing that can drift out of step with the accounts actually being used. An
explicit value still wins, for the rare environment where the viewer is not the
signer.

That also means **CI needs no new secret and no new variable**: the two phones
already arrive in the environment blob, and the harness does the rest.

**Three things to know.**

1. **It must never be set on a deployed app.** `NEXT_PUBLIC_*` values are inlined
   into the browser bundle, so on a build that has it set the numbers are
   readable by every visitor of that build. The only place it is ever set is the
   app the harness builds, starts on a loopback port, and throws away. A unit
   test checks no tracked file sets it; it cannot see a value set in a hosting
   dashboard.
2. **Inlined means rebuilt.** Changing the accounts changes nothing until the app
   is built again, so **`--skip-build` serves a build with the old list** — or
   with none.
3. **The number is matched however it is written.** Everything that is not a
   digit is ignored on both sides, so `+999 000 000 001` and `999000000001` are
   one entry. Same rule as `utils/server/otpAllowlist.ts`, and for the same
   reason.

**The browser half of this rule is advisory, not a control.** Three of the four
story readers run in the page and learn who is looking from store state a visitor
can change. The guarantee is point 1: on a build a customer can reach, the list
is empty, so there is nothing to match and nothing to spoof. Only
`serverRequests/stories.ts` reads the viewer out of the browser's reach, from the
HttpOnly `User-Data` cookie.

### Aiming at your own story, and nothing else

The QA host hides a story; it does not say *which* story. This run's photo, this
run's video, a leftover from last night and another run's story all share that
host. So every upload carries

```
https://<qa story host>/e2e/<run token>/<photo|video>
```

and `actions/story.ts` matches on the **whole link**. Reporting cannot be undone —
the app has no way to withdraw one — so a loose match here files a report against
somebody else's story.

Two more guards, both learned from the review panel:

- **The holder carries `data-story-id`, and only when it is active.** The cube
  carousel mounts several holders at once; an unconditional attribute would also
  match the neighbouring authors' rings.
- **Identity is checked twice before a report.** The viewer advances on its own
  timer and, at the end of a ring, moves to the **next author** — where the report
  control is still drawn. The second check happens with the report sheet open,
  because that is the only moment the viewer is paused.

### What the run leaves behind

`STORY-05` deletes every story the run uploaded, through the screens a shopper
uses, and an `afterAll` net removes anything a failure left — this run's token
only, because another run may be in flight against the same environment.

What is **not** cleaned up, and cannot be: `deleteStory` sends only the story id,
so the uploaded media stays on the media server for ever, and a filed report
cannot be withdrawn. One of each per run, and the suite runs nightly and on every
push to `development`. That is why the fixtures are capped.

## Writing a seller-dashboard test

**Use `harness/sellerDashboard.ts`. Do not write your own proxy calls.**

The QA seed was the first thing to talk to the dashboard, and everything it
learned lives in that module. The tests that add, edit and activate through the
dashboard tabs should build on it.

| Helper | What it is for |
|---|---|
| `sellerCall` | one JSON call, with the `401 → refresh → retry` the app itself performs |
| `sellerCallMultipart` | the same for a `FormData` body — the product create and update endpoints take nothing else |
| `uploadShopImage` | ticket + media-store upload, returning the **bare filename** the backend wants |
| `rowsOf` | the list inside an answer, whatever key it arrived under |
| `SELLER_SERVICE` | the proxy's wire tokens |

Each one exists because getting it wrong cost a run:

* **A `/shop/*` 401 is not an expired session.** The app exchanges the refresh
  token and retries, and `sellerCall` does the same. Sending the proxy's *wire
  token* where `/api/auth/refresh` wants the *service name* makes every exchange
  answer `{ eligible: false }`, and the 401 then looks unrecoverable.
* **The product endpoints are multipart.** With a JSON body no field is read and
  the answer is `Product name is required` whatever you sent.
* **On update, key presence is load-bearing.** The DTO reads `barcode`,
  `luck_price` and their neighbours without a fallback, so an omitted key is not
  "unchanged" — it is `422 Undefined array key "barcode"`.
* **The backend wants a bare filename**, never the stored URL and never the
  folder. Handing back the URL answers `must not be greater than 191
  characters`; sending the folder doubles the path.
* **Answers do not agree on a key.** `/shop/boutiques` returns
  `{ boutiques: [...] }`, others `{ data: [...] }`, some a bare array, and
  `/shop/uploads/presigned-url` is flat with no wrapper at all.

Three more rules that are about the data, not the transport:

* **`countries_iso` is the RESTRICTED list**, not "available in". Putting the
  shopping country there hides the row from every search in that country.
* **A boutique needs all four languages** before it can be activated, each with
  a name, description, bio, icon and at least one banner.
* **`request_status` is the admin's decision; `status` is the seller's own
  switch.** They are different fields and confusing them sends a test to the
  admin screen for a shop that was already approved.

**Everything a seller-dashboard test writes must belong to the QA shop.** Bind
every write to a slug you re-read from the backend — a numeric id carries no
mark, so an id alone can never prove the row is yours.

### The browser suite for the dashboard — `sellerDashboard.live.spec.ts`

`harness/sellerDashboard.ts` is the **transport**. The layer above it is what a
dashboard browser test actually drives:

| File | What it holds |
|---|---|
| `actions/sellerDashboard.ts` | the **shell** — settings → the shop list → this shop's dashboard, opening a section by tile or by the slide-out menu, reading which section is open, pressing back |
| `actions/shopLocations.ts` | the Locations section: the list, the status filter, the create/edit modal, the status control |
| `actions/shopInfo.ts` | the Shop Info section: the three text fields, Save, and putting the record back |

The shell knows about no single section, on purpose. A products, boutiques,
stories or comments spec written later calls `openTab(page, "products")` and
adds **one** file beside the two above.

**Four things that are easy to get wrong here.**

* **Nobody signs in.** The QA seed signs in as the QA seller and now hands its
  cookie jar on (`QA_SELLER_SESSION_PATH` in `harness/qaSeedState.ts`). Every
  case opens that jar. A second sign-in would send another one-time code for
  the same account, against limits that are not ours. So "there is no saved
  signed-in session" is **the seed's** failure, not the spec's.

* **The open section lives in the address**, not in component state
  (`?tab=locations`), and the content area repeats it in `data-tab`. That is
  what lets a navigation case prove *this tile opened this section* without
  claiming that section's backend answered. SD-02 keeps those two claims apart
  deliberately: a dead comments backend belongs to the comments spec.

* **A refused shop-info save is invisible on screen.** `ShopInfo.handleSubmit`
  reports a failure with the browser's own `alert(...)`, and Playwright
  dismisses a dialog by itself. A case that only looked at the screen would
  call that refusal a pass. `attemptShopInfoSave` listens for the dialog *and*
  judges the status the backend answered `PUT /shop/info` with.

* **A location cannot be deleted** — the API exposes none. So the create case
  names its row with the run's own timestamp (the name is unique per shop per
  country, and a repeat answers `422 detailed_error[].code = "name"`), the edit
  and status cases change that same row, and the group deactivates it at the
  end. One inactive marked row per run stays on the environment. That is the
  price of covering the create form at all.

**What it does not touch, and why.** Never the shop's **name** — the seed finds
its shop by name, so a case that renamed it and then died would make the next
seed build a second QA shop. Never the **logo or banner** — a media upload
cannot be undone by putting a string back. Contact and address are written and
restored, media included: `PUT /shop/info` rewrites every field it is given, so
the restore hands back the bare filenames it found (`bareMediaName`).

**SD-12 is red, and it is red for the core backend.** Leave it alone.

```
PUT /shop/info -> 422   "The image field must be a string."
                        detailed_error: image, banner
```

The QA shop has no logo, so `GET /shop/info` answers with the folder and no
filename — `https://…/image/upload/seller/`. `ShopInfo.handleSubmit` sends the
last path segment of whatever it was given, which for that value is the empty
string. Sending `null` instead is refused by the same rule (measured with a
direct call). So `PUT /shop/info` offers **no value that means "leave the media
alone"**, and a seller whose shop has no logo cannot save their contact or their
address at all.

Do not skip it, do not loosen it, and do not give the QA shop a logo to make it
green — the logo hides the finding, which is the whole value of the case.

**What this suite found on its first run, and what it cost to work out.** Both
are written up where they belong; they are listed here because both looked like
six other things first.

| Symptom | What it really was |
|---|---|
| Nine cases showing "Member", "Access Denied" and "your session has expired", after the first case passed | The saved cookie jar is a **snapshot**. Case one did authenticated work, the app exchanged the credential, and every later case opened a superseded pair. Cured by `handOnSession` after every case — `closeSellerPage` in the spec. `sellerDashboard.sessionExpired` now names it on sight. |
| The Locations section spinning for ever on a direct `?tab=locations` load | A real defect in `LocationsTab`: the effect's deps were `[sellerId, status]`, so the run that happened before the permissions arrived returned from `load()` before `setLoading(false)` and nothing ever re-ran it. Fixed by adding `canRead` to the deps; confirmed by two cases in `tests/components/SellerDashboard/locations/LocationsTab.test.tsx` that were seen red first. |
| The latitude box refusing 999 with no inline error | Not a defect. The box is `<input type="number" max={90}>`, so the **browser** blocks the submit and `handleSubmit` is never reached — the component's own latitude rule is unreachable from a real browser. The test reads `validity.rangeOverflow` instead. See `fieldValidity`. |

## What is here now, and what is not

Built: the harness, preflight, the server, both projects, the action and
scenario layers, `guest.live.spec.ts`, `locale.live.spec.ts` and
`session.live.spec.ts`.

Not built yet, each its own ticket:

- **`e2e-money-path`** — the session, `auth`/`cart`/`order` actions, and the
  journey that places a real order and cancels it. The hooks it needs
  (`addToCartButton`, `Confirm-Order-Button`, `cachondelivry-cartpage`) are
  already in the app and already listed in `selectors.ts`.
- **`e2e-scripted-mode`** — the specs that use `scenarios/`. `mockBackend` is
  built and ready; read the note at the top of `scenarios/index.ts` first,
  because sending an OTP goes through a server action and cannot be intercepted.
