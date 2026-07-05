# Trydos — Feature Index

**Purpose:** A complete, plain-language inventory of everything the Trydos app does today.
This is the master list (the "table of contents"). Each feature will get its own detailed
file under `docs/features/<domain>/` — this index links them together and shows, at a
glance, where each feature stands.

**Audience:** Management / non-technical stakeholders.
**Last updated:** 2026-07-05
**How it was built:** Compiled directly from the current codebase (routes, services, and
app state) — not from memory — so it reflects what is actually shipped on the `develop` branch.

---

## How to read this document

- Features are grouped into **9 domains** (A–I).
- Every feature has a **stable ID** (e.g. `SD-01`). Detail files will reuse the same ID, so
  a manager can always trace a headline to its full write-up.
- The **Status** column is a first-pass indicator, to be confirmed as each detail file is written:

| Symbol | Meaning |
|:------:|---------|
| 🟢 | **Live** — built and in use |
| 🟡 | **Partial** — works but limited, or under active development |
| ⚪ | **Placeholder / Planned** — scaffolded in the app but not yet functional |
| 🔧 | **Internal** — infrastructure or admin/support tool, not a normal end-user feature |

---

## Status at a glance

| Domain | Features | Notes |
|--------|:--------:|-------|
| A. Shopping & Product Discovery | 33 | Core storefront live; SD-17, SD-24, SD-27 & SD-33 partial |
| B. Cart, Checkout & Orders | 28 | Full purchase & post-purchase lifecycle; partial: CO-17 & CO-18 (cancel reason not sent to backend), CO-28 (hardcoded return-tracking timers/refund) |
| C. Payments, Wallet & Banking | 6 | ⚠️ External wallet package, under active development (RDB). Balance/history view live; pay-with-wallet is a dummy test widget; deposits, accounts, cards & transfers expected from the external package (not in-app) |
| D. Accounts & Authentication | 30 | Phone + OTP only; AC-06 consent + AC-27–30 legal/info pages are placeholder-grade |
| E. Chat & Calls | 25 | 1-to-1 chat + Agora voice/video (customer↔customer, customer↔delivery worker) |
| F. Stories | 7 | Seller/admin stories + customer stories (shoppable) |
| G. Notifications | 10 | Push (Firebase) + in-app |
| H. Seller Dashboard | 14 | Merchant back-office; SL-04 product edit is interim (AI redesign planned) |
| I. Platform & Foundations | 46 | Localization, SEO, analytics, PWA, security |
| **Total** | **~199** | |

### Key things the manager should know up front
- **Login is phone + OTP only** — no passwords, no email login, no Google/Apple/Facebook login.
- **The wallet & banking domain (C) is an external package, still being built by the RDB developer** — Trydos integrates with it as a black box (`rdb` is not even installed yet). Today only a balance/history view and a **dummy test widget** for paying an order at checkout exist; **deposits, and full digital banking (accounts / cards / money transfers), are expected from the external package and are not available in-app** ("Under Development").
- **Known placeholders:** Bank Cards screen (⚪), QR-code login (⚪), the Privacy / Terms / About / Contact legal-info pages (⚪, AC-27–30 — thin boilerplate, not linked from settings).
- **No readable legal policy for users:** the signup consent gate (AC-06) has a dead "Terms" link and no Privacy link; there is no cookie-consent / GDPR banner. Real Privacy/Terms content + linking is still needed before launch.
- **Seller product editing (SL-04)** is functional today but is planned to be replaced by a new AI-driven editor that extracts product info from images — treat the current form as interim.
- **Pre-launch reminders:** search indexing (SEO) is gated behind env flags; PostHog session replay is currently paused for cost.

---

## A. Shopping & Product Discovery

The shopper-facing browsing experience.

### Homepage & home widgets
| ID | Feature | What it does | Status |
|----|---------|--------------|:------:|
| [SD-01](A-shopping-and-discovery/SD-01-homepage-feed.md) | Homepage feed | The main landing screen stacking search, categories, stories, featured products, flash deals and boutiques into one scrollable feed. | 🟢 |
| [SD-02](A-shopping-and-discovery/SD-02-category-navigation-bar.md) | Category navigation bar | Top bar of main shopping categories; tapping one filters the whole homepage to that category. | 🟢 |
| [SD-03](A-shopping-and-discovery/SD-03-featured-products.md) | Featured products | Curated strip of highlighted products, with its own "see all" page. | 🟢 |
| [SD-04](A-shopping-and-discovery/SD-04-flash-deals.md) | Flash deals | Time-limited discounted products with countdown pricing and a dedicated deals page. | 🟢 |
| [SD-05](A-shopping-and-discovery/SD-05-boutiques-offers-list.md) | Boutiques / offers list | Shop-by-store section listing seller boutiques and their offers. | 🟢 |
| [SD-06](A-shopping-and-discovery/SD-06-personalized-recommendations.md) | Personalized recommendations | Per-user precomputed suggestions — renders on the **home feed**, not the PDP. | 🟢 |

