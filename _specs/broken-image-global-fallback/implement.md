---
ticket: broken-image-global-fallback
stage: implement
mode: standard          # single workflow form — no other modes (ADR-009)
status: complete        # not_started | in_progress | blocked | complete
owner: developer
updated: 2026-08-30
links:
  clickup:
  github:
---

# Implement — broken-image-global-fallback

> Record of what was actually built, following `plan.md`.

Branch `ticket/broken-image-global-fallback`, cut from `develop` (this repository
overrides the shared `main` default). No commit was created — publishing is the
delivery action's job (IM-9).

**This is round 2.** Round 1 was returned by `/verify` with `verification-failed`.
The resume path was taken: the checkout was already on `ticket/broken-image-global-fallback`
and no second branch was created (IM-3). Round 2 changed two files, both already in
`plan.md > Files to change`.

## Round 2 — the fix for the failure `/verify` found

**What was wrong.** The whole emitted script was passed through
`.replace(/</g, "\\u003c")`. The production minifier rewrites
`typeof document === "undefined"` into `"u" < typeof document`, which puts a `<`
**outside any string**. Escaping it produced `<` in operator position — legal
only in identifiers, strings, templates and regular expressions — so the shipped
script threw `SyntaxError` before installing anything. The feature was dead in the
built app while all 19 unit tests stayed green, because the test runner never
minifies.

**The fix, in `utils/imageFallback.ts`.** The escape moved into a small
`asScriptString()` helper that is applied to the two interpolated **values** only,
never to the code around them. A `<` is legal inside a string literal, which is
where the escape belongs. The property that actually matters is narrower than "no
`<` anywhere": inside a `<script>` the HTML parser stops only at `</script`, so
only that sequence and `<!--` have to be impossible.

**Proof, from the built app both times.** The confirming check is `node --check` on
the script extracted from the page the built server actually served — it was seen
red before the fix and green after:

| | round 1 (before) | round 2 (after) |
|---|---|---|
| shipped script | `if(!("u"<typeof document))` | `if(!("u"<typeof document))` |
| `node --check` | **exit 1** — `SyntaxError: Invalid or unexpected token` | **exit 0** |
| bytes | 2824 | 2818 |
| holds `</script` | no | no |
| holds `<!--` | no | no |

**Two test cases changed, both in the declared test file.**

- `carries no < , so it cannot close its own script element` → **replaced** by
  `cannot close its own script element`, which asserts the real property: no
  `</script` (case-insensitive) and no `<!--`. The old assertion was not just too
  strong, it was the cause — it is what forced the escape across the code.
- **Added** `escapes < inside the values it interpolates, and only there`: a value
  carrying `</script><img src=x onerror=…>` comes out unable to close the tag, and
  reads back byte-for-byte unchanged.

The `F-2` case (`installs a working listener when it is evaluated`) was kept and its
limit written into the file: it sees unminified source only, because the minifier
runs in `pnpm build` and never in the test runner. That gap is covered by the
`node --check` step above, which `/verify` now runs as part of AC-7's evidence
rather than only greping the built HTML for the marker name.

## Changes made

- **`utils/imageFallback.ts` — new.** The marker attribute name, the placeholder
  address, the installer function, and the inline script string built from that
  function's own source. Nothing is imported, so the function's source can be
  inlined into the page and still run.
- **`app/(client)/[lang]/layout.tsx`.** One raw `<script>` added as the **first
  child of `<body>`**, before every other element, plus its import. Written with
  `dangerouslySetInnerHTML` — React escapes a text child of `<script>`, which
  would ship entities and throw on every page. The existing `gtag-init` script
  below it does the same thing for the same reason.
- **`public/styles/globals.css`.** One rule, `img[data-img-fallback]`, added
  directly under the app-wide `img` rule at line 395 so the two read together. No
  existing rule was edited.
- **`components/Chat/components/SearchResult.tsx`.** `onError` removed. The
  initial-source line (`photo ? GetImageUrl(photo) : ProfilePicture.src`) is
  untouched, so a contact with no photo at all still shows the person default.
- **`components/products/ShareAvatar.tsx`.** `onError` removed, and the
  `SyntheticEvent` import with it, which nothing else in the file used. The
  initial-source line is untouched.
- **`components/setting/orders/confirmations/OrderItemReturnConfirmationWindow.tsx`.**
  `onError` removed.
- **`tests/utils/imageFallback.test.ts` — new.** 19 cases.

