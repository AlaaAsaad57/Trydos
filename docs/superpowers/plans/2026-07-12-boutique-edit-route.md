# Boutique Show/Edit Route — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a seller-dashboard route to view and edit one of a seller's own boutiques — global data, per-language translations (en/ar/tr/ku), banners (with a pre-upload dimension warning), and the active/inactive status — matching the dashboard design language, responsive, RTL-aware, no breaking changes elsewhere.

**Architecture:** Mirror the existing product-editor sub-route. A thin server page renders a `"use client"` `BoutiqueEditor`. New code is fully self-contained under `components/SellerDashboard/boutiqueEdit/`; the only edits to existing files are 3 additive service methods, 3 `REQUESTS_DATA` entries, one `next/link` on the boutique card, and new translation keys.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, TailwindCSS 4, Zustand, the dashboard `ui/index.tsx` kit, `fetchData` (`server: "market-dashboard"`), media-server bulk upload.

## Global Constraints

- **No automated tests** (CLAUDE.md). Verification = `pnpm lint` + type-check (`npx tsc --noEmit`) + manual browser check. Do **not** add test files.
- **Package manager:** `pnpm`.
- **Every dashboard request** carries `X-Seller-ID` — supplied by passing the `sellerId` arg to `fetchData` (never set the header manually).
- **i18n:** English strings ARE the keys; add `ar`/`tr`/`ku` values to `public/translations/translations.{ar,tr,ku}.js`. Wrap every user-facing string in `translateFunction`.
- **RTL:** `isRtl = language === "ar" || language === "ku"`, applied via inline `direction` + mirrored padding.
- **Design tokens:** primary `#5d5d5d`, accent `#388CFF`, danger `#f85555`, tint `#f0f0f0`, cards `rounded-[15px]` + `boxShadow 0 3px 10px rgba(0,0,0,0.1)`. Reuse the `ui/index.tsx` kit; do NOT restyle.
- **Scope:** attached-products picker (`product_resources` / `related_product_ids`) is **deferred** — preserve existing ids untouched on save.
- **Status is bundled into Save:** the header toggle only stages `form.status`; Save calls `update`, then `change-status` only if status changed.
- **Banner rules:** hard-block files > 10 MB or non-image (no override); warn (with "Ignore & upload") when aspect ratio ∉ ~1.6–2.9:1 or width < 1280 px. Recommended size **1280×750 (16:9)**.

### Backend assumptions to confirm during implementation
The API contract (`shop-seller-product-boutique-apis.md` §4) documents `icon` only as "filename of an already-uploaded icon" and does **not** list a banner field in the update body — banners are folded into `custom_data` per the product-owner's decision. Two reference-format assumptions are made here, modeled on `normalizeBulkUpload` in `services/sellerDashboard/index.ts`:
1. A **newly uploaded** icon/banner is referenced by its **filename** (e.g. `banner1.webp`), as the `icon` contract wording implies.
2. An **unchanged existing** icon/banner is sent back with the **exact value the GET returned** (absolute URL), which the backend already produced and should accept.

If the backend rejects either, adjust `mediaRef()` / `bannerRef()` in `helpers.ts` (single choke points) to send `/boutiques/boutiques/<file>` instead. This does not change any other code.

---

### Task 1: Service methods + request codes

**Files:**
- Modify: `utils/Requests.ts` (add 3 entries near line 208, after `GET_SELLER_BOUTIQUES`)
- Modify: `services/sellerDashboard/index.ts` (add 3 methods before the final `}` at line 848)

**Interfaces:**
- Produces:
  - `getBoutiqueForEdit(sellerId: string, boutiqueId: string | number): Promise<any>` → envelope `{ success, data: { boutique, lookups }, message, detailed_error }`
  - `updateBoutique(sellerId: string, boutiqueId: string | number, payload: object): Promise<any>` → envelope
  - `changeBoutiqueStatus(sellerId: string, boutiqueId: string | number, status: 0 | 1): Promise<any>` → envelope with `data.status`

- [ ] **Step 1: Add request codes**

In `utils/Requests.ts`, immediately after the `GET_SELLER_BOUTIQUES` line (208), add:

```ts
  GET_BOUTIQUE_FOR_EDIT: { reqTitle: "GET_BOUTIQUE_FOR_EDIT", code: 182 },
  UPDATE_BOUTIQUE: { reqTitle: "UPDATE_BOUTIQUE", code: 183 },
  CHANGE_BOUTIQUE_STATUS: { reqTitle: "CHANGE_BOUTIQUE_STATUS", code: 184 },
```

(Codes 182–184 continue the sequence after the product trio 179–181. If any of these numbers already exist in the file, pick the next free integers and keep them unique — grep `code: 18` to check.)

- [ ] **Step 2: Add service methods**

In `services/sellerDashboard/index.ts`, just before the closing `}` of the class (line 848, right after `changeProductStatus`), add:

```ts
  // ---------- Boutique Edit / Update / Change-status ----------
  // Seller-owned boutique management (see shop-seller-product-boutique-apis.md §4).
  // All scoped to X-Seller-ID via the sellerId arg. Laravel backend (/shop/* is
  // not in the Go allow-list).

  // GET /shop/boutiques/{id}/edit — UPDATE_BUTIKS | SUPER_ADMIN
  async getBoutiqueForEdit(sellerId: string, boutiqueId: string | number) {
    const res = await fetchData({
      url: `/shop/boutiques/${boutiqueId}/edit`,
      method: "GET",
      server: "market-dashboard",
      reqTitle: REQUESTS_DATA.GET_BOUTIQUE_FOR_EDIT,
      sellerId,
    });
    if (!res?.success) {
      throw new Error(res?.message || "Failed to load boutique for edit");
    }
    return res;
  }

  // POST /shop/boutiques/{id}/update — UPDATE_BUTIKS | SUPER_ADMIN
  // Body: { boutique_global_data, custom_data } (see helpers.buildUpdatePayload).
  async updateBoutique(
    sellerId: string,
    boutiqueId: string | number,
    payload: Record<string, unknown>,
  ) {
    return fetchData({
      url: `/shop/boutiques/${boutiqueId}/update`,
      method: "POST",
      server: "market-dashboard",
      reqTitle: REQUESTS_DATA.UPDATE_BOUTIQUE,
      body: JSON.stringify(payload),
      sellerId,
      noMessage: true,
    });
  }

  // POST /shop/boutiques/{id}/change-status — CHANGE_BOUTIQUE_STATUS | SUPER_ADMIN
  // status=0 always succeeds; status=1 may 422 with detailed_error blockers.
  async changeBoutiqueStatus(
    sellerId: string,
    boutiqueId: string | number,
    status: 0 | 1,
  ) {
    return fetchData({
      url: `/shop/boutiques/${boutiqueId}/change-status`,
      method: "POST",
      server: "market-dashboard",
      reqTitle: REQUESTS_DATA.CHANGE_BOUTIQUE_STATUS,
      body: JSON.stringify({ status }),
      sellerId,
      noMessage: true,
    });
  }
```

- [ ] **Step 3: Type-check & lint**

Run: `npx tsc --noEmit`
Expected: no new errors referencing `services/sellerDashboard/index.ts` or `utils/Requests.ts`.
Run: `pnpm lint`
Expected: clean (or only pre-existing warnings).

- [ ] **Step 4: Commit**

```bash
git add utils/Requests.ts services/sellerDashboard/index.ts
git commit -m "feat(seller-dashboard): add boutique edit/update/change-status service methods"
```

---

### Task 2: `helpers.ts` — types, mapping, validation, banner check

**Files:**
- Create: `components/SellerDashboard/boutiqueEdit/helpers.ts`

**Interfaces:**
- Produces (consumed by Tasks 3–5):
  - Constants: `BOUTIQUE_LANGS: readonly ["en","ar","tr","ku"]`, `LANG_LABELS: Record<LangCode,string>`, `AVAILABILITY_OPTIONS: {value:string;label:string}[]`, `RECOMMENDED_BANNER`, `MAX_BANNER_MB`
  - Types: `LangCode`, `BannerItem`, `TranslationForm`, `BoutiqueForm`, `BoutiqueLookups`, `CountryOption`, `BannerCheck`
  - Functions: `mediaRef(url:string):string`, `bannerRef(url:string):string`, `extractUploadedNames(data:any):string[]`, `buildFormFromEdit(boutique:any, lookups:any):BoutiqueForm`, `buildUpdatePayload(form:BoutiqueForm):Record<string,unknown>`, `validate(form:BoutiqueForm):Record<string,string>`, `checkBannerFile(file:File):Promise<BannerCheck>`

- [ ] **Step 1: Write the file**

