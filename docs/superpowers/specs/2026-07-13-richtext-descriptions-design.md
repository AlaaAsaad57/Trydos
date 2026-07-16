# Rich-text descriptions (TipTap) + save-time sanitize gate

- **Date:** 2026-07-13
- **Status:** Approved (design)
- **Scope:** Seller dashboard — boutique description & product description

## Goal

Replace the plain `<textarea>` used for the **boutique description** and the
**product description** with a lightweight TipTap rich-text editor (Bold,
Italic, Underline, H2), and add a **sanitize gate on save** so a seller can
never persist dangerous markup (`<script>`, `on*` handlers, `javascript:` URLs)
to the backend — defense-in-depth alongside the existing render-time sanitize.

## Current state (verified)

- **Boutique description** — plain `<textarea>` in
  `components/SellerDashboard/boutiqueEdit/sections.tsx` (~line 234), stored
  per-language as `tr.description`. Required per language (validation in
  `boutiqueEdit/helpers.ts`: `!tr.description.trim()` → "Description is required.").
- **Product description** — plain `Area` textarea in
  `components/SellerDashboard/productEdit/sections.tsx` (main field ~line 298,
  per-language ~line 966), stored as `form.description` and per-language
  `custom_data[i][description]`.
- **Render already sanitizes** via `utils/sanitizeHtml.ts` (the `xss`
  whitelist library) + `dangerouslySetInnerHTML`:
  - `components/products/ProductDetailsText.tsx`
  - `components/Home/OfferWidgets/BoutiqueElement.tsx`
- **TipTap is not installed.**

## Design

### 1. Shared editor component

New client primitive `components/SellerDashboard/ui/RichTextEditor.tsx`, reused
by both the boutique and product description fields (one editor, one toolbar,
one behavior).

- **Engine:** TipTap (`@tiptap/react`, `@tiptap/pm`) with a trimmed
  `StarterKit` + `@tiptap/extension-underline`. Enabled: **Bold, Italic,
  Underline, Heading level 2**, paragraphs, hard breaks. Everything else in
  StarterKit (lists, blockquote, code block, horizontal rule, etc.) is disabled
  so the toolbar and the produced HTML stay minimal.
- **Toolbar:** four toggle buttons (B / I / U / H2) using existing dashboard
  tokens (active `#5d5d5d` tint like the `Chip` primitive), each with a
  translated `title` + `aria-label`. Active state reflects
  `editor.isActive(...)`.
- **Props:** `{ value: string; onChange: (v: string) => void; disabled?: boolean;
  error?: string }` — a drop-in replacement for the current textarea API so the
  swap at each call site is one line.
- **Value in:** existing description strings (plain text or HTML) are loaded as
  editor content.
- **Value out:** `onChange` emits `editor.getHTML()`, **except** when
  `editor.isEmpty` → emits `""`, so the boutique "Description is required"
  validation keeps working (TipTap otherwise yields `<p></p>` for empty).
- **SSR:** `useEditor({ immediatelyRender: false })` to avoid the Next.js
  hydration mismatch.
- **Styling:** editor content area matches `dashInputClass` (border, radius,
  padding); an `error` prop applies the `#f85555` border like other fields.

### 2. Sanitize gate (the security ask)

Sanitize with the **existing** `sanitizeHtml` (`utils/sanitizeHtml.ts`) at the
**save chokepoints**, immediately before the description enters the request
payload — so nothing dangerous reaches the backend regardless of editor output:

- **Boutique:** `boutiqueEdit/helpers.ts` — wrap the per-language `description`
  value(s) placed into the payload with `sanitizeHtml(...)`.
- **Product:** `productEdit/helpers.ts` — wrap `set("description", ...)` and the
  per-language `custom_data[i][description]` value with `sanitizeHtml(...)`.

Combined with the render-time sanitize already present, scripts are stripped on
**both save and display**.

### 3. Scope & i18n

- **Rich editor swap (2 surfaces):** the boutique active-language description
  (`boutiqueEdit/sections.tsx` textarea) and the main product description
  (`productEdit/sections.tsx` `Area`, ~line 298). These are the primary,
  multiline description fields.
- **Sanitize gate (all 4 save points):** applied on save to *every* description
  field, whether or not it uses the rich editor —
  `boutique_global_data.description`, boutique `custom_data[].description`,
  product `set("description")`, and product `custom_data[i][description]` — so
  no description reaches the backend unsanitized.
- **Left as-is:** the per-language product description inputs
  (`TranslationsSection`, single-line `Txt`) stay single-line localized
  overrides — only their saved value is gated, not their editor. Boutique `bio`
  and product `meta_description` remain plain textareas (not requested).
- No backend changes: each field stays a string, now containing sanitized HTML.
  Same payload shape.
- **New user-visible strings** (`Bold`, `Italic`, `Underline`, `Heading`) added
  to all three `public/translations/translations.{ar,tr,ku}.js` in the same
  edit, then used via `translateFunction`.

## Validation strategy

- `pnpm lint` and a `pnpm build` (type-check) pass.
- Manual: boutique + product editors render the rich editor; B/I/U/H2 toggle and
  persist; empty editor still triggers the boutique "Description is required"
  error; a pasted `<script>`/`onerror=` payload is stripped from the saved
  value (inspect payload) and does not render.

## Rollback

Revert the call-site swaps back to the textarea/`Area` and remove the new
component + TipTap deps; the field format (string) is unchanged, so no data
migration is needed.

## Out of scope

- No changes to the Go backend or the stored data format.
- No lists, links, images, tables, colors, or alignment in the editor.
- No changes to the render-time sanitizers (already correct).
