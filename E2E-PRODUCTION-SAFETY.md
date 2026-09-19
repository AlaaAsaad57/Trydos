# Running the browser tests against production — safely

**Status: BUILT.** The work item is
`_specs/e2e-production-safety-lock/`, and the branch is
`ticket/e2e-production-safety-lock`.

## What changed between this design and what was built

Read this list before the rest of the document. The design below is kept as the
reasoning; these five points are where the built thing differs, and the code is
the source of truth.

1. **The QA story host is a code constant, not a configuration value.** It is
   `qa-test.trydos.tech` in `utils/qaStoryFilter.ts`, with an optional
   `NEXT_PUBLIC_QA_STORY_LINK_HOST` override that falls back to the constant
   when empty or unparseable. Section 3 and O-7 below argue for a configured
   value; that was changed because an unset or drifted host is a silent hole,
   and the value is public by design anyway — it ships in the browser bundle and
   it is not a secret.
2. **The QA-mode header is attached with `page.route` on a narrow pattern**, not
   with `extraHTTPHeaders` (section 6). `extraHTTPHeaders` puts the secret on
   every request the browser makes, including ones to the media store. The
   handler matches only Server Action POSTs and document/RSC navigations, and it
   calls `route.fallback()` rather than `route.continue()` — `continue()` ends
   the chain and would silently disable any other `page.route` a spec
   registered. See `tests/e2e/actions/qaProduct.ts`.
3. **The catalogue base query is written out SIX times**, not four. Four carry
   the clause; the two left out (`ElasticsearchReader.getRules` and
   `serverRequests/meta/home.ts`) read category names only, and the visible
   effect of leaving them is a category tab.
4. **The seed polls the product SEARCH, not the boutique list.** The boutique
   path is filtered unconditionally — there is no QA-mode switch on it — so a QA
   boutique can never come back from it by design. The product search is both
   reachable and a stronger proof: the catalogue query requires
   `boutique.status: 1` and `seller_status: "approved"`, so the product
   appearing proves the boutique is indexed, active, and the seller approved.
5. **The admin approve screens are the one unverified part.** Nothing in this
   repository describes the admin dashboard. `tests/e2e/harness/adminApprove.ts`
   is written against the shape the two screens share, every locator is
   overridable from the environment, and a row whose identity cannot be read is
   **refused rather than approved**.

---

The goal: run the end-to-end suite against a real production environment, on any
environment, with no per-environment setup — and never let a real customer see
test data, and never touch real data.

Two rules hold the whole design together:

1. **Test data carries its own mark.** The mark travels inside the row. So any
   service, and any client, can filter it with one rule and never ask another
   service anything. This is the opposite of putting an `is_tester` flag in five
   services and keeping them in step.
2. **Filter discovery. Never filter a direct lookup.** A customer can only see
   what a search, a list or a feed hands them. A page reached by a slug nobody
   published is not a leak.

---

## 1. What is settled

These came from the product owner and are treated as fixed.

| Fact | Effect on the design |
|---|---|
| The backend is 5 services: market, chat, stories, wallet, comments+reactions | A design that needs all 5 to agree is rejected |
| Only **market** has a tester flag on a customer | That flag is used, but only for the signed-in viewer |
| Adding the flag to the other 4 means syncing, and syncing means bugs | So nothing syncs. The mark lives in the data |
| A boutique or product with `status = 0` **can never be bought** | The test shop and test product must be **active**. So our own filter has to do the hiding |
| The **mobile app reads the catalogue through this app's routes** | This app is the single door for the catalogue, for both clients |
| The mobile app reaches **stories, comments, chat and wallet directly** | Our filter cannot reach those. Only stories is a real leak |
| Production may have no test account, no seller and no shop yet | The setup must create what is missing and skip what exists |
| QA mode (a secret header) is wanted | Section 5.3 |

### Decided values

| Decision | Value | Note |
|---|---|---|
| Test shop slug prefix | **`trydos-qa-`** | a constant in code, never configured |
| Test story link host | **a configuration value**, set per environment | not a constant in code, by decision. See section 3 for the rule that stops an unset value becoming a leak |
| QA mode on the home page | **No** | the home page stays cached for real customers. Section 5.1 |
| Production environment | **Does not exist yet** | every address in `guard.ts` is staging. The lock is built and proven on staging first; the production allow-list stays empty until the hosts exist |
| Mobile reads the catalogue | **Only through this app's routes** | so the filter is a real lock for both clients. The whole design rests on this |
| Market's tester flag in the profile | **Not returned today** | so QA mode is the only signal that turns the filter off. The flag is a later second layer — one field, one endpoint, one service |
| Buying from a hidden-but-active shop | **Works** | the shop really is active in market; our filter only changes what a search returns |
| Test stories | **Hidden by both the web app and the mobile app**, by the QA link | so stories are not a leak. Story tests can run in production. The feed returns the `link`, so the filter can read it |
| Comments and reactions | **Shown only on a product page**, never in a global feed | so test comments are free — they sit on a product nobody can find |
| Order of work | **Build the full lock now** | not read-only monitoring first |
| Ticket scope | **Everything in one work item** — seed, filter, QA mode, and migrating the existing tests | section 14 |
| The rule applies on staging too | **From day one** | staging holds other people's work. Section 14 |
| Finding the test product | **The seed names it.** One case finds it by search; the BUY cases open it by URL | no `TEST_PRODUCT_SLUG` |
| Stock | **Set very high, once** | nothing tops it up |
| A missing or unbuyable test product | **Fails the run loudly**, naming which of the three | never skips |
| Seller-request approval | **The seed drives the admin dashboard UI with Playwright** | the most fragile part, and it keeps super-admin in CI |
| The QA seller | **Shopper B, `TEST_ACCOUNT_PHONE_2` (`…850`)** | shopper A (`…307`) already has a seller account and must not be touched. This inverts today's comments in `harness/env.ts` and the README |
| The buyer | **Shopper A, `TEST_ACCOUNT_PHONE` (`…307`)** | A buys from B's QA shop |
| Test orders reaching operations | **Accepted cost** | the seller is our own test account, so the order lands in our own inbox. Tagged and cancelled in the run. Finance and reporting still count it |
| Admin access for the setup | **The existing `ADMIN_DASHBOARD_*` account, which is super-admin** | accepted risk. CI will hold full control of production. Guards in section 10 |

