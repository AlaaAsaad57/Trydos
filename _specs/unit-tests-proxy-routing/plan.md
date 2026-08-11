---
ticket: unit-tests-proxy-routing
stage: plan
mode: standard          # single workflow form — no other modes (ADR-011)
status: complete        # not_started | in_progress | blocked | complete
owner: developer
updated: 2026-08-10
links:
  clickup:
  github:
---

# Plan — unit-tests-proxy-routing

> Decide the approach before changing code. Plan only — no implementation here.

## Approach

Add **one new test file**, `tests/proxy.test.ts`, and change nothing else. It
tests the proxy the way Next does: build a request, call the exported function,
and read what comes back — the status, the address in the `location` header, and
the cookies on the response. The helpers inside the file are private, so this is
the only honest way in, and it is also the right one: it tests the behaviour a
visitor gets, not the shape of the code.

The file goes in the `tests/` mirror rather than beside the proxy, because the
proxy is a protected path and a new file inside that area would trigger the full
stop at `/implement` (GU-2 / IM-5). Writing it outside keeps every guardrail as
it is.

Two things this file must control, both answered below: which environment it runs
in (**OQ-1**), and the background country lookup plus the values the proxy
remembers between calls (**OQ-2**).

**OQ-1 — the environment.** The file runs in the **shared `jsdom` environment,
unchanged**, and it does not touch `vitest.config.mts` or `tests/setup.ts`. The
reason is that `jsdom` does not define the web `Request`, `Response` and `Headers`
objects at all, so Node's own versions stay in place underneath it — which is why
the fake network (`msw/node`) already works in this suite today. If the proxy
still refuses to load there, the fallback is a **one-line environment marker at
the top of this new file only** (`@vitest-environment node`), which is a per-file
setting and changes nothing for any other test. Both routes satisfy NFR-3 and
AC-14, so the choice is safe either way; whichever one is used gets written down
in `implement.md`.

**OQ-2 — the background lookup and remembered values.** Two measures, both
already standard in this repo:

- **A fresh copy of the proxy for every test.** The test loads it through a small
  loader that calls `vi.resetModules()` first, the pattern
  `docs/testing/UNIT_TESTING.md` sets out and `utils/functions.test.ts` already
  uses. That gives each test an empty country cache and an unset "already
  fetching" flag, so no test can be affected by the one before it (NFR-2, AC-12).
  It is also what makes the cookie lifetime testable, because that value is read
  once when the file loads.
- **A fake network in place of the real one.** The test replaces the global
  `fetch` with `makeMockFetch` from `tests/mocks/mockFetch.ts` — an existing
  stand-in that imports nothing and so can never reach a real address (NFR-1,
  AC-13). It records every call, so the test proves whether the background lookup
  went out **by reading the recorded calls**, not by waiting for a failure: the
  proxy swallows errors from that lookup on purpose, so an unqueued reply would
  never surface on its own. The address is pinned inside the test file with
  `vi.stubEnv`, not by adding a value to the shared settings — see the
  integration surface for why that matters.

## Steps

1. Create `tests/proxy.test.ts`.
2. Add a small private helper in that file to build a request: an address, plus
   optional headers (user agent, browser language preference, country of origin,
   referring site, bounce count) and cookies. It stays local to this file — the
   shared kit has no request builder, and one ticket's need does not justify a
   shared one.
3. Add the loader that resets the module registry and imports the proxy, so every
   test starts from a clean copy (OQ-2).
4. Put the fake network in place for the whole file, and undo the global and
   environment stand-ins after each test.
5. Write the tests, grouped so each group names the criterion it proves:
   - language choice — AC-1, AC-2
   - country choice and precedence — AC-3
   - pass through versus redirect, and the prefixed address — AC-4
   - the country-change marker and the `gb` case — AC-5
   - the bounce limit — AC-6
   - crawlers — AC-7
   - every cookie the proxy writes, with its options — AC-8
   - sitemap addresses, including behind a locale prefix — AC-9
   - the three recorded findings, each saying in words that it pins today's
     behaviour — AC-10
   - which paths the proxy runs on, by naming paths in and out — AC-11
6. Confirm the whole suite still passes and no other test file was touched
   (AC-14), then confirm the proxy itself is unchanged (AC-15).
7. Record in `implement.md` which environment was used, and any behaviour that
   turned out to resist testing, as a finding.

## Files to change

- `tests/proxy.test.ts` — **new, and the only file this ticket writes.** It holds
  every test for AC-1 to AC-15, the local request builder, the loader, and the
  fake network.

**Deliberately not listed, and therefore not allowed to change:**

