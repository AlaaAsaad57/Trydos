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
      desc={`${t("Recommended size")} ${RECOMMENDED_BANNER.label}. ${t("Used across all languages.")}`}
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
