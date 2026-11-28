---
ticket: ui-migrations-7e-start-flow
stage: spec
mode: standard
status: complete
owner: developer
updated: 2026-11-28
links:
  clickup:
  github:
---

# Spec — ui-migrations-7e-start-flow

> Define *what* must be true when done. **No implementation details, no file
> names, no code.**

## Feature Name

Stage 7e part 2 — the real start flow (start animation → country picker → Quick
Preview → Get Started) and the real guest sign-in request sheet.

## Business Goal

The designer approved the start flow and the sign-in request sheet on `/demo`
(`development`). Today the real app still shows the old "Select Your Region" popup,
and a guest is never asked to sign in with the new design. This ticket puts the
approved screens in front of real visitors, with the real country list, the real
country choice and the real login, and removes the old popup. It also fixes the
hang that stops the flagged home page from loading on the deployed `ui-migrations`
build, because the new flow shows on exactly those addresses.

## User Story

> As a visitor whose country the site does not know, I want to pick my country in
> the new start flow and then see the Quick Preview and sign in or look around, so
> that I shop in the right country from the first page.
>
> As a guest, I want the new sign-in request sheet to ask me to sign in a few
> seconds after a page shows, and bring me back to the same page after I sign in,
> so that I can unlock all features without losing my place.

## Functional Requirements

### Start flow

- **FR-1 When it shows.** The start flow shows exactly where the old popup shows
  now: on an address with a `gb-` locale, with `?no-country`, or with
  `?changed-country` (owner default 1, 2026-11-28). It never shows anywhere else,
  never to a bot, and never twice in one page load.
- **FR-2 Order and look.** The flow runs in the `/demo` order: the start animation,
  then the column rises with the country picker (boards `Ramaaz pay signin – 16` /
  `– 15`), a pick slides the part under the pill and logo to the Quick Preview's
  slider, then Get Started. It looks and moves exactly as `/demo` on `development`
  (S7e-1), as a layer over the page.
- **FR-3 Page under it.** The real page renders under the layer (server HTML, for
  search engines). The shopper does not see that page before the start animation
  covers it.
- **FR-4 Country rows (new visitor).** On a `gb-` or `?no-country` address the rows
  are the countries of the real country list (the one the old popup reads), each
  with its flag and its name in the page's language. The map paints the same
  countries. Nothing is chosen at first.
- **FR-5 Country rows (changed country).** On `?changed-country=<new>,<old>` the
  picker shows **only those two countries**, with the new country (the one in the
  address) shown as chosen, as on board `– 15` (owner, 2026-11-28). The map keeps its
  drawing; the new country is filled and lined as chosen. A tap on either row picks
  that country. A tap on a map country that is not one of the two does nothing.
- **FR-6 A pick.** A tap on a row or on a map country picks it once (the first tap
  wins), with the `/demo` fill motion and hold. At the pick the site saves the
  country and the current language as the shopper's locale (the same cookies the
  old popup sets) and loads that country's starter settings, as the old popup does.
  The flow then goes on to the Quick Preview with **no page reload** in between.
- **FR-7 The end of the flow.** "Later" on the Quick Preview / Get Started, the
  close, and the end of the login all end the flow. The site then opens the same
  page path in the picked country and the current language, with `no-country`,
  `changed-country` and `_bypass` gone from the address, and the flow does not show
  again on that load.
- **FR-8 Get Started.** Get Started in the flow opens the real login of Stage 2 (send
  code, verify, the 3-wrong-codes lock, resend, name, its events), in the same
  layer (owner default 2).
- **FR-9 List errors.** While the country list loads, the rows show a skeleton in
  their place. If the list cannot be read, the picker offers a retry, as the old
  popup does (A2-21), and the retry reads the list again.
- **FR-10 The old popup goes.** No address shows the old "Select Your Region" popup.
  Its code and its unit test are deleted once nothing uses them (D-6). The settings
  countries page is not changed.
- **FR-11 Notifications.** While the start flow shows, the app does not re-send the
  notification permission to the backend, as the old popup case does now.

### Sign-in request sheet

- **FR-12 Who.** Only a guest sees the sheet. A guest is a shopper whose profile is
  known and has no valid phone. While the profile is not known yet, the sheet waits.
  A signed-in shopper never sees it.