---

## 2. What the code says today — verified

Every line below was read in this repository. Nothing here is assumed.

### 2.1 The catalogue has one door

| Path | Reads by | File |
|---|---|---|
| Search, listing, facets, home rows, related, recommended | a **search** through `buildBaseConditions()` | `services/elastic/helpers.ts:1316` |
| Sitemap | its **own** query, `buildProductBaseQuery()` | `services/elastic/sitemap.service.ts` |
| Product page — ratings, views, shares | `client.get({ index, id })` and `term: { product_id }` | `serverRequests/product.tsx:384`, `utils/pagesDataRequests/ProductPageData.ts:107` |
| Product page — the product itself | market, **by slug** | `serverRequests/product.tsx:174` (`/web/product/globalDetails/{slug}`) |

`buildBaseConditions()` already demands `status: 1`, `boutique.status: 1`,
`brand.status: 1`, and no `deleted_at` (`helpers.ts:1331-1336`).

**The product page never goes through `buildBaseConditions()`.** It is all
by-id and by-slug. So filtering discovery cannot break it. That single fact is
what makes the guest journey possible (section 6).

### 2.2 The mobile app really does come through this app

- `app/api/mobile/product/details/[slug]/route.ts` — reshapes market's answer
  into "the mobile `/product/details` contract", with
  `Access-Control-Allow-Origin: *`
- `app/api/mobile/product/qty/[slug]/route.ts`
- `app/api/internal/mobile-error-log/route.ts`
- `app/api/products/recomended/route.tsx` and `app/api/home/boutiques/route.ts`
  both read `country` / `language` from **request headers** and both send
  `Access-Control-Allow-Origin: *`

### 2.3 The index already carries what we need to mark a shop

`services/elastic/helpers.ts`:

- `:437` — `result.boutique_id` is a top-level field
- `:73-76` — `custom_boutiques.id`, `.name`, `.slug`, `.language_code`

So a shop can be matched exactly, by id or by slug prefix.

### 2.4 The cache forbids reading a cookie or a header

`serverRequests/cached/home.ts:20-29`, word for word:

> Every function here takes plain serialisable arguments. Nothing reads a
> cookie, a header or the clock: those are the three things a `use cache` scope
> forbids, and they are also the three things that would make one shopper's data
> end up in another shopper's cache entry.

And, measured on this repository:

> Only the values a cached function **actually reads** join its cache key. […] a
> cached function that ignored the locale served one entry to `/lb-ar` and
> `/tr-tr` alike. Nothing warns you.

The `"use cache"` readers are `serverRequests/cached/home.ts:53,98,125,151`,
`serverRequests/cached/currency.ts:33` and `serverRequests/meta/home.ts:147`.

**This decides the QA-mode design.** The QA flag can never be read inside a
cached function. It must arrive as an argument, and it must be used, or it will
not join the cache key — and a tester's unfiltered page would be served to a
real customer.

### 2.5 The pieces the setup needs already exist

| Need | It exists at |
|---|---|
| "Is this account a seller?" | `SellerDashboardService.getShopes(true)` — `204` or an empty list means no (`components/settings/GoToSellerDashBoard.tsx:48-75`) |
| Send a seller request | `POST /shop/vendor-requests` (`components/settings/BecomeSellerModal.tsx:350`) |
| Turn a product on or off | `changeProductStatus()` (`services/sellerDashboard/index.ts:920`) |
| Turn a boutique on or off | `changeBoutiqueStatus()` (`services/sellerDashboard/index.ts:978`) |
| Create a boutique | `addBoutique()` → `POST /shop/boutiques` (`services/sellerDashboard/index.ts:1021`) |
| A new product starts hidden | "The product always starts with status = 0" (`services/sellerDashboard/index.ts:907`) |
| A story carries a **link** | `StoryService.upload(file, cb, is_video, endUpload, link)` → `/api/v1/stories/add_story` (`services/story.ts:116-137`) |
| Delete a story | `StoryService.deleteStory(id)` (`services/story.ts:157`) |
| A test allowlist read from env, empty by default | `utils/server/otpAllowlist.ts`, `OTP_TEST_PHONES` |
| Cancel an order left behind | `tests/e2e/harness/orderCleanup.ts` |
| Refuse an unknown backend host | `tests/e2e/harness/guard.ts` |

