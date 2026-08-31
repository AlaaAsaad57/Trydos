---
ticket: broken-image-global-fallback
stage: review
mode: standard          # single workflow form — no other modes (ADR-009)
status: complete        # not_started | in_progress | blocked | complete
owner: reviewer
updated: 2026-08-30
links:
  clickup:
  github:
---

# Review — broken-image-global-fallback

> Review gate — run by the ticket owner themselves (self-review). A comprehension
> check at the gate is the integrity control. Evaluates the spec and plan before
> any implementation.

## Review Scope

- `_specs/broken-image-global-fallback/spec.md` — 14 acceptance criteria, 11 research
  questions resolved.
- `_specs/broken-image-global-fallback/plan.md` — approach, 6 steps, 7 files to
  change, integration surface, 14 test rows, validation profile `full`.
- `_specs/broken-image-global-fallback/research.md` — read as context for what the
  repository actually contains.

No implementation exists yet. No branch has been created.

## Plan Summary

One `error` listener on `document`, in the capture phase, catches every failing
`<img>` in the app. It is delivered as an inline `<script>` rendered as the first
child of `<body>` by the root layout, so it is running before the first image in the
server-rendered HTML can fail, and the client JavaScript bundle does not grow.

On a failure the listener rewrites `src` to an inline `data:` placeholder and sets a
`data-img-fallback` attribute. One CSS rule keyed to that attribute supplies the
tint and draws the mark whole with `object-fit: contain !important`, which beats the
app-wide `img { object-fit: cover !important }` rule for failed images only.

Three of the four existing per-image `onError` handlers are removed. The fourth is
kept, because its image is a local file that the remote-only rule (AC-4) means the
new mechanism will never cover.

## Risks

- The plan's recovery step and its stated guard do not match, so a failed image can
  end up showing the mark cropped — the exact outcome the ticket exists to prevent.
- The inline-script technique couples working code to what the compiler emits, and
  nothing currently proves the emitted script parses and runs.
- The root layout is not the only document root in this repository, so "every page"
  in the plan is not accurate.

## Assumptions

- React does not rewrite a DOM property whose value did not change in its own model,
  so a re-render leaves a swapped `src` alone. The plan says this is proven by test,
  not assumed — the panel disputes that the declared test proves it.
- The browser fires `error` on an `<img>` whose source fails. Standard behaviour,
  not introduced by this change.
- `getAttribute("src")` distinguishes a local path from a remote address, because a
  local path is never written as an absolute URL in this repository.

## Open Questions

- Whether the four other document roots (`app/(special)/*` and `app/simulateUser/`)
  are in or out of scope. The plan does not say.
- Whether reporting broken images stays out of scope, given the placeholder now
  hides the symptom that a broken icon used to make visible.

## Panel Findings (advisory)

> Findings from the advisory review panel (senior / security / performance) —
> read-only lenses over `plan.md` + `spec.md` (ADR-010 / RP-1).
>
> **This section is written before the comprehension gate runs (RP-4).**
>
> **Advisory only:** these inform the owner; they never block the decision (RP-2).

