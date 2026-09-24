---
ticket: broken-image-global-fallback
stage: research
mode: standard          # single workflow form — no other modes (ADR-009)
status: complete        # not_started | in_progress | blocked | complete
owner: ai_agent
updated: 2026-08-30
links:
  clickup:
  github:
---

# Research — broken-image-global-fallback

> Read-only phase. **No implementation is allowed in this command.**

## Goal

Find every place an image is drawn in this app, and find every rule that already
controls how those images paint — so a single fallback can be added without moving
or reshaping anything on screen.

## How many images, and where they are

The intake said "we use images a lot". Here is the measured shape of that.

**Raw `<img>` tags — 499**, spread very unevenly:

| Area | `<img>` count |
|---|---|
| `components/Chat` | 130 |
| `components/Cart` | 65 |
| `components/setting` | 50 |
| `components/Home` | 48 |
| `components/Server` | 37 |
| `components/products` | 37 |
| `components/SellerDashboard` | 29 |
| `components/ListingPage` | 22 |
| `components/settings` | 18 |
| `components/Orders` | 16 |
| `components/global` | 14 |
| `app/(client)` | 10 |
| `components/skeleton` | 8 |
| `components/ServerWrapper` | 6 |
| `components/Listing` | 5 |
| `components/filterPage` | 2 |
| `components/Notifications`, `components/Login` | 1 each |

**`next/image` — 64 files** import it (`components/**` and `app/page.tsx`).

**These two groups are the same DOM element.** `next.config.ts:184` sets
`images.unoptimized: true`. I read the installed Next source to confirm what that
does: `node_modules/next/dist/shared/lib/get-img-props.js:95` —
`generateImgAttrs()` returns early when `unoptimized` is set, with
`srcSet: undefined, sizes: undefined`. So every `next/image` in this app renders a
plain `<img>` with a single `src` and **no `srcset`**. One mechanism can cover all
563 places, and no `srcset` re-selection can fight it.

**A large share of the 499 are local icons that never fail.** The most repeated
sources are `/icons/ActiveCategoryIcon.svg` (29 uses), `/icons/backIcon.svg` (15),
`/icons/AddressInfo.svg` (8), `/icons/WalletIcon.svg` (7). These ship with the app.
The remote ones — the ones that actually break — go through `GetImageUrl()` to
`https://media_server.ramaaz.dev/image/upload` (`.env.production:34`).

## The finding that matters most for "never break any design or shape"

`public/styles/globals.css:395` sets a **global rule on every `img` in the app**:

```css
img {
  -o-object-fit: cover;
  object-fit: cover !important;
  -o-object-position: center;
  object-position: center !important;
  display: block;
  -webkit-user-drag: none;
  max-width: 100%;
  color: transparent;
}
```

It is at the top level of the file, not inside a media query (the nearest `@media`
blocks are at lines 376 and 382, both closed before it). A second, smaller `img`
rule sits at line 32 (`user-select`, `-webkit-user-drag`).

Four consequences, and every one of them touches this ticket:

1. **`object-fit: cover !important` will crop the placeholder.** The fallback is
   painted into whatever box the page already made — a tall product card, a small
   round avatar, a wide banner. `cover` fills the box and cuts off the rest. A
   placeholder with a drawing in it will be cut differently in every one of those
   boxes.
2. **A normal CSS class cannot undo it.** The rule uses `!important`, so a
   `.img-fallback { object-fit: contain }` class is simply ignored. Overriding it
   needs `!important` as well.
3. **`color: transparent` hides `alt` text.** Today a broken image shows the
   browser's own icon and no words, because the alt text is painted transparent.
   So nothing on screen currently explains a missing picture.
4. **`display: block` and `max-width: 100%` are already applied everywhere.** The
   fallback must not restate or change either one.

The safe shape of a fallback follows from this: it must set **no** width, height,
aspect-ratio, margin, or position. At most it may change what is drawn inside the
existing box.

## An existing global error listener already exists — and cannot see images

`utils/globalErrorListeners.ts` exports `installGlobalErrorListeners()`. It is
installed from `components/Home/Init.tsx:45`, inside a `useEffect`, and it is
idempotent (`installed` flag).

Two facts about it decide a lot of this ticket:

- It registers `window.addEventListener("error", …)` with **no capture argument**,
  so it listens in the bubble phase. Image load failures do not bubble. They only
  reach a listener registered with `capture: true`. So this listener does **not**
  see a single broken image today, and adding one is not a duplicate of it.
