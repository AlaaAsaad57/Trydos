# Trydos — Where We Are & What's Left

**Prepared for:** Product Management
**Date:** 2026-07-06
**Basis:** `develop` branch — compiled from the feature documentation (`docs/features/`) and verified directly against the current codebase (not from memory). Eight parallel code audits fed this report: an unfinished-feature inventory, a hardcoded-values/placeholder scan, a wallet/banking deep-dive, a pre-launch readiness check, plus deeper digs into Chat & Calls, Stories, Cart/Checkout/Orders, and every privacy/legal control.

---

## 1. Executive summary

Trydos is a **broad, largely-shipped storefront**. Of ~199 catalogued features across 9 domains, the vast majority are live: the full shopping/browse experience, search (text/voice/image), cart→checkout→order lifecycle, returns, real-time chat + voice/video calls, stories, notifications, and the seller dashboard are all functional today.

The gaps that matter are concentrated in a few areas, and they are mostly **"finish and wire up," not "build from scratch":**

- **✅ The wallet-payment secret-leak bug is now fixed** — the checkout flow no longer returns or logs payment credentials (code applied this pass). One **ops** step remains: rotate the merchant API key and purge any tokens from existing logs. Details in §3.
- **The wallet/banking domain is the biggest functional hole** — everything beyond "view your balance" depends on an external package (`rdb`) that isn't installed yet and is owned by an outside developer. See §4.
- **Legal/compliance content and links are placeholder-grade** — Privacy/Terms/About/Contact pages exist but are boilerplate, their links are dead, and there is no cookie-consent banner. See §5.
- **A handful of user-facing numbers are hardcoded fakes** — return windows, refund timers, and refund amounts show fixed values that don't reflect reality. See §6.
- **Two go-live switches are off by design** — search-engine indexing is gated behind an env flag, and PostHog session replay is paused for cost. See §5.

The deeper second-pass digs (Chat, Stories, Orders, Privacy) surfaced issues the first-pass "fully live" labels had hidden — most importantly:

- **Two silent data-quality bugs write bad data on real orders:** every order is submitted with the literal placeholder note *"order note"*, and every saved address gets a fake ZIP code *"123123"*. See §6/§8.
- **Chat "Edit message" is a complete UI that saves nothing** — plus several inert chat menu items (Category, Reminder, Archive). The domain is not "25/25 live" at the UI level. See §8.
- **A failed "change item variant" shows the shopper a success screen** (the error is swallowed). See §8.
- **In-app story video recording likely fails on iPhone/iPad** (hardcoded `webm` format iOS Safari rejects). See §8.

Nothing above is a surprise or a regression on the shipped happy-paths — most are interim states, dead affordances, or debug leftovers. This report turns them into a prioritized to-do list.

### Status at a glance

| Domain | Features | Health |
|--------|:--------:|--------|
| A · Shopping & Discovery | 33 | Core live; 4 partial (SD-17, SD-24, SD-27, SD-33) |
| B · Cart, Checkout & Orders | 28 | Full lifecycle live; 3 partial (CO-17, CO-18, CO-28) |
| C · Payments, Wallet & Banking | 6 | ⚠️ Mostly blocked on external package (secret-leak bug now fixed) |
| D · Accounts & Auth | 30 | Live; legal/consent placeholders (AC-06, AC-27–30), QR login stub (AC-09) |
| E · Chat & Calls | 25 | Core messaging/calls live, BUT "Edit message" is a non-saving stub + 3 inert menu items (§8) |
| F · Stories | 7 | Live, but iOS video-capture likely broken + a PII fallback + dead analytics (§8) |
| G · Notifications | 10 | ✅ Fully live |
| H · Seller Dashboard | 14 | Live; SL-04 product editor is interim (AI redesign planned) |
| I · Platform & Foundations | 46 | Live; no GDPR/cookie banner (PF-43); indexing gated off |

---

## 2. Prioritized "what to do next"

Ordered by urgency. P1 blocks any public launch; P2 is finish-work; P3 is planned/roadmap. *(The original P0 — the wallet secret-leak — was fixed this pass; see §3. Its one remaining ops task, key rotation, is listed first below.)*