| Lens | Severity | Finding | Ref (AC-n / step / file) | Owner's disposition |
|------|----------|---------|--------------------------|---------------------|
| senior, performance | **major** | **F-1 — the recovery listener removes the marker as soon as the placeholder itself loads.** The handler sets `src` to the placeholder and attaches a one-time `load` listener to the same element. The placeholder is an image, so it loads, `load` fires, and the marker is removed. The element keeps the placeholder but loses `object-fit: contain`, so the global `cover` rule crops the mark — the exact failure this ticket exists to prevent. jsdom never loads a `data:` address, so the declared case dispatches `load` by hand and would hide it. | `plan.md > OQ-4 > Recovery`; test row AC-3 | **mitigate** — the fix is inside files the plan already declares. The recovery listener must return early while the current `src` is the placeholder, and the AC-3 row gains a case proving the placeholder's own load keeps the marker. |
| senior | **major** | **F-2 — nothing proves the inline script parses and runs.** The unit tests import and call the installer function directly; the AC-7 check greps the built HTML for `data-img-fallback`, which matches the script's own source text. So a compiler helper, a minifier rename or a bad interpolation could ship a script that throws, every check would stay green, and the feature would be silently dead app-wide. Building the string from the function's own source is what creates this risk, and the plan already carries a list of hand-rules to work around it. | `plan.md > Steps 1`; `Rules the installer function must follow`; `Validation strategy > AC-7 evidence` | **mitigate** — the technique stays; the proof does not. `tests/utils/imageFallback.test.ts` gains a case that evaluates the emitted script string itself and then fails an image, so a script that throws turns the suite red. |
| senior | **major** | **F-3 — OQ-4 asked about hydration, but the declared test proves a re-render.** The research risk was that React writes the original `src` back **after a pre-hydration DOM swap**, which is the main path, because AC-7 exists precisely because images fail before hydration. A client re-render is not hydration, and a hydration mismatch can trigger a client render of the root that does rewrite `src`. | `plan.md > OQ-4 > src`; test row AC-11; `research.md > Risks` | **mitigate** — the AC-11 case uses `hydrateRoot` over server-like markup instead of a forced re-render. If hydration turns out not to be reproducible in jsdom, `verify.md` says so plainly and the check moves to the browser, the way AC-7 and AC-12 are already handled. |
| security | **major** | **F-4 — the installer's rules never state a tag check.** A capture-phase `error` listener on `document` sees failures from every element, not only `<img>` — `<script>`, `<link>`, `<video>`, `<audio>`, `<source>`, `<iframe>`. The chat components render several of those. Without `target.tagName === "IMG"` as the first test, the handler could write `src` and the marker onto a failed script or media element, app-wide. | `plan.md > Approach`; `Rules the installer function must follow`; `research.md > Surfaces a listener cannot reach` | **mitigate** — `target.tagName === "IMG"` becomes the handler's first statement, before any string work, and a case fires `error` on a `<source>` and a `<script>` and asserts nothing was written. The handler never calls `stopPropagation`. |
| senior | minor | **F-5 — "rendered on every page" is not accurate.** There are five document roots. `app/(special)/callInProg/layout.jsx`, `app/(special)/call_direct/layout.jsx`, `app/(special)/endCall/layout.jsx` and `app/simulateUser/layout.tsx` each render their own `<html>`/`<body>`. Three import `styles/globals.css`, so they ship the new CSS rule but never get the script. Impact today is near zero — those screens draw local icons and CSS-background avatars — but AC-1 and AC-8 are worded universally. | `plan.md > Integration surface`; `app/(special)/call_direct/layout.jsx` | |
| senior | minor | **F-6 — the placeholder SVG has a `viewBox` but no `width`/`height`.** An `<img>` pointing at an SVG with no intrinsic size is sized differently across engines, and AC-9 rests entirely on that sizing. | `plan.md > The placeholder mark` | |
| senior | minor | **F-7 — three declared unit cases can only be text greps.** The two CSS cases read `globals.css` and reason about it by hand; jsdom applies no stylesheet, so neither sees a rendered result. The AC-10 case is a grep over three component files, which the diff proves better. AC-9 is not provable in jsdom at all and should be marked honestly, the way AC-7 and AC-12 already are. | `plan.md > Tests`, rows AC-2, AC-9, AC-10 | |
| security | minor | **F-8 — `JSON.stringify` does not escape `<`.** Any future constant, or minifier output, containing `</script`, `<script` or `<!--` would close the element early and inject markup into the root layout of every page. Today's values are developer-authored, so nothing is attacker-influenced now. | `plan.md > Steps 1`; `The placeholder mark` | |
| security | minor | **F-9 — step 3 does not say how the script is rendered.** React escapes text children of `<script>`, so `<script>{code}</script>` ships escaped entities and throws on every page; only `dangerouslySetInnerHTML` works, as the existing `gtag-init` script at `layout.tsx:142` does. The AC-7 check would still pass, so the failure would be silent. | `plan.md > Steps 3`; `Validation strategy > AC-7 evidence` | |
| performance | minor | **F-10 — AC-12's evidence cannot see the cost it claims is zero.** The script never enters the client bundle, but its bytes ship in every HTML document and again, escaped, in the streaming payload — roughly twice the script size per document. Measuring First Load JS passes by construction. | `plan.md > Validation strategy > AC-12 evidence`; spec NFR-1 / AC-12 | |
| performance | minor | **F-11 — building the script string during render runs on the hottest server path.** If `toString()` is called while rendering, it runs on every server render of the root layout — every page, every locale. It should be a module-scope constant computed once per process. | `plan.md > Steps 1` | |
| performance | minor | **F-12 — NFR-4 is never measured.** The jsdom case proves the handler makes no calls; it does not prove that a real storm of 200 failures is cheap. Either measure it once in a browser or state plainly that it is accepted on design grounds. | `plan.md > Validation strategy`; spec NFR-4 | |
| performance | minor | **F-13 — an inline classic script as the first child of `<body>` waits for stylesheets already declared in `<head>`,** and HTML parsing stops meanwhile. The preload scanner still fetches images, so the effect is small, but it is not zero and the plan treats placement purely as a correctness question. | `plan.md > OQ-3`; Steps 3 | |
| security | minor | **F-14 — a second inline script raises the cost of the deferred strict CSP.** Nothing breaks today and the plan's C-4 claim is correct: the enforced policy has no `script-src` and no `default-src`. But a later nonce or `strict-dynamic` policy must thread a nonce through a raw element the framework does not manage. | `plan.md > OQ-3`; `next.config.ts` headers; `docs/security/csp-decision.md` | |
| security | minor | **F-15 — dropping all reporting hides a real regression class.** A media-host 403, an expired signed URL or an ACL change now looks like deliberate design and produces no signal in this app. The placeholder actively hides the symptom that the broken icon used to show. | `spec.md > OQ-9`; AC-13 | |
| senior | nit | **F-16 — the loop guard is redundant with the remote-only rule.** After the swap the `src` attribute is a `data:` address, which the remote-only check already rejects. One check does both jobs. | `plan.md > OQ-4 > The loop guard` | |
| senior | nit | **F-17 — a line reference disagrees with itself.** The prose says `ChatContactsUpload.tsx:333` (the `src` line); the table row and `research.md` say `:336`. The `onError` is at line 336. | `plan.md > Conflict found` | |
| security | info | **F-18 — reading `src` from images inside sanitized backend HTML is safe as planned.** The value is only compared, never re-inserted into HTML, a URL or a log. `utils/sanitizeHtml.ts` allows only `class` and `style` beyond the defaults, so hostile HTML cannot pre-set `data-img-fallback` and force the fallback style. | `utils/sanitizeHtml.ts`; `research.md` | |
| security | info | **F-19 — a `data:image/svg+xml` source in an `<img>` is inert.** The browser treats it as a script-disabled, fetch-disabled document, and the SVG is static and developer-authored. Percent-encode it so `<`, `#` and `"` cannot terminate the attribute or the script element. | `plan.md > The placeholder mark` | |
| performance | info | **F-20 — repainting hundreds of failed images is cheap by construction.** `object-fit` and `background-color` change paint only, never layout, and an attribute selector invalidates style for the one element whose attribute changed. No reflow, no layout thrash — the handler reads no geometry. | `plan.md > The CSS rule` | |
| senior | info | **F-21 — the AC-4 / AC-10 conflict is handled well and the overall shape is the smallest thing that works.** One document listener plus one CSS rule instead of ~560 edits is right, the `data-` attribute over `className` is the correct call for the stated reason, and the plan names the conflict and hands the decision to the owner instead of quietly bending an acceptance criterion. | `plan.md > Conflict found` | |