---

## 3. The mark — what makes a row "test"

No ids in configuration. The mark arrives with the row, so a brand-new
environment works on the first run.

| Thing | Its mark | Chosen by |
|---|---|---|
| Test shop | slug starts with `trydos-qa-` | **a constant in code** |
| Test product | it lives in the test shop | nothing extra needed |
| Test story | its `link` points at a QA host | **a configuration value** |
| Test comment / reaction | none needed — it sits on a test product's page | — |
| Test chat | none needed — 1 to 1, test talks only to test | — |

The **shop prefix is a constant in this repository**. That is what makes the
catalogue lock work in a brand-new environment with no setup.

**Guard the prefix.** A real seller who names a shop so its slug starts with
`trydos-qa-` would vanish from the catalogue and lose sales, and nothing would
say so. Block the prefix in the boutique-create form.

### The story host is configured — and that opens a hole

By decision, the QA story host is a **configuration value**, not a constant. It
should be a subdomain of `trydos.tech`, which the company already owns, so
nothing needs registering and nobody can take it. It needs no real page behind
it — the filter only reads the text of the link.

But a configured value can be **unset**, or the app and the test can hold
**different** values. Either way the app filters nothing, the test still uploads
a story, and that story is visible to everybody. Nothing would say so.

Three rules close that, and all three are needed:

1. **Unset means the story test does not run.** It must never mean "filter
   nothing". This follows the rule `tests/e2e/harness/env.ts` already uses:
   *unset means skip, never fail.*
2. **The test reads the same value the app reads.** One name, one source. The
   test never keeps its own copy of the host.
3. **The lock check proves it on every run** (section 8): upload the test story,
   then confirm a guest cannot see it in the feed. A value that drifted is
   caught on the run it drifts, not months later.

---

## 4. Where the filter goes

### 4.1 One clause covers most of it

In `buildBaseConditions()` (`services/elastic/helpers.ts:1316`):

```ts
// Hide the QA shop from every discovery path, unless the viewer may see it.
if (!qaView) {
  mustNotConditions.push({
    nested: {
      path: "custom_boutiques",
      query: { prefix: { "custom_boutiques.slug.keyword": TEST_SHOP_SLUG_PREFIX } },
    },
  });
}
```

### 4.2 The base query is copied four times — all four need the filter

This is the biggest single risk in the build, and it was found by reading the
code, not by guessing. The same "only active products" rule exists in **four**
separate places, and they have already drifted apart:

| # | Where | Note |
|---|---|---|
| 1 | `services/elastic/helpers.ts:1316` — `buildBaseConditions()` | the one most paths use |
| 2 | `services/elastic/elasticsearch-reader.service.ts:630` — its **own** `buildBaseConditions()` method | a second, separate copy |
| 3 | `services/elastic/elasticsearch-reader.service.ts:~53` — `getRules(country)` | a **third** inline copy |
| 4 | `services/elastic/sitemap.service.ts` — `buildProductBaseQuery()` | **the most important.** Miss it and Google indexes the test products |

Copy 2 and copy 3 are what the cached home readers use
(`serverRequests/cached/home.ts` builds on `ElasticsearchReader`).

**A filter added to only one of the four is a filter that does not work.** This
is exactly why the lock check in section 8 is not optional.

Also needs its own line:

| File | Why |
|---|---|
| `app/api/home/boutiques/route.ts` | a boutique list, not a product list |

**Checked and not a risk:** `services/elastic/sellerComments.ts` reads the
*comments* index, not the catalogue index, and is scoped by product. A test
comment sits on a test product that nobody can find, so it needs no filter.

### 4.3 Answers from somewhere else get a response-level filter

`app/api/products/recomended/route.tsx` takes a ranking from the recommendation
engine (`ELASTIC_BACKEND_URL`). We do not build that query, so we drop test
items from its **answer** instead.

### 4.4 Never filter these

The product page's own reads — `client.get` by id, `term: { product_id }`, and
market's `globalDetails/{slug}`. They are direct lookups, not discovery.

---

## 5. Who may see test data — two signals today, three later

**Market's tester flag is stored but is NOT returned in the profile this app
receives (O-1, answered).** So the flag cannot be used yet. That simplifies the
build: **QA mode is the only signal that turns the filter off**, and it covers
the signed-in tester and the guest alike.

### 5.1 QA mode — a secret header — the only signal today

**How it works**

- A secret in the environment, e.g. `QA_VIEW_SECRET`. **Unset means QA mode does
  not exist** — the same default as `OTP_TEST_PHONES`.
- The test browser sends a header on every request. Playwright's
  `extraHTTPHeaders` on the browser context covers documents, RSC navigations
  and XHR in one place.
- The header name must be stack-agnostic — no `go`, `next`, `laravel`. For
  example `x-qa-view`.
- The server compares it to the secret and produces one boolean, `qaView`.

**The rules it must obey — all four, or it becomes the leak it was meant to avoid**

1. **`qaView` is passed as an argument. It is never read inside a `"use cache"`
   function.** A cached scope forbids reading a header, and a flag read outside
   the key would serve a tester's page to a real customer (section 2.4).
