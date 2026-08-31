---
ticket: broken-image-global-fallback
stage: verify
mode: standard          # single workflow form — no other modes (ADR-009)
status: complete        # not_started | in_progress | blocked | complete
owner: developer
updated: 2026-08-30
links:
  clickup:
  github:
---

# Verify — broken-image-global-fallback

> Final validation and impact review before the ticket is closed.

## Outcome: PASSED

This is **round 2** of verification. Round 1 recorded `verification-failed` and
sent the work item back to `implement`; that account is kept below under
"Round 1 — what failed", because it is the evidence that the fix was seen red
first.

All 14 acceptance criteria are satisfied. The five profile checks are green, the
shipped script parses, and the two criteria that need a real renderer were checked
in a browser rather than asserted.

## Checks performed

- Validation profile: `full` (`.claude/project-config.yaml`)

| AC ID | Check / test case | Command (resolved) | Exit | Output summary | Result |
|-------|-------------------|--------------------|------|----------------|--------|
| — | lint | `pnpm lint` | 0 | 65 warnings, **0 errors**; none in the changed files | pass |
| — | i18n-parity | `pnpm lint:i18n-parity` | 0 | 2165 keys present in all three files | pass |
| — | typecheck | `node_modules/.bin/tsc --noEmit --pretty false` | 0 | no output | pass |
| — | unit-tests | `pnpm test:run` | 0 | 112 files, **1974 passed** | pass |
| — | build | `pnpm build` | 0 | `✓ Compiled successfully in 15.3s` | pass |
| AC-1 | `swaps a failed remote image to the placeholder` | `vitest run --project unit` | 0 | passed | pass |
| AC-1 | confirmed in a real browser: four failing images, all marked and swapped | Playwright + `chromium`, against the built app | 0 | `marked: "1"`, `srcIsPlaceholder: true` in every box | pass |
| AC-2 | `writes nothing on the element but src and the marker` | `vitest run --project unit` | 0 | attribute list unchanged apart from `src` + marker | pass |
| AC-2 | **the box does not move** — measured in a browser, before and after | Playwright `getBoundingClientRect()` | 0 | width, height **and x/y identical** in all four shapes (see below) | pass |
| AC-3 | `leaves a working image untouched` · `removes the marker when a working source loads on the same element` · `keeps the marker when the placeholder itself loads (F-1)` | `vitest run --project unit` | 0 | 3 cases passed | pass |
| AC-4 | `leaves a local app file alone when it fails` · `keeps the handler on the local country flag` | `vitest run --project unit` | 0 | 2 cases passed | pass |
| AC-4 | confirmed in a real browser: a failing `/icons/flag/…` file is untouched | Playwright | 0 | `localMarked: false`, `src` unchanged | pass |
| AC-5 | `leaves an image with no source alone when it fails` | `vitest run --project unit` | 0 | passed | pass |
| AC-6 | `needs no network request and cannot itself fail` | `vitest run --project unit` | 0 | passed | pass |
| AC-7 | the script is the first child of `<body>`, ahead of every image | `curl --noproxy '*' localhost:3103/sy-en` + `grep -bo` | 0 | `<body` @3652, script @**3783**, first `<img>` @**8332** — 4549 bytes ahead of the first image | pass |
| AC-7 | **the shipped script parses** | `node --check` on the script extracted from the built page | **0** | 2818 bytes, no `</script`, no `<!--` | pass (**was exit 1 in round 1**) |
| AC-8 | `covers an image added to the page after the listener was installed` | `vitest run --project unit` | 0 | passed | pass |
| AC-9 | the mark is drawn whole at every box ratio | Playwright, four shapes against the built app | 0 | `object-fit: contain` and the mark fits inside the box in all four | pass |
| AC-10 | `no longer handles its own image failure` × 3 files | `vitest run --project unit` | 0 | 3 cases passed | pass |
| AC-11 | `never re-triggers on the placeholder, and swaps again if the failing source returns` · `keeps the placeholder through hydration` | `vitest run --project unit` | 0 | 2 cases passed | pass |
| AC-12 | first-load JS unchanged | `grep -rl` over `.next/static/chunks` | 0 | the placeholder appears in **0 of 116** client JS chunks; the marker appears **only** in a `.css` file. The module never enters the browser bundle | pass |
| AC-13 | `makes no request and sends no report when many images fail at once` | `vitest run --project unit` | 0 | 200 failures, 0 network calls, 0 beacons | pass |
| AC-14 | no new translation key needed | `pnpm lint:i18n-parity` | 0 | 2165 keys parallel across `ar`/`tr`/`ku` | pass |
| F-1 | `keeps the marker when the placeholder itself loads` | `vitest run --project unit` | 0 | passed — and seen **red** at implement with the guard removed | pass |
| F-2 | `installs a working listener when it is evaluated` | `vitest run --project unit` | 0 | passed (unminified source only — the `node --check` row above covers minified) | pass |
| F-4 | `leaves a failing script or media source alone` | `vitest run --project unit` | 0 | passed | pass |
| F-8 | `cannot close its own script element` · `escapes < inside the values it interpolates, and only there` | `vitest run --project unit` | 0 | 2 cases passed | pass |

