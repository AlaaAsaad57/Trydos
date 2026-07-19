// Types, GET→form/form→payload mapping, validation and banner dimension checks
// for the boutique editor. Content (name/description/bio/icon/banners) is
// PER-LANGUAGE — each translation carries its own copy. The boutique's global
// data (boutique_global_data) is derived from the default (English) language.

import { sanitizeHtml } from "utils/sanitizeHtml";

/** Language codes are dynamic (sourced from the languages API), so this is a
 *  plain string — not a fixed union. */
export type LangCode = string;

/** The default language whose content seeds boutique_global_data. */
export const DEFAULT_LANG: LangCode = "en";

/** Default availability (Web + Mobile) — used on create and as the fallback
 *  when the stored/looked-up value is unknown. The user picks the real value
 *  in the availability select. */
export const DEFAULT_AVAILABILITY = 3;

/** Local translation key per availability value — backend `label` strings
 *  ("WebMobile") are never rendered. Options whose value is not in this map
 *  are not offered. */
export const AVAILABILITY_LABEL_KEYS: Record<number, string> = {
  1: "Web",
  2: "Mobile",
  3: "Web + Mobile",
};

/** Fallback options when the lookups response carries no availabilities. */
export const FALLBACK_AVAILABILITIES: AvailabilityOption[] = [
  { value: 1, label: "Web" },
  { value: 2, label: "Mobile" },
  { value: 3, label: "WebMobile" },
];

export interface AvailabilityOption {
  value: number;
  label: string;
}

export interface Language {
  code: LangCode;
  label: string; // display name (native), shown on the language tab
  isRtl: boolean;
}

/** Codes that render right-to-left when the API doesn't tell us the direction. */
const RTL_CODES = new Set(["ar", "ku", "fa", "he", "ur", "ps", "sd"]);

/** Used only if the languages API is unreachable/empty. */
export const FALLBACK_LANGUAGES: Language[] = [
  { code: "en", label: "English", isRtl: false },
  { code: "ar", label: "العربية", isRtl: true },
  { code: "tr", label: "Türkçe", isRtl: false },
  { code: "ku", label: "کوردی", isRtl: true },
];

// Recommended banner size (see design §6): 1280×750, ~16:9.
export const RECOMMENDED_BANNER = { width: 1280, height: 750, label: "1280 × 750 (16:9)" };
export const MAX_BANNER_MB = 10;
const MAX_BANNER_BYTES = MAX_BANNER_MB * 1024 * 1024;
/** Icon shares the same 10 MB ceiling as banners. */
export const MAX_ICON_MB = 10;
const MAX_ICON_BYTES = MAX_ICON_MB * 1024 * 1024;
const MIN_BANNER_WIDTH = 600;
const MIN_BANNER_RATIO = 1.5;
const MAX_BANNER_RATIO = 1.8;

export interface CountryOption {
  iso: string;
  name: string;
}

export interface BoutiqueLookups {
  countries: CountryOption[];
  availabilities?: AvailabilityOption[];
}

export interface BannerItem {
  id?: number; // existing banner id (omit for new / copied)
  banner: string; // bare filename sent back to the API as `file_path` (never the folder)
  previewUrl: string; // absolute URL / object URL for display
  isNew?: boolean;
}

export interface TranslationForm {
  id?: number; // existing translation id (omit to create)
  language_code: LangCode;
  name: string;
  description: string;
  bio: string;
  icon: string; // bare filename sent back to the API (never the folder)
  iconPreview: string; // absolute URL / object URL for display
  banners: BannerItem[]; // per-language
}

export interface BoutiqueForm {
  countries_iso: string[];
  related_product_ids: (number | string)[]; // preserved untouched (deferred feature)
  translations: Record<LangCode, TranslationForm>;
  status: number; // 0 inactive / 1 active — staged; applied via change-status on save
  availability: number; // 1 Web · 2 Mobile · 3 Web+Mobile — user-picked
}

/** Fields that can be copied from one language into another. */
export type CopyableField = "name" | "description" | "bio" | "icon" | "banners";

export interface BannerCheck {
  hardError?: string; // block upload (translatable key)
  warning?: string; // warn but allow "Ignore & upload" (already-composed, translatable)
}

/* --------------------------------- languages -------------------------------- */

/** Map the (loosely-typed) `api/v1/languages` response into `Language[]`.
 *  Defensive across common backend shapes; falls back to the built-in list. */