- **FR-13 Where.** Every page under the locale except the login page, `/loginDemo`
  and `/demo` (owner, 2026-11-28). Bots never see it.
- **FR-14 When.** 5 s after the page shows, once per page load. On a load that shows
  the start flow, the 5 s start when the flow ends without a sign-in. While another
  sheet, popup or overlay is open (the cart, a chat, the search, a story, add story,
  a call, the payment frame, the login, the session-expired or phone check widget),
  or while the shopper types in a field, it waits and checks again every second, as
  on `/demo`.
- **FR-15 Look.** The sheet looks and moves exactly as `/demo` on `development`
  (board `Sign In request`), with the Quick Preview slides in its card,
  `e1218dd5b` (no white under "Later" in iPhone Safari 26) and `88bf4e63a` (the
  card's line is never cut).
- **FR-16 Actions.** "Get Started" opens the real login as a layer over the page;
  the end of the login (signed in, "Later" or the close) comes back to the same page,
  at the same place. After a sign-in the page shows the signed-in state without a
  full reload. "Later", a tap on the dimmed page and a drag down close the sheet.
  "More Info" shows "Soon available" (S7e-3; no destination exists).

### Flagged home page

- **FR-17 No hang.** On a deployed build of this branch, `/gb-en`, `/gb-ar` and
  `/sy-en?no-country=true` finish loading (the document ends with `</html>`) and the
  start flow shows on them.

## Non-Functional Requirements

- **NFR-1 Speed (S7e-9).** On a page that shows neither the flow nor the sheet, the
  JS loaded by the load event grows by at most 1,024 B (gzip) over "before". The
  flow's heavy parts (login widget, map, splash fix) load only on an address that
  shows the flow. The sheet's body loads only when the sheet is due. No cache is
  added as a speed fix. Measured on a production build, 4x CPU, median of 5, on
  `/sy-en` (home), `/sy-en/about` (an old page) and `/gb-en` (the flow), before and
  after. The numbers go in "Where Stage 7e stopped".
- **NFR-2 Same design (S7e-1, S7e-7).** Compare every new real screen with `/demo` on
  `development` at 440 x 802, 402 x 712 and 375 x 635, in Chromium and WebKit, in
  `en` and `ar`. Each difference that is left, and why, goes in "Where Stage 7e
  stopped".
- **NFR-3 RTL.** Logical sides; `ar` mirrors as `/demo` does (A-13, A-14).
- **NFR-4 Words.** Every user-visible word is translated in `ar`, `tr` and `ku`; no
  English leaks in `ar`.
- **NFR-5 Events.** Only existing analytics events (D-10). The login widget keeps its
  events. No new event is added for the pick or the sheet.
- **NFR-6 Reduced motion.** With "reduce motion" on, moves are instant and fades stay,
  as on `/demo`.
- **NFR-7 Safari 26.** The start flow's bottom logo looks as it does on `development`
  with the default splash fix; no debug menu, ruler or badge appears.

## Constraints

- Work on `ui-migrations`; the ticket branch is cut from it and the PR goes to it
  (S7e-5).
- Shipping code never imports the `/demo` data files (S7e-6).
- No designed part is removed or hidden because the backend lacks it (S7e-3).
- The protected runtime paths change only if `plan.md` lists them.
- Tests: the plan's rule of 2026-11-04 (no new unit tests, no local Vitest runs,
  the full unit suite in CI); tests that exist stay green or are changed with a
  reason; e2e is left for Stage 8 (A-34).
- Never two login canvases at once (one scaled canvas rule).

## Edge Cases

- A visitor on `/sy-en?no-country=true` (not a `gb-` address): a pick ends on
  `/<picked>-<lang>/<same path>` with the flag gone, not on the same address.
- A visitor closes the tab after the pick but before the flow ends: the saved
  country takes them to that country on the next visit (the proxy already moves a
  `gb-` address with a saved country).
- The country list has a country with no shape on the map: it gets a row with its
  flag and no map shape. (Staging has exactly the 4 map countries on 2026-11-28.)
- `changed-country` names a country that is not in the list: its row still shows,
  with its flag and name.