2. **The argument must be used inside the cached function**, or it does not join
   the cache key. This repository has already been bitten by exactly that with
   the locale.
3. **Every response built with `qaView = true` is `no-store`** at the HTTP level
   as well. Two layers, because the cost of being wrong is a real customer
   seeing test products.
4. **The secret is never logged, echoed, or put in an error message.** This
   repository is public and its CI logs are world-readable.

**Where QA mode applies — decided**

**Only the already-dynamic paths:** search, listing, facets, related,
recommended, and the API routes. **Never** the cached home readers (O-2).

Reason: the home page would have to read a header to learn `qaView`, and reading
a header makes a route dynamic. That would take static rendering away from the
home page for every real customer, to serve one test case. Not worth it.

Because of that, rules 1 and 2 above never have to be applied to a real cached
function — the home page carries the filter unconditionally instead. See
section 5.3.

### 5.2 A direct lookup — no signal needed

Anyone holding the test product's slug can open its page and add it to a cart.
That is by design (section 6). Real customers never get the slug, because every
path that could hand it to them is filtered.

### 5.3 The cached home readers — the filter is always on

The home page is the one cached surface, and QA mode does not reach it. That
turns the hardest part of this design into the easiest.

The cached readers (`serverRequests/cached/home.ts`, `meta/home.ts`,
`cached/currency.ts`) apply the filter **unconditionally**. No flag, no
argument, no header.

What that buys:

- **No header is read**, so the home page does not become dynamic and real
  customers keep the cached, fast page.
- **No new cache key**, so the "only values the function reads join the key"
  trap (section 2.4) cannot bite here.
- **No way to serve an unfiltered home page to anybody**, tester included. The
  test shop simply never appears on the home page, for anyone.

The cost is one line in section 6's table: a test cannot check the home page
rows against the test shop in production. That check stays on staging.

### 5.4 Market's tester flag — a second layer, later

The flag exists in market but is not returned to this app today. When it is
returned, the app reads it for the **current viewer only** — no list, no id map,
no sync — and a signed-in tester then sees test data without QA mode.

The ask is **one field on one endpoint of one service.** It is the only backend
change in this whole design.

When it lands, QA mode stays. It is still the only thing that works for a guest.

---

## 6. The guest problem, and how it is solved

**The problem.** A guest test must prove "a guest can add to the cart". If a
guest cannot see test data, the test has to add a **real** seller's product —
which is touching real data. That is not acceptable.

**The solution.** The guest opens the test product **by its slug**, not through
a search. The product page is a direct lookup (section 2.1), so our filter never
touches it. The seed hands the slug to the spec.

So the spec calls `gotoTestProduct(slug)` instead of `gotoFirstProduct()`.
Nothing new is needed — no session, no header, no special case.

QA mode (5.3) is the second layer: with it, a guest test can also prove that
search and listing behave, using the test product.

### What a guest can and cannot prove in production

| Guest journey | In production? |
|---|---|
| Open a product page, add to cart, change quantity, remove | **Yes** — on the test product, by slug |
| Browse the real catalogue, open a real listing, read it | **Yes** — reading real data changes nothing |
| Search returns results at all | **Yes** — a read |
| Search finds our own known product by name | **Only with QA mode on** |
| The test shop appears in a home-page row | **No** — the home page filter is always on, for everyone. This check stays on staging |

---

## 7. The setup — it creates what is missing, and skips what exists

Runs **once**, in `globalSetup`. Every step is "check first, act only if needed".

### Which identity is the seller

| Identity | Env key | Ends with | Role |
|---|---|---|---|
| Shopper A | `TEST_ACCOUNT_PHONE` | `…307` | **the buyer**. Already has a seller account of its own, which this setup must never touch |
| Shopper B | `TEST_ACCOUNT_PHONE_2` | `…850` | **the QA seller**. Not a seller yet, so it exercises the whole become-a-seller flow |

**This inverts what the suite assumes today.** `tests/e2e/harness/env.ts:135`
says *"Shopper A — who is also the seller"*, and `tests/e2e/README.md` repeats
it. Both must be corrected in the same change, or the next reader will trust a
comment that is wrong.

Putting the QA shop on A would have built it inside A's existing seller account,
mixing our data with whatever is already there. That is the reason for the swap.

### The steps, each with its verified call

1. **Sign in as shopper B** (`…850`).
2. **Read the profile. If market does not say this account is a tester, stop.**
   We never set that flag ourselves. A human grants it. It is the permission to
   run at all.
3. **Is B a seller?** `getShopes(true)` — `204` or an empty list means no. If
   yes, skip to 6.
4. **Become a seller from our app.** `POST /shop/vendor-requests`
   (`components/settings/BecomeSellerModal.tsx:350`). `GET` on the same path
   reads the status back: PENDING / REJECTED / APPROVED.
5. **Approve the seller from the admin dashboard.** No API for this exists in
   this repository, so the setup drives the admin UI in a browser (section 14).
   Then re-read the status until it is APPROVED.
6. **Create the boutique** — `addBoutique()`, `POST /shop/boutiques`
   (`services/sellerDashboard/index.ts:1021`). Name it so the slug starts with
   `trydos-qa-`. It stays inactive until step 10, because it cannot be activated
   before it holds an active product. Note the create body key is
   `boutique_custom_data`, **not** `custom_data`; the wrong one silently drops
   every translation.