export function mapLanguages(data: any): Language[] {
  const arr =
    data?.data?.languages ?? data?.languages ?? data?.data ?? data ?? [];
  if (!Array.isArray(arr)) return FALLBACK_LANGUAGES;

  const mapped: Language[] = arr
    .map((item: any): Language | null => {
      const code = String(
        item?.code ?? item?.language_code ?? item?.iso ?? item?.slug ?? "",
      )
        .trim()
        .toLowerCase();
      if (!code) return null;
      const label =
        item?.native_name ?? item?.name ?? item?.title ?? item?.label ?? code;
      const dir = String(item?.direction ?? item?.dir ?? "").toLowerCase();
      const isRtl =
        item?.is_rtl === true ||
        item?.is_rtl === 1 ||
        item?.rtl === true ||
        item?.rtl === 1 ||
        dir === "rtl" ||
        RTL_CODES.has(code);
      return { code, label: String(label), isRtl };
    })
    .filter((l: Language | null): l is Language => l !== null);

  // De-dupe by code, preserving order.
  const seen = new Set<string>();
  const unique = mapped.filter((l) =>
    seen.has(l.code) ? false : (seen.add(l.code), true),
  );

  return unique.length ? unique : FALLBACK_LANGUAGES;
}

/* ----------------------------------- media ---------------------------------- */

/** Upload folders (the media server `folder` field) — WHERE the file is stored.
 *  Used ONLY for the upload request. The upload service already returns the
 *  folder in its path, and the backend resolves the folder itself, so we never
 *  send the folder back on save — only the bare filename (see fileNameOf).
 *  Prefixing it here produced a doubled "folder/folder/file" path. */
export const ICON_FOLDER = "boutiques/boutiques/icon";
export const BANNER_FOLDER = "boutiques/boutiques";

/** Bare stored filename from a URL or path (".../a/b.webp" -> "b.webp").
 *  This is exactly what the backend expects for `icon` / `file_path`: the file
 *  itself, with no folder prefix — for both freshly-uploaded and existing
 *  images. */
export function fileNameOf(raw: string): string {
  if (!raw) return "";
  return raw.replace(/^\/+/, "").split("?")[0].split("/").pop() || raw;
}

/** Best-effort filename list from the media-server /upload/bulk response shapes. */
export function extractUploadedNames(data: any): string[] {
  const arr =
    data?.files ?? data?.urls ?? data?.results ?? data?.data ?? (data?.url ? [data.url] : Array.isArray(data) ? data : []);
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

/* ------------------------------- form building ------------------------------ */

function emptyTranslation(code: LangCode): TranslationForm {
  return {
    language_code: code,
    name: "",
    description: "",
    bio: "",
    icon: "",
    iconPreview: "",
    banners: [],
  };
}

function mapBanners(raw: any): BannerItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .slice()
    .sort((a: any, b: any) => (a?.sequence ?? 0) - (b?.sequence ?? 0))
    .map((b: any) => ({
      id: b?.id,
      banner: fileNameOf(b?.banner ?? ""), // bare filename for the update payload
      previewUrl: b?.banner ?? "", // absolute URL for display
    }));
}

/**
 * Blank form for the "create boutique" route — one empty translation per
 * language. `buildUpdatePayload` omits ids when absent, so this produces a valid
 * POST /add body untouched.
 */
export function emptyBoutiqueForm(languages: Language[]): BoutiqueForm {
  const translations: Record<LangCode, TranslationForm> = {};
  for (const lang of languages) translations[lang.code] = emptyTranslation(lang.code);
  return {
    countries_iso: [],
    related_product_ids: [],
    translations,
    status: 0,
    availability: DEFAULT_AVAILABILITY,
  };
}

