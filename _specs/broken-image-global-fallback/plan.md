---
ticket: broken-image-global-fallback
stage: plan
mode: standard          # single workflow form — no other modes (ADR-009)
status: complete        # not_started | in_progress | blocked | complete
owner: developer
updated: 2026-08-30
links:
  clickup:
  github:
---

# Plan — broken-image-global-fallback

> Decide the approach before changing code. Plan only — no implementation here.

## Approach

One `error` listener on `document`, registered in the **capture** phase, catches
every failing `<img>` in the app. Image errors do not bubble, so capture is the only
phase that sees them, and one listener replaces edits at ~560 call sites (C-5).

The listener is delivered as a small inline `<script>` written into the page by the
root layout. That is what makes it running before the first image of the
server-rendered HTML can even be parsed (AC-7), and it keeps the client JavaScript
bundle at exactly the same size, because a Server Component only renders the string
— the module never enters the browser bundle (AC-12).

On a failure the listener changes two things on the element and nothing else: the
`src` becomes an inline placeholder that needs no network request and cannot itself
fail, and a `data-img-fallback` attribute is set. One CSS rule keyed to that
attribute supplies the tint and draws the mark whole. Nothing about size or position
is touched, so no box moves (AC-2).

**Alternatives rejected.** A `<SafeImage>` wrapper component would mean editing
~560 call sites and adding React state plus a second render per image — rejected
against C-5, NFR-1 and NFR-4. Extending the existing `utils/globalErrorListeners.ts`
was rejected on two counts: it installs from a `useEffect` (too late for AC-7), and
its job is reporting errors, which OQ-9 put out of scope.

## Answers to the questions the spec deferred

### OQ-3 — how it is running before the first image can fail

A raw `<script>` element, rendered as the **first child of `<body>`** by the root
layout, with its code inline. The browser runs an inline script the moment it parses
it, before parsing the rest of the body, so the listener exists before any `<img>`
element in the document does.

`next/script` is deliberately not used. Its `beforeInteractive` strategy is a client
component and its placement in the document is decided by the framework; a plain
element in the server-rendered markup is placed exactly where it is written.

The enforced CSP is `object-src 'none'; base-uri 'self'; frame-ancestors 'self'`.
It has no `script-src` and no `default-src`, so an inline script needs no policy
change (C-4).

### OQ-4 — can hydration put the failed source back, and what guard survives it

Two separate risks, handled separately:

- **`src`.** React only writes a DOM property when its own model of that property
  changes between renders. The `src` prop does not change, so a re-render does not
  rewrite it. This is a claim about framework behaviour, so it is **proven by a
  test**, not asserted: the test renders a component, fails its image, forces a
  re-render, and checks the placeholder is still there.
- **The marker.** `className` is a bad place to record the failure, because React
  *does* own `className` and rewrites the whole string whenever it changes — a hover
  or selected state would wipe the marker. A `data-` attribute React never rendered
  is not in React's model, so a re-render leaves it alone. That is why the marker is
  `data-img-fallback` and not a class.

**The loop guard is a value test, not a counter.** The handler returns early when
the failing `src` is already the placeholder. Because the placeholder is an inline
image that requires no request, it can never fail, so no loop is possible. And
because the guard is not a one-shot flag, a restored-then-failing source is swapped
again — which is exactly what AC-11 asks for in both directions.

**Recovery.** When the placeholder is drawn, a one-time `load` listener is attached
to that element alone. If a working source is later put on the same element, the
marker is removed and the image paints normally again. It is attached only to
elements that already failed, so a healthy page still runs nothing (NFR-2), and it
is what keeps AC-3 true for an element that a carousel or list re-uses.

### OQ-10 — what the tests prove, and what they cannot

The proof lives in the unit suite (`tests/`, Vitest, jsdom), which gates every pull
request. Two limits are real and are not papered over:

- **jsdom never loads an image**, so no `error` event happens by itself. The tests
  raise the event on the element by hand. That proves the handler's decisions —
  which is the whole of the logic — and does not prove a browser fires the event.
  The browser firing `error` on a failed image is standard behaviour, not something
  this change introduces.
- **jsdom has no layout engine**, so a box cannot be measured there. AC-2 is
  therefore proven **structurally** instead, and more strictly than a measurement
  would: one test asserts the handler writes nothing except `src` and the marker,
  and a second test reads `public/styles/globals.css` and asserts the new rule
  contains no property that can move or resize an element. That second test also
  stops the rule growing a size property later.
- **AC-7 and AC-12 are about the built output**, not about logic, so they are proven
  from the build at `/verify` with the exact commands named below — not by a unit
  test pretending to see them.

## Conflict found — AC-4 and AC-10 cannot both be met in full

`AC-10` says all four images that handle their own failure stop doing so. `AC-4`
says a local app file is left alone when it fails. For three of the four images
there is no conflict. For the fourth there is:

`components/Chat/components/ChatContactsUpload.tsx:333` loads a country flag from
`/icons/flag/<iso2>.svg` — a **local** path. Under AC-4 the new listener will never
touch it. So removing its handler would not hand it to the new mechanism; it would
simply delete the behaviour, and a failed flag would go from *hidden* to *showing
the browser's broken-image icon* in the middle of a phone-number field.

That is a regression with no gain, and it comes from the two decisions meeting, not
from either one being wrong.

**This plan keeps that one handler and removes the other three.** The three removed
all load from the media app, so the new mechanism does cover them:

| File | Source | Action |
|---|---|---|
| `components/Chat/components/SearchResult.tsx:145` | `GetImageUrl(photo)` — remote | remove handler |
| `components/products/ShareAvatar.tsx:26` | media address + `photo_path` — remote | remove handler |
| `components/setting/orders/confirmations/OrderItemReturnConfirmationWindow.tsx:334` | `getConfiguredImage({src: return_item.image})` — remote | remove handler |
| `components/Chat/components/ChatContactsUpload.tsx:336` | `/icons/flag/<iso2>.svg` — **local** | **keep** |

The owner accepts or refuses this at `/review`. If it is refused, the fix is in the
spec, not here: `AC-10` would have to be narrowed to the remote images.

Two smaller notes on the three that are removed:

- `SearchResult` and `ShareAvatar` also use the person-shaped default as their
  **initial** source when a contact has no photo at all. That is a different line
  and it is **not** touched. Only the case "a photo exists and fails to load"
  changes, and it changes to the general placeholder.
- The defect research found — a fallback pointing at `/images/placeholder-product.png`,
  a file that does not exist, with no loop guard — disappears with the handler it
  lives in. It needs no separate ticket, and the plan's own test proves the loop
  cannot happen through the new mechanism.

## Steps

1. Add `utils/imageFallback.ts`: the placeholder image as an inline data address,
   the marker attribute name, the installer function, and the one-line script string
   built from that function. The script string is built with the function's own
   source, so there is exactly one copy of the logic and the test and the browser
   run the same code.
2. Add the rule for the marker to `public/styles/globals.css`, directly under the
   existing global `img` rule so the two are read together.
3. Render the script as the first child of `<body>` in the root layout.
4. Remove the three per-image handlers listed above. Keep the flag one.
5. Write `tests/utils/imageFallback.test.ts` with the cases named in **Tests**.
6. Run the `full` validation profile.

### The placeholder mark

A square drawing with its own padding built in: the mark sits in the middle ~44% of
the picture, the rest is transparent. Padding inside the drawing is what keeps it a
modest, centred mark in every box — a wide banner, a tall card and a small avatar
all show the same mark at about 44% of the shorter side, never blown up to fill the
box and never cut (AC-9).