7. **Create the location** — `addShopLocation()`, `POST /shop/locations`
   (`:1101`). This must come before the product, because a product requires a
   `location_id` (`components/SellerDashboard/productEdit/helpers.ts:898`,
   *"Location is required"*).
8. **Create the product in that boutique** — `addProduct()`,
   `POST /shop/products` (`:908`), multipart via
   `buildUpdateFormData(form, true)`. It always lands at `status = 0`.
9. **Enable the product** — `changeProductStatus(.., 1)` (`:927`).
10. **Enable the boutique** — `changeBoutiqueStatus(.., 1)` (`:978`).
11. **Run the lock checks** (section 8), then hand the ids and the product name
    to the specs in memory.

**The product is enabled before the boutique, and the order matters.** The
product's `boutique` activation check only asks that the product belongs to a
boutique, not that the boutique is active. The boutique is the one with the
harder requirement: it needs an active product before it will turn on. Doing it
the other way round fails at step 10 with a `detailed_error` that reads like a
bug in the setup.

### What blocks activation — the documented list

`docs/mobile-seller-dashboard-api-guide.md:99-101`: `status = 1` succeeds only if
the product passes its checks, otherwise **422** with `detailed_error:
[{ message }]` naming what to fix. The five checks are:

**approval · an `en` translation · stock · boutique · synced colour images**

So the product cannot be a stub. In particular it needs at least one image, and
the image flow is two calls: upload to the media store (folder `product`), then
save with `{ images: [{ url, name }] }` — the media store returns only a
filename, so the path `/product/<filename>` is built by the caller.

Stock must be above zero (`helpers.ts:912`) and is set **very high, once**.

### Idempotency details that will bite

- **A location has no delete endpoint** (`:1052`) — it can only be deactivated.
  The QA location is permanent once created.
- **A location name is unique per shop per country**; a duplicate returns 422
  with `detailed_error[].code = "name"` (`:1099`). So "create the location"
  really means "find it, or create it" — a 422 on the name is success, not
  failure.
- A known create-only backend bug applies to `custom_data.similar_words`:
  500 on create, fine on update.

### Three conditions, and none is optional

- It may only **create**. It never deletes and never edits anything it did not
  create. A setup with delete power, pointed at production, is the worst thing
  that could come out of this plan.
- It **reuses**. Steps 6 to 10 do not build a new shop and product every night.
  Only the order is new, and the order is cancelled.
- The admin credential is **super-admin** by decision, so the guards in
  section 10 carry the whole weight.

### One thing to confirm before building

**Can a seller buy from their own shop?** If not, the split above is required
rather than merely tidy: B sells, A buys. If it is allowed, either account could
buy, and the split is still worth keeping for clarity.

---

## 8. The lock check, and the trap inside it

Our filter fails open. If somebody adds a read path and forgets the filter, test
data appears and nothing complains. That is the weakness of every deny-list, so
a check has to close it.

Before a single test runs, the setup proves the lock holds: a guest must not
find the test product in search, listing, home, related, recommended, or the
sitemap.

**The trap.** Elasticsearch indexes late. A product that is not indexed yet is
not findable by anybody — so the guest check passes for the wrong reason. That
is a silent false pass, and this repository's testing rules forbid exactly that.

**So the check has two halves, in this order:**

1. **With the filter off** — QA mode today; a signed-in tester too, once market
   returns the flag — find the product. Retry until it appears, with a time
   limit. Only now is the index known to hold it.
2. **As a guest**, search for the same thing. It must not be found.

- Half 1 times out → stop, and say the index never caught up.
- Half 2 finds it → stop, and say the lock is broken.

Either way, **nothing is created and no test runs.**

### The story lock is checked the same way

The story host is a configured value, so it can be unset or can drift out of
step with the app (section 3). The catalogue check above would not notice, so
stories get their own check, in the same two halves:

1. Upload the test story with the QA link.
2. **As a guest**, read the stories feed. The story must not be there.

If it is there, stop and say the story filter is not working — and name whether
the host is unset, or set to something the app does not match.

This check runs **before** any other story test. It is the only thing standing
between a configuration typo and a test story on every shopper's screen.

---

## 9. Rules the tests follow

- **Reading real data is allowed.** Browsing, searching, opening a real product
  page. A read changes nothing.
- **Writing goes only to test-owned data**: the test shop, the test product, the
  test accounts' own cart, orders, chats and wallet.
- **A real product never enters a test cart** — not even a guest's.
- A comment or a rating only goes on a **test** product.
- A chat only goes to the **other test account**.
- Everything created carries the run tag `LIVETEST-<8 hex>` and is registered
  for teardown the moment its id is known. The suite already does this.
- Orders are paid by cash on delivery (`sy` only) or a zero-value wallet.
  **Never a card.**
- A test story is deleted in teardown — `deleteStory()` exists.

---

## 10. Run gates

- **Production hosts go in their own allow-list**, not a widened
  `ALLOWED_HOSTS`. `tests/e2e/harness/guard.ts` keeps its staging list exactly
  as it is. The production list is unlocked only by an explicit
  `E2E_ALLOW_PRODUCTION` value.