| # | Priority | Item | Why it matters |
|---|----------|------|----------------|
| 1 | 🟠 **P1 (ops)** | Rotate the wallet merchant API key + purge wallet tokens from existing logs | Closes the credentials that already leaked before the code fix (§3) |
| 2 | 🟠 **P1** | Real Privacy/Terms/About/Contact copy + wire the dead links | No readable legal policy is reachable by users today (§5) |
| 3 | 🟠 **P1** | Add a cookie-consent / GDPR banner | None exists — compliance risk, esp. EU-facing (§5) |
| 4 | 🟠 **P1** | Set `NEXT_PUBLIC_ALLOW_INDEXING=true` + `NEXT_PUBLIC_SITE_URL` in prod | Site is currently invisible to search engines; defaults to a dev URL (§5) |
| 5 | 🟠 **P1** | Remove/gate the dev-only routes (`api-test`, `simulateUser`) | Developer tools shipped as live routes (§6) |
| 6 | 🟠 **P1** | Fix the two silent order-data bugs: hardcoded note *"order note"* + fake ZIP *"123123"* on every address | Every order & address is persisted with garbage data — hurts fulfilment/shipping (§8) |
| 7 | 🟠 **P1** | Fix "change item variant" showing false success on failure | Shopper thinks a change succeeded when it didn't (§8) |
| 8 | 🟡 **P2** | Replace hardcoded refund/return/cancel timers & amounts with real values | Shoppers see fake "3 H", "12 Hours", "3 USD", "25 USD", "25%" (§6) |
| 9 | 🟡 **P2** | Send cancel reasons (CO-17/CO-18) to the backend | Business currently has zero visibility into why orders are cancelled (§4) |
| 10 | 🟡 **P2** | Decide fate of Chat "Edit message" stub + 3 inert menu items (Category/Reminder/Archive) | Shipped controls that do nothing (§8) |
| 11 | 🟡 **P2** | Verify/fix iOS story video capture (hardcoded `webm`) + phone-number PII fallback in story titles | Likely broken on iPhone; can leak a user's phone number (§8) |
| 12 | 🟡 **P2** | Hide or finish the broken stubs users can reach: Bank Cards (PW-05), QR login (AC-09), Virtual try-on (SD-24) | Each presents a broken/blank experience today (§4) |
| 13 | 🟡 **P2** | Add double-submit guards on the two cancel dialogs; stop silent error-swallowing (fetchOrders, wallet balance) | Duplicate cancels / silently blank data (§8) |
| 14 | 🔵 **P3** | Integrate the external `rdb` wallet/banking package when delivered | Deposits, cards, transfers, full bank — blocked on outside dev (§4) |
| 15 | 🔵 **P3** | AI-driven product editor to replace SL-04; real size-guide (SD-27); virtual try-on engine (SD-24) | Planned enhancements, not blockers |

---

## 3. ✅ Wallet payment secret-leak — FIXED this pass