```ts
// Types, GET→form/form→payload mapping, validation and banner dimension checks
// for the boutique editor. Mirrors the product-editor helpers pattern.

export const BOUTIQUE_LANGS = ["en", "ar", "tr", "ku"] as const;
export type LangCode = (typeof BOUTIQUE_LANGS)[number];

export const LANG_LABELS: Record<LangCode, string> = {
  en: "English",
  ar: "العربية",
  tr: "Türkçe",
  ku: "کوردی",
};

// availability: 1 Web · 2 Mobile · 3 Web+Mobile (contract §4.1)
export const AVAILABILITY_OPTIONS: { value: string; label: string }[] = [
  { value: "1", label: "Web" },
  { value: "2", label: "Mobile" },
  { value: "3", label: "Web + Mobile" },
];

// Recommended banner size (see design §6): 1280×750, ~16:9.
export const RECOMMENDED_BANNER = { width: 1280, height: 750, label: "1280 × 750 (16:9)" };
export const MAX_BANNER_MB = 10;
const MAX_BANNER_BYTES = MAX_BANNER_MB * 1024 * 1024;
const MIN_BANNER_WIDTH = 1280;
const MIN_BANNER_RATIO = 1.6;
const MAX_BANNER_RATIO = 2.9;

export interface CountryOption {
  iso: string;
  name: string;
}

export interface BoutiqueLookups {
  countries: CountryOption[];
  availabilities?: { value: number; label: string }[];
}

export interface BannerItem {
  id?: number; // existing banner id (omit for new)
  banner: string; // value sent back to the API (filename for new, original URL for existing)
  previewUrl: string; // absolute URL / object URL for display
  isNew?: boolean;
}

export interface TranslationForm {
  id?: number; // existing translation id (omit to create)
  language_code: LangCode;
  name: string;
  description: string;
  bio: string;
}

export interface BoutiqueForm {
  name: string;
  availability: string; // "1" | "2" | "3"
  icon: string; // value sent back (filename for new, original URL for existing)
  iconPreview: string;
  countries_iso: string[];
  related_product_ids: (number | string)[]; // preserved untouched (deferred feature)
  translations: Record<LangCode, TranslationForm>;
  banners: BannerItem[]; // shared across all languages
  status: number; // 0 inactive / 1 active — staged; applied via change-status on save
}

export interface BannerCheck {
  hardError?: string; // block upload (translatable key)
  warning?: string; // warn but allow "Ignore & upload" (already-composed, translatable)
}

/** Filename from an absolute URL or path (e.g. ".../a/b.webp" -> "b.webp"). */
export function fileNameOf(raw: string): string {
  if (!raw) return "";
  return raw.replace(/^\/+/, "").split("?")[0].split("/").pop() || raw;
}

/** Reference to send for a newly-uploaded icon (assumption 1 — see plan header). */
export function mediaRef(url: string): string {
  return fileNameOf(url);
}

/** Reference to send for a newly-uploaded banner (assumption 1 — see plan header). */
export function bannerRef(url: string): string {
  return fileNameOf(url);
}

/** Best-effort filename list from the media-server /upload/bulk response shapes. */
export function extractUploadedNames(data: any): string[] {
  const arr =
    data?.files ?? data?.urls ?? data?.results ?? data?.data ?? data ?? [];
  if (!Array.isArray(arr)) return [];
  return arr
    .map((item: any) => {
      const raw =
        typeof item === "string"
          ? item
          : item?.url ?? item?.path ?? item?.file_name ?? item?.name ?? "";
      return fileNameOf(raw);
    })
    .filter(Boolean);
}

function emptyTranslation(lang: LangCode): TranslationForm {
  return { language_code: lang, name: "", description: "", bio: "" };
}

/** Map the GET /edit `boutique` object into the editable form. */
export function buildFormFromEdit(boutique: any, _lookups: any): BoutiqueForm {
  const translations = {} as Record<LangCode, TranslationForm>;
  for (const lang of BOUTIQUE_LANGS) translations[lang] = emptyTranslation(lang);

  const srcTranslations: any[] = Array.isArray(boutique?.translations)
    ? boutique.translations
    : [];
  for (const tr of srcTranslations) {
    const lang = tr?.language_code as LangCode;
    if (BOUTIQUE_LANGS.includes(lang)) {
      translations[lang] = {
        id: tr?.id,
        language_code: lang,
        name: tr?.name ?? "",
        description: tr?.description ?? "",
        bio: tr?.bio ?? "",
      };
    }
  }

  // Banners are shared: take them from English, else the first translation that has any.
  const bannerSource =
    srcTranslations.find((t) => t?.language_code === "en" && t?.banners?.length) ??
    srcTranslations.find((t) => t?.banners?.length);
  const banners: BannerItem[] = Array.isArray(bannerSource?.banners)
    ? bannerSource.banners
        .slice()
        .sort((a: any, b: any) => (a?.sequence ?? 0) - (b?.sequence ?? 0))
        .map((b: any) => ({
          id: b?.id,
          banner: b?.banner ?? "", // send back the exact value GET returned (assumption 2)
          previewUrl: b?.banner ?? "",
        }))
    : [];

  return {
    name: boutique?.name ?? translations.en.name ?? "",
    availability: String(boutique?.availability ?? 3),
    icon: boutique?.icon ?? "",
    iconPreview: boutique?.icon ?? "",
    countries_iso: Array.isArray(boutique?.restricted_countries_iso)
      ? boutique.restricted_countries_iso
      : [],
    related_product_ids: Array.isArray(boutique?.related_product_ids)
      ? boutique.related_product_ids
      : [],
    translations,
    banners,
    status: Number(boutique?.status ?? 0),
  };
}

/** Build the POST /update body: global data + per-language custom_data (§4.2). */
export function buildUpdatePayload(form: BoutiqueForm): Record<string, unknown> {
  const banners = form.banners.map((b, i) => ({
    ...(b.id ? { id: b.id } : {}),
    banner: b.banner,
    sequence: i + 1,
  }));

  const custom_data = BOUTIQUE_LANGS.map((lang) => {
    const tr = form.translations[lang];
    return {
      ...(tr.id ? { id: tr.id } : {}),
      language_code: lang,
      name: tr.name,
      description: tr.description,
      bio: tr.bio,
      icon: form.icon, // shared: uploaded once, reused for all languages
      banners, // shared
    };
  }).filter((c) => c.name.trim().length > 0 || c.id != null);

  return {
    boutique_global_data: {
      name: form.name,
      availability: Number(form.availability),
      description: form.translations.en.description,
      bio: form.translations.en.bio,
      icon: form.icon,
      countries_iso: form.countries_iso,
      product_resources: form.related_product_ids, // unchanged (deferred)
    },
    custom_data,
  };
}

/** Field-level validation. Keys are field ids used by the form. */
export function validate(form: BoutiqueForm): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!form.name.trim()) errors.name = "Name is required.";
  if (!form.translations.en.name.trim())
    errors["translations.en.name"] = "English name is required.";
  if (!["1", "2", "3"].includes(form.availability))
    errors.availability = "Choose an availability.";
  return errors;
}

/** Read an image's natural dimensions client-side (null if unreadable). */
function readImageSize(
  file: File,
): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const dims = { width: img.naturalWidth, height: img.naturalHeight };
      URL.revokeObjectURL(url);
      resolve(dims);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    img.src = url;
  });
}

/** Hard-block (size/type) vs warn (ratio/low-res) for a banner file (design §6). */
export async function checkBannerFile(file: File): Promise<BannerCheck> {
  if (!file.type.startsWith("image/"))
    return { hardError: "Please choose an image file." };
  if (file.size > MAX_BANNER_BYTES)
    return { hardError: "Banner image must be 10 MB or smaller." };

  const dims = await readImageSize(file);
  if (!dims || dims.width === 0 || dims.height === 0) return {}; // unreadable → allow
  const ratio = dims.width / dims.height;
  if (
    dims.width < MIN_BANNER_WIDTH ||
    ratio < MIN_BANNER_RATIO ||
    ratio > MAX_BANNER_RATIO
  ) {
    return {
      warning: `${dims.width}×${dims.height}`, // consumer composes the full sentence
    };
  }
  return {};
}
```

- [ ] **Step 2: Type-check & lint**

