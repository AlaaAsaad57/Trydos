# SD-17 — Boutique Storefront

| | |
|---|---|
| **Feature ID** | SD-17 |
| **Domain** | A · Shopping & Product Discovery |
| **Status** | 🟡 Prtial 99% done check gaps/note |
| **Last verified** | 2026-07-04 (against `develop`) |
| **Source of truth** | `components/Listing/FiltersPageContent.tsx`, `components/Server/ListingBoutiqueSlider.tsx`, `components/Listing/ListingShareControl.tsx`, `services/elastic/elasticsearch-reader.service.ts` |

---

## What it is

A boutique's own **storefront header** shown on top of its product listing: the boutique's
banner image(s), its logo, its name, and a share button — so a boutique's page feels like *its*
shop, not a generic listing.

## Where it appears

On a boutique's listing URL: `/{lang}/filters/boutiques/<slug>`. There is **no** separate
`/boutique` route — a boutique storefront is the normal listing page (SD-14) that recognises a
boutique in the URL and adds the boutique header on top. Shoppers reach it by tapping a boutique
in the homepage "shop by boutique" section (SD-05).

## Who uses it

Shoppers browsing a specific seller's shop.

## How it works (verified behaviour)

- **Boutique detected from the URL.** When the listing URL contains a boutique slug, the page
  loads that boutique's details and shows the storefront header; without one, it's a plain
  listing.
- **The header shows:**
  - a **swipeable banner slider** over the boutique's banner images (only non-deleted banners),
  - the boutique **logo** and **name**,
  - a compact logo that stays in the sticky bar when the header scrolls away.
- **Share button.** A share control opens a bottom sheet to share the current storefront URL to
  Facebook, X, WhatsApp, Telegram, Email, Copy Link or the device's native share — each tagged
  with its channel (`utm_source`) for attribution.
- **Products below.** The rest of the page is the standard listing grid, filters and sort
  (SD-14/14/15), scoped to that boutique.
- **Graceful miss.** If the boutique can't be found, the shopper is redirected to the homepage
  with a "boutique not found" message.

## Data source

| Item | Value |
|------|-------|
| Boutique details | `ElasticsearchReader.getBoutiqueInfo({ country, language, slug })` (`services/elastic/elasticsearch-reader.service.ts`) — queries `catalog_index`, matching the nested `custom_boutiques.slug` + language |
| Returned fields | **only** `{ name, icon, banners }` (banners filtered to non-deleted) |
| Products | the same Elasticsearch listing query as SD-14, scoped to the boutique |

## Technical reference

| Item | Value |
|------|-------|
| Storefront banner | `components/Server/ListingBoutiqueSlider.tsx` (`BoutiqueHeader` + banner slider) |
| Banner carousel | `components/clientWrapper/filtersPage/BoutiquePhotoSliderWrapper.tsx` (Embla) |
| Sticky mini-logo | `components/Listing/BoutiqueMiniLogo.tsx` |
| Share control | `components/Listing/ListingShareControl.tsx` (bottom sheet, `utm_source` per channel) |
| Boutique fetch | `getBoutique()` in `FiltersPageContent.tsx` → `getBoutiqueInfo()` |
| Not-found redirect | `/{country}-{language}?message=boutique_not_found` |

## Current status & maturity

**Live and stable.** The share control is recent (it replaced an older
`ShareBoutiquePageButton`, now removed).

## Known gaps / notes

- **The verification / top-seller badges in the banner are hardcoded icons**, not driven by real
  boutique data. (plan to be solved later)


## Related features

SD-05 (Boutiques list that links here) · SD-14 (Listing engine) · SD-15 (Filters) · SD-16 (Sort)
· SL-01 (Seller dashboard entry — the *private* seller side; this SD-17 storefront is the
*public* shop face) · PF-32 (Multi-channel sharing).
