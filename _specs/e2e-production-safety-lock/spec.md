---
ticket: e2e-production-safety-lock
stage: spec
mode: standard
status: complete
owner: developer
updated: 2026-09-19
links:
  clickup:
  github:
---

# Spec — e2e-production-safety-lock

## In plain words

- **What must be true when this is done:** the browser suite owns a seller, a
  shop and a product of its own, and builds them itself on an environment that
  has none. Real customers can never find that shop — not on the web, not in the
  mobile app. The money-path cases buy our own product instead of a stranger's.
- **Each criterion in one line:**
  - `AC-1` — the QA shop is absent from search — it is **not** about the product's
    own page, which stays reachable (`AC-9`)
  - `AC-2` — the QA shop is absent from category and listing browsing — it is
    **not** search (`AC-1`)
  - `AC-3` — the QA shop is absent from home-page rows — it is **not** the
    category tabs, which carry no products
  - `AC-4` — the QA shop is absent from related and recommended products — it is
    **not** listing (`AC-2`)
  - `AC-5` — the QA shop is absent from the sitemap — it is **not** `robots.txt`
  - `AC-6` — a QA story is absent from the stories feed **on the web** — it is
    **not** a promise about the mobile app, and it is **not** about comments,
    which need no rule of their own
  - `AC-7` — a caller holding the QA secret **does** find the QA product in
    search — it is **not** a change to what anyone else sees
  - `AC-8` — nothing produced with QA mode on is ever served to a normal viewer
    from a shared cache — it is **not** about speed
  - `AC-9` — the QA product page opens by its own address for anyone, guest
    included — it is **not** a hole, because nothing links to it
  - `AC-10` — a fresh environment ends with an approved QA seller — it is **not**
    the shop (`AC-11`)
  - `AC-11` — a fresh environment ends with an active QA boutique
  - `AC-12` — a fresh environment ends with a QA location
  - `AC-13` — a fresh environment ends with an active, buyable QA product
  - `AC-14` — running the setup again creates nothing new — it is **not** about
    deleting (`AC-15`)
  - `AC-15` — the setup never deletes or edits anything it did not create
  - `AC-16` — the signed-in money-path cases buy the QA product
  - `AC-17` — the guest bag case uses the QA product
  - `AC-18` — before any case that **uses** the QA product, the run proves a
    normal viewer cannot find it on five live paths — it is **not** the sitemap,
    which `AC-5` proves at unit level
  - `AC-19` — that proof first confirms the index holds the product, so "not
    found" cannot pass for the wrong reason — it is **not** a second copy of
    `AC-18`, it is the guard that makes `AC-18` mean anything
  - `AC-20` — the same proof runs for the QA story before any story case
  - `AC-21` — a QA product that is missing, inactive or out of stock fails the
    run and says which of the three — it is **not** a skip
  - `AC-22` — a run against a production address refuses without an explicit
    opt-in
  - `AC-23` — only cases marked production-safe run against production
  - `AC-24` — the QA secret never reaches a log, an error message or a kept file
- **Out of scope, in one line each:** cleaning historic test data; testing live
  video; card payment; read-only production monitoring; the media orphan the
  picture case already leaves; the guests the session cases already register.
- **Easy to confuse:**
  - `AC-18` is the hiding proof; `AC-19` is the guard that stops it passing for
    the wrong reason.
  - `AC-1` is search; `AC-9` is the product's own address. One is closed, the
    other is open on purpose.
  - `AC-10` is the seller; `AC-11` is the shop. Two separate approvals.

> Define *what* must be true when done. **No implementation details, no file
> names, no code.**

## Feature Name

QA data that the suite owns, and that no customer can find.

## Business Goal

Today a test run places a real order against a real seller's product. That
seller receives an order and a cancellation on every run, and the same shape of
risk blocks the suite from ever running against a real production environment.

When this is done the suite owns everything it touches. That removes the harm to
other sellers now, and it removes the reason the suite cannot run against
production later.

## User Story

> As a Trydos engineer, I want the browser tests to create and use their own
> seller, shop and product, so that no test ever touches a real seller's data
> and no customer is ever shown something a test created.

## Functional Requirements

- **TR-1 — The mark.** QA data is recognisable from its own content, without any
  list of identifiers and without any setting on a new environment.
- **TR-2 — The lock.** QA data never appears in any path a customer can use to
  discover it, on any client.