/** Map the GET /edit `boutique` object into the editable per-language form. */
export function buildFormFromEdit(boutique: any, languages: Language[]): BoutiqueForm {
  const srcTranslations: any[] = Array.isArray(boutique?.translations)
    ? boutique.translations
    : [];
  const byCode = new Map<string, any>();
  for (const tr of srcTranslations) {
    const code = String(tr?.language_code ?? "").toLowerCase();
    if (code) byCode.set(code, tr);
  }

  const translations: Record<LangCode, TranslationForm> = {};
  for (const lang of languages) {
    const tr = byCode.get(lang.code);
    if (!tr) {
      translations[lang.code] = emptyTranslation(lang.code);
      continue;
    }
    translations[lang.code] = {
      id: tr?.id,
      language_code: lang.code,
      name: tr?.name ?? "",
      description: tr?.description ?? "",
      bio: tr?.bio ?? "",
      icon: fileNameOf(tr?.icon ?? boutique?.icon ?? ""),
      iconPreview: tr?.icon ?? boutique?.icon ?? "",
      banners: mapBanners(tr?.banners),
    };
  }

  return {
    countries_iso: Array.isArray(boutique?.restricted_countries_iso)
      ? boutique.restricted_countries_iso
      : [],
    related_product_ids: Array.isArray(boutique?.related_product_ids)
      ? boutique.related_product_ids
      : [],
    translations,
    status: Number(boutique?.status ?? 0),
    availability:
      Number(boutique?.availability) in AVAILABILITY_LABEL_KEYS
        ? Number(boutique.availability)
        : DEFAULT_AVAILABILITY,
  };
}

/** Build the boutique save body: global data (from the default language) + one
 *  per-language content entry each.
 *
 *  The per-language key differs between the two endpoints (see the API contract):
 *  update (`POST /shop/boutiques/{id}/update`) expects `custom_data`, while create
 *  (`POST /shop/boutiques`) expects `boutique_custom_data` — sending the wrong key
 *  to create silently drops every translation. Pass `mode` accordingly. */
export function buildUpdatePayload(
  form: BoutiqueForm,
  languages: Language[],
  mode: "update" | "create" = "update",
): Record<string, unknown> {
  const codes = languages.length
    ? languages.map((l) => l.code)
    : Object.keys(form.translations);

  const custom_data = codes
    .map((code) => {
      const tr = form.translations[code];
      if (!tr) return null;
      return {
        ...(tr.id ? { id: tr.id } : {}),
        language_code: code,
        name: tr.name,
        description: sanitizeHtml(tr.description),
        bio: tr.bio,
        icon: tr.icon,
        banners: tr.banners.map((b, i) => ({
          ...(b.id ? { id: b.id } : {}),
          file_path: b.banner, // §4.2: the banner reference key is `file_path`
          sequence: i + 1,
        })),
      };
    })
    .filter(
      (c): c is NonNullable<typeof c> =>
        c != null && (c.name.trim().length > 0 || c.id != null),
    );

  const base =
    form.translations[DEFAULT_LANG] ??
    form.translations[codes[0]] ??
    emptyTranslation(DEFAULT_LANG);

  // create → `boutique_custom_data`; update → `custom_data` (see the doc above).
  const perLangKey = mode === "create" ? "boutique_custom_data" : "custom_data";

  return {
    boutique_global_data: {
      name: base.name,
      availability: form.availability,
      description: sanitizeHtml(base.description),
      bio: base.bio,
      icon: base.icon,
      countries_iso: form.countries_iso,
      product_resources: form.related_product_ids, // unchanged (deferred)
    },
    [perLangKey]: custom_data,
  };
}

/** Field-level validation. Every language must carry a name, description, bio,
 *  an icon and at least one banner — the storefront renders each translation on
 *  its own, so a partially-filled language would surface blanks to shoppers.
 *  The icon is required by the backend on both add and update (the default
 *  language's icon also seeds `boutique_global_data.icon`), so block it here
 *  rather than let every save 422. */
export function validate(form: BoutiqueForm): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const [code, tr] of Object.entries(form.translations)) {
    if (!tr) continue;
    if (!tr.name.trim()) errors[`translations.${code}.name`] = "Name is required.";
    if (!tr.description.trim())
      errors[`translations.${code}.description`] = "Description is required.";
    if (!tr.bio.trim()) errors[`translations.${code}.bio`] = "Bio is required.";
    if (!tr.icon.trim()) errors[`translations.${code}.icon`] = "Icon is required.";
    if (tr.banners.length === 0)
      errors[`translations.${code}.banners`] = "At least one banner is required.";
  }
  return errors;
}

/* ----------------------------- banner validation ---------------------------- */

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

/** Hard-block (type/size) for an icon file. Icons have no dimension/ratio rules,
 *  so this is synchronous — type and 10 MB size only. */
export function checkIconFile(file: File): { hardError?: string } {
  if (!file.type.startsWith("image/"))
    return { hardError: "Please choose an image file." };
  if (file.size > MAX_ICON_BYTES)
    return { hardError: "Icon image must be 10 MB or smaller." };
  return {};
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