- It runs from a `useEffect`, which means **after hydration**. Images begin loading
  from the server-rendered HTML, so the first failures happen before that effect
  ever runs. Anything installed the same way misses the first wave.

It also carries a pattern worth copying: a `SKIP_SUBSTRINGS` list and a 2-second
de-dupe map, both written to stop error storms and logging loops.

## The four existing `onError` handlers, and a bug in one of them

Only four images in the whole app handle their own failure today. They do four
different things:

| File | Line | What it does |
|---|---|---|
| `components/Chat/components/SearchResult.tsx` | 145 | Swaps to `ProfilePicture` and sets `onerror = null` to stop a loop. The only correct one. |
| `components/products/ShareAvatar.tsx` | 26 | Swaps to `/images/profileNo.png`. No loop guard, but the target exists. |
| `components/Chat/components/ChatContactsUpload.tsx` | 336 | **Hides** the image: `e.currentTarget.style.display = "none"`. |
| `components/setting/orders/confirmations/OrderItemReturnConfirmationWindow.tsx` | 334 | Swaps to `/images/placeholder-product.png`. |

A fifth is commented out at `components/Home/Stories/StoryCard.tsx:21`.

**`/images/placeholder-product.png` does not exist.** `public/images/` holds
exactly five files: `end.png`, `error.png`, `filePng.png`, `notifications.png`,
`profileNo.png`. So that handler answers a broken image by pointing at another
broken image, and it has no `onerror = null` guard — assigning `src` re-runs the
load, which fails, which fires `error` again, which assigns the same `src` again.
This is a pre-existing defect in a file this ticket does not necessarily open. It
is recorded here so `/wf:spec` can decide scope; it is **not** fixed at research.

`ChatContactsUpload.tsx:336` is the opposite risk: it deliberately makes the image
disappear. A global fallback that paints a placeholder there would put a grey box
where the design currently shows nothing.

## Existing placeholder assets

- `public/images/profileNo.png` — the de-facto avatar fallback, referenced 19 times
  across `components/` and `app/`, including as a CSS `background-image` in the
  call screens.
- `public/icons/ProfilePlaceHolder.svg` — profile-shaped.
- `public/images/error.png`, `public/error.png` — error illustrations, not image
  placeholders.

There is **no** general-purpose "picture missing" asset in the repo today.

## Surfaces a listener on `<img>` cannot reach

These draw media without an `<img>` element, so no `error` event is available:

- **CSS `background-image` with a media URL** — `components/Chat/components/ChatVideoCall.tsx:315`,
  `ChatVoiceCall.tsx:273`, `components/global/WebViewVideoCall.tsx:247`,
  `WebViewVoiceCall.tsx:200`. All four already hard-code `/images/profileNo.png` as
  a sibling default, so they are partly handled by design.
- **`<source>` inside media elements** — `MediaMessagePreview.tsx:47`,
  `AudioMessage.tsx:138`, `VideoMessage.tsx:105`. These are audio and video, not
  images.
- There is **no `<picture>` element** anywhere in the app, and no `srcSet` on any
  image (the `sizes=` matches in the grep are all product size lists, not image
  sizing).

## Images whose `src` can be empty or undefined

89 of the `<img>` tags use an expression for `src`. Several can resolve to
`undefined`, for example `components/Chat/components/messages/Types/ImageMessage.tsx:101`
(`message_files?.[0]?.file_path`), `ReplyMessage.tsx:34`, and
`components/Home/Stories/StoryViewer.tsx:364`. An `<img>` with an empty or missing
`src` can fire an `error` event in some browsers. If the fallback does not exclude
that case, it draws a placeholder in a spot the design meant to leave blank.

## Injected HTML also contains images

Five places render backend HTML through `dangerouslySetInnerHTML` +
`sanitizeHtml()`: `components/products/ProductDetailsText.tsx:9`,
`components/global/compare.tsx:450`, `components/Home/OfferWidgets/BoutiqueElement.tsx:66`,
`components/Notifications/NotificationItem.tsx:80`,
`components/global/NotificationsContainer.tsx:112`. Any `<img>` inside that HTML is
a real DOM image and would be covered by a document-level listener — for free, and
without touching those files.

## Relevant directories

- `components/` — 489 of the 499 `<img>` tags, and all 63 component-level
  `next/image` imports.
