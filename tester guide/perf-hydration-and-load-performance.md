# Performance & Load Optimization — Manual Tester Guide

**Prepared for:** Manual QA
**Branch:** `perf/hydration-and-load-performance`
**Scope:** 5 performance commits on top of `develop`

---

## 1. Purpose

This work was **performance-only** — the app should look and behave exactly as it
does on `develop`, just load faster. So the goal of this round is **regression
hunting**, not feature testing: we are looking for anything that broke, went
missing, showed English instead of the selected language, or stopped updating.

Two areas changed real behaviour (not just load timing) and deserve the deepest
testing: **login/user session (Section 3)** and **country names (Section 4)**.

## 2. What changed, in plain terms

| # | Change | What testers should watch for |
|---|--------|-------------------------------|
| 1 | Translation tables and the country dataset are no longer shipped to the browser | English text appearing where Arabic/Turkish/Kurdish should be |
| 2 | Story viewer, add-story camera, image search, voice search, rich-text editor and the share sheet now load only when opened | Something not opening on the first tap, or a broken/blank loading state |
| 3 | The user-session request (`/api/auth/me`) is now sent once instead of twice | Wrong user shown after switching accounts; avatar/name not updating |
| 4 | Header/navbar/cart/notifications now watch fewer pieces of state | A counter or label that stops updating |
| 5 | Removed an unused video library (`hls.js`) | Live video / stories video playback |

## 3. Session & login — **priority 1**

The biggest behavioural change. Test on a **fresh browser profile or hard reload**
each time (not just a client-side navigation).

| # | Steps | Expected result |
|---|-------|-----------------|
| 3.1 | Open the site as a **guest** (never logged in), hard reload the home page | Page loads normally; no login errors; guest browsing works (listing, product page, add to cart) |
| 3.2 | Log in with a valid account | Avatar and user name appear in the header **immediately** after login — no manual refresh needed |
| 3.3 | While logged in, hard-reload the home page | Header still shows the correct avatar/name; chat, stories and wallet sections load for that user |
| 3.4 | **Log out, then log in with a *different* account** | Header, chat, stories and wallet all show the **second** user. No leftover data from the first user anywhere |
| 3.5 | Log out and stay on the site | Header returns to the guest state; no user name/avatar remains |
| 3.6 | Log in, then open several pages quickly (home → listing → product → settings) | User stays logged in throughout; no random logout |
| 3.7 | With the network throttled to Slow 3G, hard-reload while logged in | Header may show a placeholder briefly, but resolves to the correct user; it must not stay empty forever |

> **Note for the tester:** 3.4 is the single most important case in this guide.
> If any part of the *previous* user (name, avatar, chat, wallet, stories) is
> still visible after switching accounts, report it immediately.

## 4. Country names — **priority 2**

The library that produced country names was removed; names now come from the
browser/server built-in language data. A wrong result here looks like a **2-letter
code (e.g. "TR", "IQ", "XK") instead of a country name**, or an English name in an
Arabic/Turkish/Kurdish page.

Repeat each row in **all 4 languages: English, Arabic, Turkish, Kurdish**.

| # | Where | Expected result |
|---|-------|-----------------|
| 4.1 | Country selection popup / country switcher | All countries listed with proper names, translated into the selected language |
| 4.2 | Settings → Personal Info → country field | Country name shown correctly, not a code |
| 4.3 | Phone number input — country list and selected country | Correct names and flags; search by country name works |
| 4.4 | Product page → delivery / extended area info | Country names correct |
| 4.5 | Checkout / address screens | Country names correct |
| 4.6 | Orders list and order details | Country names correct |
| 4.7 | Kurdish (ku) specifically, everywhere above | Country names appear in **Sorani Kurdish**, not English |

> If you see any **2-letter uppercase code** where a country name belongs, that is
> a bug — note the exact code and the screen.

## 5. Translated text on first load

Translations moved out of the browser bundle. The failure mode is **English text
appearing for one moment or permanently** on a page rendered by the server.

For each screen: switch to Arabic (then Turkish, then Kurdish), **hard-reload the
page** (Ctrl+F5 — not a link click), and check the text.