- `proxy.ts` — the file under test. It is a `protected_paths` entry, it is **not**
  in the list above, and nothing in this ticket may edit it (C-1, C-2, AC-15,
  GU-2 / IM-5). This is the written answer to the protected-path question: the
  path stays out of scope.
- `vitest.config.mts` — no coverage or environment change is needed; the proxy is
  already measured (**OQ-5**, answered in `spec.md`).
- `tests/setup.ts` and every other test file — untouched, per NFR-3 and AC-14.

## Integration surface

> Required (PL-11, ADR-014). What this change touches **beyond its own files** —
> the source of the mandatory integration question at `/review` (CG-5).
> `none — self-contained` is valid only with the reason stated.

- **Components / shared config touched:** the new file is not self-contained,
  because every test file in this repo runs inside shared machinery. It inherits
  `tests/setup.ts`, which starts the fake network with "a request nobody wrote a
  reply for fails the test", replaces `next/navigation`, and cuts the module chain
  at `serverActions/sendOtp` and `serverRequests/radis` — the second one because
  the cache client opens a real socket the moment it loads. It also inherits
  `vitest.config.mts > test.env`, the fake settings shared by every test file. The
  proxy reads two settings the shared list does **not** contain: the backend
  address it fetches the country list from, and the cookie lifetime override.
- **Who else depends on them:** every other test file, all 6 of them and 169
  tests. Adding either of those two settings to `vitest.config.mts` would hand
  them to every test file in the suite, including files written later that never
  asked for them. That is why this ticket pins both **inside its own file** with
  `vi.stubEnv` and undoes them afterwards. The same reasoning applies to the
  global `fetch`: it is replaced for this file and put back after each test, and
  vitest gives each test file its own module registry and globals, so nothing
  leaks sideways into another file.
- **Overlapping flows:** the proxy is shared ground in three directions. First,
  the cookies it writes (`country`, `lang`, `language`) are read all over the app,
  so these tests are writing down a contract other code already relies on; if a
  test pins the wrong name or the wrong readability, it locks in a bug rather than
  catching one. Second, the same file is where the `main` staging gate lives —
  gate and matcher are one revertable unit — so a test that assumed the gate would
  fail the day it is reverted, which is exactly when the suite should stay green
  (C-3). Third, the roadmap's later phases assume this journey works: Phase 5
  onwards test code that runs only after the proxy has already put the visitor on
  a locale address.
- **Ordering / lockstep dependencies:** none inside this ticket. It depends only
  on work that is already finished (the harness, the shared stand-ins, the render
  helper). Nothing has to land with it or after it. Within the file, one ordering
  rule matters: the environment values must be pinned **before** the proxy is
  loaded, because the cookie lifetime is read once at load time — pin it after,
  and that test quietly proves nothing.
- **What breaks if this is wrong:** three concrete failures. (1) If the background
  country lookup is not replaced, it goes out on a real address, or the fake
  network flags an unhandled request in whichever file happens to be running —
  a failure that moves around and looks like flakiness. (2) If the module registry
  is not reset, the first test fills the country cache and later tests silently
  test the cache instead of the fallback list, so a broken fallback would pass.
  (3) If a shared file is edited to make this one work, the blast radius jumps
  from one new file to the whole suite, and AC-14 fails.

## Validation strategy

- Validation profile: `tests-and-types`
- The profile covers the whole ticket: the suite passes, types compile, and lint
  is clean. On top of that, `/verify` records for AC-12 that the suite gives the
  same result when run again and when the order is shuffled; for AC-13 that the
  recorded calls show nothing left the process; for AC-14 that the file count and
  test count went up and nothing that passed before now fails; and for AC-15 that
  the proxy has no diff at all.

## Rollback

- Delete `tests/proxy.test.ts`. That is the whole change, so removing it puts the
  repository back exactly as it was.
- Nothing that ships to a user is touched, so there is nothing to roll back in
  production and no deployment step involved. No settings file, no shared test
  file, and no application file is edited, so there is nothing else to undo.

## Out of scope

- **Fixing anything in the proxy.** Findings are written down, never corrected.
  Editing `proxy.ts` is not permitted by this plan (see Files to change).
- **Rewrites** — the file performs none (**OQ-4**, answered in `spec.md`).
- **Coverage settings** and settling which testing document is right about them
  (**OQ-5**, answered in `spec.md`).
- **The staging gate on `main`.**
- **A shared request builder** for other phases to use. If a later ticket needs
  one, it can lift this one out then, with its own review.
- **End-to-end or browser testing** of the routing.