**Not changed, on purpose:** `components/Chat/components/ChatContactsUpload.tsx`.
Its image is `/icons/flag/<iso2>.svg`, a local file, which AC-4 makes the listener
skip. Removing its handler would have turned a hidden flag into the browser's
broken-image icon inside a phone-number field. A test asserts the handler is still
there, with that reason written next to it.

## Changes prepared (uncommitted)

> `/implement` creates **no commit** (IM-9 / ADR-008).

- `utils/imageFallback.ts` — new file
- `tests/utils/imageFallback.test.ts` — new file
- `app/(client)/[lang]/layout.tsx` — +20 lines
- `public/styles/globals.css` — +17 lines
- `components/Chat/components/SearchResult.tsx` — −4 lines
- `components/products/ShareAvatar.tsx` — −5 lines
- `components/setting/orders/confirmations/OrderItemReturnConfirmationWindow.tsx` — −3 lines

Every one of these is in `plan.md > Files to change`. No other file was touched
(IM-4).

## The review gate's seven binding conditions

All seven are carried out. `review.md > Required Follow-up Actions` is the source.

| # | Condition | Where it landed |
|---|---|---|
| 1 | The recovery listener returns early while `src` is the placeholder (F-1) | `utils/imageFallback.ts`, inside `onLoad`. **Proved red-first — see below.** |
| 2 | `target.tagName === "IMG"` is the handler's first test; no `stopPropagation` (F-4) | first statement in the handler; case `leaves a failing script or media source alone` |
| 3 | A test evaluates the emitted script string itself (F-2) | case `installs a working listener when it is evaluated` |
| 4 | The AC-11 case uses `hydrateRoot`, not a forced re-render (F-3) | case `keeps the placeholder through hydration` |
| 5 | `dangerouslySetInnerHTML` (F-9); `<` escaped (F-8); module-scope constant (F-11) | the layout; `.replace(/</g, "\\u003c")`; `IMAGE_FALLBACK_SCRIPT` is computed once at module load |
| 6 | The placeholder declares an intrinsic size (F-6) | satisfied by the format — see Deviations |
| 7 | `verify.md` records the HTML delta, NFR-4, parse cost, AC-9, and the out-of-scope roots | carried to `/verify`; the measured HTML delta is below |

**F-16 also applied:** the explicit loop guard was dropped. After a swap the `src`
attribute is a `data:` address, which the remote-only test already rejects, so one
check does both jobs.

## F-1 — confirmed red before it was trusted

The repository requires a fix to be proved by a test that was seen red. F-1 was
found at review, before any code existed, so the guard and its test were written
together. To prove the test really covers the fault, the guard was removed and the
suite run:

```
× keeps the marker when the placeholder itself loads (F-1)
AssertionError: the placeholder's own load removed the marker, so the mark would
be cropped by the global cover rule: expected null to be '1'
Tests  1 failed | 18 passed (19)
```

The guard was then restored and the suite re-run: **19 passed**. The failure names
the fault on its own, with no code open.

## Deviations from plan

1. **The placeholder is the owner's WebP, not the SVG the plan drafted.** The owner
   replaced `IMAGE_FALLBACK_SRC` with their own artwork during implementation. This
   is a product decision, not a defect, and it was kept.

   Two consequences were handled rather than ignored:
   - **Two assertions were rewritten.** They were written against the SVG
     specifically (`data:image/svg+xml,` prefix, literal `width='100'`). They now
     check the properties that actually matter for any inline format: the address
     is inline (`data:image/`), it carries no raw `<`, and — because an SVG with no
     declared size is sized differently by different browsers — the size check
     applies when the placeholder is an SVG. A raster format always carries its
     own intrinsic size, so F-6 is satisfied by construction.
   - **The size cost changed and is recorded.** Measured: **2287 characters raw,
     1274 bytes gzipped**. That is paid per HTML document and, per F-10, again in
     the streaming payload — roughly 2.5 KB gzipped per page. First-load JavaScript
     is still unchanged at zero, so AC-12 holds; F-13's "keep the script under
     ~1 KB" note does not, and `/verify` records the real figure.

   The module's comment block was updated to match: it no longer describes an SVG,
   and it states the two properties any replacement must keep (no raw `<`, an
   intrinsic size) plus the reason to keep the drawing padded inside its square.

2. **One declared test case was not written**, per the review's disposition of F-7:
   `the fallback style rule sets no property that can move or resize an element`
   was dropped. The senior lens called it a denylist that can never be complete,
   and `the handler writes nothing but src and the marker` is the real proof of
   AC-2. Recorded here because `plan.md > Tests` declared it.