- `app/(client)/[lang]/` — the locale root layout, the only place mounted on every
  page.
- `public/styles/` — `globals.css`, which holds the global `img` rule above.
- `public/images/`, `public/icons/` — where a placeholder asset would live.
- `utils/` — `globalErrorListeners.ts`, `tinyUtils.tsx` and `server/helpers.ts`
  (the two `GetImageUrl` copies).
- `tests/` — the unit suite that must prove the behaviour.

## Relevant config files

- `next.config.ts:184` — `images.unoptimized: true`; also `images.domains` (the
  media hosts) and `minimumCacheTTL`.
- `next.config.ts` headers block — the enforced CSP is
  `object-src 'none'; base-uri 'self'; frame-ancestors 'self'`. There is **no**
  `default-src` and **no** `img-src`, so a `data:` image URL is allowed and no CSP
  change is needed.
- `next.config.ts` headers block — `/:all*(css|png|jpg|svg|…)` already gets
  `Cache-Control: public, max-age=31536000, immutable`. A placeholder file placed
  under `public/` inherits that automatically.
- `public/styles/globals.css:32` and `:395` — the two global `img` rules.
- `vitest.config.mts` — one project, `unit`, `environment: 'jsdom'`,
  `setupFiles: ['./tests/setup.ts']`, `testTimeout: 15000`, `tests/e2e/**`
  excluded.
- `app/(client)/[lang]/layout.tsx:138,142` — the two existing `<Script>` tags, both
  `strategy="lazyOnload"`. No `beforeInteractive` script exists in the app yet.

## Possibly affected services

- **The media app** (`media_server.ramaaz.dev`) — not changed by this ticket, but
  it is the source of nearly every image that can fail. Layer 1 is being handled
  separately and the two do not depend on each other.
- **Sentry / `mobile_error_log`** — if the fallback reports failures, both receive
  new traffic. On a page with a broken product feed that could be dozens of events
  per view. `utils/globalErrorListeners.ts` already has the de-dupe and skip-list
  pattern to borrow.
- **The browser suite** — `tests/e2e/selectors.ts:201` and `:204` locate elements
  by exact `src` (`img[src="/icons/settings/VerifiedUserIcon.svg"]`). Those two are
  local icons that should never fail, but any mechanism that rewrites `src`
  couples to these selectors.

## Test / validation commands available

Listed, not run (research is read-only):

- `pnpm test:run` — the unit suite, Vitest project `unit`, jsdom. Gates every PR.
- `pnpm test:coverage` — the same with coverage.
- `pnpm lint` — ESLint, including the i18n rules that error on translate keys
  missing from `ar`/`tr`/`ku`.
- `pnpm lint:i18n-parity` — checks the three translation files stay key-parallel.
- `pnpm build` — production build.
- `npx next typegen && npx tsc --noEmit` — typecheck. `next typegen` must run
  first, because `next-env.d.ts` is not committed.
- `pnpm test:e2e:live` / `pnpm e2e:health` — the browser suite against staging. Not
  a PR gate.

### Test layout and naming convention

- Tests live under `tests/`, mirroring the source path:
  `utils/tinyUtils.tsx` → `tests/utils/tinyUtils.test.ts`;
  `components/products/ProductCard/index.tsx` →
  `tests/components/products/ProductCard/index.test.tsx`.
- File name is `<SourceName>.test.ts` for plain modules and `.test.tsx` when it
  renders. One colocated leftover exists (`utils/functions.test.tsx`) and still
  runs, because the default pattern is kept.
- Runner is **Vitest**, project `unit`, `environment: 'jsdom'`, with
  `@testing-library/jest-dom` matchers and `@testing-library/react` cleanup wired
  in `tests/setup.ts`. `msw` supplies the fake network.
- The expected-failure marker is Vitest's `test.fails` / `it.fails`. **It is not
  used anywhere in the suite today** — a grep for `test.fails` / `it.fails` /
  `BUG-` over `tests/` returns only unrelated prose. So a `BUG-n` guard added by
  this ticket would be the first, and it sets the pattern.

## Risks and unknowns

- **The global `object-fit: cover !important` crops the fallback** — high impact,
  certain to happen. Any placeholder with a drawing in it is cut differently in a
  square avatar, a tall product card and a wide banner.
- **Installing after hydration misses the first failures** — high impact, certain.
  Images load from the server HTML; `Init.tsx`'s `useEffect` runs later.
