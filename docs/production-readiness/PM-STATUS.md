# Trydos web app — how close are we to production?

**Date:** 2026-10-20
**Scope:** the web app itself: its code, the product decisions it waits for, and the legal text. Backend work and server setup are not counted here; they are tracked separately.

## The short answer

**About 75 out of 100.**

The shop works. We checked every part of the site, section by section, and counted **572 working cases** across 20 sections: browsing, search, product pages, cart, checkout, orders, sign-in, profile, chat and calls, stories, notifications, the seller dashboard, wishlist and compare, languages and regions.

What is left is small. It splits into three groups:

| Group | Score | What is left |
|---|:-:|---|
| Code | 90 | 5 small fixes, about two days of work |
| Product decisions | 50 | 9 decisions. Each one is "hide it or finish it". Hiding takes an hour each |
| Legal text | 40 | The real text for 4 pages, in 4 languages |

## What is still open

### 1. Code (Frontend, about two days)

| # | Fix |
|---|---|
| 1 | Stop returning a sign-in credential to page scripts |
| 2 | Stop sending session cookies to the error tool (one setting in three config files) |
| 3 | The mobile-app call page: take the token out of the address and the debug button |
| 4 | Every order sends the text "order note"; send none, or add a real note field |
| 5 | The "invite a friend" text: translate it and use the real Play Store id |

### 2. Product decisions (9)

Each item below is live in the app today but not finished. The decision is **hide it** (one hour each) or **finish it** (days to weeks).

| # | Decision | What a shopper sees today |
|---|---|---|
| 1 | Wallet: hide or finish | A sheet that says "Under Development", and an empty "Bank Cards" page |
| 2 | Virtual try-on: remove or build | The button waits 3 seconds and shows the shopper's own photo |
| 3 | QR login: remove or build | A fake flow; "Approve" closes as if it worked |
| 4 | Order promises: confirm or change | "refund within 12 hours", "no fees", "cancel in 3 hours" are fixed text nobody confirmed |
| 5 | Cookie consent: needed or not, per launch country | Analytics start on every page with no consent (Turkey needs one) |
| 6 | Support channels | The contact page shows an e-mail address as plain text |
| 7 | Card and crypto at launch: offered or not | Both show at checkout; no real payment was ever tested |
| 8 | Play Store id for the invite text | The invite points at a placeholder id |
| 9 | Demo and test pages: remove or hide | Design demos and tester pages can be opened by anyone |

### 3. Legal text (Product writes)

The Privacy Policy, Terms of Service, About and Contact pages exist and every link opens them, but the text on them is a placeholder. Product writes the real text in English, Arabic, Turkish and Kurdish. The privacy text must name the services we use (error reporting, analytics, push notifications, cookies) and say how an account is deleted. No code work is needed once the text is ready.

## What moves the number fastest

1. **One meeting with Product** on the 9 decisions. If every item is "hide it", Frontend closes all of them in a day. That alone is worth about 15 points.
2. **The legal text.** Worth about 10 points, and it does not depend on anyone else.
3. **The 5 code fixes.** Two days, worth about 5 points.

With all three done, the web app itself is at about 100. The remaining work to open the shop is on the backend and server side, which is tracked in the other lists.