3. **AC-9 moved to a browser check at `/verify`**, also per F-7's disposition. jsdom
   applies no stylesheet, so a jsdom case could only have re-read the CSS file and
   reasoned about it by hand.

## Tests written

| AC | Test file | Test case | Disposition carried out |
|------|-----------|-----------|-------------------------|
| AC-1 | `tests/utils/imageFallback.test.ts` | `swaps a failed remote image to the placeholder` | new |
| AC-2 | `tests/utils/imageFallback.test.ts` | `writes nothing on the element but src and the marker` | new |
| AC-2 | — | ~~`the fallback style rule sets no property that can move or resize an element`~~ | **dropped** per F-7 disposition |
| AC-3 | `tests/utils/imageFallback.test.ts` | `leaves a working image untouched` · `removes the marker when a working source loads on the same element` · `keeps the marker when the placeholder itself loads (F-1)` | new |
| AC-4 | `tests/utils/imageFallback.test.ts` | `leaves a local app file alone when it fails` · `keeps the handler on the local country flag` | new |
| AC-5 | `tests/utils/imageFallback.test.ts` | `leaves an image with no source alone when it fails` | new |
| AC-6 | `tests/utils/imageFallback.test.ts` | `needs no network request and cannot itself fail` | new |
| AC-7 | — | none — proven from the built HTML at `/verify` | as planned |
| AC-8 | `tests/utils/imageFallback.test.ts` | `covers an image added to the page after the listener was installed` | new |
| AC-9 | — | none — moved to a browser check at `/verify` per F-7 | **deviation, see above** |
| AC-10 | `tests/utils/imageFallback.test.ts` | `no longer handles its own image failure: %s` (3 files) | new |
| AC-11 | `tests/utils/imageFallback.test.ts` | `never re-triggers on the placeholder, and swaps again if the failing source returns` · `keeps the placeholder through hydration` | new |
| AC-12 | — | none — proven from the build at `/verify` | as planned |
| AC-13 | `tests/utils/imageFallback.test.ts` | `makes no request and sends no report when many images fail at once` | new |
| AC-14 | — | covered by the profile's `lint` and by `pnpm lint:i18n-parity` | existing |
| F-2 | `tests/utils/imageFallback.test.ts` | `installs a working listener when it is evaluated` | new (gate condition) |
| F-4 | `tests/utils/imageFallback.test.ts` | `leaves a failing script or media source alone` | new (gate condition) |
| F-8 | `tests/utils/imageFallback.test.ts` | `cannot close its own script element` · `escapes < inside the values it interpolates, and only there` | new (gate condition) — **corrected in round 2** |

20 cases in one file. `plan.md > Tests` declared one file for this unit and one was
written — no second parallel file (PL-14).

## Findings — confirmed bugs, out of scope

**none.**

The defect research recorded — `OrderItemReturnConfirmationWindow.tsx:334` falling
back to `/images/placeholder-product.png`, a file that does not exist, with no loop
guard — lived inside a file `plan.md > Files to change` lists, so it was in scope
(IM-12). It is gone: the handler that held it was removed. No separate ticket is
needed and no expected-failure marker was added.

Two answers worth carrying to `/verify`, both settled by test rather than assumed:

- **React 19 hydration does not put a swapped `src` back.** `keeps the placeholder
  through hydration` passes, so `OQ-4`'s main risk is closed by evidence.
- **A `data:` address is rejected by the remote-only test**, which is what makes a
  loop impossible without a second guard.

## Validation run during implementation

The `full` profile, all four checks, run against the final working tree:

Round 2, the `full` profile against the final working tree:

| Check | Command | Result |
|---|---|---|
| lint | `pnpm lint` | **exit 0** — 65 warnings, **0 errors**, none in the changed files |
| i18n-parity | `pnpm lint:i18n-parity` | **pass** — 2165 keys present in all three files |
| typecheck | `tsc --noEmit --pretty false` | **exit 0** |
| unit-tests | `pnpm test:run` | **112 files, 1974 tests, all passed** |
| build | `pnpm build` | **exit 0** — `✓ Compiled successfully in 10.6s` |
| the shipped script parses | `node --check` on the script pulled from the built page | **exit 0** — was **exit 1** in round 1 |

Round 1 ran the same profile at 1973/1973; round 2 adds the new F-8 case for
1974/1974. Removing the three `onError` handlers broke nothing in either round.

Left to `/verify` as the plan declares: the AC-7 evidence on the built HTML — now
including the `node --check` step, not only the grep — the AC-12 client-bundle
check, and the AC-9 browser check, which round 1 could not attempt because no
listener was ever installed.