### Search
| ID | Feature | What it does | Status |
|----|---------|--------------|:------:|
| [SD-07](A-shopping-and-discovery/SD-07-text-search-overlay.md) | Text search overlay | Full-screen search with live results grouped into products, categories, brands and boutiques, plus autocomplete. | 🟢 |
| [SD-08](A-shopping-and-discovery/SD-08-trending-searches.md) | Trending searches | Shows popular search terms when the box is empty. | 🟢 |
| [SD-09](A-shopping-and-discovery/SD-09-search-history.md) | Search history | Remembers a shopper's recent searches for quick re-search. | 🟢 |
| [SD-10](A-shopping-and-discovery/SD-10-voice-search.md) | Voice search | Search by speaking; speech is transcribed to a query. | 🟢 |
| [SD-11](A-shopping-and-discovery/SD-11-image-visual-search.md) | Image / visual search | Search by uploading or snapping a photo of a product. | 🟢 |
| [SD-12](A-shopping-and-discovery/SD-12-in-search-filtering.md) | In-search filtering | Refine search results in place by category, brand or boutique. | 🟢 |
| [SD-13](A-shopping-and-discovery/SD-13-in-catalog-search.md) | In-catalog search | Search within a specific boutique / catalog. | 🟢 |

### Listing & category pages
| ID | Feature | What it does | Status |
|----|---------|--------------|:------:|
| [SD-14](A-shopping-and-discovery/SD-14-product-listing-page.md) | Product listing page | Infinite-scroll product grid — the shared engine behind category, boutique, featured, flash-deal and search pages. | 🟢 |
| [SD-15](A-shopping-and-discovery/SD-15-filter-panel.md) | Filter panel | Narrow a listing by category, brand, boutique, colour, size and price range. | 🟢 |
| [SD-16](A-shopping-and-discovery/SD-16-sort-control.md) | Sort control | Reorder a listing (relevance, best sellers, price, name). | 🟢 |
| [SD-17](A-shopping-and-discovery/SD-17-boutique-storefront.md) | Boutique storefront | A boutique's own banner, logo, name and share button on its listing. | 🟡 |
| [SD-18](A-shopping-and-discovery/SD-18-quick-view-modal.md) | Quick-view modal | Open a product in an overlay without leaving the current listing. | 🟢 |

> **Note.** There is no public seller/boutique profile page — the public face of a shop is the
> **boutique storefront (SD-17)**; the private seller entry point lives in **Domain H → SL-01**.

### Product detail
| ID | Feature | What it does | Status |
|----|---------|--------------|:------:|
| [SD-19](A-shopping-and-discovery/SD-19-product-detail-page.md) | Product detail page | Full product page: photos, name & brand, description, specs, delivery estimate and actions. | 🟢 |
| [SD-20](A-shopping-and-discovery/SD-20-image-video-gallery.md) | Image & video gallery | Swipeable image slider (Embla) + tap-to-zoom + picture-in-picture product video. | 🟢 |
| [SD-21](A-shopping-and-discovery/SD-21-colour-variant-selection.md) | Colour / variant selection | Pick a colour (reloads gallery) and size via chips. | 🟢 |
| [SD-22](A-shopping-and-discovery/SD-22-product-labels-view-counts.md) | Product labels & view counts | Promotional label tags (rotating on cards) and product view counts. | 🟢 |
| [SD-23](A-shopping-and-discovery/SD-23-delivery-shipping-returns.md) | Delivery & shipping/returns info | Expected delivery date, free-shipping and free-return badges + delivery-times sheet. | 🟢 |
| [SD-24](A-shopping-and-discovery/SD-24-virtual-try-on.md) | Virtual try-on | ⚠️ Photo capture/upload UI only — the try-on itself is a stub (echoes the input photo; no AI/backend). | 🟡 |
| [SD-25](A-shopping-and-discovery/SD-25-buyer-comments-reviews.md) | Buyer comments & reviews | Read/like/edit-own ratings + size-fit; reviews are written from Orders (CO-23). | 🟢 |
| [SD-26](A-shopping-and-discovery/SD-26-product-qa-faq.md) | Product Q&A / FAQ | Interactive buyer→seller pre-purchase questions. | 🟢 |
| [SD-27](A-shopping-and-discovery/SD-27-specs-size-guide.md) | Specs & size guide | Quality/rating/size-fit modal is live; the size-guide (measurement chart) is not built. | 🟡 |
| [SD-28](A-shopping-and-discovery/SD-28-share-product.md) | Share product | Share to social channels (tracked) or in-app chat (see E). | 🟢 |
| [SD-29](A-shopping-and-discovery/SD-29-related-products.md) | Related products | "You may also like" — audience/category similarity (not personalised). | 🟢 |
| [SD-30](A-shopping-and-discovery/SD-30-more-options-menu.md) | More-options menu | Overflow menu: notify-me, wishlist, compare. | 🟢 |

