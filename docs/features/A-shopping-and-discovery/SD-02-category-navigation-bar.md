# SD-02 — Category Navigation Bar

| | |
|---|---|
| **Feature ID** | SD-02 |
| **Domain** | A · Shopping & Product Discovery |
| **Status** | 🟢 Live |
| **Last verified** | 2026-07-03 (against `develop`) |
| **Source of truth** | `components/Server/MainCategories/index.tsx`, `components/Home/CategoryNavMobile.tsx` |

---

## What it is

A horizontal, scrollable bar of the store's **main shopping categories** at the top of the
homepage. Tapping a category filters the entire homepage feed to that category.

## Where it appears

- At the top of the homepage (`/{lang}`), inside the same white bar as the search entry point.

## Who uses it

Every shopper — it is the primary way to browse the catalogue by category from the home screen.

## How it works (verified behaviour)

- **Where the categories come from:** the list is read from the **product search index
  (Elasticsearch)**. The app pulls category records for the shopper's country, keeps the
  translation that matches the current language, and removes duplicates so each category
  appears once.
- **Selecting a category:** each item is a link.
  - Tapping an inactive category navigates to `/{lang}?mainCategory=<slug>` — this reloads
    the homepage filtered to that category (Featured, Flash Deals and Boutiques all narrow
    to it — see SD-01).
  - Tapping the **already-active** category navigates back to `/{lang}` — i.e. it acts as a
    toggle that clears the filter.
- **Active state:** the selected category is **moved to the front** of the bar, shows an
  "active" marker icon, and swaps its flat icon for its outline icon.
- **Icons & labels:** each category shows a 25×25 icon and its translated name (truncated).
- **Direction-aware:** the bar and its scroll behaviour adapt to right-to-left for Arabic
  and Kurdish (handled by the surrounding `Navbar`/`NavbarServer`).

## Two ways it is served

| Path | Purpose |
|------|---------|
| `GetMainCategories({ country, language })` in `serverRequests/home.tsx` | Used when server-rendering the homepage bar. |
| `GET /api/home/mainCategories` | The same data as a JSON API (reads `country` / `language` request headers), available for other callers (mobile app). |

Both return, per category: `id`, `name`, `slug`, `flat_photo_path`, `outline_photo_path`,
`fill_photo_path`. Both use `ElasticsearchReader.getCategories({ country, size: 4000 })`.

## Technical reference

| Item | Value |
|------|-------|
| Server component | `components/Server/MainCategories/index.tsx` (`MainCategoriesNavbar`) |
| Item component | `components/Home/CategoryNavMobile.tsx` |
| Scroll container | `components/Server/Navbar` (`NavbarServer`) — RTL-aware scroll |
| Data (SSR) | `GetMainCategories()` → `ElasticsearchReader.getCategories()` |
| Data (API) | `app/api/home/mainCategories/route.ts` |
| Link target | `/{lang}?mainCategory=<slug>` (or `/{lang}` to clear) |
| Errors (API) | `LogServerError` → Sentry; returns 500 JSON on failure |

## Current status & maturity

**Live and stable.** Established core navigation.

## Known gaps / notes

- The category list is capped at `size: 4000` records fetched from the index before
  de-duplication — comfortably above the real category count, but noted for completeness.

## Related features

SD-01 (Homepage feed — receives the `mainCategory` filter) · SD-03 / SD-04 / SD-05
(all narrow to the selected category) · SD-14 (Listing page).