- **Only specs tagged `@prod-safe` may run against production.** The default is
  refuse, so a spec written next month is never live by accident.
- Production test traffic is marked in PostHog and Sentry, so it does not spoil
  real numbers.
- `retries: 0` and `workers: 1` stay as they are (`playwright.config.ts`). A
  retried write is a duplicated write.

### The admin credential — accepted risk, and its guards

The setup uses the existing `ADMIN_DASHBOARD_*` account, and **that account is a
super-admin**. So once the suite points at production, CI holds full control of
production. This was decided deliberately. It is recorded here because a risk
that is accepted and written down is manageable, and one that is accepted and
forgotten is not.

The guards that go with it:

1. **The setup may call exactly one admin endpoint** — approve a seller request.
   Any other admin call is a defect, not a feature. Put that limit in the code,
   not only in this document.
2. **The credential never reaches a log, an error message, or an artifact.**
   This repository is public and its CI logs are world-readable.
3. **It is only ever used by the setup**, never by a spec.
4. **Revisit this before production exists.** A scoped account with one
   permission is the right answer; using the super-admin is the fast answer. The
   fast answer is fine for staging, and it should not survive into a real
   production run without being looked at again.

---

## 11. What is covered, and what is not

| Risk | Status |
|---|---|
| Real customers see test products | **Closed** — discovery filtered, web and mobile |
| Google indexes test products | **Closed** — the sitemap query gets its own filter |
| A guest test touches a real product | **Closed** — direct slug, never a search result |
| Test comments reach a real seller | **Closed** — test comments only on test products |
| Test chat reaches a real person | **Closed** — test talks only to test |
| Real customers see test stories **on the web** | **Closed** — filter by the QA link |
| Real customers see test stories **on mobile** | **Closed** — the mobile app applies the same QA-link rule |
| An unfiltered page is cached and served to a real customer | **Closed.** The one cached surface — the home page — carries the filter unconditionally and never reads the QA header, so there is no unfiltered version of it to cache (section 5.3) |
| The filter is added to some copies of the base query but not all four | **Open, and the most likely way this goes wrong.** Section 4.2. The lock check in section 8 is what catches it |
| The QA secret leaks | **Low** — it only reveals test data. But it must never be logged |
| Test data skews production analytics | **Open, low** — mark the traffic |
| Admin credentials in CI against production | **Accepted risk.** The account is a super-admin, so CI holds full control of production. Four guards in section 10, and revisit before a real production run |
| The QA story host is unset, or the app and the test hold different values | **Closed by three rules** (section 3) and proven by the story lock check (section 8). This risk exists only because the host is configured rather than fixed in code |
| A real seller takes the `trydos-qa-` prefix | **Open, low** — block it in the create form |
| A test order is real work for real people | **Accepted.** Our own test seller absorbs it. Finance and reporting still count it (section 13) |

### Not in scope

- Deleting or cleaning historic test data in production. The setup only creates.
- Testing live video / Agora in production.
- Any card payment.
- Read-only production monitoring (layer 1, section 13). Useful, but the
  decision is to build the full lock first.

---

## 12. Questions and answers

**All eleven open questions and both measurements are answered.** Nothing in
this design is waiting on anybody.

### Answered

- **O-1. Answered — the tester flag is stored in market but NOT returned** in
  the profile this app receives. So it cannot be used yet. QA mode (section 5.1)
  is the only signal today. Adding the field is one field, one endpoint, one
  service — the only backend change in this design, and it is not a blocker.
- **O-3. Answered — yes, a tester can buy.** The shop is genuinely active in
  market; our filter only changes what a search returns. The money path is safe.
- **O-4. Answered — both this app and the mobile app will hide any story whose
  link points at the QA subdomain.** So stories are not a leak, and story tests
  can run in production.
- **O-5. Answered — yes, the mobile app reads search, listing, home and
  recommendations only through this app's routes.** The catalogue lock is a real
  lock for both clients. **Everything in this design rests on this one sentence**
  — if it ever stops being true, sections 4 and 5 must be rewritten before the
  next production run.

- **O-6. Answered — no global comments feed.** The mobile app shows comments and
  reactions only on a product page. So test comments stay free: they sit on a
  test product that nobody can find, and they need no mark of their own.

### Decided by the product owner

- **O-7. Decided — the QA story host is a configuration value**, set per
  environment rather than fixed in code. The company domain is `trydos.tech`
  (`next.config.ts:243-244`), so a subdomain of it is the natural choice and
  needs no registration. Section 3 carries the three rules that stop an unset or
  drifted value becoming a leak.
- **O-8. Answered — `trydos-qa-`.** A constant in code, not a configured value.
  Also block that prefix in the boutique-create form.
- **O-9. Answered — there is no production environment yet.** Every address in
  `guard.ts` is staging, so the lock is built and proven on staging, and the
  production allow-list stays empty until the hosts exist. Separately:
  `guard.ts` and `harness/env.ts` currently do **not** list the media store
  addresses, so the media host is not guarded — worth fixing before any
  production run.
- **O-10. Answered — the existing `ADMIN_DASHBOARD_*` account is a super-admin**,
  and it is the one the setup will use. Accepted risk: CI will hold full control
  of production. Section 10 carries the four guards that go with it, and the note
  to revisit it before a real production run.