### Cross-cutting shopper actions
| ID | Feature | What it does | Status |
|----|---------|--------------|:------:|
| [SD-31](A-shopping-and-discovery/SD-31-wishlist-favourites.md) | Wishlist / favourites | Save products ("CheckList") and view them in a slide-in panel. | 🟢 |
| [SD-32](A-shopping-and-discovery/SD-32-product-comparison.md) | Product comparison | Add products to a compare list and view them side by side (2-item slots). | 🟢 |
| [SD-33](A-shopping-and-discovery/SD-33-redeem-luck-rewards.md) | Redeem / "luck" rewards | Time-limited redeemable discount ("Luck!") on product cards and detail; hardcoded timer, cookie-gated. | 🟡 |

---

## B. Cart, Checkout & Orders

Everything from adding to cart through paying and managing an order.

### Cart
| ID | Feature | What it does | Status |
|----|---------|--------------|:------:|
| [CO-01](B-cart-checkout-orders/CO-01-add-to-cart.md) | Add to cart (with variants) | Choose colour/size and quantity, then add to the bag. | 🟢 |
| [CO-02](B-cart-checkout-orders/CO-02-notify-me-when-available.md) | Notify me when available | Ask to be alerted when an out-of-stock item returns. | 🟢 |
| [CO-03](B-cart-checkout-orders/CO-03-cart-drawer.md) | Cart drawer | Slide-in panel showing all items, quantities, prices and totals. | 🟢 |
| [CO-04](B-cart-checkout-orders/CO-04-update-remove-items.md) | Update / remove items | Change quantity or remove items from the bag. | 🟢 |
| [CO-05](B-cart-checkout-orders/CO-05-saved-for-later-old-cart.md) | Saved-for-later ("old cart") | A secondary bag for items kept aside from the active cart, with a one-tap "Add Again". | 🟢 |
| [CO-06](B-cart-checkout-orders/CO-06-coupon-promo-codes.md) | Coupon & promo codes | Enter a discount code that is validated and applied. | 🟢 |

### Checkout
| ID | Feature | What it does | Status |
|----|---------|--------------|:------:|
| [CO-07](B-cart-checkout-orders/CO-07-shipping-address-management.md) | Shipping address management | Choose, add, edit, delete and default a delivery address. | 🟢 |
| [CO-08](B-cart-checkout-orders/CO-08-region-map-picker.md) | Region / map picker | Pick the delivery region and pinpoint a location on a map. | 🟢 |
| [CO-09](B-cart-checkout-orders/CO-09-mobile-confirmation-pre-order.md) | Mobile confirmation (pre-order) | Verify the phone via OTP before placing an order. | 🟢 |
| [CO-10](B-cart-checkout-orders/CO-10-payment-method-selection.md) | Payment method selection | Choose wallet, cash on delivery, or card/crypto gateway. | 🟢 |
| [CO-11](B-cart-checkout-orders/CO-11-place-order-checkout.md) | Place order / checkout | Confirm and submit the order for payment. | 🟢 |
| [CO-12](B-cart-checkout-orders/CO-12-external-payment-gateway.md) | External payment gateway | Hosted card/crypto payment page in an embedded window. | 🟢 |
| [CO-13](B-cart-checkout-orders/CO-13-pay-with-wallet.md) | Pay with wallet at checkout | Apply the in-app wallet balance to the order (see C). ⚠️ Secret-leak bug in the failure path. | 🟢 |
| [CO-14](B-cart-checkout-orders/CO-14-order-confirmation-invoice.md) | Order confirmation & invoice | Order-placed screen with an invoice summary. | 🟢 |

