# Trydos — Feature Summary at a Glance

**Source:** distilled from [`docs/features/README.md`](README.md) (full 200-feature inventory).
**Last updated:** 2026-07-08 · reflects the `develop` branch.

Three buckets only: **what's done**, **what's left to do**, **what's a placeholder to fill**.

## 📊 Completion by domain

**% complete = (🟢 Live + 🔧 Internal) ÷ Total** — a feature counts only when it is fully done.
Anything 🟡 Partial or ⚪ Placeholder counts as **not done**.

| Domain | Total | 🟢 Live | 🟡 Partial | ⚪ Placeholder | 🔧 Internal | % Complete |
|--------|:-----:|:------:|:---------:|:-------------:|:----------:|:----------:|
| A. Shopping & Product Discovery | 33 | 30 | 2 | 1 | 0 | **91%** |
| B. Cart, Checkout & Orders | 29 | 26 | 3 | 0 | 0 | **90%** |
| C. Payments, Wallet & Banking | 6 | 1 | 2 | 3 | 0 | **17%** |
| D. Accounts & Authentication | 30 | 23 | 2 | 4 | 1 | **80%** |
| E. Chat & Calls | 25 | 24 | 1 | 0 | 0 | **96%** ¹ |
| F. Stories | 7 | 6 | 1 | 0 | 0 | **86%** |
| G. Notifications | 10 | 9 | 0 | 0 | 1 | **100%** |
| H. Seller Dashboard | 14 | 10 | 4 | 0 | 0 | **71%** |
| I. Platform & Foundations | 46 | 45 | 0 | 1 | 0 | **98%** |
| **Total** | **200** | **174** | **15** | **9** | **2** | **🟩 88% complete** |

¹ All 25 chat feature IDs ship, but a cluster of inert chat sub-controls (Edit message,
Category/Reminder, Archive — see the placeholder list below) counts as one not-done item, docking
E to just under 100%.

**Overall: ~88% of the app is fully done** (176 of 200 features). The remaining ~12% is 15 partials
+ 9 placeholders, concentrated in **Payments/Wallet (C, 17%)** — an external package not yet
installed — with the next-biggest gaps in the **seller dashboard (H, 71%)** and **accounts (D, 80%,
mostly the legal pages)**.

---

## ✅ What we did (live & in use)

Whole domains shipped and working:

- **Shopping & discovery (A)** — homepage feed, category nav, featured/flash/boutiques, full search (text, voice, image, trending, history, in-catalog), listing grid + filters + sort, product detail page, gallery, variants, reviews, Q&A, share, related, wishlist, compare, luck rewards.
- **Cart, checkout & orders (B)** — add-to-cart with variants, cart drawer, coupons, address + map picker, OTP pre-order, payment-method selection, place order, gateway, confirmation/invoice, order history + tracking, change address/variant, report, hide/restore, rate & review, order chat, returns (create + photos).
- **Accounts & auth (D)** — phone + OTP login end-to-end (SMS/WhatsApp, resend + rate-limit, outcome screens), guest registration + upgrade, session re-auth, logout, full profile & settings (edit info, change phone, avatar, size profile, addresses, country/language).
- **Chat & calls (E)** — 1-to-1 voice/video (Agora), call history, delivery-worker calls, time limits; full messaging (rich types, voice notes, camera, reply, delete, typing, presence, receipts, pin/mute/delete, search, contacts sync, shared media, order chat).
- **Stories (F)** — view, post customer story, seller/admin stories, shoppable, delete, report.
- **Notifications (G)** — FCM push, foreground handling, toasts, notification center + bell, preferences, topic subscribe, chat/order/marketing push.
- **Seller dashboard (H)** — shop picker, product management, activate/allow-purchase, shop info/branding, image gallery, seller stories, comments/reviews mgmt, bulk Excel upload, team/roles.
- **Platform (I)** — 4 languages + RTL, multi-country + currency, on-demand translations, full SEO (sitemaps, robots, canonical/hreflang, structured data), bot detection, GA4 + PostHog + Sentry, PWA + web push, sharing/deep links, security headers, image optimization.