- **React 19 hydration may write the original `src` back** after a
  pre-hydration DOM swap. Impact: the placeholder flashes away and the broken icon
  returns. Likelihood unknown — must be settled before the loop guard is designed,
  because a guard that stops after one swap would make this permanent.
- **An error storm.** A failing media host means hundreds of `error` events on one
  page. The handler must stay cheap and must not log per event.
- **Replacing a failing local icon with a general placeholder may look worse** than
  the current broken icon — a 16px icon slot filled with a grey "no picture" box
  draws more attention to the fault, not less.
- **`ChatContactsUpload.tsx:336` hides its image on purpose.** A global placeholder
  contradicts it.
- **`OrderItemReturnConfirmationWindow.tsx:334` points at a file that does not
  exist** and has no loop guard — a pre-existing defect, listed above.
- **jsdom does not load images.** No `error` event ever fires there on its own, so
  the unit test has to dispatch the event by hand. That proves the handler, not the
  browser. What jsdom cannot prove has to be named honestly in the spec rather than
  assumed.

## Open questions

> Give each question a stable ID (`OQ-1`, `OQ-2`, …). `spec.md` must record an
> answer for every one of them (SP-9) — an answer given only in chat does not
> count. A question about touching `observability/**` is answered by putting the
> path in scope (then `plan.md > Files to change`) or by putting it Out of Scope.

| ID | Question | Why it matters |
|------|----------|----------------|
| OQ-1 | Which placeholder artwork is used, and can a single one survive `object-fit: cover` in every box shape the app has (round avatar, tall product card, wide banner, small brand icon)? | `globals.css:395` crops it. A drawing that reads well in one box is cut in another. This is the core of "never break the shape". |
| OQ-2 | Does the fallback need `object-fit: contain !important` to defeat the global rule, and is changing the fit for a **failed** image acceptable? | Without `!important` any override is ignored. With it, failed images paint differently from working ones — which may be exactly right, but it must be a stated decision. |
| OQ-3 | Where is the handler installed so it is already running before the first image fails? | `Init.tsx:45` installs in a `useEffect`, which is after hydration. Images fail before that. |
| OQ-4 | Can React 19 hydration put the original broken `src` back after a pre-hydration swap, and what loop guard survives that without looping forever? | A hard "swap once" flag would leave the broken icon on screen; no guard at all can loop. The guard has to depend on the answer. |
| OQ-5 | What happens to the four existing `onError` handlers — especially the one that hides the image (`ChatContactsUpload.tsx:336`) and the one pointing at the missing `/images/placeholder-product.png`? Is the missing-file defect fixed here or ticketed separately? | Two of them contradict a global placeholder. The missing-file one can loop. Leaving them undecided means two mechanisms fighting on the same element. |
| OQ-6 | Does a failing **local** asset (`/icons/*.svg`, `/images/*.png`) get the placeholder too, or only remote media URLs? | Local icons are small and decorative. A grey "no picture" box in a 16px icon slot may look worse than today. |
| OQ-7 | Does an `<img>` with an empty or `undefined` `src` fire the error, and must it be excluded? | 89 images build `src` from an expression and several can be `undefined`. A placeholder there fills a space the design meant to leave empty. |
| OQ-8 | Are the four CSS `background-image` avatar surfaces in scope, or explicitly out? | A listener on `<img>` cannot reach them. They already hard-code `/images/profileNo.png`, so "out of scope" is defensible — but it must be written down. |
| OQ-9 | Is a failed image reported anywhere (Sentry, `mobile_error_log`, PostHog), and if so how is an error storm avoided? | One dead media host means hundreds of events per page view. `globalErrorListeners.ts` already holds a skip-list plus a 2-second de-dupe to copy. |
| OQ-10 | Which test file and which cases prove this, given jsdom never loads an image and the `error` event must be dispatched by hand? | Decides whether the proof is real or only proves the handler function. What jsdom cannot cover must be named, not assumed. |
| OQ-11 | Does the placeholder need `alt` text, given `globals.css:395` paints `color: transparent` so alt text is invisible today? | If alt text can never be seen, adding new translated copy would be dead work — and any new copy needs `ar`/`tr`/`ku` keys before it is used. |

## Notes

- No code was changed during research.
- No observability runtime configs were modified.
- Nothing outside `_specs/broken-image-global-fallback/` was written.
- Every count and line number above was read from the working tree on `develop` on
  2026-08-30.