### Orders (history, tracking & management)
| ID | Feature | What it does | Status |
|----|---------|--------------|:------:|
| [CO-15](B-cart-checkout-orders/CO-15-order-history.md) | Order history | Browse past/current orders, filterable by status. | 🟢 |
| [CO-16](B-cart-checkout-orders/CO-16-order-details-tracking.md) | Order details & tracking | View one order's items and delivery-status progress. | 🟢 |
| [CO-17](B-cart-checkout-orders/CO-17-cancel-whole-order.md) | Cancel whole order | Cancel an order that hasn't shipped (cancel reason is not yet sent to the backend). | 🟡 |
| [CO-18](B-cart-checkout-orders/CO-18-cancel-single-item.md) | Cancel a single item | Cancel one product (or reduce quantity) within an order (cancel reason not yet sent to the backend). | 🟡 |
| [CO-19](B-cart-checkout-orders/CO-19-change-delivery-address.md) | Change delivery address | Update where an existing order is delivered. | 🟢 |
| [CO-20](B-cart-checkout-orders/CO-20-change-item-variant.md) | Change item variant | Swap the size/colour of an item already ordered. | 🟢 |
| [CO-21](B-cart-checkout-orders/CO-21-report-an-order-item.md) | Report an order item | Flag a problem with a delivered item (reasons + note). | 🟢 |
| [CO-22](B-cart-checkout-orders/CO-22-hide-order-item.md) | Hide order / item | Remove an order or item from the visible history. | 🟢 |
| [CO-23](B-cart-checkout-orders/CO-23-rate-review-a-purchase.md) | Rate & review a purchase | Star rating and written review (with images) on delivered items. | 🟢 |
| [CO-24](B-cart-checkout-orders/CO-24-order-chat.md) | Order chat | Open a chat tied to a specific order — delivery-worker only (see E). | 🟢 |
| [CO-25](B-cart-checkout-orders/CO-25-order-invoice-view.md) | Order invoice view | View the order's invoice — a total + payment-method summary | 🟢 |

### Returns & refunds
| ID | Feature | What it does | Status |
|----|---------|--------------|:------:|
| [CO-26](B-cart-checkout-orders/CO-26-create-return-request.md) | Create a return request | Start a return, choosing reason and quantity. | 🟢 |
| [CO-27](B-cart-checkout-orders/CO-27-upload-return-photos.md) | Upload return photos | Attach evidence images to a return. | 🟢 |
| [CO-28](B-cart-checkout-orders/CO-28-manage-a-return.md) | Manage a return | Track, confirm or cancel a submitted return (tracking UI shows hardcoded fake timers & refund figure). | 🟡 |

---

## C. Payments, Wallet & Banking

In-app money features.

> **🚨 Critical — the wallet is an external package, under active development.** Every feature in this
> domain is delivered by an **external wallet package/service** owned by, and **still being built by, the
> RDB developer**. Trydos integrates with it as a **black box** — we do **not** own, control or document
> its internals (accounts, ledgers, signing, endpoints). The `rdb` package is currently **not installed**
> in the app (its imports are commented out) and the full banking widget is stubbed to *"Under
> Development"*. What Trydos has today is only a thin, interim layer — a balance/history view (the UI's
> *"RDB Wallet"*) and a **dummy test widget** for paying an order at checkout; **deposits, accounts, cards
> and transfers are expected to come from the external package** and are not available in-app. Treat this
> entire domain as **subject to change** until that integration lands.

| ID | Feature | What it does | Status |
|----|---------|--------------|:------:|
| [PW-01](C-payments-wallet-banking/PW-01-wallet-balance-history.md) | Wallet balance & history | View the wallet balance and a list of past transactions. Thin in-app view over the external wallet. | 🟡 |
| [PW-02](C-payments-wallet-banking/PW-02-add-funds-bank-deposit.md) | Add funds (bank deposit) | Top up the wallet by bank deposit. The interim in-app UI was **removed** — deposits are expected from the external wallet package. | ⚪ |
| [PW-03](C-payments-wallet-banking/PW-03-wallet-multi-currency-balance.md) | Wallet & multi-currency balance | Auto-creates a wallet and shows the balance in the shopper's country currency (via the external wallet). | 🟢 |
| [PW-04](C-payments-wallet-banking/PW-04-pay-order-with-wallet.md) | Pay an order with the wallet | Pay for a purchase from the wallet balance at checkout. Current modal is a **dummy test widget**; real payment expected via the external RDB widget. ⚠️ Secret-leak bug in the failure path (see CO-13). | 🟡 |
| [PW-05](C-payments-wallet-banking/PW-05-bank-cards.md) | Bank cards | A "Bank Cards" screen exists but is an empty shell. | ⚪ |
| [PW-06](C-payments-wallet-banking/PW-06-full-digital-bank.md) | Full digital bank (accounts / cards / transfers) | The rich banking UI (send money, cards, transfers) is the external package — not wired in; shows "Under Development". | ⚪ |

---

## D. Accounts & Authentication

Signing in and managing an account. **Identity is phone-number + OTP only.**