- **O-11. Decided — accepted.** A test order reaches our own test seller's
  inbox, and finance and reporting still count it. The order is tagged
  `LIVETEST-<hex>` and cancelled inside the run. Section 13 explains what
  cancelling does not undo.
- **O-2. Answered — no.** QA mode does not cover the home page. The home page
  stays cached for real customers.

### Answered while planning the ticket

- **O-12. Answered — no admin approval API exists here.** Only the shopper side
  (`GET`/`POST /shop/vendor-requests`). The seed will drive the admin dashboard
  UI instead. See section 14.
- **O-13. Answered — the `sy` empty product-name bug is fixed.** It no longer
  threatens BUY-01 and BUY-04, which all run in `sy` because cash on delivery
  exists only there (`actions/nav.ts:220`).

### Open for the research stage

- **R-1. The admin approve screen has never been read** — its path, its controls
  and its sign-in flow. The largest piece of unknown work in the ticket.
- **R-2. Answered.** The product activation checks are documented at
  `docs/mobile-seller-dashboard-api-guide.md:99-101`: **approval, an `en`
  translation, stock, boutique, synced colour images**. Section 7 carries them.
- **R-3. Can a seller buy from their own shop?** If not, shopper B must sell and
  shopper A must buy — which is the plan either way. Worth confirming so a BUY
  failure is never mistaken for a marketplace rule.
- **R-4. What does a boutique need to activate?** Partly answered by the product
  owner: **it needs an active product**, which is why the product is enabled
  first (section 7, step 9). The full list is still undocumented —
  `changeBoutiqueStatus(.., 1)` "may 422 with `detailed_error` blockers"
  (`services/sellerDashboard/index.ts:979`). Read the blockers the first time the
  seed runs and write them down next to the product's list.

### Measurements

- **M-1. Answered.** The base query is copied **four** times — see section 4.2.
  `sellerComments.ts` reads the comments index and needs no filter.
- **M-2. Answered.** `addBoutique()` exists —
  `POST /shop/boutiques` (`services/sellerDashboard/index.ts:1021`). Step 5 of
  the setup can use it. Note the body key on create is `boutique_custom_data`,
  **not** `custom_data`; sending the wrong one silently drops every translation.
- **M-3. Closed — the question has no subject.** It asked whether reading the QA
  header would make the home page dynamic for real customers. Because QA mode
  does not cover the home page (O-2), the home page never reads the header. The
  cached readers get the filter **unconditionally** instead — always on, no flag
  — so there is nothing to measure and no speed cost. See section 5.3.
- **M-4. Answered — yes, the stories feed returns the `link`.** So the web
  filter can read it, and the mark works on the read side as well as the upload
  side (`services/story.ts:116-137`).

---

## 13. How other teams do this, and what it means for the order

Running tests against production is normal practice. It is called **testing in
production**. Teams that do it well use three layers, not one.

| Layer | Where | How deep | How often | Do we have it? |
|---|---|---|---|---|
| **1. Synthetic monitoring** | production | shallow, mostly read-only | every 1–5 minutes | **No** |
| **2. Full journeys** | staging | deep, many writes | every deploy | **Yes** — the suite today |
| **3. Canary journeys** | production | deep, few, heavily marked | daily | **No** — this document |

**Layer 1 is missing and it is the cheapest of the three.** It answers "is the
shop working right now" within minutes: is the site up, does sign-in work, does
search return results, does the product page load, does the cart page load. It
writes almost nothing, so it needs none of the lock in this document. Off-the-shelf
tools do it: Checkly, Datadog Synthetics, New Relic Synthetics, Grafana Synthetic
Monitoring.

### The six techniques used for layer 3

1. **Marked test accounts** — a few real accounts flagged in the identity
   system. Market's tester flag is this.
2. **Marked test data, excluded everywhere** — not only hidden from shoppers,
   but excluded from analytics, business reporting, finance and seller payouts.
3. **Payment provider sandbox cards** — a real charge path, no real money. The
   standard way e-commerce tests checkout in production. Trydos uses cash on
   delivery, which has no equivalent.
4. **A dedicated test merchant or tenant** whose data never mixes with real
   sellers.
5. **Feature flags / dark launch** so the test path exists but only testers
   reach it.
6. **A written runbook and a named owner** — who cleans up, and who is called
   when the canary fails at 3am.

### The gap in this plan: cancelling is not excluding

This design places a real order and cancels it in teardown
(`tests/e2e/harness/orderCleanup.ts`). That is not enough, and professional
teams do not rely on it. Before the cancel runs, the order has already:

- reached the seller's real order inbox
- possibly created a task in the fleet delivery product
- entered financial reporting and seller payout figures
- entered business dashboards and analytics

Cancelling removes none of that. The row stays, marked cancelled.

**The professional answer is to mark the order as a test at creation, and have
every downstream system skip it** — fulfilment, finance, payouts, reporting.
That is a business decision, not a frontend one, and it is the single biggest
thing this plan is still missing.

### The decision taken

**Build the full lock now (layer 3). Layer 1 is not built.**

