"use client";
import React, { useRef } from "react";
import { translateFunction } from "utils/functions";
import { getLocalizedCountryName } from "utils/countryData";
import LocalizationServiceClass from "services/localization";
import { DashButton, DashIcon, Segmented } from "components/SellerDashboard/ui";
import dynamic from "next/dynamic";
import RichTextEditorSkeleton from "components/skeleton/RichTextEditorSkeleton";

// Lazy: TipTap (+ prosemirror) is ~150KB min; only the description field
// needs it, so it loads when the form renders instead of with the page.
const RichTextEditor = dynamic(
  () =>
    import("components/SellerDashboard/ui/RichTextEditor").then(
      (m) => m.RichTextEditor,
    ),
  { ssr: false, loading: () => <RichTextEditorSkeleton /> },
);
import { Section, Chip, CopyFrom, FieldShell, dashInputClass } from "./controls";
import {
  AVAILABILITY_LABEL_KEYS,
  FALLBACK_AVAILABILITIES,
  RECOMMENDED_BANNER,
  type BoutiqueForm,
  type BoutiqueLookups,
  type CopyableField,
  type Language,
  type LangCode,
  type TranslationForm,
} from "./helpers";

const t = (s: string) => translateFunction(s);

export interface SectionProps {
  form: BoutiqueForm;
  patch: (p: Partial<BoutiqueForm>) => void;
  patchTranslation: (lang: LangCode, p: Partial<TranslationForm>) => void;
  errors: Record<string, string>;
  lookups: BoutiqueLookups;
  languages: Language[];
  disabled: boolean;
  activeLang: LangCode;
  setActiveLang: (l: LangCode) => void;
  onUploadIcon: (lang: LangCode, file: File) => Promise<void>;
  onAddBanners: (lang: LangCode, files: File[]) => Promise<void>;
  onRemoveBanner: (lang: LangCode, index: number) => void;
  onMoveBanner: (lang: LangCode, index: number, dir: -1 | 1) => void;
  onCopyField: (field: CopyableField, fromLang: LangCode) => void;
  uploading: { icon?: boolean; banners?: boolean };
  shakeTick: number;
}

/* ------------------------------ Availability ---------------------------- */

export function AvailabilitySection({ form, patch, lookups, disabled }: SectionProps) {
  const fromLookups = (lookups.availabilities || []).filter(
    (o) => o.value in AVAILABILITY_LABEL_KEYS, // unknown values are never offered
  );
  const options = fromLookups.length ? fromLookups : FALLBACK_AVAILABILITIES;

  return (
    <Section
      icon="boutiques"
      title="Availability"
      desc="Choose where this boutique is available."
    >
      <select
        value={String(form.availability)}
        disabled={disabled}
        onChange={(e) => patch({ availability: Number(e.target.value) })}
        className={`${dashInputClass} max-w-[320px] ${disabled ? "opacity-70" : ""}`}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {t(AVAILABILITY_LABEL_KEYS[o.value])}
          </option>
        ))}
      </select>
    </Section>
  );
}

/* ------------------------------- Countries ------------------------------ */

export function CountriesSection({ form, patch, lookups, disabled }: SectionProps) {
  const countries = lookups.countries || [];
  const language = LocalizationServiceClass.GetAppLanguage();

  const toggleCountry = (iso: string) => {
    const set = new Set(form.countries_iso);
    if (set.has(iso)) set.delete(iso);
    else set.add(iso);
    patch({ countries_iso: Array.from(set) });
  };

  return (
    <Section
      icon="boutiques"
      title="Restricted countries"
      desc="The boutique is restricted to the selected countries. Leave empty to make it available everywhere."
    >
      {countries.length === 0 ? (
        <p className="text-[12px] text-[#8e8e8e]">
          {t("No countries available.")}
        </p>
      ) : (
        <div className="flex flex-wrap gap-2 max-h-[180px] overflow-auto p-1">
          {countries.map((c) => (
            <Chip
              key={c.iso}
              active={form.countries_iso.includes(c.iso)}
              disabled={disabled}
              onClick={() => toggleCountry(c.iso)}
            >
              {getLocalizedCountryName(c.iso, language)}
            </Chip>
          ))}
        </div>
      )}
    </Section>
  );
}

/* ----------------------------- Translations ---------------------------- */

/** Other languages that already have `field` filled — the copy-from candidates. */
function copyCandidates(
  field: CopyableField,
  activeLang: LangCode,
  form: BoutiqueForm,
  languages: Language[],
): { code: string; label: string }[] {
  const filled = (tr?: TranslationForm) => {
    if (!tr) return false;
    if (field === "icon") return !!(tr.icon || tr.iconPreview);
    if (field === "banners") return tr.banners.length > 0;
    return (tr[field] as string)?.trim().length > 0;
  };
  return languages
    .filter((l) => l.code !== activeLang && filled(form.translations[l.code]))
    .map((l) => ({ code: l.code, label: l.label }));
}