---

## 🟡 What we have to do (partial — one core piece missing)

| ID | Feature | The one thing it needs |
|----|---------|------------------------|
| SD-17 | Boutique storefront | Drive "verified / top-seller" trust badges from real shop data (hardcoded today) — or remove them. |
| SD-27 | Specs & size guide | Build the real measurement / size-conversion chart (IN/CM & EU/US/UK toggles are decorative). |
| CO-17 | Cancel whole order | Send the cancel **reason** to the backend (analytics-only today); wire the dead terms link. |
| CO-18 | Cancel single item | Send the cancel **reason** to the backend (not persisted today). |
| CO-28 | Manage a return | Replace hardcoded fake tracking timers ("3 H") and flat "3 USD" refund with real amount / currency / SLA. |
| ST-07 | Story viewer tracking | Wire per-story **view-time** (`onStoryViewTime`) to backend/analytics — today it only `console.log`s. |
| PW-01 | Wallet balance & history | **On hold by choice** — awaiting the external wallet package; no in-app work planned until it ships. |
| PW-04 | Pay order with wallet | Swap the **dummy test widget** for the real external RDB widget; allow failed payment to retry in place. |
| AC-06 | Privacy / terms consent | Wire the dead "Terms" link + add a Privacy link to real pages; ideally persist consent server-side. |
| AC-09 | QR-code login | Replace the local **mock** with real backend endpoints and mint a real session on approval. |
| SL-02 | Leave a shop | Make the UI react after a successful leave (redirect/refresh/confirm) — backend call already works. |
| SL-04 | Product editing | Functional today; "partial" only because it's slated for the planned AI-driven editor. Ship as-is or deliver AI editor. |
| SL-06 | Boutiques management | Build create/edit/delete/status actions (write permissions exist, tab is read-only) — or rename to a viewer. |
| SL-07 | Orders & fulfillment | Finish whole-order status change (commented out); build or hide payment/refund/shipping/tracking actions. |

---

## ⚪ Placeholders to fill (scaffolded but not functional)

| ID | Placeholder | What must be filled in |
|----|-------------|------------------------|
| SD-24 | Virtual try-on | Build the real try-on engine (locked design: on-device 3D AR); today it echoes the uploaded photo after a fake spinner. Hide the badge until then. |
| PW-02 | Add funds (bank deposit) | Deposit flow expected from the external wallet package (interim UI removed). |
| PW-05 | Bank cards | Empty shell — build the screen, or hide it from the menu until real. |
| PW-06 | Full digital bank | Install `rdb` package, wire the `<RDB />` widget + server bridge behind a feature flag, verify token handoff. Blocked on external dev. |
| AC-27 | Privacy Policy page | Real counsel-reviewed copy + design; link from consent gate + settings (thin boilerplate today). |
| AC-28 | Terms of Service page | Real legal copy + design; un-comment the settings link. |
| AC-29 | About page | Real content + design; wire settings "About Us" link (currently `#`). |
| AC-30 | Contact page | Real content + design; un-comment the settings link. |
| CH · Edit message | Chat edit action | Build the edit service + wire the empty Save handler — or remove the option. |
| CH · Category / Reminder | Chat message options | Implement both actions, or remove the inert buttons. |
| CH · Archive | Chat archive | Implement Archive (sibling to working Pin/Mute/Delete), or remove it. |
| PF-43 | Cookie-consent / GDPR banner | Build the banner (or obtain a documented legal exemption) before go-live. |

### Copy / links still to write (content, not engineering)

| Where | What's needed |
|-------|---------------|
| CO-20 Change item variant | Real "Change Color/Size Terms" page + link (currently `href="#"`). |
| CO-26 Create a return | Real "Learn More Tips" content + link, or remove. |
| CO-28 Manage a return | Confirm the real refund SLA, then replace the hardcoded "within 12 hours" line. |
| Legal (AC-06, AC-27–30) | Real Privacy/Terms/About/Contact copy + design, wired from the consent gate and settings. |

---