I recommended layer 1 first — read-only production monitoring, days of work
rather than weeks, catching most real production problems with no test data at
all. The decision was to go straight to the full lock. That is the owner's call
and the design proceeds on it.

What that choice costs, written down so it is not a surprise later:

- Nothing useful lands until the whole lock is finished. There is no early,
  cheap win along the way.
- Production still has no "is the shop working right now" signal between
  deploys. Layer 1 remains worth building afterwards.

**The test order is an accepted cost.** The seller is our own test account, so
the order lands in our own inbox. It is tagged `LIVETEST-<hex>` and cancelled
inside the run. Finance, reporting and any fleet task still count it — cancelling
does not undo that. Accepted deliberately, not overlooked.

---

## 14. The existing tests — what they touch today, and the migration

**The rule applies from day one, on staging too.** Staging holds other people's
work, so "only touch data you created" is not a production-only rule.

### What the suite writes to data it does not own

All four cases call the same helper, `addFirstBuyableProduct()`
(`tests/e2e/actions/cart.ts:389`), which walks the first six cards on the home
listing and takes the first one in stock.

| Case | What it does | Whose data |
|---|---|---|
| **BUY-01** | adds a random real product, **places a real order**, cancels it | a real staging seller |
| **BUY-02** | adds a random real product to a **guest** bag (the phone gate stops the order) | a real staging seller |
| **BUY-03** | adds a random real product, reads the bag's money | a real staging seller |
| **BUY-04** | adds a random real product, raises the line to 2, removes it | a real staging seller |

So a real staging seller receives an order and a cancellation on every run.

### Already clean — no work needed

- **Addresses** are created *and* deleted (`shopper.live.spec.ts:682`)
- **Orders** are cancelled in teardown (`harness/orderCleanup.ts`)
- **Profile edits** are the test account's own
- **GUEST-03 / 04 / 05** only read — search, open a product, open the cart drawer
- **No test writes a comment, rating or chat** anywhere
- **PROF-05** uploads to the media store and leaves an orphan object. Known,
  recorded in `tests/e2e/README.md`, out of scope here.
- **GUEST-32..34** register about five guests per run and cannot remove them.
  An accepted exception, already decided.

### The migration

1. **BUY-01 to BUY-04 use the test product**, never `addFirstBuyableProduct`.
2. **Reads keep the real catalogue.** GUEST-03 and GUEST-04 still search real
   data and open a real product. A read changes nothing, and those cases exist to
   prove the real catalogue renders. Pointing them at our own product would
   weaken what they prove.
3. **Search proves search; the URL does the buying.** One case searches for the
   test product by its name, which proves search and QA mode work together. The
   four BUY cases open it **by URL**. So a QA-mode or indexing problem fails one
   clearly named case instead of the whole money path.
4. **The seed names the product**, so the name to search for is known without
   configuration. There is no `TEST_PRODUCT_SLUG`.
5. **Stock is set very high, once** — the suite runs about twice a day, so one
   large number lasts for years. Nothing tops it up.
6. **A missing, inactive or out-of-stock test product fails the run loudly, and
   names which of the three it is.** It never skips. A silent skip of the money
   path is exactly the green tick this repository's testing rules forbid.
7. `docs/testing/E2E_SCENARIOS.md` gets a row for every case added or changed.

### The seed, and the part nobody has looked at yet

**There is no admin approval API in this repository.**
`docs/market-api-inventory.md:138-139` lists only the shopper side of the
vendor request: `GET /shop/vendor-requests` reads your own status
(PENDING / REJECTED / APPROVED) and `POST` submits the application.

**Decision: the seed drives the admin dashboard UI with Playwright**, signing in
with the `ADMIN_DASHBOARD_*` credentials and clicking approve.

Two costs, accepted deliberately:

- **It is the most fragile part of the suite.** Any change to the admin UI
  breaks the seed, and the failure will point at our setup rather than at the
  change that caused it. It must therefore say plainly which admin screen it
  could not drive.
- **It keeps the super-admin credential in CI** (section 10). The alternative —
  a human approving once per environment — would have removed it entirely.

**The open unknown for the research stage:** nobody has looked at the admin
approve screen. Its path, its controls and its sign-in flow all need to be read
before this part can be planned. It is the single largest piece of unknown work
in the ticket.

### What the product create has to survive

- `addProduct()` is `POST /shop/products` (`services/sellerDashboard/index.ts:908`),
  multipart, built by `buildUpdateFormData(form, isCreate)`
  (`components/SellerDashboard/productEdit/helpers.ts:1334`).
- The body contract is `docs/api-requirements/shop-product-body-contract.md`.
- **A product cannot be created active.** It always starts at `status = 0`, and
  `changeProductStatus(.., 1)` "only succeeds if the product passes activation
  checks, otherwise a 422 with `detailed_error` listing the blocking reasons"
  (`:922`). So the seed must build a product complete enough to activate —
  images included — not a stub. **This is what will decide the ticket's real
  size.**
- A known create-only backend bug applies: `custom_data.similar_words` returns
  500 on create and works on update. The seed will meet it.

---

## 15. Related documents

- `docs/testing/E2E_TEST_DESIGN.md` — how the suite works today
- `tests/e2e/README.md` — how to run it and how to add a case
- `docs/testing/E2E_SCENARIOS.md` — the list of cases
