# Checklist settings page + menu cleanup — design

Date: 2026-07-26
Status: approved

## Goal

Move the CheckList out of the header menu's slide-over panel and into a proper
settings screen at `/settings/checklist`, give its items a design that matches
the rest of the settings screens, and add loading feedback to both the
add-to-checklist action and the remove-from-checklist action. As a follow-up,
drop the debug-only items that share the same menu.

## Background

Today the checklist lives in `components/WishList/WishListPanel.tsx`, a
fixed-position 400px panel opened from a `CheckList` item in
`components/Home/Menu.tsx`. It is styled with inline styles that match nothing
else in the app, and half of its item markup is commented out (price, colours,
sizes) because the `/checklist` endpoint does not return those fields.

The same menu also carries four debug affordances: "Show OTP Statics",
"Reset Redeemed Products", "Make Chat Token Expired" and
"Make Stories Token Expired".

## Data contract

`GET /checklist?page=&page_size=10` (gateway) returns, per item, only:
`id`, `name`, `slug`, `image` — plus `has_next` / `total_pages` for paging.
There is no price, colour or size, so the item design must not imply them.

## Design

### 1. Settings entry

`app/(client)/[lang]/settings/page.tsx` gains one entry at the head of the
existing `options` array, rendered by the existing `SettingOption` row
component (53px, `#f8f8f8`, `rounded-[15px]`):

```
{ name: "My Checklist", Icon: "/icons/Heart.svg", href: `/${lang}/settings/checklist` }
```

`Heart.svg` already exists and fits the `w-[25px] h-[25px]` slot.

### 2. Route

- `app/(client)/[lang]/settings/checklist/page.tsx` — server component
  following the `settings/profile/address` pattern: await `params`, split
  `country-language`, render the standard
  `flex-col w-full pt-[20px] px-[12px] flex setting-screen` wrapper.
- `components/setting/checklist/ChecklistView.tsx` (`"use client"`) —
  `BackBar` (`name = "My Checklist"`, `preivous_page = /{local}/settings`)
  plus the list: loading state → items → "Load more" → empty state. Fetch and
  pagination logic is carried over unchanged from `WishListPanel`.
- `components/setting/checklist/ChecklistItem.tsx` — the row card.

### 3. Item design

Full-width rows in the settings visual language
(`bg-[#F8F8F8] rounded-[15px] p-[12px] mt-[8px]`), direction-aware:

- 64×72 rounded image, the row itself is a `NextLink` to
  `/{lang}/products/{slug}`
- Product name, clamped to two lines
- Remove button in the trailing corner; `stopPropagation` so it does not
  navigate
- Removing state: the button swaps to `<Spinner />` and the row goes
  `opacity-50 pointer-events-none`. Per-row only — other rows stay
  interactive. The row leaves the list on success and is restored on failure,
  with the existing error toast.
- The remove `aria-label` uses `translateFunction("Remove")` instead of the
  current hardcoded English.

### 4. Add-to-checklist loading state

`components/products/MoreOptionsSection.tsx` already tracks `wishlistLoading`
but never renders it. While loading, the button's SVG swaps to `<Spinner />`
and the button gets `opacity-60 cursor-wait`. The existing early return already
blocks double taps.

### 5. Menu cleanup — `components/Home/Menu.tsx`

| Removed menu item | Also deleted |
|---|---|
| CheckList | `components/WishList/WishListPanel.tsx`, `showWishList` state |
| Show OTP Statics | `components/Home/OtpStatsModal.tsx`, `serverActions/otpStats.ts`, `getOtpStats` + `OtpStats` in `serverRequests/radis/index.ts`, references in `eslint.config.mjs` and `.i18nignore` |
| Reset Redeemed Products | `deleteCookie` import |
| Make Chat Token Expired | `userChat` local |
| Make Stories Token Expired | `userStories` local |

`utils/server/otpIdentity.resolveOtpIdentity` stays — the real send-OTP flow
uses it.

The menu is left with: Settings, Notifications, Compare, Logout.

### 6. Translations

One new key, `"My Checklist"`, added to all three of
`public/translations/translations.{ar,tr,ku}.js` before it is used. Every other
string already has an entry: `Load more`, `Loading...`,
`Your CheckList is empty`, `Remove`, `Removed from checklist`,
`Failed to remove from checklist`.

## Out of scope

- Price, colours or sizes on checklist items — the endpoint does not return
  them, and fetching them per item would add N requests per page.
- Any change to the checklist API or to `services/wishlist.ts`.
- Renaming the `wishlist` service/module to `checklist`.