Run: `npx tsc --noEmit`
Expected: no errors in `components/SellerDashboard/boutiqueEdit/helpers.ts`.
Run: `pnpm lint`
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add components/SellerDashboard/boutiqueEdit/helpers.ts
git commit -m "feat(seller-dashboard): add boutique edit form types, mapping, and banner validation"
```

---

### Task 3: `controls.tsx` — self-contained form controls

**Files:**
- Create: `components/SellerDashboard/boutiqueEdit/controls.tsx`

**Interfaces:**
- Consumes: `DashField`, `dashInputClass`, `DashIcon` from `components/SellerDashboard/ui`; `translateFunction` from `utils/functions`.
- Produces (consumed by Tasks 4–5): `Section`, `Grid`, `Txt`, `Area`, `Select`, `Chip`, `Toggle` (React components with the prop shapes below).

- [ ] **Step 1: Write the file**

```tsx
"use client";
import React from "react";
import { translateFunction } from "utils/functions";
import { DashField, dashInputClass, DashIcon } from "components/SellerDashboard/ui";
import type { IconName } from "components/SellerDashboard/ui";

const t = (s: string) => translateFunction(s);

export function Section({
  icon,
  title,
  desc,
  children,
}: {
  icon: IconName;
  title: string;
  desc?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="bg-white rounded-[15px] p-5 lg:p-6"
      style={{ boxShadow: "0 3px 10px rgba(0,0,0,0.1)" }}
    >
      <div className="flex items-start gap-2.5 mb-5 pb-4 border-b border-[#ededed]">
        <span className="text-[#5d5d5d] shrink-0 mt-0.5">
          <DashIcon name={icon} size={19} />
        </span>
        <div className="min-w-0">
          <h2 className="text-[15px] semibold text-[#3c3c3c]">{t(title)}</h2>
          {desc && <p className="text-[12px] text-[#8e8e8e] mt-0.5">{t(desc)}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}

export const Grid = ({ children }: { children: React.ReactNode }) => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">{children}</div>
);

export function Txt({
  label,
  value,
  onChange,
  error,
  hint,
  disabled,
  placeholder,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  hint?: string;
  disabled?: boolean;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <DashField label={required ? `${t(label)} *` : t(label)} error={error && t(error)} hint={hint}>
      <input
        type="text"
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={`${dashInputClass} ${error ? "border-[#f85555]" : ""} ${disabled ? "opacity-70" : ""}`}
      />
    </DashField>
  );
}

export function Area({
  label,
  value,
  onChange,
  disabled,
  rows = 4,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  rows?: number;
}) {
  return (
    <DashField label={t(label)}>
      <textarea
        rows={rows}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className={`${dashInputClass} h-auto py-3 leading-relaxed ${disabled ? "opacity-70" : ""}`}
      />
    </DashField>
  );
}

export function Select({
  label,
  value,
  onChange,
  options,
  disabled,
  error,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  disabled?: boolean;
  error?: string;
  required?: boolean;
}) {
  return (
    <DashField label={required ? `${t(label)} *` : t(label)} error={error && t(error)}>
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className={`${dashInputClass} ${error ? "border-[#f85555]" : ""} ${disabled ? "opacity-70" : ""}`}
      >
        <option value="">{t("Select")}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {t(o.label)}
          </option>
        ))}
      </select>
    </DashField>
  );
}

/** Selection = outline + faint tint (design-language §10.8), never checkbox. */
export function Chip({
  active,
  onClick,
  disabled,
  children,
}: {
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`px-3.5 h-[34px] rounded-full text-[13px] medium border transition-colors active:scale-[0.98] disabled:cursor-not-allowed ${
        active
          ? "border-[#5d5d5d] bg-[#5d5d5d]/[0.07] text-[#3c3c3c]"
          : "border-transparent bg-[#f2f2f2] text-[#8e8e8e] hover:text-[#505050]"
      } ${disabled && !active ? "opacity-60" : ""}`}
    >
      {children}
    </button>
  );
}