```svg
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'>
  <g fill='none' stroke='#C4C2C2' stroke-width='4'
     stroke-linecap='round' stroke-linejoin='round'>
    <rect x='28' y='30' width='44' height='40' rx='5'/>
    <circle cx='40' cy='43' r='4'/>
    <path d='M72 60 58 46 36 70'/>
  </g>
</svg>
```

It is URL-encoded into a `data:image/svg+xml,…` address — under 400 bytes, no
request, and impossible to 404. `#C4C2C2` is already the app's placeholder grey
(it is the input placeholder colour used across the forms).

### The CSS rule

```css
/* A remote image that failed to load. The mark is drawn whole instead of
   filling the box, so it is never cropped by the global rule above. Nothing
   here may change size or position — see tests/utils/imageFallback.test.ts. */
img[data-img-fallback] {
  object-fit: contain !important;
  background-color: #f0f0f0;
}
```

`img[data-img-fallback]` is more specific than the plain `img` selector above it, so
it wins even though both are marked important (C-1 — the global rule itself is not
edited, and a working image never matches this selector).

### Rules the installer function must follow

- It takes the placeholder address and the marker name as **arguments**. It reads no
  module-level value, because its source is inlined into the page and a closure
  would not travel with it.
- It uses only syntax that compiles without helper functions — no `?.`, no `??`, no
  class fields, no `async`. A helper the compiler adds outside the function would
  not be inlined with it and the script would throw.
- It is safe to run twice (a flag on `window`), so a re-render or a second layout
  can never register two listeners.

## Files to change

- `utils/imageFallback.ts` — **new.** The placeholder address, the marker attribute
  name, the installer function, and the inline script string built from it.
- `app/(client)/[lang]/layout.tsx` — add the inline `<script>` as the first child of
  `<body>`, before every other element. Nothing else in the file changes.
- `public/styles/globals.css` — add the `img[data-img-fallback]` rule below the
  existing global `img` rule at line 395. No existing rule is edited.
- `components/Chat/components/SearchResult.tsx` — remove the `onError` handler
  (lines 145–148). The initial-source line stays.
- `components/products/ShareAvatar.tsx` — remove the `onError` handler (lines
  26–29) and the now-unused `SyntheticEvent` import. The initial-source line stays.
- `components/setting/orders/confirmations/OrderItemReturnConfirmationWindow.tsx` —
  remove the `onError` handler (lines 334–336).
- `tests/utils/imageFallback.test.ts` — **new.** The cases in the Tests table.

**Explicitly not changed:** `components/Chat/components/ChatContactsUpload.tsx` (see
the conflict above), `utils/globalErrorListeners.ts`, and the two `GetImageUrl`
copies.

## Integration surface

> Required (PL-11, ADR-012). What this change touches **beyond its own files** —
> the source of the mandatory integration question at `/review` (CG-5).
> `none — self-contained` is valid only with the reason stated.

- **Components / shared config touched:**
  - `app/(client)/[lang]/layout.tsx` — the root layout, rendered on **every** page
    of the app in all four languages. It is shared with the navigation bar, the
    analytics scripts, the modal slot and the store providers.
  - `public/styles/globals.css` — one global stylesheet loaded on every page. It
    already carries the app-wide `img` rule that this whole ticket works around.
  - The `data-img-fallback` attribute name becomes a small piece of shared
    vocabulary between the script and the stylesheet.
- **Who else depends on them:**
  - Every screen depends on the layout. A script that throws while parsing would
    not stop the page, but a mistake in the layout's markup would affect all of it.
  - Every screen depends on `globals.css`. The new rule is keyed to an attribute
    that only the script sets, so nothing else can match it.
  - The browser suite selects two elements by exact `src`
    (`tests/e2e/selectors.ts:201` and `:204`). Both are local `/icons/...` files.
    Under AC-4 the listener never rewrites a local source, so those selectors cannot
    be affected — but they are the reason the remote-only rule must be checked on
    the `src` **attribute** and not on the resolved address, which is always
    absolute.