| # | Screen | Check |
|---|--------|-------|
| 5.1 | Home page | All labels, section titles and buttons translated |
| 5.2 | Listing page + filters window | Filter names, category names, sort options, buttons |
| 5.3 | Product page | Tabs, price labels, delivery info, buttons |
| 5.4 | Product page → buyer comments / ratings | Labels and empty states |
| 5.5 | Product page → FAQ section | Questions area labels, buttons |
| 5.6 | Orders list + order details | Statuses, labels, buttons |
| 5.7 | Seller Dashboard → product edit | Section titles, field labels |
| 5.8 | Seller Dashboard → boutique edit | Section titles, field labels, banners section |
| 5.9 | Arabic + Kurdish on all of the above | Layout stays right-to-left (RTL); nothing mirrored incorrectly |

> Also check the very first moment of loading, not only the settled page — a flash
> of English that disappears is still a bug worth reporting.

## 6. Features that now load on demand

These components are downloaded only when you open them. Test each on a **normal
connection** and again with the browser throttled to **Slow 3G** (DevTools →
Network → Slow 3G), because that is where problems appear.

| # | Feature | Steps | Expected result |
|---|---------|-------|-----------------|
| 6.1 | Story viewer | Home page → tap a story ring | Opens on the **first** tap. A loading placeholder may appear briefly, then the story plays. Swipe next/previous, close, and progress bars all work |
| 6.2 | Add story (camera) | Tap "Add story" → allow camera | Opens on the first tap; camera permission prompt appears; capture/upload completes; the new story appears |
| 6.3 | Image search | Search → image search icon | Opens on the first tap; upload an image; results return |
| 6.4 | Voice search | Search → microphone icon | Opens on the first tap; microphone permission prompt appears; speech is captured; results return |
| 6.5 | Product share sheet | Product page → Share | Opens on the first tap; all share options present and working (copy link, WhatsApp, etc.) |
| 6.6 | Rich-text editor — product | Seller Dashboard → product → description | Editor loads; Bold / Italic / Underline / Heading all work; saving keeps the formatting |
| 6.7 | Rich-text editor — boutique | Seller Dashboard → boutique edit → description | Same as 6.6 |
| 6.8 | Product stories | Product page → linked stories | Open and play correctly |

> **What a bug looks like here:** nothing happens on the first tap (needs a second
> tap), a blank white box instead of a loading placeholder, a loading placeholder
> that is a completely different size than the real content and makes the page
> jump, or a placeholder that never resolves.

## 7. Live-updating counters and header

The header, cart and notifications were changed to watch fewer pieces of data. The
risk is that something **stops refreshing** even though the underlying data changed.

| # | Steps | Expected result |
|---|-------|-----------------|
| 7.1 | Add a product to the cart | Cart badge count increases **immediately**, without refreshing the page |
| 7.2 | Remove a product from the cart / change quantity | Cart badge updates immediately and matches the real cart |
| 7.3 | Trigger a notification (e.g. an action that shows a toast) | Toast appears, is readable, and disappears on its own or on close |
| 7.4 | Switch language from the header | Header and page content switch language; layout direction changes for Arabic/Kurdish |
| 7.5 | Switch country from the header | Header updates; prices/currency update accordingly |
| 7.6 | Log in / log out | Header switches between guest and logged-in state immediately |
| 7.7 | Open the notifications panel | List loads, unread count is correct and clears as expected |

## 8. Video playback

An unused video library was removed. Verify nothing that plays video regressed.

| # | Steps | Expected result |
|---|-------|-----------------|
| 8.1 | Play a video story | Plays, with sound, progress bar advances |
| 8.2 | Play a product video (if the product has one) | Plays normally |
| 8.3 | Open a live-shopping / live video session, if available in the test env | Stream loads and plays |

## 9. Cross-cutting sweep

| # | Check |
|---|-------|
| 9.1 | Home, listing and product pages on **mobile** (real device or device emulation) |
| 9.2 | Home, listing and product pages on **desktop** |
| 9.3 | Navigate home → listing → product → back, several times; no flicker, no blank screens, scroll position behaves |
| 9.4 | Open the browser console (F12 → Console) during the flows above; report any **red errors** with a screenshot |
| 9.5 | Guest flow end-to-end: browse → add to cart → start checkout |
| 9.6 | Logged-in flow end-to-end: browse → add to cart → checkout → orders |

## 10. How to report an issue

For each issue include:

1. Which section/case number from this guide (e.g. "4.3, Kurdish").
2. Language and country selected.
3. Device / browser.
4. Whether it was a **hard reload** or an in-app navigation.
5. Screenshot or short screen recording.
6. Any red errors from the browser console.
7. Whether the same problem also happens on the current **staging/develop** build
   — this tells us if it is a new regression or a pre-existing issue.
