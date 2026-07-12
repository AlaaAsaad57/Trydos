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