**What it was:** leftover debug code in the pay-with-wallet checkout path exposed payment credentials (the user's wallet **Bearer token** and the **merchant API key**) two ways — a browser popup on payment failure, and a full-headers `console.log` into server logs on every attempt. Root cause: the server action used a debug-shaped failure return (carrying the request headers) and the client `alert()`'d it.

**What was changed (code applied to the working tree):**
- `services/wallet/index.ts` — removed the `console.log` of headers/token/signature, and the failure branch now returns a safe sentinel `{ paymentFailed: true }` instead of the signed request object.
- `components/Cart/WalletPaymentModal.tsx` — removed the `alert(JSON.stringify(result))` popup and switched the success/failure check to the `paymentFailed` flag (from the fragile `result.url` signal); failures now show a plain error toast.

The change is behaviour-preserving on the happy path (successful payment still polls to order conversion) and needs to be reviewed, committed, and deployed.

**⚠️ Still required (ops, not code):** **rotate the wallet merchant API key** and treat any wallet tokens that appeared in existing server logs as compromised (purge/rotate). The code fix stops *future* leaks; rotation closes what already leaked. Tracked as item #1 in §2.

> Note: the good news is that the previously-flagged **hardcoded GitLab token in `package.json` is gone** — the `rdb` git dependency was removed entirely, so that leaked secret is no longer in the manifest. (The CLAUDE.md note warning about it is now stale and should be updated. Confirm with the team that the old token was rotated on GitLab.)

---

## 4. Wallet, Payments & Banking (Domain C) — the biggest functional hole

This domain is a **thin Trydos layer over a separate external wallet service**, plus a planned rich-banking widget (`rdb`) that **is not installed** and is **still being built by an outside developer**. Treat the whole domain as subject to change until that integration lands.

### What works today
| Capability | Status |
|---|---|
| Auto-create a wallet on login | 🟢 Live |
| Show wallet balance in local currency (settings "RDB Wallet" card) | 🟢 Live |
| Wallet transaction history (statement) | 🟢 Live (from the legacy backend, not the external wallet) |
| Pay an order from wallet balance | 🟡 Happy-path works, but the checkout modal is an explicit **dummy test widget**, not the final UI |

### What is not available in-app
| Feature | Status | Reality |
|---|---|---|
| **PW-02 Add funds / deposit** | ⚪ Removed | Interim deposit UI was deleted; helper code remains but has no callers (orphaned — clean up) |
| **PW-05 Bank Cards** | ⚪ Empty shell | Route is reachable from the menu but renders a blank page with just a back bar |
| **PW-06 Full digital bank** (accounts/cards/transfers/send-money) | ⚪ Not wired in | Shows hardcoded **"Under Development"**; the `<RDB />` widget and its server-action bridge (`services/RDB/*`) are entirely commented out |

**Key facts for planning:**
- The `rdb` package **does not appear in `package.json`** and isn't installed. All its integration code is commented out — it's disabled *by commenting source*, not by a feature flag.
- A token handoff (`/api/auth/wallet-token`) is **pre-built and ready** to feed the external widget when it arrives — the plumbing exists, the widget doesn't.
- **Blocked on the external RDB developer** to deliver and publish the package. Until then: no in-app deposits, no cards, no transfers, no full bank.

**To reach launch-ready (wallet):**
1. ✅ Secret-leak bug fixed this pass (§3); still **rotate the merchant API key** and purge any wallet tokens from existing logs (ops).
2. Product decision: keep the dummy pay-with-wallet modal, or swap in the real external widget / pending design.
3. Allow a failed payment to be retried without reopening the modal (current guard blocks retry).
4. When `rdb` is delivered: install it, un-comment and wire the widget + bridge, gate it behind a **real feature flag** (not commented code), and verify the token handoff.
5. Hide the empty Bank Cards screen (PW-05) until it's real, and clean up the orphaned deposit helpers.

> **Related payment note (CO-12):** the external card/crypto gateway works on the happy path, but **card payment is not fully active** (depends on backend data that was never fully wired), and its "payment finished" detection relies on a fragile browser message with no fallback. Harden before relying on card payments.

---

## 5. Pre-launch checklist (Legal · SEO · Analytics · Security · Auth)

Every item below is verified against code, not just the docs.

### Legal / consent — 🟠 must fix
- The four trust pages (**Privacy Policy, Terms, About, Contact**) exist as real routes but hold only **thin boilerplate** copy (~70–90 words each: one intro + two short sections) and share one layout component. They are reachable **only by typing the URL or arriving from search** — nothing in the app links to them.
- **Every in-app path to them is dead** (full control-by-control audit in §8):
  - Signup consent gate: "Terms Of Services" is an empty handler (`PrivacyConfirm.tsx:56`) and there is **no Privacy link at all**.
  - Settings menu: "Terms & Conditions" and "Contact Us" are **commented out**; "About Us" and "Legal Information" are dead `href="#"` (`settings/page.tsx:60-79`).
- **Consent is not persisted server-side** — "Agree & Continue" only fires a PostHog `terms_accepted` analytics event; there is no server record that the user consented (weak compliance evidence). `PrivacyConfirm.tsx:62-116`.
- **No cookie-consent / GDPR banner exists** anywhere in the codebase (PF-43), while GA + PostHog tracking runs.
- **Do before go-live:** write real, counsel-reviewed legal/About/Contact copy; wire all the dead links (consent gate + settings); add a cookie-consent banner (or obtain a documented legal exemption); consider recording consent server-side.

### SEO — 🟠 must fix (currently gated OFF)
- **`NEXT_PUBLIC_ALLOW_INDEXING`** must be set to exactly `"true"` in production or the entire site is blocked from search engines (`robots.ts` disallows `/`, every page emits `noindex`).
- **`NEXT_PUBLIC_SITE_URL`** must be set to the production origin — if unset it **defaults to `https://dev.trydos.com`**, which would leak dev URLs into sitemaps and canonical tags.
- **Do before go-live:** set both env vars in the production environment only.

### Analytics — 🟡 confirm
- **PostHog session replay is intentionally paused** to cut cost (`utils/posthog.ts:72`); autocapture, pageviews, events and error capture still flow. PostHog only runs in production.
- **GA4 is present** (`utils/gtag.ts`) and needs `NEXT_PUBLIC_GA_MEASUREMENT_ID` set in production.
- **Decision needed:** keep replay off (cost) or re-enable it; confirm the GA measurement ID is set.

### Security — 🟡 mostly resolved
- The **wallet secret-leak bug (§3) is fixed in code**; the one remaining security task is the **merchant API key rotation** (ops).
- The old **hardcoded GitLab token is gone** from `package.json`. Update the stale CLAUDE.md warning; confirm the old token was rotated.

### Auth — 🟡 confirm (product decision)
- **Login is phone-number + OTP only** — no passwords, no email login, no Google/Apple/Facebook. Verified in code.
- **Confirm:** the PM accepts that account recovery depends entirely on SMS/WhatsApp access to the registered number — there is no other fallback.

---

## 6. Hardcoded values, placeholders & dev leftovers

Code-verified list of fake/hardcoded values and unfinished stubs users can hit.

### Hardcoded user-facing copy & amounts (should be dynamic)
| Where | What's hardcoded |
|-------|------------------|
| `components/setting/orders/OrderItemOptions.tsx:277` | "Cancel This Product In **3 Hours**…" — cancel window, not from backend policy |
| `components/setting/orders/OrderItemOptions.tsx:329` | "Return This Product In **24 Hours**…" — return window |
| 3 order-confirmation dialogs (`CancelOrderItemConfirmationWindow.tsx:69`, `OrderItemReturnConfirmationWindow.tsx:198`, `OrderCancelConfirmationWindow.tsx:67`) | "You Will Receive Your Refund Within **12 Hours**" — repeated fixed SLA |
| `components/Orders/OrderRetailsReturnInfo.tsx:254` | "Cancel Return Request & Get **3 USD**" — fixed refund amount/currency (CO-28) |
| `components/products/ExpectedDeleiveryModal.tsx:259` | "You Will Get **25 USD** To Your Wallet Automatically" — late-delivery comp figure |
| `serverRequests/meta/StructuredData/utils.ts:44-57` | Currency hardcoded to USD for `gb` + all unmapped countries (affects SEO pricing data) |

> These need a **product decision on the real policies** (return window, refund SLA, compensation), then wiring to backend values — or rewording if the numbers aren't real commitments.

### Dead / inert links (`href="#"` or empty handlers)
- Order/address confirmation "terms" links go nowhere: `ConfirmAddressModal.tsx:325`, and four confirmation windows (`OrderItemReturnConfirmationWindow.tsx:226`, `OrderCancelConfirmationWindow.tsx:93`, `ChangeOrderItemConfirmWindow.tsx:186`, `CancelOrderItemConfirmationWindow.tsx:95`).
- Empty click handlers: `components/Login/PrivacyConfirm.tsx:56` (the consent Terms link), `ProductStories.tsx:106`, `Chat/components/OptionsMenu.tsx:146`.

### Stubs & dev-only routes shipped live (🟠 gate/remove before launch)
- **`app/(client)/api-test/`** — a raw API-testing playground (request URL/headers/body inputs). Should not be a live route.
- **`app/simulateUser/`** (+ `app/api/auth/simulate/route.ts`) — user-impersonation dev tool. Verify it's access-restricted or remove.
- **Search blacklist is a stub** — `services/elastic/helpers.ts:2820` hardcodes `isBlacklisted = false`; no blacklist filtering actually happens.

### Misleading "mock/dummy" comments that are actually real code (no action, just awareness)
- `services/sellerDashboard/index.ts:729` "dummy implementation" — the Excel upload below it is real.
- `components/settings/UploadProfilePhoto.tsx:148` "TODO: Upload file to server" — the real upload is already called.
- `services/orders.ts:32`, `services/notifications.ts:26,46` "fallback to mock data" — there is **no** fallback; on API failure the UI silently gets nothing. Worth cleaning the comments so nobody assumes a safety net exists.

---

## 7. Unfinished features by domain (the 🟡/🟢 detail)

Everything not fully live, with what's missing. Domains E (Chat), F (Stories), G (Notifications) have **no gaps** — all live.

### A · Shopping & Discovery
- **SD-17 Boutique storefront** 🟡 — banner/logo/name/share work; the "verified / top-seller" trust badges are fake (hardcoded, not from shop data). *Fix: drive badges from real data or remove.*
- **SD-24 Virtual try-on** 🟡 (effectively a stub) — capture/upload works, but after a fake 3s spinner it just returns the shopper's own photo unchanged. No AI/backend. *Fix: build the real try-on engine (locked design = on-device 3D AR); hide the badge until then.*
- **SD-27 Specs & size guide** 🟡 — quality/rating/size-fit is live; the actual measurement/size-conversion chart doesn't exist and the IN/CM & EU/US/UK toggles are decorative. *Fix: build a real size chart or remove the toggles.*
- **SD-33 "Luck" rewards** 🟡 — countdown/claim work, but timer length (~50s) is hardcoded, the one-time limit is enforced only by a clearable cookie, and two timer implementations still coexist mid-migration. *Fix: move duration + one-time enforcement to the backend; finish the consolidation.*

### B · Cart, Checkout & Orders
- **CO-17 Cancel whole order** 🟡 — works, but the **cancel reason is never sent to the backend** (analytics only); plus a dead terms link and hardcoded English reason strings.
- **CO-18 Cancel single item** 🟡 — full + partial cancel work with correct math; same gap — **cancel reason not persisted.**
- **CO-28 Manage a return** 🟡 — real actions (confirm/track/cancel) are wired, but the tracking timeline shows **fake hardcoded "3 H" steps and a flat "3 USD" refund** regardless of the real amount/currency.

### C · Payments, Wallet & Banking
See §4 — PW-01 🟡, PW-02 ⚪, PW-04 🟡 (secret-leak now fixed, §3), PW-05 ⚪, PW-06 ⚪.

### D · Accounts & Auth
- **AC-06 Consent gate** 🟡 — works, but dead Terms link, no Privacy link (see §5).
- **AC-09 QR-code login** ⚪ — shows only a sample QR; doesn't log anyone in. *Fix: build the real web↔mobile handshake, or hide it.*
- **AC-27–30 Privacy/Terms/About/Contact** ⚪ — boilerplate pages, unlinked (see §5).

### H · Seller Dashboard
- **SL-04 Product editing** 🟡 (interim) — **fully functional today** (loads & saves real data); flagged only because it's slated for replacement by a planned AI-driven editor that extracts product info from images. Not broken.

### I · Platform & Foundations
- **PF-43 Cookie-consent / GDPR banner** ⚪ — not present (see §5).

---

## 8. Deep-dig findings (Chat, Stories, Orders, Privacy)

A second, deeper pass on the domains the first-pass index called "fully live." These are code-verified with `file:line`. Severity key: 🔴 launch-blocker · 🟠 finish-work · ⚪ cosmetic/awareness.

### 8a. Chat & Calls (Domain E) — "25/25 live" is overstated at the UI level

> No feature docs exist for this domain yet (`docs/features/` has no `E-*`/`CH-*` files), so the "fully live" claim was undocumented. Core messaging, calls, block/unblock, media, contacts, typing/last-seen, product-sharing and Agora voice/video are genuinely wired — but several visible controls do nothing:

| Sev | Where | Finding |
|-----|-------|---------|
| 🟠 | `components/Chat/components/OptionsMenu.tsx:146` (dialog 85-171, menu 266-277) | **"Edit message" is a complete UI that saves nothing** — textarea + Save button whose handler is `onClick={() => {}}`. No edit service/store action exists anywhere. Looks shipped; does nothing. |
| 🟠 | `OptionsMenu.tsx:250-255` | **"Category" message option is inert** — icon + translated label, no handler. |
| 🟠 | `OptionsMenu.tsx:278-281` | **"Reminder" message option is inert** — icon + translated label, no handler. |
| 🟠 | `components/Chat/components/ChatOptions.tsx:70-73` | **"Archive" chat option is inert** — no handler, while its siblings (Unread/Pin/Mute/Delete) all work. |
| ⚪ | `components/Chat/components/ChatInfo.tsx:304-320` | "Save To Gallery / Never" auto-download row is decorative — no handler. |
| ⚪ | `ChatVideoCall.tsx:32`, `ChatVoiceCall.tsx:27`, `WebViewVideoCall.tsx:25` | **Agora App ID hardcoded** in 3 files. Not a secret (the per-call token is fetched server-side, correctly), but it can't be rotated or vary by environment — should be an env var. |
| ⚪ | `components/callDurationConstants.ts:1-2` | **Call limits hardcoded:** every call force-ends at 10 min with a 5-min warning; unanswered calls auto-cancel at 60s. Product decision baked in — not tunable without a deploy. |
| 🟠 | `services/chat.ts:84,177`, `store/chat/callActions.ts:285` | **Tokens in `localStorage`** (`ID-TOKEN`, `firebase_id`, `FB-DEVICE-TOKEN`) — violates the project's "JWTs only in HttpOnly cookies" policy. These are OTP/device/Firebase identifiers, not the main session JWT, but are readable by any script on the page. Worth a security review. |
| ⚪ | `SearchResult.tsx:82` | Native `alert("Link copied…")` instead of the app's toast used everywhere else. |

### 8b. Stories (Domain F) — solid, but a likely iOS break + a privacy fallback

> The add-story camera capture is **real and working** (photo + video, front/rear flip, 59s cap); delete/report hit real endpoints. The gaps:

| Sev | Where | Finding |
|-----|-------|---------|
| 🟠 | `components/Home/Stories/CameraStory.tsx:91` | **In-app video recording likely fails on iOS Safari** — hardcoded `mimeType: "video/webm"`, which iPhone/iPad reject (they need `video/mp4`); no `isTypeSupported` guard/fallback. Photo + gallery upload unaffected. **Verify on a real iOS device** — potential launch-blocker for iOS story video. |
| 🟠 | `CameraStory.tsx:113` | **Recording stopwatch never stops** — code calls `stop()` which doesn't exist on the timer, so it resolves to the browser's `window.stop()`. Timer keeps ticking in the background (should be `pause()`/`reset()`). |
| 🟠 | `services/story.ts:275,305`, `StoryElement.tsx:30,55` | **Phone-number PII fallback** — a story's title is `name ?? mobile_phone ?? "Unknown"`, so an author with no display name has **their phone number shown as the story title** to all viewers. Replace with a non-PII default. |
| 🟠 | `AddStoryWidget.tsx` (6 blocks: 244, 436-439, 447-450, 456-459, 489-492, 623-626) | The entire **GA click-funnel for add-story is commented out** (PostHog `STORY_UPLOADED` still fires). Decide: restore or delete the dead blocks. |
| ⚪ | `StoryViewer.tsx:69,116-145` → `StoryHolder.tsx:184` | **Per-story view-time tracking is computed then discarded** — the consumer renders `<StoryViewer>` without wiring `onStoryViewTime`, so it only reaches a `console.log`. Wire it to analytics or remove. |
| ⚪ | `AddStoryWidget.tsx:441` / `ProductStories.tsx:106` | Stale `// TODO: Integrate camera` comment (camera actually works) and an inert outer-div `onClick={() => {}}` (real handler is on the child). Cosmetic. |
| ⚪ | `StoryHolder.tsx:34`, `StoryViewer.tsx:139` | Debug `console.log`s left in production paths (one dumps the user object every render). |

### 8c. Cart, Checkout & Orders (Domain B) — new data-quality & silent-failure bugs

> Beyond the known hardcoded copy (§6) and unsent cancel reasons (§4), the deeper pass found data being persisted wrong and failures being hidden:

| Sev | Where | Finding |
|-----|-------|---------|
| 🟠 | `services/order.ts:77` | **Every order is submitted with the literal note "order note"** — the checkout URL hardcodes `?order_note=order note`. There's no UI to enter a real note, so the field is permanently garbage. |
| 🟠 | `services/order.ts:261,315` | **Every saved address gets a fake ZIP "123123"** (and city/province default to the literal `"Not Entered"`). Real postal code is never captured — hurts shipping/label accuracy. |
| 🟠 | `services/order.ts:569-599` → `ChangeOrderItemConfirmWindow` (ConfirmChange 44-70) | **Failed "change item variant" shows success** — this method swallows its error and returns `undefined` (unlike every sibling that throws); the caller doesn't check the result, closes the modal, refreshes, and fires a success analytics event regardless. |
| 🟠 | `services/orders.ts:27-34` | `fetchOrders` **silently swallows errors** and returns `undefined`; the "fallback to mock data" comment is false — there is no fallback. On any API failure the order list is just blank. |
| 🟠 | `services/order.ts:160` | `GetWalletBalanceToShow` has an **empty catch** — wallet balance can silently render as 0/blank at payment selection with no log/report. |
| 🟠 | `OrderCancelConfirmationWindow.tsx:100-108`, `CancelOrderItemConfirmationWindow.tsx:102-109` | **Double-submit risk on cancel dialogs** — confirm button guards only `if (!agree)`, not `loading`, so a fast double-tap can fire the cancel twice (siblings guard on `loading`). |
| 🟠 | `OrderItemReturnConfirmationWindow.tsx:38-44` | **Possible wrong refund amount shown** — divides `offer_price` by quantity assuming it's a line total, but elsewhere `offer_price` is used as a per-unit price. If it's already per-unit, the displayed return subtotal is understated. Needs a data-shape check. |
| ⚪ | `ExpectedDeleiveryModal.tsx:220,174` | New hardcodes beside the known "25 USD": a fixed **"25%" delayed-shipping refund** and a hardcoded shipping-company name "trydos". |
| ⚪ | `CancelOrderWrapper.tsx:99-103`, `CancelOrderItemWrapper.tsx:112-117` | Inert "We Have Other Solutions Instead Of Cancellation" bar and "Learn More Tips" link — styled like buttons, no handlers. |
| ⚪ | `PaymentMethod.tsx:294-296` | CO-10: when no payment methods load, a literal **"0"** renders on screen (`&& length &&` bug). |
| ⚪ | `services/order.ts:816` | `ReturnProduct` throws `new Error(error)` on an Error object → `[object Object]`-style message, degrading Sentry signal. |

### 8d. Privacy / legal controls — full audit

Every privacy/terms/consent control in the app and whether it actually works:

| Control (file:line) | Actual behavior |
|---------------------|-----------------|
| Consent gate "Terms Of Services" — `PrivacyConfirm.tsx:53-60` | **Dead** — empty `onClick`. Target page (`/terms-of-service`) exists but isn't linked. |
| Consent gate Privacy link | **Missing entirely** — no Privacy link on the signup gate. |
| Consent gate "Agree & Continue" — `PrivacyConfirm.tsx:62-116` | Works flow-wise, but **consent is only a GA event, not persisted server-side**. |
| Settings "Terms & Conditions" — `settings/page.tsx:60-64` | **Commented out** (never rendered); target exists. |
| Settings "Legal Information" — `settings/page.tsx:65-69` | **Dead `href="#"`.** |
| Settings "Contact Us" — `settings/page.tsx:70-74` | **Commented out** (never rendered); target exists. |
| Settings "About Us" — `settings/page.tsx:75-79` | **Dead `href="#"`** — doesn't even point at the existing `/about`. |
| `/privacy-policy`, `/terms-of-service`, `/about`, `/contact` pages | Real routes, indexable, in sitemap — but **boilerplate placeholder text** (~70–90 words each). |
| Cookie-consent / GDPR banner | **Does not exist** anywhere in the codebase. |

**Net:** a real user cannot tap through to any legal page from inside the app; the pages that do exist hold placeholder text; and there is no cookie banner. All of this is content + wiring (the routes and layout already exist), plus a legal-copy dependency.

---

## 9. Notes on scope & method

- This report reflects `develop` as of 2026-07-06, verified against source. Re-run the audit after major merges to keep it current.
- Full per-feature detail lives in `docs/features/<domain>/<ID>-*.md`; the master index is `docs/features/README.md`.
- "Hardcoded" here means a fixed value in code where a real/dynamic value is expected — not the normal form placeholders (e.g. "John Doe" hint text), which are fine.