**20 of 20 declared unit cases ran and passed.** Nothing was asserted that was not
executed.

### AC-2 and AC-9 — measured in a browser, not argued

jsdom has no layout engine, so these two were checked against the built app in
Chromium. Four box shapes, each given a failing remote source:

| box | before | after | `object-fit` | mark drawn |
|---|---|---|---|---|
| small round avatar 48×48 | 48×48 at (0,0) | 48×48 at (0,0) | contain | 48×48 |
| tall product card 200×260 | 200×260 at (0,0) | 200×260 at (0,0) | contain | 200×200 |
| wide banner 1200×200 | 1200×200 at (0,0) | 1200×200 at (0,0) | contain | 200×200 |
| tall narrow strip 80×400 | 80×400 at (0,0) | 80×400 at (0,0) | contain | 80×80 |

Width, height **and position** are identical before and after in every case, so
nothing on the page moves (AC-2). The drawn mark fits inside the box every time,
so it is never cropped (AC-9) — the `img[data-img-fallback]` rule does beat the
app-wide `img { object-fit: cover !important }`, and the tint resolves to
`rgb(240, 240, 240)`.

A first attempt at this measurement was wrong and was redone: it read the "before"
box before layout had run (width `0`) and let `max-width: 100%` cap the banner at
200px. The numbers above come from the corrected run, which forces layout first and
uses an explicitly sized 1400px host.

## Round 1 — what failed, kept as the red-first evidence

Round 1 failed on one thing, and it is the reason the fix can be trusted.

The whole emitted script was passed through `.replace(/</g, "\\u003c")`. The
production minifier rewrites `typeof document === "undefined"` into
`"u" < typeof document` — correct, and it puts a `<` **outside any string**.
Escaping it produced `<` in operator position, which is legal only in
identifiers, strings, templates and regular expressions. The shipped script threw
`SyntaxError` before installing anything, so no image in the built app got a
placeholder — while all 19 unit tests stayed green, because the test runner never
minifies.

Same command, both rounds, on the script the built server actually served:

| | round 1 | round 2 |
|---|---|---|
| shipped script opens with | `if(!("u"<typeof document))` | `if(!("u"<typeof document))` |
| `node --check` | **exit 1** — `SyntaxError: Invalid or unexpected token` | **exit 0** |
| bytes | 2824 | 2818 |
| holds `</script` / `<!--` | no / no | no / no |

This was predicted by the review panel as **F-2**, and it was found only because
the plan made AC-7 an evidence check against the **built** output instead of a unit
test. The lesson is recorded in the module and in the test file: the escape belongs
inside the interpolated string literals and nowhere else, and the property that
matters is "no `</script` and no `<!--`", not "no `<`".

## Commands run

- `node --check <script extracted from the built page>`
  ```
  exit 0        # round 2
  ```
- `curl -s --noproxy '*' -o page.html http://localhost:3103/sy-en`
  ```
  status=200
  ```
  Two environment notes, recorded so the next person does not lose time: the built
  app was served on **3103**, because another process of the owner's already held
  3000 and was left alone; and `--noproxy '*'` is required here, or a squid proxy
  answers `503` and the request never reaches localhost.
