# E2E scenarios

Every case the browser suite runs. Add a row whenever a case is added.

Design: `docs/testing/E2E_TEST_DESIGN.md`. How to run: `tests/e2e/README.md`.

## Guest journeys

Real staging, read-only. Nothing logs in and nothing writes.

| ID | Case | Spec | What it proves |
|----|------|------|----------------|
| GUEST-01 | The root path redirects to a country-and-language path | `guest.live.spec.ts:16` | Locale routing in `proxy.ts` sends `/` to a `/xx-xx` path |
| GUEST-02 | The home page renders and stays up | `guest.live.spec.ts:37` | The app renders and hydrates with no uncaught exception |
| GUEST-03 | Search finds products | `guest.live.spec.ts:50` | The search opens, accepts typing, and returns results from staging |
| GUEST-04 | A listing leads to a product page | `guest.live.spec.ts:60` | A product card navigates to a real product page that has a title |
| GUEST-05 | The cart drawer opens for a guest | `guest.live.spec.ts:75` | The cart opens for someone who never logged in |
| GUEST-06 | A guest from a country we serve goes straight there | `locale.live.spec.ts:34` | A known country is used as-is, with no popup |
| GUEST-07 | A guest from a country we do not serve is asked to pick one | `locale.live.spec.ts:49` | An unknown country falls back to the default and shows the picker |
| GUEST-08 | A browser asking for a language we have gets it | `locale.live.spec.ts:63` | `Accept-Language` picks the language, and does not move the country |
| GUEST-09 | A browser asking for a language we do not have gets English | `locale.live.spec.ts:78` | An unknown language falls back to English, and does not move the country |
| GUEST-10 | A saved country beats the country the visitor is in | `locale.live.spec.ts:93` | The saved choice wins over detection, so travel or a VPN cannot undo it |
| GUEST-11 | An address for a different country than the saved one asks which to keep | `locale.live.spec.ts:113` | A shared link neither switches the country silently nor is ignored |
| GUEST-12 | An address with no country falls back to the saved one, keeping the path | `locale.live.spec.ts:135` | A bookmark with no locale is fixed up without losing the page asked for |