- **Overlapping flows:**
  - Images inside backend HTML (product descriptions, notifications) are covered
    for free, because the listener is on the document rather than on a component.
    Five screens render such HTML.
  - The three files whose handler is removed each sit in a different flow: chat
    search, the share sheet, and order returns.
- **Ordering / lockstep dependencies:** the stylesheet rule and the script must land
  together. With the script but no rule, a failed image would show the mark cropped
  by the global `cover`. With the rule but no script, nothing matches it and nothing
  happens. There is no ordering requirement beyond being in the same change.
- **What breaks if this is wrong:**
  - If the remote-only test is written against the resolved address instead of the
    `src` attribute, **every** local icon in the app matches, and failed toolbar
    icons turn into grey boxes. It would show up as icon slots changing appearance
    across the whole app.
  - If the loop guard is wrong, an element swaps between two failing addresses
    without end and pins a CPU core. It would show up as one screen becoming
    unresponsive.
  - If the marker were a class instead of a data attribute, any re-render that
    changes `className` would drop it, and the mark would silently start being
    cropped again on those elements only.

## Tests

> Required (PL-13, ADR-026). One row per `AC-n` in `spec.md`.

**Search performed (PL-14).** `utils/imageFallback.ts` does not exist yet, so no
test for it can exist. I searched the layout `research.md` recorded — `tests/`
mirroring the source path — for any existing coverage of image failure handling:
`tests/utils/` (20 files, listed in research) has no image-fallback file;
`grep -rn "onError\|img\[" tests/` returns nothing for this behaviour;
`tests/utils/tinyUtils.test.ts` and `tests/utils/server/helpers.test.ts` cover
`GetImageUrl` (building an address), not failure handling. So there is no file for
this unit to extend, and one new file is correct — not a second file beside an
existing one.

| AC | Existing coverage found | Disposition | Test file | Test case / name |
|------|-------------------------|-------------|-----------|------------------|
| AC-1 | `none — searched tests/utils/, tests/components/` | new | `tests/utils/imageFallback.test.ts` | `a remote image that fails shows the placeholder` |
| AC-2 | `none — searched tests/utils/, tests/components/` | new | `tests/utils/imageFallback.test.ts` | `the handler writes nothing but src and the marker` **and** `the fallback style rule sets no property that can move or resize an element` |
| AC-3 | `none — searched tests/utils/, tests/components/` | new | `tests/utils/imageFallback.test.ts` | `an image that loads normally is never marked` **and** `the marker is removed when a working source loads on the same element` |
| AC-4 | `none — searched tests/utils/, tests/components/` | new | `tests/utils/imageFallback.test.ts` | `a local app file is left alone when it fails` |
| AC-5 | `none — searched tests/utils/, tests/components/` | new | `tests/utils/imageFallback.test.ts` | `an image with no source is left alone when it fails` |
| AC-6 | `none — searched tests/utils/, tests/components/` | new | `tests/utils/imageFallback.test.ts` | `the placeholder is an inline address, so it needs no request and cannot fail` |
| AC-7 | `none — searched tests/, and it is not visible to jsdom` | none — proven from the build at `/verify` | — | See **Validation strategy**: the script must appear in the built HTML before the first `<img>`. |
| AC-8 | `none — searched tests/utils/, tests/components/` | new | `tests/utils/imageFallback.test.ts` | `an image added to the page after the listener was installed is covered` |
| AC-9 | `none — searched tests/utils/, tests/components/` | new | `tests/utils/imageFallback.test.ts` | `the fallback rule draws the mark whole and beats the global cover rule` |
| AC-10 | `none — searched tests/utils/, tests/components/` | new | `tests/utils/imageFallback.test.ts` | `the three remote images no longer handle their own failure` |
| AC-11 | `none — searched tests/utils/, tests/components/` | new | `tests/utils/imageFallback.test.ts` | `a restored failing source is swapped again, and the placeholder never re-triggers` **and** `the placeholder survives a re-render` |
| AC-12 | `none — searched tests/, and it is not visible to jsdom` | none — proven from the build at `/verify` | — | See **Validation strategy**: First Load JS unchanged. |
| AC-13 | `none — searched tests/utils/` | new | `tests/utils/imageFallback.test.ts` | `many failures make no request and send no report` |
| AC-14 | `pnpm lint:i18n-parity` and the i18n lint rules already gate this repo-wide | existing | — | The `full` profile runs `lint` and there is no new user-visible string to add a key for. |