### Signing in / creating an account
| ID | Feature | What it does | Status |
|----|---------|--------------|:------:|
| AC-01 | Login / sign-up chooser | Pick "I have an account" or "Create new account". | 🟢 |
| AC-02 | Phone number entry | Enter a mobile number (with dial-code detection) to begin. | 🟢 |
| AC-03 | Choose SMS or WhatsApp | Select how the one-time code is delivered. | 🟢 |
| AC-04 | Enter & verify OTP | Type the code to prove ownership of the number. | 🟢 |
| AC-05 | Enter your name | New users provide a display name to finish sign-up. | 🟢 |
| AC-06 | Privacy / terms agreement | Consent screen accepted before creating an account. ⚠️ The gate works, but the "Terms of Services" link is a dead no-op, there is no Privacy link, and no readable policy is reachable from it. | 🟡 |
| AC-07 | Outcome screens | Welcome-back / new-user / already-registered / not-found result screens. | 🟢 |
| AC-08 | Resend code & rate limiting | Re-request a code with cooldown timers and abuse caps. | 🟢 |
| AC-09 | QR-code login | "Scan from the app" option — shows a sample QR only. | ⚪ |
| AC-10 | Browse as guest | Dismiss login and keep shopping without an account. | 🟢 |

### Sessions & lifecycle
| ID | Feature | What it does | Status |
|----|---------|--------------|:------:|
| AC-11 | Automatic guest registration | Silently registers an anonymous device so guests can browse and cart. | 🟢 |
| AC-12 | Guest → verified upgrade | Merges guest data into the real account on verification. | 🟢 |
| AC-13 | Session-expiry re-auth | Recovers a expired session and re-prompts verification seamlessly. | 🟢 |
| AC-14 | Logout | Clears sessions/tokens, resets the app, unregisters push. | 🟢 |
| AC-15 | Verify-now prompt | Shows verification status and lets an unverified user verify. | 🟢 |
| AC-16 | Simulate / impersonate user | Load a session from a payload for testing/support. | 🔧 |

### Profile & settings
| ID | Feature | What it does | Status |
|----|---------|--------------|:------:|
| AC-17 | Account / settings home | Hub linking profile, orders, wallet, preferences, country, language, legal. | 🟢 |
| AC-18 | Profile overview | Landing page for personal details. | 🟢 |
| AC-19 | Edit personal info | Update name, phone, email, gender and alternative phone. | 🟢 |
| AC-20 | Change phone number | Change the number with fresh OTP re-verification. | 🟢 |
| AC-21 | Profile picture | Add or replace the account avatar. | 🟢 |
| AC-22 | Body / clothing size profile | Record size info used for shopping. | 🟢 |
| AC-23 | Saved addresses | Manage delivery addresses (add/edit/delete/select). | 🟢 |
| AC-24 | Notification preferences | Choose which notifications to receive (see G). | 🟢 |
| AC-25 | Change country | Switch the store country/region (see H). | 🟢 |
| AC-26 | Change language | Switch the app language (see H). | 🟢 |

### Legal & static info pages
| ID | Feature | What it does | Status |
|----|---------|--------------|:------:|
| AC-27 | Privacy Policy page | A `/privacy-policy` route exists but holds only thin boilerplate (intro + 2 short paragraphs); needs real design + legal copy, and is not linked from settings. | ⚪ |
| AC-28 | Terms of Service page | A `/terms-of-service` route exists but holds only thin boilerplate; the settings link to it is commented out. Needs real design + legal copy. | ⚪ |
| AC-29 | About page | An `/about` route exists but holds only thin boilerplate; the settings "About Us" item points to `#`. Needs real design + content. | ⚪ |
| AC-30 | Contact page | A `/contact` route exists but holds only thin boilerplate; the settings link to it is commented out. Needs real design + content. | ⚪ |

> **Note.** The four legal/info static pages above share one `StaticPage` component and are reachable only by direct URL — the settings/account home either comments out their links or points them to `#`, so a user cannot tap through to them. Treat them as scaffolded placeholders pending design and real (legal) copy.

---

## E. Chat & Calls

Private real-time messaging and calling. **All conversations are 1-to-1 (Agora); there is no broadcast live stream.** Participants are either **two customers**, or a **customer and a delivery worker** (order/delivery threads and calls).

### Voice & video calls
| ID | Feature | What it does | Status |
|----|---------|--------------|:------:|
| CH-01 | Video call | Buyer↔seller live video, with mute mic/camera and a timer. | 🟢 |
| CH-02 | Voice call | Audio-only live call between two users. | 🟢 |
| CH-03 | Receive / answer / decline | Incoming-call popup, plus multi-device and busy handling. | 🟢 |
| CH-04 | Call history | List of incoming, outgoing and missed calls. | 🟢 |
| CH-05 | In-app call screens (mobile) | Full-screen call pages the native app opens in a webview. | 🟢 |
| CH-06 | Delivery-worker calls | Special flow letting a delivery worker call the customer. | 🟢 |
| CH-07 | Call time limit & warning | Calls auto-end after a max duration with an on-screen warning. | 🟢 |