- **TR-3 — QA mode.** A caller holding a shared secret sees QA data. Everyone
  else, signed in or not, does not.
- **TR-4 — The setup.** On an environment with no QA seller, the run builds one:
  the seller, the shop, the location and the product, each active and buyable.
- **TR-5 — The setup is safe to repeat.** A second run reuses what the first
  built and creates nothing new.
- **TR-6 — The money path uses QA data.** Every case that fills a bag or places
  an order uses the QA product.
- **TR-7 — The lock is proved, every run, before anything else.** The run
  demonstrates the hiding works before it creates or buys anything.
- **TR-8 — Failures name the cause.** An unusable QA product stops the run and
  says what is wrong with it.
- **TR-9 — Production needs an explicit opt-in**, and only cases marked as safe
  for it may run there.
- **TR-10 — The second test identity owns the QA shop.** The buyer stays the
  first identity. (`hasShopperB()` already has an indirect caller, so this is
  about who sells, not about removing dead code — corrected in plan check
  round 1.)

## Non-Functional Requirements

- **Reads stay real.** Cases that only read the catalogue keep using real data.
  A read changes nothing, and those cases exist to prove the real catalogue
  works.
- **No speed cost for customers.** Adding QA mode must not make a page dynamic
  that is cached today.
- **Nothing sensitive in output.** This repository is public and its run logs are
  world-readable.
- **No retries on a write.** A retried purchase is a duplicated purchase.

## Constraints

- **The buyer and the seller are different accounts.** The first test identity
  buys; the second owns the QA shop.
- **Cash on delivery only**, or a wallet with no value. Never a card.
- **The setup may only create.** It may never delete, and may never edit
  anything it did not create.
- **One named exception: a test may delete what it created in the same run.**
  The story case creates a QA story and removes it in its own teardown. That is
  the opposite of the risk this constraint guards — a story left behind is the
  harm, not the deletion. It applies to the story only; the seed's shop,
  location and product are permanent by design. (Added in plan check round 6,
  which found the story teardown contradicted this constraint and `AC-15`.)
- **Stock is set once, high.** The figure is **100,000 units**, chosen by the
  product owner. Arithmetic: the suite buys at most 1 unit per run and runs
  about twice a day, so 100,000 ÷ 2 per day = 50,000 days, and 50,000 ÷ 365 =
  **137.0 years**. Nothing tops it up. (Arithmetic corrected in plan check
  round 2.)
- **The QA names must be unique** and must not collide with names other cases
  already write. They appear in public logs, so they carry nothing but the fact
  that they are QA data.
- **A location cannot be removed once created.** Anything the setup creates
  there is permanent.

## Edge Cases

- The environment already has a QA seller, shop and product — the setup must
  recognise all of it and do nothing.
- A previous run stopped half way, leaving a shop but no product — the setup
  must finish it, not start a second one.
- The search index has not caught up with a newly created product — the run must
  wait rather than read "not found" as success.
- The QA product exists but was deactivated by hand — the run must say so, not
  skip.
- The QA story host is not configured — the story cases must not run, and the
  story filter must not silently pass everything.
- The QA secret is not configured — QA mode must not exist at all.
- A first run creates the shop before the lock exists — ordering inside the work
  must not leave a window where the shop is visible to customers.

## Research Questions Resolved