- The flow ends with a sign-in: no sign-in sheet on that load.
- A guest opens the sheet's login and signs in on a page that needs a signed-in
  shopper's data: the page shows the signed-in data after the login.
- The session-expired widget or the phone check is open when the sheet is due: the
  sheet waits; it never opens a second login canvas.
- A move inside the site (no reload) does not start the sheet's 5 s again once it
  came up.
- "Reduce motion" on: the fill and the slides are instant.

## Research Questions Resolved

| OQ | Answer | Lands in |
|----|--------|----------|
| OQ-1 | (b): at the pick, save the locale cookies and load the starter settings; move to the picked country's address only when the flow ends. No reload between the pick and the Quick Preview. | FR-6, FR-7, AC-6, AC-7 |
| OQ-2 | Owner (2026-11-28): only the two countries of `changed-country`, the new one shown as chosen; a tap picks either. The old "You previously visited" line is not drawn (no board). | FR-5, AC-5 |
| OQ-3 | Bots never see the flow or the sheet. How the client knows a bot is the plan's call. | FR-1, FR-13, AC-2; Open Questions (OQ-3) |
| OQ-4 | Rows come from the real list; the map paints the list's countries that it draws; a list country with no shape gets a row only. Load skeleton and retry as in A2-21. | FR-4, FR-9, Edge Cases, AC-4, AC-9 |
| OQ-5 | Every word is translated in `ar`/`tr`/`ku`, within the NFR-1 byte budget. Where the words come from is the plan's call. | NFR-4, NFR-1; Open Questions (OQ-5) |
| OQ-6 | Never two login canvases; the sheet waits while the session-expired or phone check widget is open. How it is kept is the plan's call. | FR-14, Constraints, AC-13; Open Questions (OQ-6) |
| OQ-7 | Yes, still true on 2026-11-28 (`/gb-en` sent 179 KB and stopped at 40 s; `/sy-en` ended in 1.1 s). Owner: fix it in this ticket. | FR-17, AC-17 |
| OQ-8 | A pick from any flagged address ends on `/<picked>-<lang>/<same path>` with the flags gone. | FR-7, Edge Cases, AC-7 |
| OQ-9 | "More Info" shows "Soon available" (S7e-3). | FR-16, AC-16 |
| OQ-10 | Owner (2026-11-28): every page except the login page, `/loginDemo` and `/demo`; it waits while another sheet or overlay is open. | FR-13, FR-14, AC-12, AC-13 |
| OQ-11 | Profile not known yet = wait; guest = profile known with no valid phone. | FR-12, AC-11 |
| OQ-12 | After the sheet's login the page shows the signed-in state with no full reload, and the page keeps its own colours. How is the plan's call. | FR-16, AC-15; Open Questions (OQ-12) |
| OQ-13 | Yes: delete the old popup and its unit test once nothing renders it; change the `Init` test where it asserts on the popup; e2e selectors wait for Stage 8 (A-34). | FR-10, Constraints, AC-10 |
| OQ-14 | `/sy-en`, `/sy-en/about`, `/gb-en` (the "before" for `/gb-en` is taken on a local production build if the deployed one still hangs). | NFR-1, AC-18 |

## Open Questions

- **OQ-3** (deferred to `/plan`): how the client knows a bot, and whether `proxy.ts`
  must change for it.
- **OQ-5** (deferred to `/plan`): the word source for the picker and the sheet on
  pages with no screen shell.
- **OQ-6** (deferred to `/plan`): how the one-scaled-canvas rule is kept.
- **OQ-12** (deferred to `/plan`): how the page refreshes its data and its colours
  after the sheet's login layer closes.
- **OQ-15** (new, for `/plan`): the cause of the flagged-home hang (FR-17), proven on
  a deployed build, and whether the fix touches a protected path.

## Acceptance Criteria Mapping