- `grep -bo '<body' / 'id="image-fallback"' / '<img' page.html`
  ```
  3652:<body
  3783:id="image-fallback"
  8332:<img
  ```
- `grep -rl "data:image/webp;base64,UklGRpoG" .next/static/chunks/`
  ```
  (no matches — 116 .js chunks searched)
  ```

## Recorded for the record, as the review gate required

- **F-10 — the HTML size delta.** The placeholder is **2287 characters raw, 1274
  bytes gzipped**, paid per HTML document and again in the streaming payload —
  roughly **2.5 KB gzipped per page**. First-load JS is unchanged at zero (AC-12),
  so the plan's F-13 note of "keep the script under ~1 KB" does not hold; this is
  the real figure. The owner replaced the drafted SVG with their own WebP during
  implementation, which is a product decision, and this is its measured cost.
- **F-12 — NFR-4 is accepted on design grounds, not measured.** The unit case
  proves 200 failures make no network call and send no report; it does not measure
  main-thread time in a browser. The reason for accepting it is F-20: `object-fit`
  and `background-color` change paint only, never layout, and an attribute selector
  invalidates style for the one element whose attribute changed. So a dead media
  host costs one style recalculation and one repaint per failed element — no
  reflow, and the handler reads no geometry. The browser run is consistent with
  that: four failures changed no box at all.
- **F-13 — the inline script's parse cost** was not measured. It is 2818 bytes and
  parses; no timing figure was taken.
- **F-5 — the four other document roots are out of scope**, confirmed by the owner.
  `app/(special)/callInProg`, `call_direct`, `endCall` and `app/simulateUser` render
  their own documents and do not receive the script. Three of them import
  `styles/globals.css`, so they ship the CSS rule with nothing to match it. They
  draw only local icons and CSS-background avatars today, so no remote image on
  those screens can use the mechanism. **The Integration surface's "rendered on
  every page" should read "every page under `app/(client)/[lang]`".**
- **F-15 — no reporting**, confirmed by the owner. A media-host 403, an expired
  signed URL or an ACL change will look like a deliberate placeholder and produce
  no signal inside this app.
- **F-7 — AC-9 was moved to this browser check** and the "no property that can move
  or resize" denylist case was dropped, as the disposition directed. The browser
  measurement above is a stronger proof than that case would have been.

## Findings — confirmed bugs, out of scope

**none.**

`implement.md > Findings` carries none forward. The defect research recorded —
`OrderItemReturnConfirmationWindow.tsx` falling back to `/images/placeholder-product.png`,
a file that does not exist, with no loop guard — was removed together with the
handler that held it, so there is nothing to ticket.

The round-1 `SyntaxError` was **not** a finding: it lived in `utils/imageFallback.ts`,
which `plan.md > Files to change` lists, so by VF-12's file rule it was this
ticket's failure to fix. It was fixed in implement round 2 and is proved above.

No `BUG-n` exists, and no expected-failure marker was added anywhere.

## Observability & runtime impact review

- Were any `observability/` runtime configs changed? **No.** The repository owns
  none (`project-config.yaml > features.observability: false`).
- Were any protected runtime paths changed? **No.** `proxy.ts`, `next.config.ts`,
  `instrumentation*`, `sentry.*.config.ts` and `.github/workflows/**` are untouched.
- Working tree at verification: 5 modified files and 2 new source files, every one
  of them in `plan.md > Files to change`, plus the `_specs/` workspace. No commit
  was created (VF-10).

## Sign-off

- Outcome: **verified**
- Final ticket state: `completed`
- Sign-off: developer (owner), 2026-08-30. Comprehension gate passed **3/3** at
  threshold 1.0 (`comprehension.md`, `stage: verify`, `attempt: 1`).
- **The gate was degraded and says so.** Only two questions cleared falsification
  outright, below the floor of three. The third asked is the final round's *missed*
  integration question, administered under the short rule and marked `short` rather
  than `yes`. `degraded:` in the record carries that line.
- Commit: none created at verify (VF-10 / ADR-008) — committing is the delivery
  boundary's job, owned by `/wf:publish-pr`.
- Notes: The `review` gate record was retired to `comprehension-review-1.md` before
  this round, so it could not clear this gate.