| OQ | Answer | Lands in |
|------|--------|----------|
| OQ-1 | **Deferred to `/plan`.** The admin approve screen has not been read, and nothing in this repository describes it. The criterion does not depend on how approval happens — only that it ends approved. `/plan` cannot be completed until this is known. | `AC-10`; repeated under Open Questions |
| OQ-2 | **Deferred to `/plan`.** Whether a seller may buy from their own shop is unconfirmed. The design separates buyer and seller either way, so no criterion changes. It matters so a failure is not misread. | Constraints; repeated under Open Questions |
| OQ-3 | **Deferred to `/plan`.** A boutique needs an active product — the product owner confirmed that, and it sets the order of the last two steps. The rest of its requirements are undocumented and must be read from the refusal itself. | `AC-11`; repeated under Open Questions |
| OQ-4 | **Answered: it does not matter.** The mark is a prefix, so a suffix added to a slug still matches it. The search case looks for the name the setup chose, which the setup knows. | `AC-7`, Constraints |
| OQ-5 | **Answered: yes, treat approval as required — and it cuts both ways.** **Five** of the six catalogue queries demand an approved seller, so an unapproved QA seller is invisible to everyone, QA mode included, and the index proof would fail. The sixth — the sitemap's product query — has **no** seller-approval rule, so an unapproved QA product would still reach the sitemap. Approval is needed for the tests to work, and the sitemap filter is needed whether or not the seller is approved. (Corrected in plan check round 1; the first version said four of six and had the drift backwards.) | `AC-5`, `AC-10`, `AC-19` |
| OQ-6 | **Answered: it does not matter.** Stock is set once at 100,000, so whether a cancel returns stock changes nothing. | Constraints |
| OQ-7 | **Answered: QA mode must not touch cached pages.** A cached page may not read the secret, and adding QA mode must not make a cached page dynamic. | `AC-8`, Non-Functional Requirements |
| OQ-8 | **Answered: the question was based on a wrong fact.** `hasShopperB()` already has an indirect caller — `hasTestAccountPhones()` uses it, and `auth.scripted.spec.ts` uses that. So it is not dead code and the no-dead-code rule does not apply. It gains its first **direct** caller here, which is a tidiness gain, not a requirement. (Corrected in plan check round 1.) | `TR-10`, rewritten |
| OQ-9 | **Deferred to `/plan`.** The time the setup and the new cases consume, against the whole-run budget, is arithmetic the plan must show. A previous ticket's panel raised exactly this as a major finding. | Repeated under Open Questions |
| OQ-10 | **Answered: unique, and safe to print.** The QA names must not collide with names other cases write, and they appear in public logs, so they carry nothing but the fact that they are QA data. | Constraints |

## Open Questions

- **OQ-1** — what is the admin approve screen: its address, its sign-in, and the
  control that approves a seller request? `/plan` cannot be finished without it.
- **OQ-2** — may a seller buy from their own shop?
- **OQ-3** — what else, besides an active product, must a boutique have before it
  can be activated?
- **OQ-9** — how much of the whole-run budget do the setup and the new cases
  consume?

## Acceptance Criteria Mapping