Two rows say `none`. Both are properties of the built output, not of logic, and both
name a concrete deterministic check below rather than being waved through.

## Validation strategy

- Validation profile: `full`

  Chosen over `logic-change` because this change edits the root layout and adds a
  module whose string is rendered by a Server Component. That is exactly the
  server/client boundary class of mistake `typecheck` does not catch and `build`
  does. `full` runs `lint`, `typecheck`, `unit-tests` and `build`.

- The unit cases in the table are run by the profile's `unit-tests` check
  (`pnpm test:run`).

- **AC-7 evidence, from the build the profile already produces.** In the generated
  HTML for a page, the fallback script must appear before the first `<img>`:

  ```
  # after `pnpm build && pnpm start`
  curl -s http://localhost:3000/sy-en | grep -o 'data-img-fallback\|<img' | head -3
  ```

  The first line of the output must be `data-img-fallback`, not `<img>`. Record the
  actual output in `verify.md`. (The `sy-en` locale is used because `gb-en` opens
  the region picker over the page.)

- **AC-12 evidence, from the same build.** `pnpm build` prints First Load JS per
  route. The figure for the root layout's routes must be unchanged from the run on
  `develop` before the change. Record both numbers in `verify.md`.

- No check writes to the repository, and all four are deterministic.

## Rollback

Revert the single commit. Nothing is stored, migrated or cached anywhere, so there
is no state to undo:

- The script disappears from the HTML, so no listener is installed.
- The CSS rule disappears; it matched only an attribute that nothing else sets.
- The three `onError` handlers come back exactly as they were.

A partial rollback is also safe in either order: the script without the rule shows a
cropped mark, and the rule without the script matches nothing at all. Neither can
break a page.

## Out of scope

- The media app change ("layer 1") — a different codebase, handled separately.
- Avatars drawn as a CSS background on the call and video screens (spec OQ-8).
- Reporting or counting broken images (spec OQ-9).
- `components/Chat/components/ChatContactsUpload.tsx` — see the conflict above.
- The commented-out handler at `components/Home/Stories/StoryCard.tsx:21`. It is a
  comment and changes nothing; deleting it would be unrelated tidying.
- Videos, audio and poster frames.
- Any change to `utils/globalErrorListeners.ts`, the two `GetImageUrl` copies, or
  the image-optimizer setting.

## Traceability

| Plan step | Files | Requirements / AC |
|---|---|---|
| 1 — the module | `utils/imageFallback.ts` | FR-1, FR-4, FR-5, FR-6, FR-8; AC-1, AC-4, AC-5, AC-6, AC-8, AC-11, AC-13 |
| 2 — the CSS rule | `public/styles/globals.css` | FR-2, FR-9, C-1; AC-2, AC-3, AC-9 |
| 3 — the layout | `app/(client)/[lang]/layout.tsx` | FR-7, NFR-1; AC-7, AC-12 |
| 4 — remove three handlers | `SearchResult.tsx`, `ShareAvatar.tsx`, `OrderItemReturnConfirmationWindow.tsx` | FR-10; AC-10 (partly — see the conflict) |
| 5 — the tests | `tests/utils/imageFallback.test.ts` | proves AC-1..AC-6, AC-8..AC-11, AC-13 |
| 6 — validation | — | AC-7, AC-12, AC-14 |