### Chat / messaging
| ID | Feature | What it does | Status |
|----|---------|--------------|:------:|
| CH-08 | One-to-one chat | Private real-time messaging inbox (slide-in widget). | 🟢 |
| CH-09 | Rich message types | Text, image, video, voice notes, files, shared products, call records. | 🟢 |
| CH-10 | Voice messages | Record and send an audio clip in chat. | 🟢 |
| CH-11 | In-chat camera | Take a photo and send it directly in chat. | 🟢 |
| CH-12 | Share product to chat | Send a product card to another user. | 🟢 |
| CH-13 | Reply / quote | Reply to a specific earlier message. | 🟢 |
| CH-14 | Delete messages | Remove a message for yourself or for everyone. | 🟢 |
| CH-15 | Typing indicator | Live "typing…" status. | 🟢 |
| CH-16 | Online / last-seen | Shows presence or last-seen time. | 🟢 |
| CH-17 | Read / delivered receipts | Message received/read states, synced across devices. | 🟢 |
| CH-18 | Pin a chat | Keep important conversations at the top. | 🟢 |
| CH-19 | Mute a chat | Silence notifications for a conversation. | 🟢 |
| CH-20 | Delete a chat | Remove an entire conversation. | 🟢 |
| CH-21 | Search chats & contacts | Find people or conversations by name/phone. | 🟢 |
| CH-22 | Contacts sync | Import contacts to find who is on the platform. | 🟢 |
| CH-23 | Chat info & shared media | View a conversation's shared images/videos/files. | 🟢 |
| CH-24 | Conversation history | Paginated loading of older messages. | 🟢 |
| CH-25 | Order / delivery chat | A chat thread tied to a specific order. | 🟢 |

---

## F. Stories

Instagram-style image/video stories. A story can be authored either by a **seller/admin** (shop stories, also managed in the Seller Dashboard — see SL-10) or by a **customer**, and can be made shoppable by linking to a product.

| ID | Feature | What it does | Status |
|----|---------|--------------|:------:|
| [ST-01](F-stories/ST-01-view-stories.md) | View stories | Full-screen swipeable image/video stories; counts a view. | 🟢 |
| [ST-02](F-stories/ST-02-post-customer-story.md) | Post a customer story | A shopper creates a story from an upload or the live camera. | 🟢 |
| [ST-03](F-stories/ST-03-seller-admin-stories.md) | Seller / admin stories | Sellers/admins publish shop stories (authored via the Seller Dashboard, SL-10). | 🟢 |
| [ST-04](F-stories/ST-04-shoppable-stories.md) | Shoppable stories | A story can link to a product to tap through and buy. | 🟢 |
| [ST-05](F-stories/ST-05-delete-own-story.md) | Delete own story | Remove a story you posted. | 🟢 |
| [ST-06](F-stories/ST-06-report-a-story.md) | Report a story | Flag another user's story. | 🟢 |
| [ST-07](F-stories/ST-07-viewer-tracking.md) | Viewer tracking | Marks stories seen and counts viewers. | 🟢 |

---

## G. Notifications

Push and in-app alerts (Firebase Cloud Messaging).

| ID | Feature | What it does | Status |
|----|---------|--------------|:------:|
| NT-01 | Push notifications | Push alerts (orders, chat, calls, offers) to web and mobile. | 🟢 |
| NT-02 | Foreground handling | Routes incoming alerts to the right action while the app is open. | 🟢 |
| NT-03 | In-app toasts | Transient success/error/chat pop-ups, some clickable. | 🟢 |
| NT-04 | Notification center | Slide-in list of the user's notifications with infinite scroll. | 🟢 |
| NT-05 | Notification bell | Header bell with unread/new-activity indicators. | 🟢 |
| NT-06 | Notification preferences | Choose which notification types to receive. | 🟢 |
| NT-07 | Topic subscribe / unsubscribe | Targeted push by category/boutique topics. | 🟢 |
| NT-08 | Chat push alerts | Alert with sender, preview and photo; taps open the chat. | 🟢 |
| NT-09 | Order & marketing push | Order-status, back-in-stock, price-drop, cart-expiry alerts. | 🟢 |
| NT-10 | FCM admin APIs | Back-office broadcast/config/inspect/analytics endpoints. | 🔧 |

---

## H. Seller Dashboard

The merchant/seller back-office (per-shop, permission-gated).