| ID | Acceptance criterion | Maps to requirement | Could pass wrongly if |
|------|----------------------|---------------------|-----------------------|
| AC-1 | A viewer without QA mode searching for the QA product's name gets no result from the QA shop. | TR-2 | The product was never indexed, so nothing would find it anyway. The check must first prove the index holds it (`AC-19`). |
| AC-2 | A viewer without QA mode browsing the QA product's category and listing never sees it. | TR-2 | The listing was filtered by something unrelated — a country, a price band — that already excluded it. The check must browse where an unfiltered product of that kind does appear. |
| AC-3 | A viewer without QA mode on the home page never sees the QA shop or its product in any row. | TR-2 | The home page served a cached copy made before the QA shop existed. The check must be made against a freshly produced page. |
| AC-4 | A viewer without QA mode never sees the QA product among related or recommended products. | TR-2 | Those rows were empty, or returned too few items to reach the QA product. The check must confirm the rows had content. |
| AC-5 | The sitemap never lists the QA product. | TR-2 | The sitemap was generated before the product existed, or was served from a cached copy. The check must confirm the sitemap is current. |
| AC-6 | A viewer without QA mode reading the stories feed **on the web** never sees a story whose link points at the QA host. | TR-2 (web only) | No QA story existed at the time of the check, so nothing could appear. The check must create one first and confirm it exists. **Scope corrected in plan check round 2:** the story module is client-side, so this criterion cannot speak for the mobile app, and saying otherwise would record a lock that does not exist. |
| AC-7 | A caller holding the QA secret searching for the QA product's name does find it. | TR-3 | The search matched a different product with a similar name. The result must be confirmed as the QA shop's own product. |
| AC-8 | A response produced while QA mode was on is never served to a viewer without QA mode. | TR-3 | The two viewers were served by different instances, so no sharing could occur in that run. The check must exercise the same shared path twice in sequence. |
| AC-9 | The QA product's own page opens, and can be put in a bag, for a guest with no QA mode. | TR-6 | The guest was carrying QA mode from an earlier step. The check must use a session that never had it. |
| AC-10 | On an environment with no QA seller, the run ends with a QA seller whose application is approved. | TR-4 | The account was already a seller from some earlier work, so the approval path never ran. The check must distinguish "already approved" from "approved by this run". |
| AC-11 | On an environment with no QA boutique, the run ends with a QA boutique that is active. | TR-4 | The boutique was reported active by the call that created it, without re-reading its stored state. The check must read the boutique back. |
| AC-12 | On an environment with no QA location, the run ends with a QA location. | TR-4 | A location belonging to another shop was found and counted. The check must confirm the location belongs to the QA shop. |
| AC-13 | On an environment with no QA product, the run ends with a QA product that is active and has stock. | TR-4 | The product was created but left inactive, and the check read the creation response rather than the product's stored state. |
| AC-14 | Running the setup a second time on the same environment reuses the **same** boutique, location and product — the second run reports the same ids as the first. | TR-5 | Nothing was created the first time either, so there was nothing to duplicate. The check must run twice against an environment where the first run really created something. **Reworded in plan check round 3:** the earlier wording invited a count assertion, which `CLAUDE.md` → Testing rule 5 forbids ("never assert on a count"). Same ids is the thing actually meant, and it survives a step being added. |
| AC-15 | **The setup** makes no call that deletes, and no call that changes anything it did not create. | TR-5 | The environment happened to have nothing worth deleting, so a destructive call would have had no visible effect. The criterion is about the calls made, not their outcome. **Scope note (plan check round 6):** this covers the **setup** only. The story case's own teardown deletes the story it just created, which the Constraints allow as a named exception, and it is not part of what this criterion audits. |
| AC-16 | Every signed-in case that fills a bag or places an order uses the QA product. | TR-6 | A case took the QA product by chance because it happened to be first in a listing. The criterion must be met by the case asking for it, not by luck. |
| AC-17 | The guest bag case uses the QA product. | TR-6 | Same as `AC-16`. |
| AC-18 | Before any case that **uses** the QA product runs, the run proves a viewer without QA mode cannot find it through **search, listing, home, related and recommended** — five live paths. The sitemap is proved at unit level instead (`AC-5`). | TR-7 | One of the five paths was not actually exercised — it errored, or returned nothing for an unrelated reason — and its silence counted as a pass. **Reworded in plan check round 3:** "before any other case" was not achievable (spec files run in path order), and a live sitemap check would cost a full catalogue scroll every run. What is achievable, and true, is that the lock spec sorts before every case that touches QA data. |
| AC-19 | That proof first confirms, with QA mode on, that the index holds the QA product, and waits until it does. | TR-7 | The wait was satisfied by any answer rather than by finding the product itself. |
| AC-20 | Before any story case runs, the run proves a normal viewer cannot see the QA story in the **web** feed. | TR-7 (web only) | The QA story was never created, so nothing could appear. The check must first confirm the story exists — **from the stories backend's own answer when it was created**, never from a feed read. **Corrected in plan check round 3:** the feed filter has no viewer condition, so it hides the QA story from its own author too; confirming existence through the author's feed could never have passed. |
| AC-21 | When the QA product is missing, inactive or out of stock, the run fails and the failure says which of the three it is. | TR-8 | The run skipped instead of failing, and the skip was read as a pass. |
| AC-22 | The target guard refuses an address that is not a known test address, and the refusal names the setting it refused. | TR-9 | The address was a known test address anyway, so the refusal never had to fire. The check must use an address that is not on the list. **Reworded in plan check round 3:** the earlier wording said "before anything is built or started", which the declared case cannot see — it runs after the build. The "before the build" half is already true today and is delivered by `pnpm e2e:preflight`, which runs ahead of the build step in CI; this criterion covers the guard's behaviour, which is what a case can prove. |
| AC-23 | With production explicitly allowed, only cases marked production-safe run. | TR-9 | No case was marked unsafe, so nothing was there to exclude. |
| AC-24 | The QA secret does not appear in any run output or any file the run keeps. | TR-3 | The secret was unset during the check, so there was nothing to leak. |

## Out of Scope

- Removing or cleaning QA data that already exists on an environment. The setup
  only creates.
- Testing live video.
- Any card payment.
- Read-only production monitoring, which is a separate and cheaper kind of test.
- The stored picture that the profile picture case leaves behind on every run.
  Already known and accepted.
- The guests that the session cases register on every run. Already known and
  accepted.
- Hiding QA data from the business: admin screens, seller reports, finance and
  analytics all still count it.
- Excluding a QA order from fulfilment, finance or payouts. Accepted as a cost,
  because the seller is our own account.