| ID | Acceptance criterion | Maps to requirement |
|----|----------------------|---------------------|
| AC-1 | On `/gb-en`, `/sy-en?no-country=true` and `/sy-en?changed-country=sy,tr` the start flow shows; on `/sy-en` with matching cookies it does not; it shows at most once per page load. | FR-1 |
| AC-2 | With a Googlebot user agent, none of the AC-1 addresses shows the flow or the sheet, and the page's server HTML holds the page content. | FR-1, FR-3, FR-13 |
| AC-3 | The flow runs start animation → picker → Quick Preview → Get Started, and a frame-by-frame capture shows no frame with the page's content visible before the start animation covers it (4x CPU). | FR-2, FR-3 |
| AC-4 | On `/gb-en` the rows are exactly the countries the real list returns, with flags and names in the page's language (`en` and `ar` checked), nothing chosen; the map paints them. | FR-4 |
| AC-5 | On `/sy-en?changed-country=sy,tr` exactly two rows show (Syria, Turkiye), Syria shown as chosen on the row and the map; a tap on Turkiye picks Turkiye; a tap on the Iraq shape does nothing. | FR-5 |
| AC-6 | After a pick the `country` / `lang` cookies hold the picked country and current language, the starter settings request ran, the Quick Preview shows, and no page load happened between the pick and the Quick Preview. | FR-6 |
| AC-7 | "Later", the close, and a finished login each end on `/<picked>-<lang>/<same path>` with no `no-country`, `changed-country` or `_bypass` in the address, and the flow does not show again there. | FR-7 |
| AC-8 | Get Started in the flow opens the real login: a code is sent to a real staging phone, a wrong code counts toward the 3-wrong-codes lock, and a right code signs in. | FR-8 |
| AC-9 | With the country list request failing, the picker shows a retry; after the request works again, the retry fills the rows. While loading, a skeleton holds the rows' place. | FR-9 |
| AC-10 | No address shows the old popup (`data-pw="country-popup"` is absent everywhere); its code and its unit test are gone; nothing imports it; the settings countries page still works. | FR-10 |
| AC-11 | A signed-in shopper never sees the sheet after 15 s on home; a guest sees it 5 s (±1 s) after home shows; before the profile is known it does not show. | FR-12, FR-14 |
| AC-12 | The sheet shows to a guest on home, a product page and an old page (`/about`), and never on the login page, `/loginDemo` or `/demo`. | FR-13 |
| AC-13 | With the cart, the search or a chat open, or a field focused, when the 5 s pass, the sheet waits and comes up within 1 s after it closes or the field loses focus; with the session-expired widget open it never opens a second login canvas. | FR-14 |
| AC-14 | The sheet matches `/demo` on `development` (NFR-2 sizes, engines, `en` and `ar`); in iPhone Safari 26 no white shows under "Later" and the card's line is not cut. | FR-15, NFR-2 |
| AC-15 | The sheet's "Get Started" opens the login over the page; after a sign-in the shopper is on the same page at the same scroll, the page shows signed-in data, no full reload happened, and the page keeps its own colours. | FR-16 |
| AC-16 | "Later", a tap on the dimmed page and a drag down each close the sheet; "More Info" shows "Soon available". | FR-16 |
| AC-17 | On a deployed build of the branch, `/gb-en`, `/gb-ar` and `/sy-en?no-country=true` each end with `</html>` within 10 s, and the start flow shows on them. | FR-17 |
| AC-18 | The NFR-1 numbers (before and after, three pages) are written in "Where Stage 7e stopped"; on `/sy-en` and `/sy-en/about` the growth is at most 1,024 B. | NFR-1 |
| AC-19 | The start flow screens match `/demo` on `development` at the NFR-2 sizes and engines in `en` and `ar`; every difference left is written with its reason; in WebKit with a Safari 26 user agent the bottom logo shows the default fix and no debug part. | FR-2, NFR-2, NFR-3, NFR-7 |
| AC-20 | `pnpm lint` (with the i18n rule), `pnpm lint:i18n-parity`, typecheck and `pnpm build` pass; the full unit suite in CI has no red beyond the known old reds of part 1. | NFR-4, Constraints |

## Out of Scope

- Step 6 (the orders screens) — part 3.
- Showing the start flow on every load, as `/demo` does (owner default 1).
- Changing the other login openers; they keep `/[lang]/login?next=` (D-11).
- The settings countries page and its own picker.
- New analytics events.
- The e2e suite (Stage 8, A-34).
- The "You previously visited from X" message of the old popup (no board).