export function Toggle({
  label,
  desc,
  value,
  onChange,
  disabled,
}: {
  label: string;
  desc?: string;
  value: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 p-3.5 rounded-[12px] bg-[#f8f8f8] border border-[#ededed]">
      <div className="min-w-0">
        <p className="text-[13px] medium text-[#3c3c3c]">{t(label)}</p>
        {desc && <p className="text-[12px] text-[#8e8e8e] mt-0.5">{t(desc)}</p>}
      </div>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange(!value)}
        aria-pressed={value}
        className={`relative shrink-0 w-[44px] h-[26px] rounded-full transition-colors disabled:opacity-50 ${
          value ? "bg-[#5d5d5d]" : "bg-[#d9d9de]"
        }`}
      >
        <span
          className={`absolute top-[3px] w-[20px] h-[20px] rounded-full bg-white shadow transition-all ${
            value ? "left-[21px]" : "left-[3px]"
          }`}
        />
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Verify `IconName` is exported from the ui kit**

Run: `grep -n "IconName" components/SellerDashboard/ui/index.tsx`
Expected: a re-export line (the ui index re-exports `IconName` from `./icons`). If it isn't exported, import the type from `components/SellerDashboard/ui/icons` instead.

- [ ] **Step 3: Type-check & lint**

Run: `npx tsc --noEmit` → no errors in `controls.tsx`.
Run: `pnpm lint` → clean.

- [ ] **Step 4: Commit**

```bash
git add components/SellerDashboard/boutiqueEdit/controls.tsx
git commit -m "feat(seller-dashboard): add boutique editor form controls"
```

---

### Task 4: `sections.tsx` — Global, Translations, Banners cards

**Files:**
- Create: `components/SellerDashboard/boutiqueEdit/sections.tsx`

**Interfaces:**
- Consumes: controls from Task 3; types + `AVAILABILITY_OPTIONS`, `LANG_LABELS`, `BOUTIQUE_LANGS`, `RECOMMENDED_BANNER` from Task 2; `DashButton`, `DashIcon`, `Segmented` from the ui kit.
- Produces (consumed by Task 5): `GlobalSection`, `TranslationsSection`, `BannersSection` — each takes `SectionProps` (defined below).

- [ ] **Step 1: Write the file**

```tsx
"use client";
import React, { useRef } from "react";
import { translateFunction } from "utils/functions";
import { DashButton, DashIcon, Segmented } from "components/SellerDashboard/ui";
import { Section, Grid, Txt, Area, Select, Chip } from "./controls";
import {
  AVAILABILITY_OPTIONS,
  BOUTIQUE_LANGS,
  LANG_LABELS,
  RECOMMENDED_BANNER,
  type BoutiqueForm,
  type BoutiqueLookups,
  type LangCode,
} from "./helpers";

const t = (s: string) => translateFunction(s);

export interface SectionProps {
  form: BoutiqueForm;
  patch: (p: Partial<BoutiqueForm>) => void;
  patchTranslation: (lang: LangCode, p: Partial<BoutiqueForm["translations"][LangCode]>) => void;
  errors: Record<string, string>;
  lookups: BoutiqueLookups;
  disabled: boolean;
  activeLang: LangCode;
  setActiveLang: (l: LangCode) => void;
  onUploadIcon: (file: File) => Promise<void>;
  onAddBanners: (files: File[]) => Promise<void>;
  onRemoveBanner: (index: number) => void;
  onMoveBanner: (index: number, dir: -1 | 1) => void;
  uploading: { icon?: boolean; banners?: boolean };
}

/* ------------------------------- Global -------------------------------- */

export function GlobalSection({
  form,
  patch,
  errors,
  lookups,
  disabled,
  onUploadIcon,
  uploading,
}: SectionProps) {
  const iconRef = useRef<HTMLInputElement>(null);
  const countries = lookups.countries || [];
  const availabilityOptions =
    lookups.availabilities?.length
      ? lookups.availabilities.map((a) => ({ value: String(a.value), label: a.label }))
      : AVAILABILITY_OPTIONS;

  const toggleCountry = (iso: string) => {
    const set = new Set(form.countries_iso);
    if (set.has(iso)) set.delete(iso);
    else set.add(iso);
    patch({ countries_iso: Array.from(set) });
  };

  return (
    <Section icon="boutiques" title="Boutique details" desc="Shown across the storefront.">
      <Grid>
        <Txt
          label="Boutique name"
          value={form.name}
          onChange={(v) => patch({ name: v })}
          error={errors.name}
          disabled={disabled}
          required
        />
        <Select
          label="Availability"
          value={form.availability}
          onChange={(v) => patch({ availability: v })}
          options={availabilityOptions}
          error={errors.availability}
          disabled={disabled}
          required
        />
      </Grid>

      {/* Icon */}
      <div className="mt-5">
        <p className="text-[13px] medium text-[#3c3c3c] mb-2">{t("Boutique icon")}</p>
        <div className="flex items-center gap-4">
          <div className="w-[72px] h-[72px] rounded-[15px] overflow-hidden bg-[#f4f4f4] border border-[#ededed] shrink-0 flex items-center justify-center">
            {form.iconPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={form.iconPreview} alt="icon" className="w-full h-full object-cover" />
            ) : (
              <DashIcon name="boutiques" size={26} strokeWidth={1.4} />
            )}
          </div>
          {!disabled && (
            <>
              <input
                ref={iconRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) onUploadIcon(f);
                  e.target.value = "";
                }}
              />
              <DashButton
                variant="secondary"
                size="sm"
                icon="upload"
                loading={uploading.icon}
                onClick={() => iconRef.current?.click()}
              >
                {t("Upload icon")}
              </DashButton>
            </>
          )}
        </div>
      </div>

      {/* Restricted countries */}
      <div className="mt-6">
        <p className="text-[13px] medium text-[#3c3c3c] mb-1">{t("Available in countries")}</p>
        <p className="text-[12px] text-[#8e8e8e] mb-3">
          {t("Leave empty to make the boutique available everywhere.")}
        </p>
        <div className="flex flex-wrap gap-2 max-h-[180px] overflow-auto p-1">
          {countries.map((c) => (
            <Chip
              key={c.iso}
              active={form.countries_iso.includes(c.iso)}
              disabled={disabled}
              onClick={() => toggleCountry(c.iso)}
            >
              {c.name}
            </Chip>
          ))}
        </div>
      </div>
    </Section>
  );
}

/* ----------------------------- Translations ---------------------------- */

export function TranslationsSection({
  form,
  patchTranslation,
  errors,
  disabled,
  activeLang,
  setActiveLang,
}: SectionProps) {
  const tr = form.translations[activeLang];
  const langError =
    activeLang === "en" ? errors["translations.en.name"] : undefined;

  return (
    <Section
      icon="edit"
      title="Translations"
      desc="Name, description and bio per language. English is required."
    >
      <div className="mb-5">
        <Segmented<LangCode>
          value={activeLang}
          onChange={setActiveLang}
          options={BOUTIQUE_LANGS.map((l) => ({ value: l, label: LANG_LABELS[l] }))}
        />
      </div>

      <div className="space-y-5" dir={activeLang === "ar" || activeLang === "ku" ? "rtl" : "ltr"}>
        <Txt
          label="Name"
          value={tr.name}
          onChange={(v) => patchTranslation(activeLang, { name: v })}
          error={langError}
          disabled={disabled}
          required={activeLang === "en"}
        />
        <Area
          label="Description"
          value={tr.description}
          onChange={(v) => patchTranslation(activeLang, { description: v })}
          disabled={disabled}
        />
        <Area
          label="Bio"
          value={tr.bio}
          onChange={(v) => patchTranslation(activeLang, { bio: v })}
          disabled={disabled}
          rows={3}
        />
      </div>
    </Section>
  );
}

/* ------------------------------- Banners ------------------------------- */

export function BannersSection({
  form,
  disabled,
  onAddBanners,
  onRemoveBanner,
  onMoveBanner,
  uploading,
}: SectionProps) {
  const bannerRef = useRef<HTMLInputElement>(null);

  return (
    <Section
      icon="gallery"
      title="Banners"
      desc={`Recommended size ${RECOMMENDED_BANNER.label}. Used across all languages.`}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {form.banners.map((b, i) => (
          <div
            key={b.id ?? `new-${i}`}
            className="relative rounded-[12px] overflow-hidden border border-[#ededed] bg-[#f8f8f8] aspect-[16/9]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={b.previewUrl} alt={`banner-${i + 1}`} className="w-full h-full object-cover" />
            {!disabled && (
              <div className="absolute inset-x-0 bottom-0 p-2 flex items-center justify-between gap-2 bg-gradient-to-t from-black/55 to-transparent">
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    disabled={i === 0}
                    onClick={() => onMoveBanner(i, -1)}
                    className="w-7 h-7 rounded-full bg-white/90 flex items-center justify-center disabled:opacity-40"
                    aria-label={t("Move left")}
                  >
                    <DashIcon name="chevronLeft" size={15} />
                  </button>
                  <button
                    type="button"
                    disabled={i === form.banners.length - 1}
                    onClick={() => onMoveBanner(i, 1)}
                    className="w-7 h-7 rounded-full bg-white/90 flex items-center justify-center disabled:opacity-40"
                    aria-label={t("Move right")}
                  >
                    <DashIcon name="chevronRight" size={15} />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => onRemoveBanner(i)}
                  className="w-7 h-7 rounded-full bg-[#f85555] text-white flex items-center justify-center"
                  aria-label={t("Delete")}
                >
                  <DashIcon name="trash" size={15} />
                </button>
              </div>
            )}
          </div>
        ))}

        {!disabled && (
          <button
            type="button"
            onClick={() => bannerRef.current?.click()}
            className="aspect-[16/9] rounded-[12px] border-2 border-dashed border-[#d9d9de] flex flex-col items-center justify-center gap-1.5 text-[#8e8e8e] hover:border-[#5d5d5d] hover:text-[#5d5d5d] transition-colors"
          >
            {uploading.banners ? (
              <span className="text-[12px]">{t("Uploading…")}</span>
            ) : (
              <>
                <DashIcon name="plus" size={22} />
                <span className="text-[12px] medium">{t("Add banner")}</span>
              </>
            )}
          </button>
        )}
      </div>

      <input
        ref={bannerRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files || []);
          if (files.length) onAddBanners(files);
          e.target.value = "";
        }}
      />
    </Section>
  );
}
```

- [ ] **Step 2: Verify icon names exist**

Run: `grep -n "chevronLeft\|chevronRight\|gallery\|upload\|trash\|plus\|edit\|boutiques" components/SellerDashboard/ui/icons.tsx`
Expected: each name appears in the `IconName` union / icon map. If a name is missing (e.g. `chevronLeft`), substitute the closest existing name from that file (the Explore report lists `chevron*`, `upload`, `trash`, `plus`, `edit`).

- [ ] **Step 3: Type-check & lint**

Run: `npx tsc --noEmit` → no errors in `sections.tsx`.
Run: `pnpm lint` → clean.

- [ ] **Step 4: Commit**

```bash
git add components/SellerDashboard/boutiqueEdit/sections.tsx
git commit -m "feat(seller-dashboard): add boutique global/translations/banners sections"
```

---

### Task 5: `BoutiqueEditor.tsx` — shell, load, save orchestration

**Files:**
- Create: `components/SellerDashboard/boutiqueEdit/BoutiqueEditor.tsx`

**Interfaces:**
- Consumes: service methods (Task 1), helpers (Task 2), sections (Task 4), ui kit, `useSellerProfile` context, `showErrorMessage`/`showSuccessMessage`.
- Produces: `default function BoutiqueEditor({ sellerId, boutiqueId, local }: { sellerId: string; boutiqueId: string; local: string })`.

- [ ] **Step 1: Write the file**

```tsx
"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSellerProfile } from "../../../app/(client)/[lang]/sellerProfile/SellerProfileContext";
import SellerDashboardService from "services/sellerDashboard";
import { translateFunction, LogError } from "utils/functions";
import { showErrorMessage, showSuccessMessage } from "components/global/AddToCartMessage";
import {
  DashButton,
  DashIcon,
  LoadingState,
  ErrorState,
  AccessDenied,
  StatusPill,
  InlineAlert,
} from "components/SellerDashboard/ui";
import {
  GlobalSection,
  TranslationsSection,
  BannersSection,
  type SectionProps,
} from "./sections";
import {
  buildFormFromEdit,
  buildUpdatePayload,
  checkBannerFile,
  extractUploadedNames,
  mediaRef,
  bannerRef,
  validate,
  RECOMMENDED_BANNER,
  type BoutiqueForm,
  type BoutiqueLookups,
  type LangCode,
} from "./helpers";

const t = (s: string) => translateFunction(s);

interface WarnState {
  file: File;
  dims: string; // "1920×640"
}

export default function BoutiqueEditor({
  sellerId,
  boutiqueId,
  local,
}: {
  sellerId: string;
  boutiqueId: string;
  local: string;
}) {
  const [, language] = (local || "").split("-");
  const isRtl = language === "ar" || language === "ku";

  const { sellerPermissions, setSellerPermissions } = useSellerProfile();

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [denied, setDenied] = useState(false);

  const [lookups, setLookups] = useState<BoutiqueLookups | null>(null);
  const [form, setForm] = useState<BoutiqueForm | null>(null);
  const [initial, setInitial] = useState<BoutiqueForm | null>(null);

  const [editMode, setEditMode] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeLang, setActiveLang] = useState<LangCode>("en");
  const [uploading, setUploading] = useState<{ icon?: boolean; banners?: boolean }>({});
  const [saving, setSaving] = useState(false);
  const [statusBlockers, setStatusBlockers] = useState<string[]>([]);

  // banner warning queue
  const [warn, setWarn] = useState<WarnState | null>(null);
  const queueRef = useRef<File[]>([]);

  const has = (p: string) =>
    (sellerPermissions || []).includes(p) ||
    (sellerPermissions || []).includes("SUPER_ADMIN");
  const canUpdate = has("UPDATE_BUTIKS");
  const canChangeStatus = has("CHANGE_BOUTIQUE_STATUS");

  // Deep-link safety: hydrate permissions if context is empty.
  useEffect(() => {
    if (sellerPermissions && sellerPermissions.length > 0) return;
    SellerDashboardService.getSellerPermissions(sellerId)
      .then((res: any) => {
        const shop = Array.isArray(res?.data)
          ? res.data.find((s: any) => String(s.seller_id) === String(sellerId))
          : null;
        if (shop?.permissions) setSellerPermissions?.(shop.permissions);
      })
      .catch((e: any) =>
        LogError({
          scenario: "BoutiqueEditor.getSellerPermissions",
          error: e instanceof Error ? e.message : String(e),
        }),
      );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sellerId]);

  const load = async () => {
    setLoading(true);
    setLoadError(null);
    setDenied(false);
    try {
      const res = await SellerDashboardService.getBoutiqueForEdit(sellerId, boutiqueId);
      const boutique = res.data?.boutique;
      const lk = (res.data?.lookups || {}) as BoutiqueLookups;
      if (!boutique) throw new Error(t("Boutique not found."));
      const built = buildFormFromEdit(boutique, lk);
      setLookups(lk);
      setForm(built);
      setInitial(built);
    } catch (e: any) {
      const msg = e instanceof Error ? e.message : String(e);
      LogError({ scenario: "BoutiqueEditor.load", error: msg, boutiqueId });
      if (/permission|forbidden|403/i.test(msg)) setDenied(true);
      else setLoadError(msg || t("Failed to load boutique."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sellerId, boutiqueId]);

  const patch = (p: Partial<BoutiqueForm>) =>
    setForm((prev) => (prev ? { ...prev, ...p } : prev));

  const patchTranslation = (
    lang: LangCode,
    p: Partial<BoutiqueForm["translations"][LangCode]>,
  ) =>
    setForm((prev) =>
      prev
        ? {
            ...prev,
            translations: {
              ...prev.translations,
              [lang]: { ...prev.translations[lang], ...p },
            },
          }
        : prev,
    );

  /* ------------------------------ uploads ------------------------------- */

  const onUploadIcon = async (file: File) => {
    setUploading((u) => ({ ...u, icon: true }));
    try {
      const url = await SellerDashboardService.uploadShopImage(file, "boutiques/boutiques/icon");
      const name = mediaRef(url);
      if (!name) throw new Error(t("Upload returned no file."));
      patch({ icon: name, iconPreview: URL.createObjectURL(file) });
    } catch (e: any) {
      const msg = e instanceof Error ? e.message : String(e);
      LogError({ scenario: "BoutiqueEditor.uploadIcon", error: msg });
      showErrorMessage(msg || t("Image upload failed."));
    } finally {
      setUploading((u) => ({ ...u, icon: false }));
    }
  };

  const uploadBanner = async (file: File) => {
    setUploading((u) => ({ ...u, banners: true }));
    try {
      const data = await SellerDashboardService.bulkUploadImages([file], "boutiques/boutiques");
      const name = bannerRef(extractUploadedNames(data)[0] || "");
      if (!name) throw new Error(t("Upload returned no file."));
      setForm((prev) =>
        prev
          ? {
              ...prev,
              banners: [
                ...prev.banners,
                { banner: name, previewUrl: URL.createObjectURL(file), isNew: true },
              ],
            }
          : prev,
      );
    } catch (e: any) {
      const msg = e instanceof Error ? e.message : String(e);
      LogError({ scenario: "BoutiqueEditor.uploadBanner", error: msg });
      showErrorMessage(msg || t("Image upload failed."));
    } finally {
      setUploading((u) => ({ ...u, banners: false }));
    }
  };

  // Process the queued banner files one at a time; pause on a warning.
  const processQueue = async () => {
    while (queueRef.current.length > 0) {
      const file = queueRef.current[0];
      const check = await checkBannerFile(file);
      if (check.hardError) {
        queueRef.current.shift();
        showErrorMessage(t(check.hardError));
        continue;
      }
      if (check.warning) {
        setWarn({ file, dims: check.warning }); // stop; wait for user decision
        return;
      }
      queueRef.current.shift();
      await uploadBanner(file);
    }
  };

  const onAddBanners = async (files: File[]) => {
    queueRef.current.push(...files);
    if (!warn) await processQueue();
  };

  const resolveWarn = async (proceed: boolean) => {
    const current = warn;
    setWarn(null);
    if (!current) return;
    queueRef.current.shift(); // remove the warned file from the head
    if (proceed) await uploadBanner(current.file);
    await processQueue();
  };

  const onRemoveBanner = (index: number) =>
    setForm((prev) =>
      prev ? { ...prev, banners: prev.banners.filter((_, i) => i !== index) } : prev,
    );

  const onMoveBanner = (index: number, dir: -1 | 1) =>
    setForm((prev) => {
      if (!prev) return prev;
      const next = [...prev.banners];
      const to = index + dir;
      if (to < 0 || to >= next.length) return prev;
      [next[index], next[to]] = [next[to], next[index]];
      return { ...prev, banners: next };
    });

  /* -------------------------------- save -------------------------------- */

  const onSave = async () => {
    if (!form || !initial) return;
    const errs = validate(form);
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      showErrorMessage(t("Please fix the highlighted fields before saving."));
      return;
    }
    setSaving(true);
    setStatusBlockers([]);
    try {
      const payload = buildUpdatePayload(form);
      const res = await SellerDashboardService.updateBoutique(sellerId, boutiqueId, payload);
      if (!res?.success) {
        const detail =
          Array.isArray(res?.detailed_error) && res.detailed_error.length
            ? res.detailed_error.map((d: any) => d.message).join(" • ")
            : "";
        throw new Error(detail || res?.message || t("Failed to update boutique."));
      }

      // Status change (only if the toggle moved). Edits are already saved.
      let savedStatus = form.status;
      if (form.status !== initial.status) {
        const sres = await SellerDashboardService.changeBoutiqueStatus(
          sellerId,
          boutiqueId,
          form.status as 0 | 1,
        );
        if (!sres?.success) {
          const blockers =
            Array.isArray(sres?.detailed_error) && sres.detailed_error.length
              ? sres.detailed_error.map((d: any) => d.message)
              : [sres?.message || t("Could not change status.")];
          setStatusBlockers(blockers);
          savedStatus = initial.status; // revert the toggle; edits stay saved
          showErrorMessage(t("Your changes were saved, but the status could not be updated."));
        } else {
          savedStatus = sres.data?.status ?? form.status;
        }
      }

      const persisted = { ...form, status: savedStatus };
      setForm(persisted);
      setInitial(persisted);
      setEditMode(false);
      setErrors({});
      if (statusBlockers.length === 0 && savedStatus === form.status) {
        showSuccessMessage(t("Boutique updated successfully."));
      }
    } catch (e: any) {
      const msg = e instanceof Error ? e.message : String(e);
      LogError({ scenario: "BoutiqueEditor.save", error: msg, boutiqueId });
      showErrorMessage(msg);
    } finally {
      setSaving(false);
    }
  };

  const cancelEdit = () => {
    setForm(initial);
    setErrors({});
    setStatusBlockers([]);
    setEditMode(false);
  };

  /* ------------------------------- render ------------------------------- */

  if (loading) return <LoadingState label={t("Loading boutique…")} />;
  if (denied)
    return <AccessDenied message={t("You don't have permission to view or edit this boutique.")} />;
  if (loadError) return <ErrorState message={loadError} onRetry={load} />;
  if (!form || !lookups) return null;

  const sectionProps: SectionProps = {
    form,
    patch,
    patchTranslation,
    errors,
    lookups,
    disabled: !editMode,
    activeLang,
    setActiveLang,
    onUploadIcon,
    onAddBanners,
    onRemoveBanner,
    onMoveBanner,
    uploading,
  };

  return (
    <div className="space-y-5" style={{ direction: isRtl ? "rtl" : "ltr" }}>
      {/* Header card */}
      <div
        className="bg-white rounded-[15px] p-4 lg:p-5"
        style={{ boxShadow: "0 3px 10px rgba(0,0,0,0.1)" }}
      >
        <div className="flex items-center gap-4 flex-wrap">
          <div className="w-[64px] h-[64px] rounded-[12px] overflow-hidden bg-[#f4f4f4] border border-[#ededed] shrink-0 flex items-center justify-center">
            {form.iconPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={form.iconPreview} alt={form.name} className="w-full h-full object-cover" />
            ) : (
              <DashIcon name="boutiques" size={26} strokeWidth={1.4} />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-[18px] bold text-[#3c3c3c] truncate">
                {form.name || t("Unnamed Boutique")}
              </h1>
              <StatusPill active={form.status === 1}>
                {form.status === 1 ? t("Active") : t("Inactive")}
              </StatusPill>
            </div>
            <p className="text-[12px] text-[#8e8e8e] mt-0.5">
              {t("ID")}: {boutiqueId}
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {editMode && canChangeStatus && (
              <DashButton
                variant={form.status === 1 ? "danger" : "secondary"}
                size="sm"
                icon={form.status === 1 ? "lock" : "check"}
                onClick={() => patch({ status: form.status === 1 ? 0 : 1 })}
              >
                {form.status === 1 ? t("Set inactive") : t("Set active")}
              </DashButton>
            )}
            {!editMode ? (
              canUpdate ? (
                <DashButton icon="edit" onClick={() => setEditMode(true)}>
                  {t("Edit")}
                </DashButton>
              ) : (
                <span className="text-[12px] text-[#8e8e8e] flex items-center gap-1.5">
                  <DashIcon name="lock" size={14} /> {t("View only")}
                </span>
              )
            ) : (
              <>
                <DashButton variant="ghost" size="sm" onClick={cancelEdit} disabled={saving}>
                  {t("Cancel")}
                </DashButton>
                <DashButton icon="check" loading={saving} onClick={onSave}>
                  {t("Save Changes")}
                </DashButton>
              </>
            )}
          </div>
        </div>

        {statusBlockers.length > 0 && (
          <div className="mt-4">
            <InlineAlert tone="error">
              <div>
                <p className="semibold mb-1">{t("Status could not be changed:")}</p>
                <ul className="space-y-0.5">
                  {statusBlockers.map((b, i) => (
                    <li key={i}>• {b}</li>
                  ))}
                </ul>
              </div>
            </InlineAlert>
          </div>
        )}
      </div>

      {/* Sections */}
      <GlobalSection {...sectionProps} />
      <TranslationsSection {...sectionProps} />
      <BannersSection {...sectionProps} />

      {/* Sticky save bar */}
      {editMode && (
        <div className="sticky bottom-3 z-20">
          <div
            className="bg-white rounded-[15px] p-3 flex items-center justify-between gap-3"
            style={{ boxShadow: "0 6px 20px rgba(0,0,0,0.14)" }}
          >
            <span className="text-[12px] text-[#8e8e8e] pl-1">
              {t("Review your changes before saving.")}
            </span>
            <div className="flex items-center gap-2.5">
              <DashButton variant="ghost" size="sm" onClick={cancelEdit} disabled={saving}>
                {t("Cancel")}
              </DashButton>
              <DashButton icon="check" loading={saving} onClick={onSave}>
                {t("Save Changes")}
              </DashButton>
            </div>
          </div>
        </div>
      )}

      {/* Banner dimension warning */}
      {warn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/45" onClick={() => resolveWarn(false)} />
          <div
            className="relative bg-white rounded-[20px] z-10 w-full max-w-md p-6 text-center"
            style={{ boxShadow: "0 12px 40px rgba(0,0,0,0.18)" }}
          >
            <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-[#fbf6e6] text-[#b8860b] flex items-center justify-center">
              <DashIcon name="alert" size={24} />
            </div>
            <h3 className="text-[16px] bold text-[#3c3c3c] mb-1.5">
              {t("This banner may not display well")}
            </h3>
            <p className="text-[13px] text-[#8e8e8e] mb-1">
              {t("For best results use a banner of")} {RECOMMENDED_BANNER.label}.
            </p>
            <p className="text-[13px] text-[#8e8e8e] mb-1">
              {t("Keep important content centered — the storefront may crop the top and bottom.")}
            </p>
            <p className="text-[12px] text-[#b8b8b8] mb-5">
              {t("Your image is")} {warn.dims}.
            </p>
            <div className="flex gap-3">
              <DashButton variant="ghost" fullWidth onClick={() => resolveWarn(false)}>
                {t("Cancel")}
              </DashButton>
              <DashButton icon="upload" fullWidth onClick={() => resolveWarn(true)}>
                {t("Ignore & upload")}
              </DashButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify the context import path resolves**

Run: `grep -rn "app/(client)/\[lang\]/sellerProfile/SellerProfileContext" components/SellerDashboard/productEdit/ProductEditor.tsx`
Expected: matches the relative import already used by `ProductEditor.tsx` (line 3). Copy that exact relative path — a new file at the same depth (`components/SellerDashboard/boutiqueEdit/`) uses the identical `../../../app/(client)/[lang]/sellerProfile/SellerProfileContext` specifier.

- [ ] **Step 3: Type-check & lint**

Run: `npx tsc --noEmit` → no errors in `BoutiqueEditor.tsx`.
Run: `pnpm lint` → clean.

- [ ] **Step 4: Commit**

```bash
git add components/SellerDashboard/boutiqueEdit/BoutiqueEditor.tsx
git commit -m "feat(seller-dashboard): add BoutiqueEditor shell with save + status + banner warning"
```

---

### Task 6: Route page

**Files:**
- Create: `app/(client)/[lang]/sellerProfile/sellerDashboard/[sellerId]/boutiques/[boutiqueId]/page.tsx`

**Interfaces:**
- Consumes: `BoutiqueEditor` (Task 5), `BackBar`, `translateFunction`.

- [ ] **Step 1: Write the file** (mirrors the product edit page exactly)

```tsx
"use client";
import { useParams } from "next/navigation";
import BackBar from "components/setting/BackBar";
import { translateFunction } from "utils/functions";
import BoutiqueEditor from "components/SellerDashboard/boutiqueEdit/BoutiqueEditor";

export default function SellerBoutiqueEditPage() {
  const params = useParams();
  const sellerId = params.sellerId as string;
  const boutiqueId = params.boutiqueId as string;
  const local = params.lang?.toString() || "";
  const [, language] = local.split("-");
  const isRtl = language === "ar" || language === "ku";

  return (
    <div className="w-full max-w-[1366px] mx-auto setting-screen pb-10">
      <div className="mb-3 bg-white">
        <BackBar
          isRtl={isRtl}
          local={local}
          name={translateFunction("Boutique", language)}
          preivous_page={`/${local}/sellerProfile/sellerDashboard/${sellerId}`}
          DataCy="seller-boutique-edit-screen"
        />
      </div>

      <div className="px-3 lg:px-0">
        <BoutiqueEditor sellerId={sellerId} boutiqueId={boutiqueId} local={local} />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Type-check & lint**

Run: `npx tsc --noEmit` → clean.
Run: `pnpm lint` → clean.

- [ ] **Step 3: Commit**

```bash
git add "app/(client)/[lang]/sellerProfile/sellerDashboard/[sellerId]/boutiques/[boutiqueId]/page.tsx"
git commit -m "feat(seller-dashboard): add boutique edit route page"
```

---

### Task 7: Boutique card → link to the editor

**Files:**
- Modify: `app/(client)/[lang]/sellerProfile/sellerDashboard/[sellerId]/page.tsx` (the boutique card in `renderBoutiques`, ~lines 1065–1136)

`Link` (line 3) and `local` (line 177) are already in scope. Convert the card's outer `<div>` into a `<Link>` exactly as product cards do.

- [ ] **Step 1: Change the opening tag**

Find (line ~1066):

```tsx
            <div
              key={boutique.id}
              className="group bg-white rounded-[16px] overflow-hidden border border-[#ededed] hover:border-transparent hover:shadow-[0_10px_28px_rgba(0,0,0,0.10)] hover:-translate-y-1 transition-all duration-300"
            >
```

Replace with:

```tsx
            <Link
              key={boutique.id}
              href={`/${local}/sellerProfile/sellerDashboard/${sellerId}/boutiques/${boutique.id}`}
              className="group block bg-white rounded-[16px] overflow-hidden border border-[#ededed] hover:border-transparent hover:shadow-[0_10px_28px_rgba(0,0,0,0.10)] hover:-translate-y-1 transition-all duration-300"
            >
```

- [ ] **Step 2: Change the matching closing tag**

Find the card's closing `</div>` (line ~1135, the one immediately before `))}` that closes `sellerBoutiques.map`):

```tsx
              </div>
            </div>
          ))}
```

Replace the outer `</div>` with `</Link>`:

```tsx
              </div>
            </Link>
          ))}
```

(The inner `</div>` at ~1134 closes the `p-4 space-y-2.5` body block — leave it. Only the outermost card wrapper becomes `</Link>`.)

- [ ] **Step 3: Type-check & lint**

Run: `npx tsc --noEmit` → clean.
Run: `pnpm lint` → clean.

- [ ] **Step 4: Commit**

```bash
git add "app/(client)/[lang]/sellerProfile/sellerDashboard/[sellerId]/page.tsx"
git commit -m "feat(seller-dashboard): link boutique cards to the edit route"
```

---

### Task 8: Translations (ar / tr / ku)

**Files:**
- Modify: `public/translations/translations.ar.js`
- Modify: `public/translations/translations.tr.js`
- Modify: `public/translations/translations.ku.js`

English keys render as-is when a key is missing, so this task adds the localized values for the new strings. Insert each block inside the existing `const translations = { ... }` object (before the closing `}`), avoiding duplicate keys (grep first).

New English keys introduced by this feature:
`"Boutique"`, `"Boutique details"`, `"Shown across the storefront."`, `"Boutique name"`, `"Availability"`, `"Web"`, `"Mobile"`, `"Web + Mobile"`, `"Boutique icon"`, `"Upload icon"`, `"Available in countries"`, `"Leave empty to make the boutique available everywhere."`, `"Translations"`, `"Name, description and bio per language. English is required."`, `"Name"`, `"Description"`, `"Bio"`, `"Banners"`, `"Add banner"`, `"Move left"`, `"Move right"`, `"Uploading…"`, `"Loading boutique…"`, `"Boutique not found."`, `"Failed to load boutique."`, `"You don't have permission to view or edit this boutique."`, `"Unnamed Boutique"`, `"View only"`, `"Edit"`, `"Cancel"`, `"Save Changes"`, `"Set active"`, `"Set inactive"`, `"Active"`, `"Inactive"`, `"Review your changes before saving."`, `"Please fix the highlighted fields before saving."`, `"Boutique updated successfully."`, `"Failed to update boutique."`, `"Could not change status."`, `"Your changes were saved, but the status could not be updated."`, `"Status could not be changed:"`, `"Image upload failed."`, `"Upload returned no file."`, `"Name is required."`, `"English name is required."`, `"Choose an availability."`, `"Please choose an image file."`, `"Banner image must be 10 MB or smaller."`, `"This banner may not display well"`, `"For best results use a banner of"`, `"Keep important content centered — the storefront may crop the top and bottom."`, `"Your image is"`, `"Ignore & upload"`, `"ID"`.

- [ ] **Step 1: Add Arabic values** to `public/translations/translations.ar.js` (inside the object):

```js
  Boutique: "المتجر",
  "Boutique details": "تفاصيل المتجر",
  "Shown across the storefront.": "تظهر في جميع أنحاء المتجر.",
  "Boutique name": "اسم المتجر",
  Availability: "الإتاحة",
  Web: "الويب",
  Mobile: "الجوال",
  "Web + Mobile": "الويب والجوال",
  "Boutique icon": "أيقونة المتجر",
  "Upload icon": "رفع أيقونة",
  "Available in countries": "متاح في الدول",
  "Leave empty to make the boutique available everywhere.": "اتركه فارغًا لجعل المتجر متاحًا في كل مكان.",
  Translations: "الترجمات",
  "Name, description and bio per language. English is required.": "الاسم والوصف والنبذة لكل لغة. الإنجليزية مطلوبة.",
  Name: "الاسم",
  Description: "الوصف",
  Bio: "نبذة",
  Banners: "اللافتات",
  "Add banner": "إضافة لافتة",
  "Move left": "تحريك لليسار",
  "Move right": "تحريك لليمين",
  "Uploading…": "جارٍ الرفع…",
  "Loading boutique…": "جارٍ تحميل المتجر…",
  "Boutique not found.": "المتجر غير موجود.",
  "Failed to load boutique.": "فشل تحميل المتجر.",
  "You don't have permission to view or edit this boutique.": "ليس لديك صلاحية لعرض أو تعديل هذا المتجر.",
  "Unnamed Boutique": "متجر بدون اسم",
  "View only": "عرض فقط",
  Edit: "تعديل",
  Cancel: "إلغاء",
  "Save Changes": "حفظ التغييرات",
  "Set active": "تفعيل",
  "Set inactive": "إلغاء التفعيل",
  Active: "مُفعّل",
  Inactive: "غير مُفعّل",
  "Review your changes before saving.": "راجع تغييراتك قبل الحفظ.",
  "Please fix the highlighted fields before saving.": "يرجى تصحيح الحقول المميزة قبل الحفظ.",
  "Boutique updated successfully.": "تم تحديث المتجر بنجاح.",
  "Failed to update boutique.": "فشل تحديث المتجر.",
  "Could not change status.": "تعذر تغيير الحالة.",
  "Your changes were saved, but the status could not be updated.": "تم حفظ تغييراتك، لكن تعذّر تحديث الحالة.",
  "Status could not be changed:": "تعذر تغيير الحالة:",
  "Image upload failed.": "فشل رفع الصورة.",
  "Upload returned no file.": "لم يُرجع الرفع أي ملف.",
  "Name is required.": "الاسم مطلوب.",
  "English name is required.": "الاسم بالإنجليزية مطلوب.",
  "Choose an availability.": "اختر الإتاحة.",
  "Please choose an image file.": "يرجى اختيار ملف صورة.",
  "Banner image must be 10 MB or smaller.": "يجب ألا يتجاوز حجم اللافتة 10 ميجابايت.",
  "This banner may not display well": "قد لا تظهر هذه اللافتة بشكل جيد",
  "For best results use a banner of": "للحصول على أفضل نتيجة استخدم لافتة بمقاس",
  "Keep important content centered — the storefront may crop the top and bottom.": "أبقِ المحتوى المهم في الوسط — قد يقتطع المتجر الأعلى والأسفل.",
  "Your image is": "صورتك بمقاس",
  "Ignore & upload": "تجاهل وارفع",
  ID: "المعرّف",
```

- [ ] **Step 2: Add Turkish values** to `public/translations/translations.tr.js`:

```js
  Boutique: "Butik",
  "Boutique details": "Butik detayları",
  "Shown across the storefront.": "Mağaza genelinde gösterilir.",
  "Boutique name": "Butik adı",
  Availability: "Kullanılabilirlik",
  Web: "Web",
  Mobile: "Mobil",
  "Web + Mobile": "Web + Mobil",
  "Boutique icon": "Butik simgesi",
  "Upload icon": "Simge yükle",
  "Available in countries": "Ülkelerde kullanılabilir",
  "Leave empty to make the boutique available everywhere.": "Butiği her yerde kullanılabilir yapmak için boş bırakın.",
  Translations: "Çeviriler",
  "Name, description and bio per language. English is required.": "Her dil için ad, açıklama ve biyografi. İngilizce gereklidir.",
  Name: "Ad",
  Description: "Açıklama",
  Bio: "Biyografi",
  Banners: "Afişler",
  "Add banner": "Afiş ekle",
  "Move left": "Sola taşı",
  "Move right": "Sağa taşı",
  "Uploading…": "Yükleniyor…",
  "Loading boutique…": "Butik yükleniyor…",
  "Boutique not found.": "Butik bulunamadı.",
  "Failed to load boutique.": "Butik yüklenemedi.",
  "You don't have permission to view or edit this boutique.": "Bu butiği görüntüleme veya düzenleme izniniz yok.",
  "Unnamed Boutique": "Adsız Butik",
  "View only": "Yalnızca görüntüle",
  Edit: "Düzenle",
  Cancel: "İptal",
  "Save Changes": "Değişiklikleri kaydet",
  "Set active": "Aktif yap",
  "Set inactive": "Pasif yap",
  Active: "Aktif",
  Inactive: "Pasif",
  "Review your changes before saving.": "Kaydetmeden önce değişikliklerinizi gözden geçirin.",
  "Please fix the highlighted fields before saving.": "Kaydetmeden önce vurgulanan alanları düzeltin.",
  "Boutique updated successfully.": "Butik başarıyla güncellendi.",
  "Failed to update boutique.": "Butik güncellenemedi.",
  "Could not change status.": "Durum değiştirilemedi.",
  "Your changes were saved, but the status could not be updated.": "Değişiklikleriniz kaydedildi ancak durum güncellenemedi.",
  "Status could not be changed:": "Durum değiştirilemedi:",
  "Image upload failed.": "Görsel yüklenemedi.",
  "Upload returned no file.": "Yükleme hiçbir dosya döndürmedi.",
  "Name is required.": "Ad gereklidir.",
  "English name is required.": "İngilizce ad gereklidir.",
  "Choose an availability.": "Bir kullanılabilirlik seçin.",
  "Please choose an image file.": "Lütfen bir görsel dosyası seçin.",
  "Banner image must be 10 MB or smaller.": "Afiş görseli 10 MB veya daha küçük olmalıdır.",
  "This banner may not display well": "Bu afiş iyi görüntülenmeyebilir",
  "For best results use a banner of": "En iyi sonuç için şu boyutta bir afiş kullanın:",
  "Keep important content centered — the storefront may crop the top and bottom.": "Önemli içeriği ortada tutun — mağaza üst ve altı kırpabilir.",
  "Your image is": "Görseliniz",
  "Ignore & upload": "Yoksay ve yükle",
  ID: "Kimlik",
```

- [ ] **Step 3: Add Kurdish (Sorani) values** to `public/translations/translations.ku.js`. These are best-effort; flag them for native review at handoff:

```js
  Boutique: "بۆتیک",
  "Boutique details": "وردەکاری بۆتیک",
  "Shown across the storefront.": "لە هەموو فرۆشگادا پیشان دەدرێت.",
  "Boutique name": "ناوی بۆتیک",
  Availability: "بەردەستبوون",
  Web: "وێب",
  Mobile: "مۆبایل",
  "Web + Mobile": "وێب + مۆبایل",
  "Boutique icon": "ئایکۆنی بۆتیک",
  "Upload icon": "بارکردنی ئایکۆن",
  "Available in countries": "بەردەستە لە وڵاتاندا",
  "Leave empty to make the boutique available everywhere.": "بەتاڵی بهێڵەرەوە بۆ ئەوەی بۆتیک لە هەموو شوێنێک بەردەست بێت.",
  Translations: "وەرگێڕانەکان",
  "Name, description and bio per language. English is required.": "ناو، پێناسە و بایۆ بۆ هەر زمانێک. ئینگلیزی پێویستە.",
  Name: "ناو",
  Description: "پێناسە",
  Bio: "بایۆ",
  Banners: "بانەرەکان",
  "Add banner": "زیادکردنی بانەر",
  "Move left": "بۆ چەپ بجوڵێنە",
  "Move right": "بۆ ڕاست بجوڵێنە",
  "Uploading…": "بارکردن…",
  "Loading boutique…": "بارکردنی بۆتیک…",
  "Boutique not found.": "بۆتیک نەدۆزرایەوە.",
  "Failed to load boutique.": "بارکردنی بۆتیک سەرکەوتوو نەبوو.",
  "You don't have permission to view or edit this boutique.": "دەسەڵاتت نییە بۆ بینین یان دەستکاریکردنی ئەم بۆتیکە.",
  "Unnamed Boutique": "بۆتیکی بێ ناو",
  "View only": "تەنها بینین",
  Edit: "دەستکاری",
  Cancel: "هەڵوەشاندنەوە",
  "Save Changes": "پاشەکەوتکردنی گۆڕانکاریەکان",
  "Set active": "چالاککردن",
  "Set inactive": "ناچالاککردن",
  Active: "چالاک",
  Inactive: "ناچالاک",
  "Review your changes before saving.": "پێش پاشەکەوتکردن گۆڕانکاریەکانت پێداچوونەوە بکە.",
  "Please fix the highlighted fields before saving.": "تکایە پێش پاشەکەوتکردن خانە دیاریکراوەکان ڕاست بکەرەوە.",
  "Boutique updated successfully.": "بۆتیک بە سەرکەوتوویی نوێکرایەوە.",
  "Failed to update boutique.": "نوێکردنەوەی بۆتیک سەرکەوتوو نەبوو.",
  "Could not change status.": "نەتوانرا دۆخ بگۆڕدرێت.",
  "Your changes were saved, but the status could not be updated.": "گۆڕانکاریەکانت پاشەکەوتکران، بەڵام دۆخ نەتوانرا نوێ بکرێتەوە.",
  "Status could not be changed:": "دۆخ نەتوانرا بگۆڕدرێت:",
  "Image upload failed.": "بارکردنی وێنە سەرکەوتوو نەبوو.",
  "Upload returned no file.": "بارکردن هیچ فایلێکی نەگەڕاندەوە.",
  "Name is required.": "ناو پێویستە.",
  "English name is required.": "ناوی ئینگلیزی پێویستە.",
  "Choose an availability.": "بەردەستبوونێک هەڵبژێرە.",
  "Please choose an image file.": "تکایە فایلێکی وێنە هەڵبژێرە.",
  "Banner image must be 10 MB or smaller.": "قەبارەی بانەر دەبێت ١٠ مێگابایت یان کەمتر بێت.",
  "This banner may not display well": "لەوانەیە ئەم بانەرە باش پیشان نەدرێت",
  "For best results use a banner of": "بۆ باشترین ئەنجام بانەرێک بەکاربهێنە بە قەبارەی",
  "Keep important content centered — the storefront may crop the top and bottom.": "ناوەڕۆکی گرنگ لە ناوەڕاستدا بهێڵەرەوە — فرۆشگا لەوانەیە سەرەوە و خوارەوە ببڕێت.",
  "Your image is": "وێنەکەت",
  "Ignore & upload": "پشتگوێخستن و بارکردن",
  ID: "ناسنامە",
```

- [ ] **Step 4: Type-check & lint**

Run: `npx tsc --noEmit` → clean.
Run: `pnpm lint` → clean.

- [ ] **Step 5: Commit**

```bash
git add public/translations/translations.ar.js public/translations/translations.tr.js public/translations/translations.ku.js
git commit -m "i18n(seller-dashboard): add boutique editor translations (ar/tr/ku)"
```

---

### Task 9: Manual end-to-end verification

**Files:** none (manual).

- [ ] **Step 1: Build**

Run: `pnpm build`
Expected: build succeeds with no type errors from the new files.

- [ ] **Step 2: Run the app and exercise the flow**

Run: `pnpm dev`, sign in as a seller who owns a boutique, open the dashboard, open the Boutiques tab.

Verify:
- [ ] A boutique card navigates to `/{lang}/sellerProfile/sellerDashboard/{sellerId}/boutiques/{boutiqueId}`.
- [ ] The editor loads name, availability, icon, restricted countries, per-language translations, and existing banners.
- [ ] Without `UPDATE_BUTIKS` the page shows "View only"; with it, **Edit** enables the form.
- [ ] Editing name/availability/description/bio and **Save** → success toast; reload shows persisted values.
- [ ] Banner upload: a >10 MB image is rejected with the size error (no "ignore"); an off-ratio/low-res image shows the warning modal with the recommended **1280×750 (16:9)**; **Ignore & upload** adds it, **Cancel** skips it; reorder arrows and delete work.
- [ ] Toggling status in edit mode then Save applies it; if activation is blocked (`422`), the edits still save and the blocker list is shown while the toggle reverts.
- [ ] Switch app language to Arabic: layout is RTL and strings are translated.
- [ ] Responsive: at `md`/`sm` widths the cards and grids stack cleanly; no horizontal page scroll.
- [ ] Other dashboard tabs (products, orders, gallery, stories, comments) are unchanged.

- [ ] **Step 3: Commit any fixes** discovered during manual testing with focused messages.

---

## Self-Review

**Spec coverage:**
- Route + editor mirroring product editor → Tasks 5, 6. ✅
- Global data (name, availability, icon, countries) → Task 4 `GlobalSection`. ✅
- Per-language translations en/ar/tr/ku → Task 4 `TranslationsSection`, Task 2 mapping. ✅
- Banners upload/reorder/delete + dimension warning + hard-block >10 MB → Tasks 2 (`checkBannerFile`), 4 (`BannersSection`), 5 (queue + modal). ✅
- Status bundled into Save with 422 handling → Task 5 `onSave`. ✅
- Product-attach deferred / preserved → Task 2 `buildUpdatePayload` (`product_resources: related_product_ids`). ✅
- Data layer + X-Seller-ID → Task 1. ✅
- i18n + RTL → Tasks 4/5/8. ✅
- Additive navigation, no breaking changes → Task 7, and every other task creates new files only. ✅

**Placeholder scan:** No TBD/TODO; every code step is complete. Two explicit, justified assumptions (media reference format) are isolated in `mediaRef`/`bannerRef` with a documented fallback.

**Type consistency:** `BoutiqueForm`, `TranslationForm`, `BannerItem`, `SectionProps`, `LangCode` are defined in Tasks 2/4 and consumed unchanged in Task 5. `checkBannerFile` returns `{ hardError?, warning? }` where `warning` carries the `"W×H"` dims string, and Task 5 composes the sentence around it — consistent across both.