| ID | Feature | What it does | Status |
|----|---------|--------------|:------:|
| [SL-01](H-seller-dashboard/SL-01-my-shops-shop-picker.md) | My shops / shop picker | The seller's "Your Shops" entry page — lists shops a user can manage (role + permissions) and opens the dashboard. | 🟢 |
| SL-02 | Leave a shop | Remove your own access to a shop. | 🟢 |
| SL-03 | Product management | Browse the shop's products with stock, status and social stats. | 🟢 |
| SL-04 | Product editing | Full edit form for a product (variants, prices, images) — functional today (loads & saves real data), but slated to be replaced by a new AI-driven design that extracts product info from images, so treated as interim. | 🟡 |
| SL-05 | Activate / allow purchase | Toggle a product on/off for sale, with eligibility checks. | 🟢 |
| SL-06 | Boutiques management | View the shop's boutiques (sub-storefronts). | 🟢 |
| SL-07 | Orders & fulfillment | View received orders and progress them (confirm, pack, cancel). | 🟢 |
| SL-08 | Shop info / branding | Edit shop name, contact, address, logo and banner. | 🟢 |
| SL-09 | Product image gallery | Upload, browse and delete product images. | 🟢 |
| SL-10 | Seller stories | Create, view and delete shop stories, linkable to a product. | 🟢 |
| SL-11 | Comments & reviews management | Read and reply to customer questions and reviews. | 🟢 |
| SL-12 | Bulk upload (Excel) | Download a template, fill it, and create products in bulk. | 🟢 |
| SL-13 | Team / user management | Invite staff by phone, assign roles, remove users. | 🟢 |
| SL-14 | Roles & permissions viewer | See a user's role and grouped permission breakdown. | 🟢 |

---

## I. Platform & Foundations

Cross-cutting capabilities that apply across the whole app.

### Localization & region
| ID | Feature | What it does | Status |
|----|---------|--------------|:------:|
| PF-01 | Multi-language (en/ar/tr/ku) | The whole store in four languages, baked into every URL. | 🟢 |
| PF-02 | On-demand translations | Non-English text loads only when needed, and is cached. | 🟢 |
| PF-03 | Right-to-left layout | Arabic & Kurdish flip the page direction automatically. | 🟢 |
| PF-04 | Multi-country storefront | Country-specific stores (Syria, Lebanon, Turkey, Iraq + GB default). | 🟢 |
| PF-05 | Auto language/country detection | First-time visitors are routed to the right locale by browser + geo-IP. | 🟢 |
| PF-06 | Country-changed popup | Prompts a visitor to confirm which country store to use. | 🟢 |
| PF-07 | Language switcher | Change language from settings. | 🟢 |
| PF-08 | Country switcher | Change country/region from settings. | 🟢 |
| PF-09 | Per-country currency | Prices shown in each country's currency. | 🟢 |
| PF-10 | Localized country/origin labels | Translated country names and "Made in {country}" labels. | 🟢 |

### SEO & discoverability
| ID | Feature | What it does | Status |
|----|---------|--------------|:------:|
| PF-11 | Dynamic XML sitemaps | Auto-generated map of every product, store and page for search engines. | 🟢 |
| PF-12 | Paginated sitemap index | Large catalogs split across files under one master index. | 🟢 |
| PF-13 | Robots.txt env gating | Only the real production site is crawlable; previews are blocked. | 🟢 |
| PF-14 | Metadata, canonical & hreflang | Canonical URLs and per-language equivalents to avoid duplicate content. | 🟢 |
| PF-15 | Structured data / rich results | schema.org markup for organization, site, products, breadcrumbs. | 🟢 |
| PF-16 | Google verification | Site-ownership verification and "don't auto-translate" signals. | 🟢 |
| PF-17 | Correct locale tags | Exact language-region tags (e.g. ar-SY) on every page. | 🟢 |
| PF-18 | Social preview image | Branded preview image when links are shared. | 🟢 |

### Bots & crawlers
| ID | Feature | What it does | Status |
|----|---------|--------------|:------:|
| PF-19 | Bot detection | Recognizes crawlers and routes them to clean URLs. | 🟢 |
| PF-20 | Redirect-loop protection | Guards against infinite redirects with a safe fallback. | 🟢 |

### Analytics & monitoring
| ID | Feature | What it does | Status |
|----|---------|--------------|:------:|
| PF-21 | Google Analytics (GA4) | Product and behavior tracking with rich context. | 🟢 |
| PF-22 | PostHog analytics | Funnels, paths, heatmaps, feature flags (session replay paused). | 🟢 |
| PF-23 | Ad-blocker-resistant proxy | Routes analytics through the site's own path for reliability. | 🟢 |
| PF-24 | Marketing attribution | Captures UTM source and referrer for campaign tracking. | 🟢 |
| PF-25 | User / guest identification | Distinguishes guests vs. verified users in analytics. | 🟢 |
| PF-26 | Performance monitoring | Real-user speed metrics (Vercel Speed Insights / Web Vitals). | 🟢 |
| PF-27 | Error & crash reporting | Client/server errors captured to Sentry and a backend log. | 🟢 |
| PF-28 | Navigation history | Remembers recent pages for smart back-navigation. | 🟢 |