export function TranslationsSection(props: SectionProps) {
  const {
    form,
    patchTranslation,
    errors,
    languages,
    disabled,
    activeLang,
    setActiveLang,
    onUploadIcon,
    onAddBanners,
    onRemoveBanner,
    onMoveBanner,
    onCopyField,
    uploading,
    shakeTick,
  } = props;

  const iconRef = useRef<HTMLInputElement>(null);
  const bannerRef = useRef<HTMLInputElement>(null);

  const tr = form.translations[activeLang];
  // Every language is required, so errors are keyed by the active language.
  const nameError = errors[`translations.${activeLang}.name`];
  const iconError = errors[`translations.${activeLang}.icon`];
  const descriptionError = errors[`translations.${activeLang}.description`];
  const bioError = errors[`translations.${activeLang}.bio`];
  const bannersError = errors[`translations.${activeLang}.banners`];

  if (!tr) return null;

  const copyAction = (field: CopyableField) => (
    <CopyFrom
      options={copyCandidates(field, activeLang, form, languages)}
      onPick={(fromLang) => onCopyField(field, fromLang)}
      disabled={disabled}
    />
  );

  return (
    <Section
      icon="edit"
      title="Translations"
      desc="Name, description, bio, icon and at least one banner are required for every language."
    >
      {/* Language tabs */}
      <div className="mb-5">
        <Segmented<LangCode>
          value={activeLang}
          onChange={setActiveLang}
          options={languages.map((l) => ({ value: l.code, label: l.label }))}
        />
      </div>

      <div className="space-y-5">
        {/* Name */}
        <FieldShell
          label="Name"
          required
          action={copyAction("name")}
          error={nameError}
          shakeTick={shakeTick}
        >
          <input
            type="text"
            value={tr.name}
            disabled={disabled}
            onChange={(e) => patchTranslation(activeLang, { name: e.target.value })}
            className={`${dashInputClass} ${nameError ? "border-[#f85555]" : ""} ${
              disabled ? "opacity-70" : ""
            }`}
          />
        </FieldShell>

        {/* Icon */}
        <FieldShell
          label="Boutique icon"
          required
          action={copyAction("icon")}
          error={iconError}
          shakeTick={shakeTick}
        >
          <div className="flex items-center gap-4">
            <div
              className={`w-[72px] h-[72px] rounded-[15px] overflow-hidden bg-[#f4f4f4] border shrink-0 flex items-center justify-center ${
                iconError ? "border-[#f85555]" : "border-[#ededed]"
              }`}
            >
              {tr.iconPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={tr.iconPreview}
                  alt={t("Boutique icon")}
                  className="w-full h-full object-cover"
                />
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
                    if (f) onUploadIcon(activeLang, f);
                    e.target.value = "";
                  }}
                />
                <DashButton
                  variant="secondary"
                
                  icon="upload"
                  loading={uploading.icon}
                  onClick={() => iconRef.current?.click()}
                >
                  {t("Upload icon")}
                </DashButton>
              </>
            )}
          </div>
        </FieldShell>

        {/* Description */}
        <FieldShell
          label="Description"
          required
          action={copyAction("description")}
          error={descriptionError}
          shakeTick={shakeTick}
        >
          <RichTextEditor
            value={tr.description}
            disabled={disabled}
            error={descriptionError}
            onChange={(v) => patchTranslation(activeLang, { description: v })}
          />
        </FieldShell>

        {/* Bio */}
        <FieldShell
          label="Bio"
          required
          action={copyAction("bio")}
          error={bioError}
          shakeTick={shakeTick}
        >
          <textarea
            rows={3}
            value={tr.bio}
            disabled={disabled}
            onChange={(e) => patchTranslation(activeLang, { bio: e.target.value })}
            className={`${dashInputClass} h-auto py-3 leading-relaxed ${
              bioError ? "border-[#f85555]" : ""
            } ${disabled ? "opacity-70" : ""}`}
          />
        </FieldShell>

        {/* Banners */}
        <FieldShell
          label="Banners"
          required
          action={copyAction("banners")}
          error={bannersError}
          shakeTick={shakeTick}
        >
          <p className="text-[12px] text-[#8e8e8e] mb-2.5">
            {t("Recommended size")} {RECOMMENDED_BANNER.label}.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" dir="ltr">
            {tr.banners.map((b, i) => (
              <div
                key={b.id ?? `new-${i}`}
                className="relative rounded-[12px] overflow-hidden border border-[#ededed] bg-[#f8f8f8] aspect-[16/9]"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={b.previewUrl}
                  alt={`${t("Banner")} ${i + 1}`}
                  className="w-full h-full object-cover"
                />
                {!disabled && (
                  <div className="absolute inset-x-0 bottom-0 p-2 flex items-center justify-between gap-2 bg-gradient-to-t from-black/55 to-transparent">
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        disabled={i === 0}
                        onClick={() => onMoveBanner(activeLang, i, -1)}
                        className="w-7 h-7 rounded-full bg-white/90 flex items-center justify-center disabled:opacity-40"
                        aria-label={t("Move left")}
                      >
                        <DashIcon name="chevronLeft" size={15} />
                      </button>
                      <button
                        type="button"
                        disabled={i === tr.banners.length - 1}
                        onClick={() => onMoveBanner(activeLang, i, 1)}
                        className="w-7 h-7 rounded-full bg-white/90 flex items-center justify-center disabled:opacity-40"
                        aria-label={t("Move right")}
                      >
                        <DashIcon name="chevronRight" size={15} />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => onRemoveBanner(activeLang, i)}
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
              if (files.length) onAddBanners(activeLang, files);
              e.target.value = "";
            }}
          />
        </FieldShell>
      </div>
    </Section>
  );
}
