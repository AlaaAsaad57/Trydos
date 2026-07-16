# SD-01 — Homepage Feed

| | |
|---|---|
| **Feature ID** | SD-01 |
| **Domain** | A · Shopping & Product Discovery |
| **Status** | 🟢 Live |
| **Last verified** | 2026-07-03 (against `develop`) |
| **Source of truth** | `app/(client)/[lang]/page.tsx` |

---

## What it is

The homepage is the app's main landing screen. It stacks all the primary discovery
widgets into one scrollable feed so a shopper can search, browse categories, watch
stories, and see featured products, flash deals and boutiques — all from the first page.

## Where it appears

- **Route:** `/{lang}` — e.g. `/sy-en`, `/iq-ar`, `/tr-en`.
  `{lang}` is a combined **country-language** code (country + language).
- It is the default page users land on.

## Who uses it

Every visitor — guests and signed-in users alike. It is the top of the shopping funnel.

## What the shopper sees (top to bottom)

The feed is assembled in this fixed order:

1. **Search bar + Category navigation bar** — a white bar containing the search entry
   point and the scrollable main-category list. *(See SD-07 Search, SD-02 Categories.)*
2. **Stories bar** — the row of user/seller stories. *(See F · Stories.)*
3. **Featured products** — a horizontal strip of highlighted products. *(See SD-03.)*
4. **Flash deals** — a horizontal strip of time-limited deals. *(See SD-04.)*
5. **Boutiques / offers list** — seller storefronts, with a personalized "Recommended
   products" strip mixed in. *(See SD-05.)*

## How it works (verified behaviour)

- **Category filtering:** the homepage reads a `?mainCategory=<slug>` value from the URL.
  When present, that category is passed into Featured, Flash Deals and Boutiques, so the
  **entire feed narrows to the selected category**. Tapping a category in the bar sets
  this value (see SD-02).
- **Localization:** the `{lang}` route segment is split into country + language. These drive
  the language of every widget and the **currency** used for prices. Arabic and Kurdish
  render the top bar right-to-left.
- **Progressive loading (streaming):** each section is wrapped in its own React `Suspense`
  boundary with a dedicated skeleton placeholder (mobile-nav, stories, featured-products
  and offer-list skeletons), so the page appears quickly and each strip fills in as its
  data arrives rather than blocking the whole page.
- **Always fresh:** the page is marked `dynamic = "force-dynamic"`, so it is rendered
  fresh on every request (no stale cached homepage).
- **Search-engine metadata:** a `generateMetadata` step produces the page title,
  description, canonical URL and social-share (Open Graph / Twitter) tags per language and
  per selected category. If it fails, a safe fallback title/description is used.
  *(See I · Platform: SEO.)*

## Technical reference

| Item | Value |
|------|-------|
| Page file | `app/(client)/[lang]/page.tsx` |
| Rendering | Server component, `force-dynamic` |
| Category input | `searchParams.mainCategory` → passed to Featured / Flash / Boutiques |
| Currency | `getCurrency(country, language)` from `serverRequests` |
| Sections (components) | `SearchIcon`, `MainCategoriesNavbar`, `StoriesBarServer`, `FeaturedProductWrapper`, `FlashProductWrapper`, `Home`, `BoutiquesListWrapper` |
| Metadata | `GetHomeMetaData()` (`serverRequests/meta/home`) |
| Error handling | `LogServerError` → Sentry, then re-thrown to the error boundary |

## Current status & maturity

**Live and stable.** This is core, well-established functionality. All five sections are
in production.

## Known gaps / notes

No dedicated gaps found.

## Related features

SD-02 (Category nav) · SD-03 (Featured) · SD-04 (Flash deals) · SD-05 (Boutiques) ·
SD-07 (Search) · F · Stories · I · Platform (localization, SEO, currency).
