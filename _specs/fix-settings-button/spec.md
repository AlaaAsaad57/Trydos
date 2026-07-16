---
ticket: fix-settings-button
stage: spec
mode: standard
status: complete
owner: developer
updated: 2026-06-20
links:
  clickup: https://app.clickup.com/t/86ey0f0d2
  github:
---

# Spec — fix-settings-button

> Define *what* must be true when done. **No implementation details, no file
> names, no code.**

## Feature Name

Settings Menu Item Navigation Fix

## Business Goal

Buyers can reach the Settings screen from the dropdown Menu at any point during their order-browsing session. Currently the Settings item silently does nothing when the buyer is on the Orders list or Order Details page, forcing them to manually navigate away before Settings becomes accessible. Fixing this removes a dead-end interaction and preserves trust in the navigation UI.

## User Story

> As a buyer, I want the Settings button in the Menu dropdown while I am on the Orders or Order Details views to navigate me to the Settings screen when tapped, so that I can manage my settings without having to navigate away from my orders first.

## Functional Requirements

- FR-1: The Settings item in the Menu dropdown must navigate to the Settings screen when tapped from the Orders list page.
- FR-2: The Settings item in the Menu dropdown must navigate to the Settings screen when tapped from the Order Details page.
- FR-3: After tapping the Settings item, the Menu dropdown must close.
- FR-4: The Settings item must continue to navigate to the Settings screen when tapped from any other buyer-facing page where it already works (e.g. homepage, product pages, compare page).
- FR-5: When the buyer is already on the Settings root screen (exact path), tapping the Settings item must close the menu without breaking the page.

## Non-Functional Requirements

- NFR-1: No observable change in navigation behaviour on pages not covered by FR-1 and FR-2.
- NFR-2: The fix must work correctly for all supported locales and both LTR and RTL layouts.
- NFR-3: No new dependencies or UI components are introduced.

## Constraints

- CON-1: The fix must respect the existing locale-prefixed URL structure (`/${lang}/settings`).
- CON-2: The existing "close menu on tap" behaviour must be preserved for all menu items.

## Edge Cases

- EC-1: Buyer is on a deep settings sub-page other than Orders (e.g. profile, preferences) — same fix applies but these are also out of scope for explicit testing in this ticket.
- EC-2: RTL locale (Arabic, Kurdish) — the fix is purely logical and must not alter layout direction behaviour.
- EC-3: The Menu opens while the Orders list is still loading — the Settings item must still navigate correctly; no timing dependency exists.

## Open Questions

- None. Root cause and expected behaviour are fully confirmed by research.

## Acceptance Criteria Mapping

> Give each criterion a stable ID (AC-1, AC-2, …); `verify.md` references these.

| ID   | Acceptance criterion | Maps to requirement |
|------|----------------------|---------------------|
| AC-1 | Tapping the Settings item in the Menu dropdown while on the Orders list page navigates the buyer to the Settings screen. | FR-1 |
| AC-2 | Tapping the Settings item in the Menu dropdown while on the Order Details page navigates the buyer to the Settings screen. | FR-2 |
| AC-3 | The Menu dropdown closes after tapping the Settings item, regardless of which page the buyer is on. | FR-3 |
| AC-4 | The Settings item continues to navigate to the Settings screen when tapped from pages where it already worked (e.g. homepage). | FR-4 |
| AC-5 | When the buyer is already on the Settings root page (exact path), tapping the Settings item closes the menu without error or broken navigation. | FR-5 |

## Out of Scope

- The Compare menu item (shares the same navigation guard pattern but is not reported as broken; separate ticket if needed).
- Visual or layout changes to the Settings menu item or the Menu dropdown.
- Seller-side views and seller dashboard pages.
- Changes to the Settings screen content or sub-pages.
- Deep settings sub-pages beyond Orders list and Order Details (EC-1 is noted but not explicitly verified).
