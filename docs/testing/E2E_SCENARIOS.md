# E2E scenarios

Every case the browser suite runs. Add a row whenever a case is added.

Design: `docs/testing/E2E_TEST_DESIGN.md`. How to run: `tests/e2e/README.md`.

## Guest journeys

Real staging. Nothing logs in. Everything is read-only except GUEST-32 to
GUEST-34, which register guests on staging because that is the behaviour they
test — about five per run, and they are not cleaned up (see rule 6 in
`tests/e2e/README.md`).

| ID | Case | Spec | What it proves |
|----|------|------|----------------|
| GUEST-01 | The root path redirects to a country-and-language path | `guest.live.spec.ts:16` | Locale routing in `proxy.ts` sends `/` to a `/xx-xx` path |
| GUEST-02 | The home page renders and stays up | `guest.live.spec.ts:37` | The app renders and hydrates with no uncaught exception |
| GUEST-03 | Search finds products | `guest.live.spec.ts:50` | The search opens, accepts typing, and returns results from staging |
| GUEST-04 | A listing leads to a product page | `guest.live.spec.ts:60` | A product card navigates to a real product page that has a title |
| GUEST-05 | The cart drawer opens for a guest | `guest.live.spec.ts:75` | The cart opens for someone who never logged in |
| GUEST-06 | A guest from a country we serve goes straight there | `locale.live.spec.ts:51` | A known country is used as-is, with no popup |
| GUEST-07 | A guest from a country we do not serve is asked to pick one | `locale.live.spec.ts:66` | An unknown country falls back to the default and shows the picker |
| GUEST-08 | A browser asking for a language we have gets it | `locale.live.spec.ts:80` | `Accept-Language` picks the language, and does not move the country |
| GUEST-09 | A browser asking for a language we do not have gets English | `locale.live.spec.ts:95` | An unknown language falls back to English, and does not move the country |
| GUEST-10 | A saved country beats the country the visitor is in | `locale.live.spec.ts:110` | The saved choice wins over detection, so travel or a VPN cannot undo it |
| GUEST-11 | An address for a different country than the saved one asks which to keep | `locale.live.spec.ts:130` | A shared link neither switches the country silently nor is ignored |
| GUEST-12 | An address with no country falls back to the saved one, keeping the path | `locale.live.spec.ts:152` | A bookmark with no locale is fixed up without losing the page asked for |
| GUEST-13 | An address matching the saved country and language is served untouched | `locale.live.spec.ts:176` | The ordinary page view is not redirected, and the cookies are not rewritten |
| GUEST-14 | A valid address with nothing saved is served, and the choice is saved | `locale.live.spec.ts:197` | A first-time shared link is honoured and remembered |
| GUEST-15 | An address carrying the pick-a-country marker is served, not bounced again | `locale.live.spec.ts:213` | The picker's own address does not loop |
| GUEST-16 | An address carrying the country-change marker is served, not bounced again | `locale.live.spec.ts:230` | The answer to GUEST-11 does not re-trigger GUEST-11 |
| GUEST-17 | A saved country with no saved language is ignored | `locale.live.spec.ts:251` | Half a saved pair does not half-apply; detection decides |
| GUEST-18 | A gb address with a different saved country goes to the saved country | `locale.live.spec.ts:301` | Nobody who has chosen is left on the default country |
| GUEST-19 | A crawler on a valid address is served it, and given no cookies | `locale.live.spec.ts:321` | Indexed pages carry no `Set-Cookie` |
| GUEST-20 | A crawler with no country gets a permanent redirect to one | `locale.live.spec.ts:339` | 308, not 307, so a crawler remembers the answer |
| GUEST-21 | A crawler is never asked to pick a country | `locale.live.spec.ts:349` | The picker is never indexed in place of a page |
| GUEST-22 | Answering the picker is remembered, and the next visit is not asked | `locale.live.spec.ts:370` | The choice sticks, even from another country |
| GUEST-23 | An answer arriving with other query values still remembers the choice | `locale.live.spec.ts:398` | The fixed bug at `proxy.ts:428` — the choice was lost and the picker re-asked |
| GUEST-24 | An answer with no country in the address still lands on a proper address | `locale.live.spec.ts:420` | The bypass does not strand a visitor on an address with no country |
| GUEST-25 | Too many bounces stops on a default address and asks | `locale.live.spec.ts:439` | The loop guard fires |
| GUEST-26 | A bounce within the limit still behaves normally | `locale.live.spec.ts:456` | The loop guard is a limit, not always-on |
| GUEST-27 | The timestamp marker is dropped on the way to a redirect | `locale.live.spec.ts:471` | `_t` does not survive onto the visitor's address |
| GUEST-28 | `robots.txt` is served as text, never locale-redirected | `locale.live.spec.ts:492` | Crawl rules are reachable |
| GUEST-29 | The site sitemap is served as XML | `locale.live.spec.ts:503` | The matcher excludes it |
| GUEST-30 | A sitemap under a country prefix is served as XML even when the saved country disagrees | `locale.live.spec.ts:511` | The bypass at `proxy.ts:278` — otherwise a crawler gets a redirect instead of XML |
| GUEST-31 | An address written in capitals is permanently redirected to lower case | `locale.live.spec.ts:535` | One page, one address, so it is not indexed twice |
| GUEST-32 | A first visit registers the guest and leaves them able to act | `session.live.spec.ts:110` | The app issues a working credential and the means to renew it, and can name who the guest is |
| GUEST-33 | A refused credential is exchanged, and the guest stays the same guest | `session.live.spec.ts:137` | The pair rotates and the identity survives, so a lapsed credential never interrupts browsing |
| GUEST-34 | A refused pair issues a new guest, and never asks anyone to sign in | `session.live.spec.ts:181` | When renewal cannot work the app issues a new guest silently — a guest has no account to sign in to |
| GUEST-35 | A global address with a saved country but no saved language still goes to that country | `locale.live.spec.ts:269` | `gb` is the global bucket, not a market — losing one cookie must not strand a visitor there with the picker up |
