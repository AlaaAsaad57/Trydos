# Stage 3 — App Shell Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The new bottom nav shows on every page of the storefront, with real counts, and the cart and its checkout live on the new page `/[lang]/cart`.

**Architecture:** A new client component `AppShell` is mounted once in `app/(client)/[lang]/layout.tsx`. It passes the old page through untouched, and draws the existing `Demo1BottomNav` over it. Each tab runs an action (go to a path, or open an old overlay). It never draws a new screen in Stage 3 (see "Moved to Stage 4"). The cart drawer becomes a page. The store action `enableCart(true/false)` stays, so every old caller keeps working, and a bridge turns it into navigation.

**Tech Stack:** Next.js 16 App Router, React 19, Zustand 5 (`useAppStore`), framer-motion, Vitest + Testing Library (unit), Playwright (e2e).

**Spec:** `UI-MIGRATION-PLAN.md` > "Stage 3 — shell, navigation, routes" (decisions S3-1..S3-10 and the build rules). Read it, and the A-* / D-* rows it names, before any task.

**Where:** worktree `../trydos-shell`, branch `ui-migrations-shell`. Never edit `../trydos` (A-18 rule 1).

## Moved to Stage 4 (needs the owner's OK)

Stage 3 turns on no new screen (S3-2). So code that **draws** a new screen at a real path would have no caller in Stage 3. CLAUDE.md says "do not add a test for code that has no caller". So these parts of the Stage 3 work list move to Stage 4, which turns on the first screen:

- the table of new-screen paths (`settings/profile` → `ProfileMenuScreen`, …) and the "is it turned on" switch (work item 1, second half);
- drawing a turned-on screen inside `AppShell`, with the slide, `DemoDataProvider`, `DemoChatProvider` and the server-side dictionary (work item 3, second half; item 6);
- `next/dynamic` for the 17 screens (item 7).

What Stage 3 still builds for every path: the real path of each tab, the lit-tab rule for every area, and the step-aside rule.

## Global Constraints

- Old pages behave as today (A-4): no slide, the browser's own scroll restore, `overflow-x: clip` on `<html>` stays. `AppShell` sets **no** `history.scrollRestoration` and **no** inline style on `<html>`.
- Old pages still render on the server (D-42). `AppShell` uses `usePathname` and `useParams` only — never `useSearchParams` — and wraps `children` in no `Suspense`.
- `HIDE_SITE_CHROME` is not used by `AppShell`. Its root uses `data-pw="app-shell"`, never `demo1-app`, so the old top nav stays until Task 9.
- `DemoKeyboard` is not mounted by `AppShell` (the drawn keyboard works only in new screens).
- One shell only: `AppShell` renders `children` alone (no bar) on `/[lang]/demo/**`, `/[lang]/loginDemo` and `/[lang]/login` (S3-8).
- Old event names and properties only (D-10). No new PostHog event, so `docs/posthog-events.md` does not change.
- Every user-visible string goes through `translateFunction`. A new key goes at the **end** of `translations.{ar,tr,ku}.js` (A-18 rule 3).
- Every assertion carries a message that names the step (CLAUDE.md "Testing"). Never assert on a count of elements.
- Tailwind breakpoints are inverted (`md` = max 768). Use `--app-bar-room` (Task 4) for every bottom offset, never a raw px value.
- Do not delete `AuthNavSection.tsx` or `UserNavTopSection.tsx` before Task 9 (A-18 rule 2).
- Before each commit: `git -C ../trydos-shell branch --show-current` prints `ui-migrations-shell`. Stage files by name, never `git add -A`.

## Review Focus

