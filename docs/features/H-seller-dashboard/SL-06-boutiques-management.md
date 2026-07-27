# SL-06 — Boutiques Management

| | |
|---|---|
| **Feature ID** | SL-06 |
| **Domain** | H · Seller Dashboard |
| **Status** | 🟡 Partial — create / edit / activate all work; **delete is built but switched off in code** pending a product decision |
| **Last verified** | 2026-07-27 (against `develop`) |
| **Source of truth** | `app/(client)/[lang]/sellerProfile/sellerDashboard/[sellerId]/page.tsx` (`renderBoutiques`), `…/boutiques/new/page.tsx`, `…/boutiques/[boutiqueId]/page.tsx`, `components/SellerDashboard/boutiqueEdit/*`, `services/sellerDashboard/index.ts` |

---

## What it is

The **Boutiques** tab of the seller dashboard — the shop's sub-storefronts. It lists every boutique
as a card and opens a full editor where a seller can **create** a boutique, **edit** its per-language
name, description, bio, icon and banners, choose where it is **available** (web / mobile / both),
restrict it to countries, and **activate or deactivate** it.

## Where it appears

- Seller dashboard → **Boutiques** tab.
- **"+ Add Boutique"** (or "Add your first boutique" on the empty state) → `…/boutiques/new`.
- Tapping a boutique card → `…/boutiques/<boutiqueId>`.

## Who uses it

**Sellers / shop staff** whose role includes a boutique permission. Actions are gated separately:
view (`READ_BUTIKS`), create (`CREATE_BUTIKS`), edit (`UPDATE_BUTIKS`), status
(`CHANGE_BOUTIQUE_STATUS`), delete (`DELETE_BUTIKS`).

## How it works (verified behaviour)

- **The list** loads on first open and is then cached in shared context. Each card shows the
  boutique's icon/banner (or a "No Image" placeholder), the name overlaid on the image, a green
  **Active** / grey **Inactive** badge, the description with HTML stripped and truncated to 100
  characters, and a `/slug` chip. There is no pagination — the whole list is fetched at once.
- **Per-language content.** The editor is language-tabbed: **name**, **description**, **bio**, an
  **icon** and an ordered set of **banners** are held per language, with a "copy from" control to
  reuse another language's value.
- **Rich-text description.** Description and bio are written in a small formatting editor (bold,
  italic, underline, H2) and the HTML is **sanitised at save time**. The editor is lazy-loaded, so it
  costs nothing until the form opens.
- **Availability.** A single select — **Web**, **Mobile**, or **Web + Mobile** — driven by the
  server's lookup list, with a built-in fallback if the lookup returns nothing. Values the app doesn't
  recognise are never offered.
- **Banner rules (enforced):** recommended **1280 × 750 (16:9)**; a hard **10 MB** ceiling on banners
  and the icon; minimum width 600px and an aspect ratio between 1.5 and 1.8.
- **Countries.** The boutique can be limited to a set of countries.
- **Status is part of Save.** "Set active" / "Set inactive" toggles the pending status in the form and
  it is applied as a **second call** when you save. If the edit succeeds but the status call fails,
  the edits stay saved, the toggle reverts, and the reason is shown — including any blocking reasons
  the server returns (e.g. missing required content).
- **Create** posts the same payload shape without a status step — a brand-new boutique is created
  first and can then be activated from its own page.
- **Delete is disabled.** The confirm-and-delete path is fully implemented against a real endpoint,
  but the button is hidden behind a hardcoded `canDelete = false` while the team decides whether
  sellers should be able to delete boutiques at all. (Deletion is a soft-delete with no undo.)

## Data source

| Item | Value |
|------|-------|
| Boutiques list | `getSellerBoutiques(sellerId)` → **GET `/shop/boutiques`** (`market-dashboard`), reads `data.boutiques` |
| Create form lookups | `getBoutiqueCreateForm(sellerId)` → **GET `/shop/boutiques/lookups`** |
| Load one for edit | `getBoutiqueForEdit(sellerId, boutiqueId)` → **GET `/shop/boutiques/{id}/edit`** |
| Create | `addBoutique(sellerId, payload)` → **POST `/shop/boutiques`** |
| Update | `updateBoutique(sellerId, boutiqueId, payload)` → **POST `/shop/boutiques/{id}/update`** |
| Activate / deactivate | `changeBoutiqueStatus(sellerId, boutiqueId, status)` → **POST `/shop/boutiques/{id}/change-status`** |
| Delete | `deleteBoutique(sellerId, boutiqueId)` → **POST `/shop/boutiques/{id}/delete`** *(implemented, not reachable in the UI)* |
| Languages | `getLanguages()` → **GET `/languages`** |

## Technical reference

| Item | Value |
|------|-------|
| Tab renderer | `page.tsx` → `renderBoutiques()` |
| Routes | `…/boutiques/new/page.tsx` · `…/boutiques/[boutiqueId]/page.tsx` → `<BoutiqueEditor mode="create" \| "edit">` |
| Editor | `components/SellerDashboard/boutiqueEdit/{BoutiqueEditor,sections,controls,helpers}.tsx` |
| Sections | Availability · Translations (name / description / bio / icon / banners) · Countries |
| Rich text | `components/SellerDashboard/ui/RichTextEditor.tsx` (TipTap, lazy-loaded), sanitised via `utils/sanitizeHtml` |
| Limits | banner 1280 × 750 recommended, ≥600px wide, ratio 1.5–1.8, ≤10 MB; icon ≤10 MB |
| Permission gate | `canViewBoutiques` = any of `READ_BUTIKS / CREATE_BUTIKS / UPDATE_BUTIKS / DELETE_BUTIKS / CHANGE_BOUTIQUE_STATUS` (or `SUPER_ADMIN`) |
| State | Shared `SellerProfileContext` (`sellerBoutiques`) + local editor state |

## Current status & maturity

Live and usable as real boutique management — create, edit, per-language content, availability,
countries and activation all work end to end and are permission-gated. Only deletion is withheld.

## Known gaps / notes

- **Delete is hard-disabled** (`canDelete = false` in `BoutiqueEditor.tsx`) pending a decision on
  whether sellers may delete boutiques. The service call and confirmation dialog already exist.
- **No pagination** on the list: the full set is loaded in one request and the count is the list
  length.

## Related features

SD-17 (the public boutique storefront shoppers see) · SL-03 (Product management) ·
SL-04 (Product editing — a product is assigned to a boutique) · SL-08 (Shop info / branding).