**Panel summary:** 4 major, 11 minor, 2 nit, 4 info. No lens blocks; all four majors
concern the plan's own correctness or its proof, not the chosen approach — F-21
records that the approach itself was judged sound.

**Dispositions for the minor and nit findings** (the majors are dispositioned in the
table above):

- **mitigate, inside files the plan already declares** — F-6 (add `width='100'
  height='100'` to the SVG), F-8 (escape `<` as `<` in the emitted string),
  F-9 (render the script with `dangerouslySetInnerHTML`, as `gtag-init` at
  `layout.tsx:142` does), F-11 (make the script string a module-scope constant, not
  work done per render), F-16 (keep one check rather than two — the remote-only test
  already rejects a `data:` address), F-17 (correct the `:333` / `:336` line
  reference).
- **mitigate, in `verify.md`** — F-10 (record the gzipped HTML size for one route
  before and after, and keep First Load JS as the secondary proof), F-12 (state that
  NFR-4 is accepted on design grounds and record F-20's reasoning), F-13 (record the
  parser cost of the inline script and keep it under 1 KB), F-7 (mark AC-9 as
  checked in the browser at `/verify`, and drop the "no property that can move or
  resize" case — the handler-writes-only-two-things case is the real proof).
- **accept as scoped** — F-5: the other four document roots stay out of scope. They
  draw local icons and CSS-background avatars only, so nothing there can use the
  mechanism today. `verify.md` records the limit, and the Integration surface
  sentence is corrected to "every page under `app/(client)/[lang]`".
- **accept** — F-14 (the deferred strict CSP already plans for `'unsafe-inline'`;
  add this script to the inventory in `docs/security/csp-decision.md`), F-15
  (reporting stays out of scope per spec OQ-9; the media app owns that signal).
- **dismiss** — none.
- **no action, recorded** — F-18, F-19, F-20, F-21. F-18's constraint ("never
  interpolate `src` into a log") goes into the module's comment.

**Owner confirmation of the two scoping calls.** Both were put to the owner
explicitly after the decision, because each one changes what a user sees and neither
was forced by the criteria:

- **F-5 — the other four document roots stay out.** Confirmed. They draw only local
  icons and CSS-background avatars, so no remote image on those screens can use the
  mechanism. `verify.md` records the limit.
- **F-15 — no reporting of broken images.** Confirmed. The media app owns that
  signal. The accepted consequence is stated plainly: after this change a media-host
  403, an expired signed URL or an ACL change looks like a deliberate placeholder
  and produces no signal inside this app.

Changing either would have grown the plan's file list, so both would have required a
plan revision rather than proceeding to `/implement`.

## Decision

`APPROVED`

- Rationale: The approach was judged sound by all three lenses, and F-21 records it
  as the smallest change that meets the criteria. Every one of the four major
  findings is a fault in the plan's detail or in its proof, not in the design, and
  each fix lands inside a file `plan.md > Files to change` already lists — so
  `/implement` can carry them out without touching an unlisted file (IM-4). The
  dispositions above are binding on `/implement`; they are not suggestions.

  The one finding that changes what a shopper sees, F-5, is accepted as scoped
  rather than fixed: the four other document roots draw no remote images today.

## Approvals

> Single self-approval by the ticket owner (no distinct reviewer, no second approver).

- Approver (owner): developer — self-approval, 2026-08-30. Comprehension gate passed
  3/3 at threshold 1.0 (`comprehension.md`, attempt 1), after three rounds of
  closed-book falsification.

## ADR reference

- ADR: none

## Required Follow-up Actions

These are conditions on `/implement`, not optional advice. Each one is inside a file
the plan already declares, so none of them widens the change:

1. **The recovery listener must return early while the current `src` is the
   placeholder** (F-1). Without this the mark is cropped, which is the failure the
   ticket exists to prevent.
2. **`target.tagName === "IMG"` is the handler's first statement** (F-4), and the
   handler never calls `stopPropagation`.
3. **A test evaluates the emitted script string itself** and then fails an image
   (F-2), so a script that throws makes the suite red.
4. **The AC-11 case uses `hydrateRoot`**, not a forced re-render (F-3).
5. **The script is rendered with `dangerouslySetInnerHTML`** (F-9), the emitted
   string escapes `<` (F-8), and it is a module-scope constant (F-11).
6. **The SVG carries `width` and `height` beside its `viewBox`** (F-6).
7. **`verify.md` records** the gzipped HTML delta (F-10), that NFR-4 is accepted on
   design grounds (F-12), the inline-script parse cost (F-13), that AC-9 was checked
   in a browser (F-7), and that the four other document roots are out of scope
   (F-5).

If any of these turns out to need a file the plan does not list, `/implement` must
stop and report it rather than widen the change.