1. **A guest taps Chat.** The tab must run the same gates as the old chat icon (notification permission, phone verify, login). Expect: the login or the verify prompt, never an empty chat. Test in Task 4.
2. **The cart closes on its own after an order or a product link** (`enableCart(false)` in `components/Cart/index.tsx` lines 1118 and 1129). On `/[lang]/cart` this must leave the page, not leave the shopper on an empty page. Test in Task 6.
3. **Browser back from `/[lang]/cart`.** `CartProvider`'s `popstate` handler treats `cart_enable` as an open popup and calls `router.push` with the `cart` param removed. On the page that would push a second entry. Expect: back goes to the page before the cart, once. Test in Task 6.
4. **An old full-screen overlay opens while the bar shows** (login widget, stories viewer, call screen, phone re-verify, payment iframe). Expect: the overlay covers the bar, and no tap reaches the bar. Test in Task 4.
5. **A count of 100 or more.** The XD draws 1–2 digits. Expect: the number fits its icon. Task 3 shows `99+` above 99 (Claude's call, the designer checks it).

---

### Task 1: Tab paths, lit tab and step-aside rule

**Files:**
- Create: `components/DemoApp1/appRoutes.ts`
- Test: `tests/components/DemoApp1/appRoutes.test.ts`

**Interfaces:**
- Consumes: `DemoTab` from `components/DemoApp/demoRoutes.ts`.
- Produces:
  - `tabHref(locale: string, tab: "home" | "cart" | "settings"): string` → `/${locale}`, `/${locale}/cart`, `/${locale}/settings`.
  - `litTab(pathname: string, open: { chat: boolean; search: boolean }): DemoTab | null` — chat open → `"chat"`; else search open → `"search"`; else by the path after the locale segment: empty → `"home"`, `cart` → `"cart"`, `settings` or `settings/**` → `"settings"`, anything else → `null` (S3-10).
  - `shellStepsAside(pathname: string): boolean` — true when the first segment after the locale is `demo`, `loginDemo` or `login`.

- [ ] **Step 1: Write the failing tests** — one `it` per rule, each with a message. Cases:
  - `tabHref("sy-ar", "cart")` is `/sy-ar/cart`; `tabHref("sy-en", "home")` is `/sy-en`.
  - `litTab("/sy-en", none)` is `"home"`; `"/sy-en/cart"` → `"cart"`; `"/sy-en/settings/orders/12"` → `"settings"`; `"/sy-en/products/abc"` → `null`; `"/sy-en/filters"` → `null`.
  - `litTab("/sy-en/products/abc", { chat: true, search: false })` is `"chat"`; `{ chat: false, search: true }` on `/sy-en` is `"search"`.
  - `shellStepsAside` is true for `/sy-en/demo`, `/sy-en/demo/settings/wallet`, `/sy-en/loginDemo`, `/sy-en/login`; false for `/sy-en`, `/sy-en/settings`, `/sy-en/loginx`.
- [ ] **Step 2: Run** `pnpm vitest run --project unit tests/components/DemoApp1/appRoutes.test.ts` — expect FAIL (module not found).
- [ ] **Step 3: Implement** the three functions in `appRoutes.ts`. Split the path with `.split("/").filter(Boolean)` and drop the first part (the locale), as `screenFromUrl` does.
- [ ] **Step 4: Run** the same command — expect PASS.
- [ ] **Step 5: Commit** `feat(shell): tab paths, lit tab and step-aside rule (Stage 3)`.

### Task 2: `useShellData` — the bar's real data (A-16)

**Files:**
- Create: `components/DemoApp1/useShellData.ts`
- Test: `tests/components/DemoApp1/useShellData.test.tsx`

**Interfaces:**
- Produces: `useShellData(): { cartCount: number; unreadChats: number; photo: string | null; phoneVerified: boolean }`
  - `cartCount` = `useAppStore(s => s.localCart).length` (the number the old `ProductCartHeader` shows).
  - `unreadChats` = `getNew(useAppStore(s => s.data)).length` (`components/Chat/chatsFunctions.tsx` line 256; the number the old chat icon shows).
  - `photo` = `userProfile?.image` through `GetImageUrl` (`utils/tinyUtils.tsx` line 327), or `null` when empty.
  - `phoneVerified` = `isValidPhone(userProfile?.phone ?? user?.phone)` (`utils/phone.ts`). This is the app's own rule (`components/setting/profile/VerifyUser.tsx` lines 24-28); `is_phone_verified` is **not** used, because register-guest resets it to 0. A guest has no photo, so `profileLine` draws the grey line and no orange ring (D-31).

- [ ] **Step 1: Write the failing tests** with `renderHook` and the store seeded through `useAppStore.setState`. One `it` per field, the message naming the store field and its source: two cart lines → `cartCount` 2; chats with one new message → `unreadChats` 1; `userProfile.image` set → `photo` is that URL; `userProfile.phone` `"0"` → `phoneVerified` false; a valid phone → true; empty store → `{0, 0, null, false}`.
- [ ] **Step 2: Run** `pnpm vitest run --project unit tests/components/DemoApp1/useShellData.test.tsx` — expect FAIL.
- [ ] **Step 3: Implement** with one selector per field (the per-field pattern of `NavbarClient.tsx`).
- [ ] **Step 4: Run** — expect PASS.
- [ ] **Step 5: Commit** `feat(shell): real cart, chat, photo and phone data for the bar`.

### Task 3: Real counts in the bottom nav

**Files:**
- Modify: `components/DemoApp/DemoBottomNav.tsx` (`SLOTS` count `text` "3" / "11", lines 134-153; `TabCount`, line 236)
- Modify: `components/DemoApp1/Demo1BottomNav.tsx` (props, line 65; `slot.count`, line 284)
- Modify: `components/DemoApp1/Demo1Shell.tsx` (passes the preview's counts)
- Test: `tests/components/DemoApp1/Demo1BottomNav.counts.test.tsx`

**Interfaces:**
- Produces: `Demo1BottomNav` gets a required prop `counts: { cart: number; chat: number }`. `SLOTS[].count.text` is removed; `TabCount` gets `text: string`.
- Count text: `n > 99 ? "99+" : String(n)`. A count of 0 shows `"0"`: the XD draws every cart and chat icon with a number, and no empty-count icon exists for the active state (`navCartActiveCount`, `navChatActiveCount` only). Claude's call; the designer checks both.
- The `/demo` preview passes `{ cart: 3, chat: 11 }` from `Demo1Shell`, so the preview looks as before.

- [ ] **Step 1: Write the failing tests:** render with `counts={{ cart: 2, chat: 0 }}` → the cart tab's count reads `2` and the chat tab's reads `0`; `{ cart: 120, chat: 5 }` → `99+` and `5`. Find each count through its tab (`[data-pw="demo-tab-cart"]`), with a message naming the tab.
- [ ] **Step 2: Run** `pnpm vitest run --project unit tests/components/DemoApp1/Demo1BottomNav.counts.test.tsx` — expect FAIL (prop ignored, shows 3 / 11).
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** the new test and `tests/components/DemoApp1/Demo1Shell.test.tsx` — expect PASS.
- [ ] **Step 5: Commit** `feat(shell): the bar shows real counts`.

### Task 4: `AppShell` on every page, with the tab actions

**Files:**
- Create: `components/DemoApp1/AppShell.tsx`
- Create: `components/DemoApp1/openChatFromTab.ts`
- Modify: `app/(client)/[lang]/layout.tsx` (mount `AppShell` once, after `<NavbarClient />`)
- Modify: `components/Home/Search/SearchIcon.tsx` (opens on a store request)
- Modify: `store/search/reducer.ts` (`openSearchRequest: number`, `requestOpenSearch()`)
- Test: `tests/components/DemoApp1/AppShell.test.tsx`, `tests/app/layout.test.tsx` (extend)

**Interfaces:**
- Consumes: Task 1 (`tabHref`, `litTab`, `shellStepsAside`), Task 2 (`useShellData`), Task 3 (`counts`).
- Produces:
  - `AppShell({ dictionary }: { dictionary: Pick<DemoDictionary, "Home" | "Search" | "Cart" | "Chat" | "Profile"> })` — renders the bar only. The layout looks up the 5 tab words on the server with `translateFunction` from `utils/server` (the async-cache rule), so only 5 strings ride on each page. The page itself is not wrapped.
  - The CSS variable `--app-bar-room` on `<html>`: `TAB_ROOM` (`demo1Layout.ts`) while the bar shows, removed when it hides. The layout's global CSS adds `.main-content { padding-bottom: var(--app-bar-room, 0px) }`.
  - `openChatFromTab(): Promise<void>` — the same gates as `openChatAction` (`components/Home/AuthNavSection.tsx` lines 40-82), reading `useAppStore.getState()`. It is a copy until Task 9, which deletes `AuthNavSection.tsx`, so only one copy is left at the end.
- Tab actions: Home → `router.push(tabHref(locale, "home"))`. Search → push home (if not there), then `requestOpenSearch()`. Cart → `enableCart(true)` (Task 6 turns it into the page). Chat → `openChatFromTab()`. Profile → push `tabHref(locale, "settings")`.
- The bar hides (and `--app-bar-room` goes) while an old overlay that covers the screen is open: `loginOpen`, `shouldAuthinticated`, `selectedStory?.id`, `addStoryEnable`, `call`, `openPayIframe` (all `useAppStore` fields). It stays over `chatVar` (Chat lit) and `enable_search` (Search lit), as S3-10 needs.

- [ ] **Step 1: Write the failing tests** in `AppShell.test.tsx` (mock `next/navigation` as `Demo1Shell.test.tsx` does). One `it` each:
  - on `/sy-en/products/x` the bar is on `<body>` with no tab lit, and the page's own child is rendered unchanged inside no `[data-demo-screen]` frame;
  - on `/sy-en/demo`, `/sy-en/loginDemo`, `/sy-en/login` there is no bar and `--app-bar-room` is not set;
  - the shell sets no inline style on `<html>` other than `--app-bar-room`, and `history.scrollRestoration` stays `"auto"`;
  - pressing Profile calls `router.push("/sy-en/settings")`; Home → `"/sy-en"`; Cart calls the store's `enableCart(true)`;
  - Search on `/sy-en/cart` pushes `/sy-en` and bumps `openSearchRequest`;
  - Chat as a guest with phone `"0"` calls `setLoginOpen(true)`; with a phone on record but no chat user → `setShouldAuthinticated("open chat")`;
  - with `loginOpen` true the bar is hidden; with `chatVar` true the bar shows and Chat is lit (Review Focus 4);
  - on `sy-ar` the bar's root has `dir="rtl"`.
  
  In `tests/app/layout.test.tsx`: the layout renders `AppShell` once, and the page's `children` are not inside a `Suspense` added by it.
- [ ] **Step 2: Run** `pnpm vitest run --project unit tests/components/DemoApp1/AppShell.test.tsx tests/app/layout.test.tsx` — expect FAIL.
- [ ] **Step 3: Implement** `AppShell`, `openChatFromTab`, the search request (`SearchIcon` runs `setSearchEnabled(true)` when `openSearchRequest` changes, skipping the first value), and the layout mount.
- [ ] **Step 4: Run** the same command, then `pnpm test:run` — expect PASS.
- [ ] **Step 5: Commit** `feat(shell): new bottom nav on every page (S3-1, S3-5, S3-10)`.

### Task 5: Old bottom bars and overlays make room for the bar (S3-6)

**Files:**
- Modify: `components/Cart/AddToCart/AddToCartComponent.tsx:843` (`bottom-0` → `bottom: var(--app-bar-room, 0px)`)
- Modify: `components/ListingPage/filterComponents/FiltersWindow/FiltersButton.tsx:21` (its `bottom-[…]` plus the room)
- Modify: `components/Chat/ChatModal.tsx` (root height leaves the room at the bottom, so the composer sits above the bar)
- Modify: `components/Home/Search/SearchIcon.tsx:896` (`bottom-[40px]` plus the room)
- Test: `tests/components/shell/bottomRoom.test.tsx`

Before Step 1, grep once more for `fixed` + `bottom` in `components/` and `app/` and list every match in the commit message as "raised" or "covers the bar" (an overlay that hides the bar under Task 4's list). Any match that fits neither: stop and ask the owner.

- [ ] **Step 1: Write the failing tests:** render each of the four with `--app-bar-room` set on `<html>`; assert its fixed bottom offset uses `var(--app-bar-room` (read from the inline style or class), one `it` per component, the message naming the component.
- [ ] **Step 2: Run** `pnpm vitest run --project unit tests/components/shell/bottomRoom.test.tsx` — expect FAIL.
- [ ] **Step 3: Implement.** With no bar the variable is unset, so the fallback `0px` keeps today's place.
- [ ] **Step 4: Run** it and the existing tests of these components — expect PASS.
- [ ] **Step 5: Commit** `feat(shell): old bottom bars sit above the new bar`.

### Task 6: The cart page `/[lang]/cart` (D-18, S3-7)

**Files:**
- Create: `app/(client)/[lang]/cart/page.tsx` (`metadata.robots = { index: false, follow: false }`; renders `<CartPage />`)
- Create: `components/Cart/CartPage.tsx`
- Modify: `components/Cart/CartProvider.tsx` (`StepSlider` lines 249-306; `?cart` effect lines 162-165; `popstate` lines 86-150; render line 216)
- Modify: `utils/tinyUtils.tsx:442` (`DetectScreen`)
- Test: `tests/components/Cart/CartPage.test.tsx`, `tests/components/Cart/CartProvider.test.tsx` (extend), `tests/utils/tinyUtils.test.ts` (extend)

**Interfaces:**
- Produces:
  - `CartSteps({ layout }: { layout: "page" })` — `StepSlider`'s two steps (`CartContainer` → `OrdersPage`), with the same `handleToOrders` (the `SCREEN_VIEW` `CHECKOUT_SCREEN`, `BEGIN_CHECKOUT`, `startOrderAttempt`, `trackOrder` calls stay byte for byte). On the page it is not `fixed` and not full-screen, and it has no `SearchParamUpdater`.
  - `CartPage()` — sets `cart_enable` true on mount and false on unmount; its `close` leaves the page: `router.back()` when the history has an entry from this site, else `router.replace(tabHref(locale, "home"))`.
  - The bridge inside `CartProvider`: `cart_enable` becomes true while not on `/[lang]/cart` → `router.push(tabHref(locale, "cart"))`; becomes false while on it → the same leave as `close`. `?cart` (any value) on any page → `router.replace("/[lang]/cart")`. The drawer (`StepSlider` overlay) is no longer rendered. `cart_enable` and `"cart"` leave the `popstate` popup lists.
  - `DetectScreen()`: a path whose part after the locale is `cart` → `GA_GLOBAL_SCREEN.CART_SCREEN`, as `?cart=true` did.

- [ ] **Step 1: Write the failing tests:**
  - `CartProvider`: `enableCart(true)` on `/sy-en/products/x` pushes `/sy-en/cart` and renders no `.cart-provider` drawer; `/sy-en?cart=true` replaces to `/sy-en/cart`; a `popstate` on `/sy-en/cart` calls no `router.push` (Review Focus 3).
  - `CartPage`: renders the cart step; "to orders" fires `SCREEN_VIEW` with `CHECKOUT_SCREEN` and `BEGIN_CHECKOUT` (GA mock), each a separate `it`; `enableCart(false)` while mounted calls `router.back()` (Review Focus 2); with no site history it calls `router.replace("/sy-en")`.
  - `DetectScreen` on `/sy-en/cart` returns `CART_SCREEN`.
- [ ] **Step 2: Run** `pnpm vitest run --project unit tests/components/Cart/CartPage.test.tsx tests/components/Cart/CartProvider.test.tsx tests/utils/tinyUtils.test.ts` — expect FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** the same, then `pnpm test:run` — expect PASS. The checkout tests (`rdbPayment`, `RdbPaymentModal`, `RdbPaymentLockedSheet`, `OrderButton`) must stay green.
- [ ] **Step 5: Commit** `feat(cart): the cart and its checkout live on /[lang]/cart`.

### Task 7: E2E — the shell journeys before the merge

**Files:**
- Create: `tests/e2e/shell.scripted.spec.ts` (closed-network style of `checkout.scripted.spec.ts`; the model for steps is `tests/e2e/profile.live.spec.ts`)
- Modify: `tests/e2e/laneConfig.ts` (add the spec to the solo lane)
- Modify: `tests/e2e/selectors.ts` (`shell.tab(page, tab)` → `[data-pw="demo-tab-${tab}"]`, `shell.bar(page)`)
- Modify: `tests/e2e/actions/cart.ts` (`openCart` presses the cart tab, then waits for `/[lang]/cart`)

Cases, each a `test.step` per move, with a message that names the step: SHELL-01 tab moves (Home → Profile → Home lights the right tab, URL `/sy-en/settings` then `/sy-en`); SHELL-02 browser back from `/sy-en/settings` returns to `/sy-en` with Home lit; SHELL-03 deep link + reload of `/sy-en/cart` keeps the cart page and Cart lit; SHELL-04 a product page from home and back (no tab lit on the product, Home lit after back, the page scroll is the browser's); SHELL-05 `/sy-en?cart=true` lands on `/sy-en/cart`; SHELL-06 the add-to-cart sheet's bottom edge is above the bar's top edge (bounding boxes); SHELL-07 a guest's chat tab opens the login, not the chat.

- [ ] **Step 1:** write the spec; run `pnpm e2e:health`, then `pnpm test:e2e:scripted -- shell.scripted` on a build of this branch — expect every case to pass. Then run it against a build of `ui-migrations` (no shell) and see it red on SHELL-01 (no bar): this proves it can see the shell.
- [ ] **Step 2:** run `pnpm test:e2e:live -- shopper.live` once (BUY-01..07 use `openCart`), one run at a time (A-6). A red case that names the cart page is this task's to fix; a backend fault stays red and named.
- [ ] **Step 3: Commit** `test(e2e): shell journeys SHELL-01..07`.

### Task 8: LCP of the home page, before and after

**Files:**
- Modify: `UI-MIGRATION-PLAN.md` (Stage 3 section only, A-18 rule 4) — add the numbers.

- [ ] **Step 1:** `pnpm build && pnpm start` on `ui-migrations` (in this worktree, checked out at the merge base); measure `/sy-en` LCP 5 times with Playwright's `PerformanceObserver` at 440 x 802. Then the same on `ui-migrations-shell`. Record median and max of each.
- [ ] **Step 2:** if the median got slower by more than 100 ms, stop and tell the owner with the numbers. Otherwise write them into the plan.
- [ ] **Step 3: Commit** `docs: Stage 3 home LCP, before and after the shell`.

### Task 9: After Stage 2 merges — the old top nav goes (S3-4, S3-9)

Start only when the owner says Stage 2 is merged into `ui-migrations`.

**Files:**
- Merge: `git merge ui-migrations` into `ui-migrations-shell`.
- Modify: `app/(client)/[lang]/layout.tsx` (remove the `.home-navbar` strip: the logo link and `<AuthNavContainer />`)
- Delete (only if `pnpm knip` and grep show no other user, D-6): `components/Home/AuthNavContainer.tsx`, `AuthNavSkeleton.tsx`, `AuthNavSection.tsx`, `UserNavTopSection.tsx`, and their tests.
- Modify: `components/DemoApp1/openChatFromTab.ts` (the login step navigates to `loginHref(lang, next)` from Stage 2's `utils/loginPath.ts`, with `next` = the current path)
- Modify: `tests/e2e/actions/nav.ts` (`gotoHome` waits for `shell.bar` instead of `nav.logo`), `tests/e2e/selectors.ts` (drop `nav.logo`, `nav.cartButton`), every helper that used them.
- Modify: `tests/e2e/shell.scripted.spec.ts` (add SHELL-08: no bar on `/sy-en/login`).

- [ ] **Step 1:** merge; run `pnpm lint`, `pnpm lint:i18n-parity`, `tsc`, `pnpm test:run` — fix only merge faults.
- [ ] **Step 2:** write SHELL-08 and a unit case in `tests/app/layout.test.tsx` ("the layout draws no `.home-navbar`"); run both — expect FAIL.
- [ ] **Step 3:** remove the strip; delete the unused files; move the e2e helpers.
- [ ] **Step 4:** run the unit suite, `pnpm knip`, the shell spec, then the full browser suite once (`gh workflow run E2E --ref ui-migrations-shell`, one run at a time). Every red case names its cause in the report.
- [ ] **Step 5: Commit** `feat(shell): the old top nav goes (S3-4, S3-9)`.

### Stage 3 end checks

`pnpm lint`, `pnpm lint:i18n-parity`, typecheck (`next typegen` + `tsc`), `pnpm test:run`, the shell spec, the XD check in `ar` and `en` at 440 x 802, then the owner's review. Then `ui-migrations-shell` merges into `ui-migrations` (A-18 rule 5).