### App delivery (PWA)
| ID | Feature | What it does | Status |
|----|---------|--------------|:------:|
| PF-29 | Installable app (PWA) | Install Trydos to the home screen as a standalone app. | 🟢 |
| PF-30 | Web push infrastructure | Browser push notifications via a Firebase service worker (see G). | 🟢 |
| PF-31 | Auto version upgrades | Clears stale caches and reloads so users run the latest version. | 🟢 |

### Sharing & deep links
| ID | Feature | What it does | Status |
|----|---------|--------------|:------:|
| PF-32 | Multi-channel sharing | Share products/stores to WhatsApp, Facebook, X, Telegram, email, copy-link, OS share. | 🟢 |
| PF-33 | Share to contacts | Share a product directly into in-app chats. | 🟢 |
| PF-34 | Campaign-tagged links | Shared URLs carry the share channel for attribution. | 🟢 |

### Global UI & accessibility
| ID | Feature | What it does | Status |
|----|---------|--------------|:------:|
| PF-35 | Global header & nav | Persistent top bar with logo and account controls. | 🟢 |
| PF-36 | Category nav bar | Scrollable, direction-aware category bar. | 🟢 |
| PF-37 | Overlays & modals system | Central system for modal routes, overlays and loaders. | 🟢 |
| PF-38 | Brand theming & fonts | Consistent brand look (Quicksand font, Tailwind theming). | 🟢 |
| PF-39 | Accessibility signals | ARIA labels and correct language/direction attributes. | 🟢 |

### Cookies, consent & sessions
| ID | Feature | What it does | Status |
|----|---------|--------------|:------:|
| PF-40 | Localization cookies | Persists country/language choices reliably across the app. | 🟢 |
| PF-41 | Cookies-disabled detection | Warns users whose browser has cookies turned off. | 🟢 |
| PF-42 | Session management | Guest vs. authenticated sessions, expiry timers, logout guard. | 🟢 |
| PF-43 | Cookie-consent / GDPR banner | **Not present** — flagged as a possible compliance gap. | ⚪ |

### Security & performance
| ID | Feature | What it does | Status |
|----|---------|--------------|:------:|
| PF-44 | Security headers (HSTS) | Enforces HTTPS across the site and subdomains. | 🟢 |
| PF-45 | Edge caching & preconnect | Smart cache rules and preconnects to speed up loading. | 🟢 |
| PF-46 | Image optimization | Optimizes and caches media images from trusted hosts. | 🟢 |

---

## Known issues — copy & links to write (NTW)

Non-blocking gaps that need **content/design** rather than engineering — dead links and hardcoded
copy surfaced while writing the feature docs. Each is also noted in its feature doc.

| Where | Issue | Needed |
|-------|-------|--------|
| **CO-20** Change item variant | "Change Color/Size Terms" link is a placeholder `href="#"` | Real terms page + link |
| **CO-26** Create a return | Return-window copy *"Return This Product In 24 Hours"* is hardcoded and not enforced client-side | Confirm the real policy, then wire or reword |
| **CO-26** Create a return | "Learn More Tips." link is inert (no handler) | Real tips content + link, or remove |
| **CO-28** Manage a return | Refund-timing line *"You Will Receive Your Refund Within 12 Hours"* is hardcoded | Confirm the real SLA, then wire or reword |
| **Legal / privacy** (AC-06, AC-27–30) | Signup consent gate has a **dead "Terms" link and no Privacy link**; the Privacy / Terms / About / Contact pages are thin boilerplate and **not linked from settings** | Real Privacy/Terms/About/Contact copy + design, and wire the links from the consent gate and settings |

> **Note.** A separate set of *engineering* follow-ups (e.g. CO-28's hardcoded return-tracking timers
> and fixed "3 USD" refund figure) remain tracked in their feature docs as functional gaps.

---

## Next steps

1. **Review & adjust this index** with the team — confirm domain grouping, headlines and the first-pass statuses.
2. **Write one detail file per feature** under `docs/features/<domain>/<ID>-<slug>.md`, reusing the IDs above. A suggested template per feature: *What it is · Who uses it · Current status & maturity · Key screens/entry points · Known gaps/TODOs · Dependencies.*
3. **Prioritize the detail write-ups** — start with anything the manager flags as high-interest, and with the ⚪/🟡 items (placeholders, partial, disabled) since those most affect "where we are now".

> This index reflects the codebase on the `develop` branch as of 2026-07-03. Re-run the inventory after major feature merges to keep it current.
