"use client";
import React, { useEffect, useRef, useState, useMemo } from "react";
import { translateFunction } from "utils/functions";
import { getLocalizedCountryName } from "utils/countryData";
import LocalizationServiceClass from "services/localization";
import { allCountries } from "country-telephone-data";
import { FlagIcon } from "utils/tinyUtils";
import {
  DashButton,
  DashField,
  DashIcon,
  dashInputClass,
} from "components/SellerDashboard/ui";
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
import {
  combos,
  ProductForm,
  Lookups,
  UNITS,
  VariantRow,
  emptyVariantRow,
  seedVariantDefaults,
  ImageItem,
  parseDescriptorOptions,
  renderableDescriptorGroups,
  descriptorIconUrl,
  locationLabel,
  getColorFromLookup,
} from "./helpers";
import GalleryPickerModal, { PickedImage } from "./GalleryPickerModal";

/* ------------------------------- shared UI ------------------------------- */

export interface SectionProps {
  form: ProductForm;
  patch: (p: Partial<ProductForm>) => void;
  errors: Record<string, string>;
  lookups: Lookups;
  disabled: boolean;
  onUploadImages?: (files: File[]) => Promise<void>;
  onUploadMeta?: (file: File) => Promise<void>;
  onUploadVideo?: (file: File) => Promise<void>;
  uploading?: { images?: boolean; meta?: boolean; video?: boolean };
  sellerId: string;
  canUseGallery?: boolean;
  busy?: boolean;
  isCreate?: boolean;
  /** Shop currency code (e.g. "SYP") overlaid on money inputs; "" = no overlay. */
  currency?: string;
  /**
   * Creating a product as a seller who is not approved for new products: every
   * price except Purchase Price is hidden (not merely disabled — an input the
   * seller cannot fill is noise). Narrower than `disabled`, which means "view
   * mode" and covers the whole form. Optional and false by default, so sections
   * used elsewhere are unaffected.
   */
  pricesLocked?: boolean;
}

const t = (s: string) => translateFunction(s);

/** One titled card section — matches the dashboard DashCard rhythm. */
export function Section({
  icon,
  title,
  desc,
  children,
}: {
  icon: any;
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

const Grid = ({ children }: { children: React.ReactNode }) => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">{children}</div>
);

function Txt({
  label,
  value,
  onChange,
  error,
  hint,
  disabled,
  placeholder,
  required,
  fieldKey,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  hint?: string;
  disabled?: boolean;
  placeholder?: string;
  required?: boolean;
  fieldKey?: string;
}) {
  return (
    <div data-field={fieldKey}>
      <DashField label={required ? `${t(label)} *` : t(label)} error={error} hint={hint}>
        <input
          type="text"
          value={value}
          disabled={disabled}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={`${dashInputClass} ${error ? "border-[#f85555]" : ""} ${
            disabled ? "opacity-70" : ""
          }`}
        />
      </DashField>
    </div>
  );
}

function Num({
  label,
  value,
  onChange,
  error,
  hint,
  disabled,
  required,
  step = "any",
  fieldKey,
  suffix,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  hint?: string;
  disabled?: boolean;
  required?: boolean;
  step?: string;
  fieldKey?: string;
  /** Static overlay at the input's inline end (e.g. a currency code). */
  suffix?: string;
}) {
  return (
    <div data-field={fieldKey}>
      <DashField label={required ? `${t(label)} *` : t(label)} error={error} hint={hint}>
        <div className="relative">
          <input
            type="number"
            min="0"
            step={step}
            value={value}
            disabled={disabled}
            onChange={(e) => {
              const val = e.target.value;
              if (val && parseFloat(val) < 0) return;
              onChange(val);
            }}
            className={`${dashInputClass} ${suffix ? "pe-14" : ""} ${
              error ? "border-[#f85555]" : ""
            } ${disabled ? "opacity-70" : ""}`}
          />
          {suffix && (
            <span className="absolute end-4 top-1/2 -translate-y-1/2 text-[12px] semibold text-[#8e8e8e] pointer-events-none">
              {suffix}
            </span>
          )}
        </div>
      </DashField>
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
  disabled,
  error,
  required,
  fieldKey,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string; icon?: React.ReactNode }[];
  disabled?: boolean;
  error?: string;
  required?: boolean;
  fieldKey?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find((o) => o.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const filteredOptions = options.filter((o) =>
    (o.label || "").toLowerCase().includes(query.toLowerCase().trim())
  );

  return (
    <div data-field={fieldKey} ref={containerRef} className="relative">
      <DashField label={required ? `${t(label)} *` : t(label)} error={error}>
        <div
          tabIndex={disabled ? -1 : 0}
          onClick={() => {
            if (!disabled) setIsOpen((prev) => !prev);
          }}
          onKeyDown={(e) => {
            if ((e.key === "Enter" || e.key === " ") && !disabled) {
              e.preventDefault();
              setIsOpen((prev) => !prev);
            }
          }}
          className={`${dashInputClass} flex items-center justify-between cursor-pointer select-none ${
            error ? "border-[#f85555]" : ""
          } ${disabled ? "opacity-70 cursor-not-allowed" : ""}`}
        >
          <span className={`truncate text-[13px] flex items-center gap-2 ${selectedOption ? "text-[#3c3c3c] medium" : "text-[#8e8e8e]"}`}>
            {selectedOption?.icon && <span className="shrink-0 flex items-center">{selectedOption.icon}</span>}
            <span className="truncate">{selectedOption ? selectedOption.label : t("Select")}</span>
          </span>
          <span className={`text-[#8e8e8e] transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}>
            <DashIcon name="chevronDown" size={14} />
          </span>
        </div>

        {isOpen && !disabled && (
          <div
            className="absolute left-0 right-0 top-full z-50 mt-1.5 bg-white rounded-[12px] border border-[#ededed] shadow-lg p-2 space-y-1.5"
            style={{ boxShadow: "0 8px 24px rgba(0,0,0,0.14)" }}
          >
            <div className="relative">
              <input
                ref={searchInputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("Search...")}
                className="w-full h-[34px] px-3 py-1 bg-[#f8f8f8] border border-[#ededed] rounded-[8px] text-[12px] text-[#3c3c3c] outline-none focus:border-[#5d5d5d] focus:bg-white"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            <div className="max-h-48 overflow-y-auto space-y-0.5 custom-scrollbar">
              <div
                onClick={() => {
                  onChange("");
                  setIsOpen(false);
                  setQuery("");
                }}
                className={`px-3 py-2 rounded-[8px] text-[12px] cursor-pointer transition-colors ${
                  value === "" ? "bg-[#f4f4f4] text-[#5d5d5d] font-semibold" : "text-[#8e8e8e] hover:bg-[#f8f8f8]"
                }`}
              >
                {t("Select")}
              </div>
              {filteredOptions.length === 0 ? (
                <div className="px-3 py-2 text-[12px] text-[#b8b8b8] text-center">
                  {t("No options found")}
                </div>
              ) : (
                filteredOptions.map((o) => (
                  <div
                    key={o.value}
                    onClick={() => {
                      onChange(o.value);
                      setIsOpen(false);
                      setQuery("");
                    }}
                    className={`px-3 py-2 rounded-[8px] text-[12px] cursor-pointer transition-colors flex items-center gap-2 ${
                      value === o.value
                        ? "bg-[#5d5d5d]/[0.08] text-[#3c3c3c] font-medium"
                        : "text-[#3c3c3c] hover:bg-[#f4f4f4]"
                    }`}
                  >
                    {o.icon && <span className="shrink-0 flex items-center">{o.icon}</span>}
                    <span className="truncate">{o.label}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </DashField>
    </div>
  );
}

/** Selection = outline + faint tint (design-language §10.8), never checkbox. */
function Chip({
  active,
  onClick,
  disabled,
  children,
}: {
  active: boolean;
  /** Optional: a permanently non-interactive chip (e.g. the read-only
   *  Attributes section) has no handler at all. */
  onClick?: () => void;
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

function Toggle({
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
        className={`relative shrink-0 w-[44px] h-[26px] rounded-full transition-colors disabled:opacity-50 ${
          value ? "bg-[#5d5d5d]" : "bg-[#d9d9de]"
        }`}
        aria-pressed={value}
      >
        <span
          className={`absolute top-[3px] w-[20px] h-[20px] rounded-full bg-white shadow-sm transition-all ${
            value ? "left-[21px]" : "left-[3px]"
          }`}
        />
      </button>
    </div>
  );
}

/* ------------------------------- sections -------------------------------- */

export function CoreSection({ form, patch, errors, lookups, disabled }: SectionProps) {
  return (
    <Section icon="products" title="General" desc="Identity & classification of the product.">
      <Grid>
        <Txt label="Product Name" fieldKey="name" value={form.name} required error={errors.name} disabled={disabled} onChange={(v) => patch({ name: v })} />
        <Txt label="Seller Product ID" fieldKey="seller_product_id" value={form.seller_product_id} required error={errors.seller_product_id} hint={t("Must stay unique across the marketplace")} disabled={disabled} onChange={(v) => patch({ seller_product_id: v })} />
        <Txt label="Barcode" fieldKey="barcode" value={form.barcode} error={errors.barcode} disabled={disabled} onChange={(v) => patch({ barcode: v })} />
        <Select label="Unit" fieldKey="unit" value={form.unit} required error={errors.unit} disabled={disabled} onChange={(v) => patch({ unit: v })} options={UNITS.map((u) => ({ value: u, label: u }))} />
        <Select label="Brand" fieldKey="brand_id" value={form.brand_id} required error={errors.brand_id} disabled={disabled} onChange={(v) => patch({ brand_id: v })} options={(lookups.brands || []).map((b) => ({ value: String(b.id), label: b.translated_name ?? b.name }))} />
        <Select label="Boutique" fieldKey="boutique_id" value={form.boutique_id} error={errors.boutique_id} disabled={disabled} onChange={(v) => patch({ boutique_id: v })} options={(lookups.boutiques || []).map((b) => ({ value: String(b.id), label: b.translated_name ?? b.name }))} />
        <Select label="Location" fieldKey="location_id" value={form.location_id} required error={errors.location_id} disabled={disabled} onChange={(v) => patch({ location_id: v })} options={(lookups.locations || []).map((l) => ({ value: String(l.id), label: locationLabel(l) }))} />
        <Txt label="Model Number" fieldKey="model_number" value={form.model_number} error={errors.model_number} disabled={disabled} onChange={(v) => patch({ model_number: v })} />
        <Txt label="Report Ref. Number" fieldKey="report_ref_number" value={form.report_ref_number} error={errors.report_ref_number} disabled={disabled} onChange={(v) => patch({ report_ref_number: v })} />
      </Grid>
      <div className="mt-5" data-field="description">
        <DashField label={t("Description")}>
          <RichTextEditor value={form.description} disabled={disabled} onChange={(v) => patch({ description: v })} />
          {errors.description && <p className="text-[12px] text-[#f85555] mt-1.5">{errors.description}</p>}
        </DashField>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-5">
        <Toggle label="Multiply Shipping × Quantity" desc="Charge shipping per item ordered." value={Boolean(form.multiply_qty)} disabled={disabled} onChange={(v) => patch({ multiply_qty: v ? 1 : 0 })} />
        <Toggle label="Packed After Ordering" desc="Item is packed once an order is placed." value={Boolean(form.packed_after_ordering)} disabled={disabled} onChange={(v) => patch({ packed_after_ordering: v ? 1 : 0 })} />
      </div>
    </Section>
  );
}

export function PricingSection({ form, patch, errors, disabled, currency, pricesLocked }: SectionProps) {
  const hasVariants = combos(form).length > 0;
  // Every price except Purchase Price is hidden for an unapproved seller — an
  // input that cannot be filled is noise, so it is not rendered at all rather
  // than shown greyed out. Non-price fields below (stock, weight, qty, pieces,
  // shipping days) stay editable. The payload is unaffected: buildUpdateFormData
  // sends "0" or existing values for omitted price keys.
  return (
    <Section icon="orders" title="Pricing & Stock" desc="Prices are in your display currency; converted server-side.">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {!pricesLocked && (
          <Num label="Unit Price" fieldKey="unit_price" value={form.unit_price} required error={errors.unit_price} disabled={disabled} suffix={currency} onChange={(v) => patch({ unit_price: v })} />
        )}
        {!pricesLocked && (
          <Num label="Discount Price" fieldKey="discount_price" value={form.discount_price} error={errors.discount_price} hint={t("Must be ≤ unit price")} disabled={disabled} suffix={currency} onChange={(v) => patch({ discount_price: v })} />
        )}
        <Num label="Purchase Price" fieldKey="purchase_price" value={form.purchase_price} error={errors.purchase_price} disabled={disabled} suffix={currency} onChange={(v) => patch({ purchase_price: v })} />
        {!pricesLocked && (
          <Num label="Luck Price" fieldKey="luck_price" value={form.luck_price} error={errors.luck_price} disabled={disabled} suffix={currency} onChange={(v) => patch({ luck_price: v })} />
        )}
        <Num
          label="Current Stock"
          fieldKey="current_stock"
          value={form.current_stock}
          error={errors.current_stock}
          hint={hasVariants ? t("Auto-calculated from variations") : undefined}
          disabled={disabled || hasVariants}
          onChange={(v) => patch({ current_stock: v })}
        />
        <Num label="Weight" value={form.weight} error={errors.weight} required fieldKey="weight" disabled={disabled} onChange={(v) => patch({ weight: v })} />
        <Num label="Max Allowed Qty" fieldKey="max_allowed_qty" value={form.max_allowed_qty} error={errors.max_allowed_qty} disabled={disabled} onChange={(v) => patch({ max_allowed_qty: v })} />
        <Num label="Pieces / Unit" fieldKey="count_of_pieces" value={form.count_of_pieces} error={errors.count_of_pieces} hint={t("Must be a whole number between 1 and 100")} disabled={disabled} step="1" onChange={(v) => patch({ count_of_pieces: v })} />
        {!pricesLocked && (
          <Num label="Shipping Cost" fieldKey="shipping_cost" value={form.shipping_cost} error={errors.shipping_cost} disabled={disabled} suffix={currency} onChange={(v) => patch({ shipping_cost: v })} />
        )}
        <Num label="Shipping Days" fieldKey="shipping_days" value={form.shipping_days} error={errors.shipping_days} disabled={disabled} step="1" onChange={(v) => patch({ shipping_days: v })} />
        {/* A flat tax is an amount in the display currency and is converted
            server-side; any other type is read as a percentage (contract §1b).
            Tax changes what the buyer pays, so it follows the same rule as the
            other prices and is hidden for an unapproved seller. */}
        {!pricesLocked && (
          <Num
            label="Tax"
            fieldKey="tax"
            value={form.tax}
            error={errors.tax}
            disabled={disabled}
            suffix={form.tax_type === "flat" ? currency : "%"}
            onChange={(v) => patch({ tax: v })}
          />
        )}
        {!pricesLocked && (
          <Select
            label="Tax Type"
            fieldKey="tax_type"
            value={form.tax_type}
            error={errors.tax_type}
            disabled={disabled}
            onChange={(v) => patch({ tax_type: v })}
            options={[
              { value: "percent", label: t("Percent") },
              { value: "flat", label: t("Flat") },
            ]}
          />
        )}
      </div>
    </Section>
  );
}

function toggleId(arr: number[], id: number): number[] {
  return arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id];
}
function toggleStr(arr: string[], v: string): string[] {
  return arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
}

export function CategoriesSection({ form, patch, errors, lookups, disabled, busy }: SectionProps) {
  const [mainCatQuery, setMainCatQuery] = useState("");
  const [subCatQuery, setSubCatQuery] = useState("");
  const [subSubCatQuery, setSubSubCatQuery] = useState("");

  const group = (
    title: string,
    items: { id: number; name: string; translated_name?: string }[],
    selected: number[],
    key: keyof ProductForm,
    searchQuery: string,
    onSearchChange: (q: string) => void,
  ) => {
    // Read mode shows only the chosen values; edit mode shows the full picker.
    const baseItems = disabled ? items.filter((c) => selected.includes(c.id)) : items;
    const shown = disabled
      ? baseItems
      : baseItems.filter((c) => {
          if (!searchQuery.trim()) return true;
          const q = searchQuery.toLowerCase().trim();
          const name = (c.name || "").toLowerCase();
          const trans = (c.translated_name || "").toLowerCase();
          return name.includes(q) || trans.includes(q);
        });

    return (
      <div>
        <div className="flex  sm:flex-row sm:items-center justify-between gap-2 mb-2">
          <p className="text-[13px] medium text-[#505050]">{t(title)}</p>
          {!disabled && items.length > 0 && (
            <div className="relative max-w-[200px] w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={t("Search...")}
                className="w-full h-[28px] px-2.5 bg-[#f8f8f8] border border-[#ededed] rounded-[8px] text-[12px] text-[#3c3c3c] outline-none focus:border-[#5d5d5d] focus:bg-white"
              />
            </div>
          )}
        </div>
        {shown.length === 0 ? (
          <p className="text-[12px] text-[#b8b8b8] text-center">
            {disabled
              ? t("None")
              : searchQuery
              ? t("No matching options.")
              : t("No options available for the current selection.")}
          </p>
        ) : (
          <div className="flex flex-wrap gap-2 max-h-[220px] overflow-auto p-0.5 custom-scrollbar">
            {shown.map((c) => (
              <Chip key={c.id} active={selected.includes(c.id)} disabled={disabled || busy} onClick={() => patch({ [key]: toggleId(selected, c.id) } as any)}>
                {c.translated_name ?? c.name}
              </Chip>
            ))}
          </div>
        )}
      </div>
    );
  };
  return (
    <Section icon="boutiques" title="Categories" desc="Sub-categories shown match the current parents (re-open the page after changing parents to load others).">
      <div className="relative" data-field="category_id">
        {busy && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 rounded-[12px]">
            <span className="text-[12px] medium text-[#5d5d5d]">{t("Loading…")}</span>
          </div>
        )}
        <div className={`space-y-5 ${busy ? "opacity-60 pointer-events-none" : ""}`}>
          {errors.category_id && <p className="text-[12px] text-[#f85555]">{errors.category_id}</p>}
          {group("Main Categories", lookups.parent_categories || [], form.category_id, "category_id", mainCatQuery, setMainCatQuery)}
          {group("Sub Categories", lookups.sub_categories || [], form.sub_category_id, "sub_category_id", subCatQuery, setSubCatQuery)}
          {group("Sub-sub Categories", lookups.sub_sub_categories || [], form.sub_sub_category_id, "sub_sub_category_id", subSubCatQuery, setSubSubCatQuery)}
        </div>
      </div>
    </Section>
  );
}

/**
 * Attributes: each descriptor GROUP (e.g. "Leather") holds DESCRIPTORS (e.g.
 * "Luster"), and the seller sets one VALUE per descriptor. `string_choice`
 * descriptors are single-select over their `options`; `numeric` descriptors take
 * a number. Groups with no renderable descriptors, and descriptors with no input
 * (a string_choice with no options), are dropped — never shown.
 */
/** Group / descriptor icon: the media-server file when the lookup carries one,
 *  a muted tag placeholder otherwise (icons are decorative — empty alt). */
function DescriptorIcon({
  icon,
  kind,
  size,
}: {
  icon?: string;
  kind: "group" | "descriptor";
  size: number;
}) {
  const url = descriptorIconUrl(icon, kind);
  return url ? (
    <img
      src={url}
      alt=""
      width={size}
      height={size}
      className="object-contain shrink-0"
    />
  ) : (
    <span className="text-[#b8b8b8] shrink-0">
      <DashIcon name="boutiques" size={size - 2} />
    </span>
  );
}

export function DescriptorsSection({ form, patch, disabled, busy, lookups }: SectionProps) {
  const allGroups = renderableDescriptorGroups(lookups.descriptor_groups || []);

  // Read mode shows only descriptors that carry a value (mirrors the Labels &
  // Tags read-mode pattern); edit mode shows every descriptor so values can be
  // set. Groups left with no valued descriptors are dropped in read mode.
  const groups = disabled
    ? allGroups
        .map((g) => ({
          ...g,
          descriptors: g.descriptors.filter(
            (d) => (form.descriptor_values[d.id] ?? "") !== ""
          ),
        }))
        .filter((g) => g.descriptors.length > 0)
    : allGroups;

  // Values live as a flat descriptor_id -> value map; group ids are re-derived
  // from lookups when the save flow builds the sync payload. Blank ≡ absent —
  // clearing an input removes the key so full-replace semantics stay honest.
  const setValue = (id: number, value: string) => {
    const next = { ...form.descriptor_values };
    if (value === "") delete next[id];
    else next[id] = value;
    patch({ descriptor_values: next });
  };

  return (
    <Section icon="permissions" title="Attributes" desc="Set attribute values for the selected categories. All optional.">
      <div className="relative">
        {busy && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 rounded-[12px]">
            <span className="text-[12px] medium text-[#5d5d5d]">{t("Loading…")}</span>
          </div>
        )}
        <div className={`space-y-4 ${busy ? "opacity-60 pointer-events-none" : ""}`}>
          {groups.length === 0 ? (
            <p className="text-[12px] text-[#b8b8b8]">
              {disabled ? t("None") : t("Select a category to see its attributes.")}
            </p>
          ) : (
            groups.map((g) => (
              <div key={g.id} className="rounded-[12px] border border-[#ededed] p-4">
                <div className="flex items-center gap-2 mb-3">
                  <DescriptorIcon icon={g.icon} kind="group" size={20} />
                  <p className="text-[13px] semibold text-[#3c3c3c]">{g.name}</p>
                </div>
                <div className="space-y-4">
                  {g.descriptors.map((d) => {
                    const value = form.descriptor_values[d.id] ?? "";
                    return (
                      <div key={d.id}>
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <DescriptorIcon icon={d.icon} kind="descriptor" size={16} />
                          <p className="text-[12px] medium text-[#505050]">{d.name}</p>
                        </div>
                        {d.type === "numeric" ? (
                          <input
                            type="number"
                            step="any"
                            value={value}
                            disabled={disabled}
                            onChange={(e) => setValue(d.id, e.target.value)}
                            className={`${dashInputClass} max-w-[220px] ${disabled ? "opacity-70" : ""}`}
                          />
                        ) : disabled ? (
                          // Read mode: show only the chosen option (mirrors the
                          // Labels & Tags read-mode pattern).
                          value ? (
                            <div className="flex flex-wrap gap-2">
                              <Chip active disabled>
                                {value}
                              </Chip>
                            </div>
                          ) : (
                            <p className="text-[12px] text-[#b8b8b8]">{t("None")}</p>
                          )
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {parseDescriptorOptions(d.options).map((opt) => (
                              <Chip
                                key={opt}
                                active={value === opt}
                                onClick={() => setValue(d.id, value === opt ? "" : opt)}
                              >
                                {opt}
                              </Chip>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Section>
  );
}

export function ClassificationSection({ form, patch, errors, lookups, disabled }: SectionProps) {
  const [labelQuery, setLabelQuery] = useState("");
  const [tagQuery, setTagQuery] = useState("");

  const baseLabels = disabled
    ? (lookups.labels || []).filter((l) => form.labels.includes(l.id))
    : lookups.labels || [];
  const shownLabels = disabled
    ? baseLabels
    : baseLabels.filter((l) => {
        if (!labelQuery.trim()) return true;
        const q = labelQuery.toLowerCase().trim();
        const label = (l.label || "").toLowerCase();
        const trans = (l.translated_label || "").toLowerCase();
        return label.includes(q) || trans.includes(q);
      });

  const baseTags = disabled
    ? (lookups.tags || []).filter((tg) => form.tags_ids.includes(tg.id))
    : lookups.tags || [];
  const shownTags = disabled
    ? baseTags
    : baseTags.filter((tg) => {
        if (!tagQuery.trim()) return true;
        const q = tagQuery.toLowerCase().trim();
        const name = (tg.name || "").toLowerCase();
        const trans = (tg.translated_name || "").toLowerCase();
        const NestedTrans=(tg.translations?.[0]?.value||"").toLocaleLowerCase();
        return name.includes(q) || trans.includes(q) || NestedTrans.includes(q);
      });

  return (
    <Section icon="permissions" title="Labels & Tags">
      <div className="space-y-5">
        <div>
          <div className="flex  sm:flex-row sm:items-center justify-between gap-2 mb-2">
            <p className="text-[13px] medium text-[#505050]">
              {t("Labels")}{" "}
              {!disabled && <span className="text-[#8e8e8e] regular">({t("max 3")})</span>}
            </p>
            {!disabled && (lookups.labels || []).length > 0 && (
              <div className="relative max-w-[200px] w-full">
                <input
                  type="text"
                  value={labelQuery}
                  onChange={(e) => setLabelQuery(e.target.value)}
                  placeholder={t("Search...")}
                  className="w-full h-[28px] px-2.5 bg-[#f8f8f8] border border-[#ededed] rounded-[8px] text-[12px] text-[#3c3c3c] outline-none focus:border-[#5d5d5d] focus:bg-white"
                />
              </div>
            )}
          </div>
          {shownLabels.length === 0 ? (
            <p className="text-[12px] text-[#b8b8b8] text-center">
              {disabled ? t("None") : labelQuery ? t("No matching options.") : t("None")}
            </p>
          ) : (
            <div className="flex flex-wrap gap-2 max-h-[180px] overflow-auto p-0.5 custom-scrollbar">
              {shownLabels.map((l) => {
                const active = form.labels.includes(l.id);
                return (
                  <Chip key={l.id} active={active} disabled={disabled || (!active && form.labels.length >= 3)} onClick={() => patch({ labels: toggleId(form.labels, l.id) })}>
                    {l.translated_label ?? l.label}
                  </Chip>
                );
              })}
            </div>
          )}
          {errors.labels && <p data-field="labels" className="text-[12px] text-[#f85555] mt-1.5">{errors.labels}</p>}
        </div>
        <div>
          <div className="flex  sm:flex-row sm:items-center justify-between gap-2 mb-2">
            <p className="text-[13px] medium text-[#505050]">{t("Tags")}</p>
            {!disabled && (lookups.tags || []).length > 0 && (
              <div className="relative max-w-[200px] w-full">
                <input
                  type="text"
                  value={tagQuery}
                  onChange={(e) => setTagQuery(e.target.value)}
                  placeholder={t("Search...")}
                  className="w-full h-[28px] px-2.5 bg-[#f8f8f8] border border-[#ededed] rounded-[8px] text-[12px] text-[#3c3c3c] outline-none focus:border-[#5d5d5d] focus:bg-white"
                />
              </div>
            )}
          </div>
          {shownTags.length === 0 ? (
            <p className="text-[12px] text-[#b8b8b8] text-center">
              {disabled ? t("None") : tagQuery ? t("No matching options.") : t("None")}
            </p>
          ) : (
            <div className="flex flex-wrap gap-2 max-h-[180px] overflow-auto p-0.5 custom-scrollbar">
              {shownTags.map((tg) => (
                <Chip key={tg.id} active={form.tags_ids.includes(tg.id)} disabled={disabled} onClick={() => patch({ tags_ids: toggleId(form.tags_ids, tg.id) })}>
                  {tg.translated_name ??tg.translations?.[0]?.value ??tg.name}
                </Chip>
              ))}
            </div>
          )}
        </div>
      </div>
    </Section>
  );
}

export function CountriesSection({ form, patch, lookups, disabled, currency, pricesLocked ,errors}: SectionProps) {
  // Per-country surcharge is a price: an unapproved seller cannot set one,
  // so the whole block is hidden rather than rendered greyed out.
  const extraPriceDisabled = disabled;
  const countries = lookups.countries || [];
  const language = LocalizationServiceClass.GetAppLanguage();
  const addExtra = () => patch({ extra_price_for_country: [...form.extra_price_for_country, { country_iso: "", extra_price: "" }] });
  const setExtra = (i: number, k: "country_iso" | "extra_price", v: string) => {
    const next = form.extra_price_for_country.map((e, idx) => (idx === i ? { ...e, [k]: v } : e));
    patch({ extra_price_for_country: next });
  };
  const removeExtra = (i: number) => patch({ extra_price_for_country: form.extra_price_for_country.filter((_, idx) => idx !== i) });

  const originCountryOptions = useMemo(() => {
    const map = new Map<string, string>();
    (allCountries || []).forEach((c) => {
      if (c && c.iso2) {
        const code = c.iso2.toUpperCase();
        if (!map.has(code)) {
          map.set(code, getLocalizedCountryName(code, language));
        }
      }
    });
    return Array.from(map.entries())
      .map(([iso, name]) => ({
        value: iso,
        label: name,
        icon: <FlagIcon iso={iso} />,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [language]);

  return (
    <Section icon="shopInfo" title="Origin & Countries">
      <div className="space-y-6">
        <div className="max-w-md">
          <Select label="Country of Origin" fieldKey="origin_country_iso" error={errors.origin_country_iso} value={form.origin_country_iso} disabled={disabled} onChange={(v) => patch({ origin_country_iso: v })} options={originCountryOptions} />
        </div>

        <div>
          <p className="text-[13px] medium text-[#505050] mb-2">{t("Restricted Countries")}</p>
          <p className="text-[12px] text-[#8e8e8e] mb-2.5">{t("The product is restricted to the selected countries.")}</p>
          <div className="flex flex-wrap gap-2 max-h-[180px] overflow-auto p-0.5">
            {countries.map((c) => (
              <Chip key={c.iso} active={form.countries_iso.includes(c.iso)} disabled={disabled} onClick={() => patch({ countries_iso: toggleStr(form.countries_iso, c.iso) })}>
                {getLocalizedCountryName(c.iso, language)}
              </Chip>
            ))}
          </div>
        </div>

        {!pricesLocked && (
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <p className="text-[13px] medium text-[#505050]">{t("Per-country Extra Price")}</p>
            {!extraPriceDisabled && (
              <DashButton type="button" variant="secondary" size="sm" icon="plus" onClick={addExtra}>
                {t("Add")}
              </DashButton>
            )}
          </div>
          {form.extra_price_for_country.length === 0 ? (
            <p className="text-[12px] text-[#b8b8b8]">{t("No per-country surcharges.")}</p>
          ) : (
            <div className="space-y-2.5">
              {form.extra_price_for_country.map((e, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <select value={e.country_iso} disabled={extraPriceDisabled} onChange={(ev) => setExtra(i, "country_iso", ev.target.value)} className={`${dashInputClass} flex-1`} style={{
                    minWidth:'120px'
                  }}>
                    <option value="">{t("Country")}</option>
                    {countries.map((c) => (
                      <option key={c.iso} value={c.iso}>{getLocalizedCountryName(c.iso, language)}</option>
                    ))}
                  </select>
                  <div className="relative shrink-0">
                    <input type="number" step="any" value={e.extra_price} disabled={extraPriceDisabled} placeholder={t("Extra price")} onChange={(ev) => setExtra(i, "extra_price", ev.target.value)} className={`${dashInputClass} w-[130px] ${currency ? "pe-12" : ""}`} />
                    {currency && (
                      <span className="absolute end-3 top-1/2 -translate-y-1/2 text-[11px] semibold text-[#8e8e8e] pointer-events-none">
                        {currency}
                      </span>
                    )}
                  </div>
                  {!extraPriceDisabled && (
                    <button type="button" onClick={() => removeExtra(i)} className="shrink-0 w-[44px] h-[44px] rounded-[12px] bg-[#fff1f1] text-[#f85555] flex items-center justify-center hover:bg-[#ffe6e6]">
                      <DashIcon name="trash" size={17} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        )}
      </div>
    </Section>
  );
}

export function SeoSection({ form, patch, errors, disabled, onUploadMeta, uploading, sellerId, canUseGallery }: SectionProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const openDevice = () => fileRef.current?.click();
  const pickMeta = (picked: PickedImage[]) => {
    const p = picked[0];
    if (p) patch({ meta_image: p.name, meta_image_url: p.url });
  };
  return (
    <Section icon="search" title="SEO / Meta">
      <Grid>
        <Txt label="Meta Title" fieldKey="meta_title" value={form.meta_title} error={errors.meta_title} disabled={disabled} onChange={(v) => patch({ meta_title: v })} />
        <Txt label="Meta Description" fieldKey="meta_description" value={form.meta_description} error={errors.meta_description} disabled={disabled} onChange={(v) => patch({ meta_description: v })} />
      </Grid>
      <div className="mt-5">
        <p className="text-[13px] medium text-[#505050] mb-2">{t("Meta Image")}</p>
        <div className="flex items-center gap-4">
          <div className="w-[96px] h-[96px] rounded-[12px] overflow-hidden bg-[#f4f4f4] border border-[#ededed] flex items-center justify-center shrink-0">
            {form.meta_image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={form.meta_image_url} alt={t("Meta Image")} className="w-full h-full object-cover" />
            ) : (
              <DashIcon name="gallery" size={26} strokeWidth={1.4} />
            )}
          </div>
          {!disabled && (
            <div>
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) onUploadMeta?.(f); e.target.value = ""; }} />
              {canUseGallery ? (
                <SourceMenu
                  onGallery={() => setPickerOpen(true)}
                  onDevice={openDevice}
                  trigger={(toggle) => (
                    <DashButton type="button" variant="secondary" size="sm" icon="upload" loading={!!uploading?.meta} onClick={toggle}>
                      {form.meta_image ? t("Change Image") : t("Add Image")}
                    </DashButton>
                  )}
                />
              ) : (
                <DashButton type="button" variant="secondary" size="sm" icon="upload" loading={!!uploading?.meta} onClick={openDevice}>
                  {form.meta_image ? t("Change Image") : t("Upload Image")}
                </DashButton>
              )}
            </div>
          )}
        </div>
      </div>
      {pickerOpen && (
        <GalleryPickerModal
          sellerId={sellerId}
          multiple={false}
          onClose={() => setPickerOpen(false)}
          onPick={pickMeta}
        />
      )}
    </Section>
  );
}

/** Small two-choice popover: pick from the gallery or upload from the device.
 *  `trigger` renders the button that toggles the menu. */
function SourceMenu({
  onGallery,
  onDevice,
  trigger,
}: {
  onGallery: () => void;
  onDevice: () => void;
  trigger: (toggle: () => void) => React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      {trigger(() => setOpen((v) => !v))}
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div
            className="absolute left-0 top-full z-40 mt-1 min-w-[200px] bg-white rounded-[12px] border border-[#ededed] p-1.5"
            style={{ boxShadow: "0 8px 24px rgba(0,0,0,0.14)" }}
          >
            <button
              type="button"
              onClick={() => { setOpen(false); onGallery(); }}
              className="w-full flex items-center gap-2.5 px-3 h-[40px] rounded-[10px] text-[13px] text-[#3c3c3c] hover:bg-[#f4f4f4] text-left"
            >
              <DashIcon name="gallery" size={16} /> {t("Choose from gallery")}
            </button>
            <button
              type="button"
              onClick={() => { setOpen(false); onDevice(); }}
              className="w-full flex items-center gap-2.5 px-3 h-[40px] rounded-[10px] text-[13px] text-[#3c3c3c] hover:bg-[#f4f4f4] text-left"
            >
              <DashIcon name="upload" size={16} /> {t("Upload from device")}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export function MediaSection({ form, patch, errors, disabled, onUploadImages, uploading, sellerId, canUseGallery }: SectionProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const openDevice = () => fileRef.current?.click();
  const addFromGallery = (picked: PickedImage[]) => {
    const existing = new Set(form.images.map((i) => i.name));
    const items: ImageItem[] = picked
      .filter((p) => p.name && !existing.has(p.name))
      .map((p) => ({ name: p.name, url: p.url, isNew: true }));
    if (items.length) patch({ images: [...form.images, ...items] });
  };
  const addTile = (onClick: () => void) => (
    <button
      type="button"
      onClick={onClick}
      className="w-full aspect-square rounded-[12px] border border-dashed border-[#cfcfcf] bg-[#fafafa] flex flex-col items-center justify-center gap-1.5 text-[#8e8e8e] hover:border-[#5d5d5d] hover:text-[#5d5d5d] transition-colors"
    >
      {uploading?.images ? (
        <span className="text-[11px]">{t("Uploading…")}</span>
      ) : (
        <>
          <DashIcon name="plus" size={22} />
          <span className="text-[11px] medium">{t("Add")}</span>
        </>
      )}
    </button>
  );
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= form.images.length) return;
    const next = [...form.images];
    [next[i], next[j]] = [next[j], next[i]];
    patch({ images: next });
  };
  const remove = (name: string) => {
    const nextColorImages: Record<string, string[]> = {};
    for (const [code, list] of Object.entries(form.colorImages))
      nextColorImages[code] = list.filter((n) => n !== name);
    patch({
      images: form.images.filter((im) => im.name !== name),
      colorImages: nextColorImages,
    });
  };
  return (
    <Section icon="gallery" title="Images" desc="The first image is the cover. Drag order with the arrows.">
      {errors.images && <p data-field="images" className="text-[12px] text-[#f85555] mb-3">{errors.images}</p>}
      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        {form.images.map((im, i) => (
          <div key={im.name + i} className="relative group rounded-[12px] overflow-hidden border border-[#ededed] bg-[#f4f4f4] aspect-square">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={im.url} alt={im.name} className="w-full h-full object-cover" />
            {i === 0 && (
              <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-full bg-[#5d5d5d] text-white text-[9px] semibold">{t("Cover")}</span>
            )}
            {!disabled && (
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between p-1.5 bg-gradient-to-t from-black/55 to-transparent">
                <div className="flex gap-1">
                  <button type="button" onClick={() => move(i, -1)} className="w-6 h-6 rounded-md bg-white/90 text-[#3c3c3c] flex items-center justify-center disabled:opacity-40" disabled={i === 0}>
                    <DashIcon name="chevronLeft" size={13} />
                  </button>
                  <button type="button" onClick={() => move(i, 1)} className="w-6 h-6 rounded-md bg-white/90 text-[#3c3c3c] flex items-center justify-center disabled:opacity-40" disabled={i === form.images.length - 1}>
                    <DashIcon name="chevronRight" size={13} />
                  </button>
                </div>
                <button type="button" onClick={() => remove(im.name)} className="w-6 h-6 rounded-md bg-white/90 text-[#f85555] flex items-center justify-center">
                  <DashIcon name="trash" size={13} />
                </button>
              </div>
            )}
          </div>
        ))}
        {!disabled &&
          (canUseGallery ? (
            <SourceMenu
              onGallery={() => setPickerOpen(true)}
              onDevice={openDevice}
              trigger={(toggle) => addTile(toggle)}
            />
          ) : (
            addTile(openDevice)
          ))}
      </div>
      <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => { const fs = Array.from(e.target.files || []); if (fs.length) onUploadImages?.(fs); e.target.value = ""; }} />
      {pickerOpen && (
        <GalleryPickerModal
          sellerId={sellerId}
          multiple
          onClose={() => setPickerOpen(false)}
          onPick={addFromGallery}
        />
      )}
    </Section>
  );
}

export function VariantsSection({ form, patch, errors, lookups, disabled, currency, pricesLocked, isCreate }: SectionProps) {
  const cmb = combos(form);
  const [colorQuery, setColorQuery] = useState("");
  const [sizeQuery, setSizeQuery] = useState("");

  // Read mode shows only the chosen colors/sizes; edit mode shows the full picker.
  const baseColors = disabled
    ? (lookups.colors || []).filter((c) => form.colors.some((x) => x.code === c.code))
    : lookups.colors || [];
  const shownColors = disabled
    ? baseColors
    : baseColors.filter((c) => {
        if (!colorQuery.trim()) return true;
        const q = colorQuery.toLowerCase().trim();
        const name = (c.name || "").toLowerCase();
        const trans = (c.translated_name || "").toLowerCase();
        const code = (c.code || "").toLowerCase();
        return name.includes(q) || trans.includes(q) || code.includes(q);
      });

  const baseSizes = disabled
    ? (lookups.sizes || []).filter((s) => form.sizes.some((x) => x.id === s.id))
    : lookups.sizes || [];
  const shownSizes = disabled
    ? baseSizes
    : baseSizes.filter((s) => {
        if (!sizeQuery.trim()) return true;
        const q = sizeQuery.toLowerCase().trim();
        const name = (s.name || "").toLowerCase();
        return name.includes(q);
      });

  // Auto-fill empty variant prices from the product-level defaults so the seller
  // sees what each variant will cost, plus a default SKU for every newly added
  // combo. Keyed on the SET of combo keys (+ edit mode), not on field values: it
  // fires on entering edit mode and whenever a color/size is added, but never
  // re-fills a field the seller cleared.
  const comboKeys = cmb.map((c) => c.key).join("|");
  useEffect(() => {
    if (disabled) return;
    const seeded = seedVariantDefaults(form, isCreate);
    if (seeded !== form.variations) patch({ variations: seeded });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [comboKeys, disabled, isCreate]);

  // Sync product-level current_stock with the sum of variation quantities when variations exist
  useEffect(() => {
    if (disabled || cmb.length === 0) return;
    let totalStock = 0;
    for (const c of cmb) {
      const q = parseFloat(form.variations[c.key]?.qty || "0");
      if (!isNaN(q) && q > 0) totalStock += q;
    }
    const newStockStr = String(totalStock);
    if (form.current_stock !== newStockStr) {
      patch({ current_stock: newStockStr });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [comboKeys, form.variations, disabled]);

  const setVariant = (key: string, field: keyof VariantRow, value: string) => {
    const row = form.variations[key] || emptyVariantRow();
    patch({ variations: { ...form.variations, [key]: { ...row, [field]: value } } });
  };
  const toggleColor = (c: { id: number; code: string; name: string; translated_name?: string }) => {
    const exists = form.colors.some((x) => x.code === c.code);
    const colors = exists
      ? form.colors.filter((x) => x.code !== c.code)
      : [...form.colors, { code: c.code, name: c.name, translated_name: c.translated_name, id: c.id }];
    const colorImages = { ...form.colorImages };
    if (exists) delete colorImages[c.code];
    patch({ colors, colorImages });
  };
  const toggleSize = (s: { id: number; name: string }) => {
    const exists = form.sizes.some((x) => x.id === s.id);
    const sizes = exists ? form.sizes.filter((x) => x.id !== s.id) : [...form.sizes, s];
    patch({ sizes });
  };
  const toggleColorImage = (code: string, name: string) => {
    const cur = form.colorImages[code] || [];
    const next = cur.includes(name) ? cur.filter((n) => n !== name) : [...cur, name];
    patch({ colorImages: { ...form.colorImages, [code]: next } });
  };

  return (
    <Section icon="permissions" title="Variants" desc="Pick colors & sizes, then set price and stock for each combination.">
      <div className="space-y-5" data-field="variations">
        <div>
          <div className="flex  sm:flex-row sm:items-center justify-between gap-2 mb-2">
            <p className="text-[13px] medium text-[#505050]">{t("Colors")}</p>
            {!disabled && (lookups.colors || []).length > 0 && (
              <div className="relative max-w-[200px] w-full">
                <input
                  type="text"
                  value={colorQuery}
                  onChange={(e) => setColorQuery(e.target.value)}
                  placeholder={t("Search...")}
                  className="w-full h-[28px] px-2.5 bg-[#f8f8f8] border border-[#ededed] rounded-[8px] text-[12px] text-[#3c3c3c] outline-none focus:border-[#5d5d5d] focus:bg-white"
                />
              </div>
            )}
          </div>
          {shownColors.length === 0 ? (
            <p className="text-[12px] text-[#b8b8b8] text-center">
              {disabled ? t("None") : colorQuery ? t("No matching options.") : t("None")}
            </p>
          ) : (
            <div className="flex flex-wrap gap-2 max-h-[160px] overflow-auto p-0.5 custom-scrollbar">
              {shownColors.map((c) => {
                const active = form.colors.some((x) => x.code === c.code);
                return (
                  <button key={c.id} type="button" disabled={disabled} onClick={() => toggleColor(c)} className={`inline-flex items-center gap-2 pl-1.5 pr-3 h-[34px] rounded-full text-[13px] medium border transition-colors active:scale-[0.98] ${active ? "border-[#5d5d5d] bg-[#5d5d5d]/[0.07] text-[#3c3c3c]" : "border-transparent bg-[#f2f2f2] text-[#8e8e8e]"}`}>
                    <span className="w-[22px] h-[22px] rounded-full border border-black/10 shrink-0" style={{ background: c.code }} />
                    {c.translated_name ?? c.name}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div>
          <div className="flex  sm:flex-row sm:items-center justify-between gap-2 mb-2">
            <p className="text-[13px] medium text-[#505050]">{t("Sizes")}</p>
            {!disabled && (lookups.sizes || []).length > 0 && (
              <div className="relative max-w-[200px] w-full">
                <input
                  type="text"
                  value={sizeQuery}
                  onChange={(e) => setSizeQuery(e.target.value)}
                  placeholder={t("Search...")}
                  className="w-full h-[28px] px-2.5 bg-[#f8f8f8] border border-[#ededed] rounded-[8px] text-[12px] text-[#3c3c3c] outline-none focus:border-[#5d5d5d] focus:bg-white"
                />
              </div>
            )}
          </div>
          {shownSizes.length === 0 ? (
            <p className="text-[12px] text-[#b8b8b8] text-center">
              {disabled ? t("None") : sizeQuery ? t("No matching options.") : t("None")}
            </p>
          ) : (
            <div className="flex flex-wrap gap-2 max-h-[160px] overflow-auto p-0.5 custom-scrollbar">
              {shownSizes.map((s) => (
                <Chip key={s.id} active={form.sizes.some((x) => x.id === s.id)} disabled={disabled} onClick={() => toggleSize(s)}>
                  {s.name}
                </Chip>
              ))}
            </div>
          )}
        </div>

        {errors.variations && <p className="text-[12px] text-[#f85555]">{errors.variations}</p>}

        {cmb.length > 0 && (() => {
          const skuCounts: Record<string, number> = {};
          cmb.forEach((c) => {
            const s = (form.variations[c.key]?.sku || "").trim().toLowerCase();
            if (s) {
              skuCounts[s] = (skuCounts[s] || 0) + 1;
            }
          });

          return (
            <div className="overflow-x-auto -mx-1 px-1">
              {/* Content-sized, never stretched: every cell holds a fixed-width
                  input, so forcing a width would spread the slack unevenly over
                  the columns (worst with the wider ar/ku headers, and worst of
                  all when `pricesLocked` removes three columns) and pull each
                  label off its input. The wrapper scrolls instead. */}
              <table className="w-auto text-left border-separate border-spacing-y-1.5">
                <thead>
                  <tr className="text-[11px] semibold text-[#8e8e8e]">
                    {/* Horizontal padding matches the body cells (`px-1`) so each
                        label lines up with the input under it. */}
                    <th className="py-1 pr-3">{t("Variant")}</th>
                    {!pricesLocked && (
                      <>
                        <th className="py-1 px-1">{t("Price")}</th>
                        <th className="py-1 px-1">{t("Discount")}</th>
                        <th className="py-1 px-1">{t("Luck")}</th>
                      </>
                    )}
                    <th className="py-1 px-1">{t("Qty")}</th>
                    <th className="py-1 px-1">{t("SKU")}</th>
                    <th className="py-1 px-1">{t("Barcode")}</th>
                    <th className="py-1 px-1">{t("Location")}</th>
                  </tr>
                </thead>
                <tbody>
                  {cmb.map((c) => {
                    const r = form.variations[c.key] || emptyVariantRow();
                    const skuVal = (r.sku || "").trim().toLowerCase();
                    const isDuplicateSku = Boolean(skuVal && (skuCounts[skuVal] || 0) > 1);
                    const skuErrMsg = errors[`variation_sku_${c.key}`] || (isDuplicateSku ? t("SKU must be unique") : null);

                    const cell = (field: keyof VariantRow, w: string, type = "number") => {
                      const isSku = field === "sku";
                      const hasErr = isSku && skuErrMsg;
                      const isMoney =
                        field === "price" || field === "discount" || field === "luck";
                      // Money cells get the shop-currency overlay (compact, narrow cells).
                      const suffix = currency && isMoney ? currency : "";
                      // The three money columns are not rendered at all for an
                      // unapproved seller (see below); qty/sku/
                      // barcode/location stay editable.
                      const cellDisabled = disabled;
                      return (
                        <td className="px-1 align-top">
                          <div className="relative w-fit">
                          <input
                            type={type}
                            min={type === "number" ? "0" : undefined}
                            step="any"
                            value={r[field]}
                            disabled={cellDisabled}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (type === "number" && val && parseFloat(val) < 0) return;
                              setVariant(c.key, field, val);
                            }}
                            className={`${w} h-[38px] px-2.5 ${suffix ? "pe-8" : ""} bg-[#f8f8f8] border ${
                              hasErr ? "border-[#f85555] bg-[#fff8f8]" : "border-[#ededed]"
                            } rounded-[10px] text-[13px] text-[#3c3c3c] outline-none focus:border-[#5d5d5d] focus:bg-white`}
                          />
                          {suffix && (
                            <span className="absolute end-1.5 top-1/2 -translate-y-1/2 text-[10px] semibold text-[#8e8e8e] pointer-events-none">
                              {suffix}
                            </span>
                          )}
                          </div>
                          {hasErr && (
                            <span className="text-[11px] text-[#f85555] block mt-0.5 leading-tight whitespace-nowrap">
                              {skuErrMsg}
                            </span>
                          )}
                        </td>
                      );
                    };

                    return (
                      <tr key={c.key}>
                        <td className="pr-3 text-[12px] medium text-[#3c3c3c] whitespace-nowrap align-top pt-2">
                          {[c.colorName, c.sizeName].filter(Boolean).join(" · ")}
                        </td>
                        {!pricesLocked && (
                          <>
                            {cell("price", "w-[88px]")}
                            {cell("discount", "w-[88px]")}
                            {cell("luck", "w-[80px]")}
                          </>
                        )}
                        {cell("qty", "w-[70px]")}
                        {cell("sku", "w-[110px]", "text")}
                        {cell("barcode", "w-[110px]", "text")}
                        <td className="px-1 align-top">
                          <select
                            value={r.location_id}
                            disabled={disabled}
                            onChange={(e) => setVariant(c.key, "location_id", e.target.value)}
                            className={`w-[150px] h-[38px] px-2 bg-[#f8f8f8] border ${!r.location_id && errors.variations ? "border-[#f85555]" : "border-[#ededed]"} rounded-[10px] text-[13px] text-[#3c3c3c] outline-none focus:border-[#5d5d5d] focus:bg-white disabled:opacity-70`}
                          >
                            <option value="">{t("Select")}</option>
                            {(lookups.locations || []).map((l) => (
                              <option key={l.id} value={String(l.id)}>
                                {locationLabel(l)}
                              </option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          );
        })()}

        {/* Color → image assignment (sync_color_images) */}
        {form.colors.length > 0 && (
          <div className="pt-2">
            <p className="text-[13px] medium text-[#505050] mb-1">{t("Color Images")}</p>
            <p className="text-[12px] text-[#8e8e8e] mb-3">{t("Assign each uploaded image to a color. Every color needs at least one image, and every image must be assigned.")}</p>
            {errors.colorImages && <p data-field="colorImages" className="text-[12px] text-[#f85555] mb-3">{errors.colorImages}</p>}
            <div className="space-y-4">
              {form.colors.map((c) => {
                const lookupColor = getColorFromLookup(c.code, lookups, c);
                const colorName = lookupColor.translated_name ?? lookupColor.name;
                return (
                  <div key={c.code} className="rounded-[12px] border border-[#ededed] p-3">
                    <div className="flex items-center gap-2 mb-2.5">
                      <span className="w-4 h-4 rounded-full border border-black/10" style={{ background: c.code }} />
                      <span className="text-[13px] medium text-[#3c3c3c]">{colorName}</span>
                    </div>
                  {form.images.length === 0 ? (
                    <p className="text-[12px] text-[#b8b8b8]">{t("Upload images first.")}</p>
                  ) : (
                    <div className="flex flex-wrap gap-2.5">
                      {form.images.map((im) => {
                        const on = (form.colorImages[c.code] || []).includes(im.name);
                        return (
                          <button key={im.name} type="button" disabled={disabled} onClick={() => toggleColorImage(c.code, im.name)} className={`relative w-[58px] h-[58px] rounded-[10px] overflow-hidden border-2 transition-colors ${on ? "border-[#5d5d5d]" : "border-transparent opacity-60 hover:opacity-100"}`}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={im.url} alt={im.name} className="w-full h-full object-cover" />
                            {on && (
                              <span className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-[#5d5d5d] text-white flex items-center justify-center">
                                <DashIcon name="check" size={10} />
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
            </div>
          </div>
        )}
      </div>
    </Section>
  );
}

const LANGS = [
  { code: "en", label: "English" },
  { code: "ar", label: "العربية" },
  { code: "tr", label: "Türkçe" },
  { code: "ku", label: "Kurdî" },
];

function SimilarWordsInput({
  words = [],
  disabled = false,
  onChange,
}: {
  words: string[];
  disabled?: boolean;
  onChange: (words: string[]) => void;
}) {
  const [inputValue, setInputValue] = useState("");

  const handleAdd = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    if (!words.includes(trimmed)) {
      onChange([...words, trimmed]);
    }
    setInputValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    }
  };

  const handleRemove = (index: number) => {
    onChange(words.filter((_, i) => i !== index));
  };

  return (
    <div className="mt-3" data-field="similar_words">
      <p className="text-[13px] medium text-[#505050] mb-1.5">{t("Similar Words")}</p>
      <div className="flex flex-wrap items-center gap-2 p-2.5 bg-[#f8f8f8] border border-[#ededed] rounded-[12px] min-h-[44px]">
        {words.map((w, idx) => (
          <span
            key={idx}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-[#ededed] text-[#3c3c3c] text-[12px] medium shadow-sm"
          >
            {w}
            {!disabled && (
              <button
                type="button"
                onClick={() => handleRemove(idx)}
                className="w-4 h-4 rounded-full hover:bg-[#f4f4f4] flex items-center justify-center text-[#8e8e8e] hover:text-[#f85555] transition-colors text-[10px]"
              >
                ✕
              </button>
            )}
          </span>
        ))}
        {!disabled && (
          <div className="flex items-center gap-1.5 flex-1 min-w-[180px]">
            <input
              type="text"
              value={inputValue}
              disabled={disabled}
              placeholder={t("Type a word and press Enter")}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-transparent text-[13px] text-[#3c3c3c] outline-none px-1 h-[30px]"
            />
            {inputValue.trim() && (
              <button
                type="button"
                onClick={handleAdd}
                className="px-2.5 h-[28px] rounded-[8px] bg-[#5d5d5d] text-white text-[11px] medium hover:bg-[#4a4a4a] transition-colors"
              >
                {t("Add")}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function TranslationsSection({ form, patch, errors, disabled, isCreate }: SectionProps) {
  const defaultLang = form.default_language_code || "en";

  const setTr = (code: string, field: "name" | "description" | "similar_words", v: any) => {
    const exists = form.translations.some((t2) => t2.language_code === code);
    const next = exists
      ? form.translations.map((t2) => (t2.language_code === code ? { ...t2, [field]: v } : t2))
      : [...form.translations, { language_code: code, name: "", description: "", similar_words: [], [field]: v }];
    patch({ translations: next });
  };

  const handleDefaultLangChange = (newCode: string) => {
    const existing = form.translations.find((t2) => t2.language_code === newCode) || {
      language_code: newCode,
      name: form.name || "",
      description: form.description || "",
      similar_words: [],
    };
    patch({
      default_language_code: newCode,
      translations: [{ ...existing, language_code: newCode }],
    });
  };

  if (isCreate) {
    const curLangObj = LANGS.find((l) => l.code === defaultLang) || LANGS[0];
    const tr = form.translations.find((x) => x.language_code === defaultLang) || {
      name: form.name || "",
      description: form.description || "",
      similar_words: [],
    };

    return (
      <Section
        icon="comments"
        title="Translations"
        desc="Select default language for product creation. Other languages will be translated automatically."
      >
        {errors.translations && <p className="text-[12px] text-[#f85555] mb-3">{errors.translations}</p>}
        <div className="space-y-5" data-field="translations">
          <div className="rounded-[12px] border border-[#ededed] p-4 bg-[#f8f8f8]">
            <Select
              label="Default Language"
              value={defaultLang}
              disabled={disabled}
              onChange={handleDefaultLangChange}
              options={LANGS.map((l) => ({ value: l.code, label: `${l.label} (${l.code})` }))}
            />
            <p className="text-[12px] text-[#8e8e8e] mt-2">
              {t("Select the primary language for this product. You can enter details for this language now and other languages will be translated automatically.")}
            </p>
          </div>

          <div className="rounded-[12px] border border-[#ededed] p-4 space-y-4">
            <p className="text-[13px] semibold text-[#3c3c3c]">
              {curLangObj.label} <span className="text-[#8e8e8e] regular text-[11px]">({curLangObj.code})</span>
            </p>
            <Txt
              label="Name"
              value={tr.name}
              disabled={disabled}
              required
              onChange={(v) => {
                setTr(defaultLang, "name", v);
                if (!form.name) patch({ name: v });
              }}
            />
            <DashField label={t("Description")}>
              <RichTextEditor
                value={tr.description}
                disabled={disabled}
                onChange={(v) => {
                  setTr(defaultLang, "description", v);
                  if (!form.description) patch({ description: v });
                }}
              />
            </DashField>
            <SimilarWordsInput
              words={tr.similar_words || []}
              disabled={disabled}
              onChange={(words) => setTr(defaultLang, "similar_words", words)}
            />
          </div>
        </div>
      </Section>
    );
  }

  return (
    <Section icon="comments" title="Translations" desc="An English (en) name is required to enable the product.">
      {errors.translations && <p className="text-[12px] text-[#f85555] mb-3">{errors.translations}</p>}
      <div className="space-y-5" data-field="translations">
        {LANGS.map((l) => {
          const tr = form.translations.find((x) => x.language_code === l.code) || {
            name: "",
            description: "",
            similar_words: [],
          };
          return (
            <div key={l.code} className="rounded-[12px] border border-[#ededed] p-4 space-y-4">
              <p className="text-[13px] semibold text-[#3c3c3c]">{l.label} <span className="text-[#8e8e8e] regular text-[11px]">({l.code})</span></p>
              <Txt label="Name" value={tr.name} disabled={disabled} onChange={(v) => setTr(l.code, "name", v)} required={l.code === "en"} />
              <DashField label={t("Description")}>
                <RichTextEditor
                  value={tr.description}
                  disabled={disabled}
                  onChange={(v) => setTr(l.code, "description", v)}
                />
              </DashField>
              <SimilarWordsInput
                words={tr.similar_words || []}
                disabled={disabled}
                onChange={(words) => setTr(l.code, "similar_words", words)}
              />
            </div>
          );
        })}
      </div>
    </Section>
  );
}

export function VideosSection({ form, patch, disabled, onUploadVideo, uploading }: SectionProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const toggleRemove = (v: string) => patch({ remove_videos: form.remove_videos.includes(v) ? form.remove_videos.filter((x) => x !== v) : [...form.remove_videos, v] });
  return (
    <Section icon="video" title="Video" desc="Optional. Upload a new product video or remove existing ones.">
      <div className="space-y-3">
        {form.existing_videos.length === 0 && !form.cloud_video && (
          <p className="text-[12px] text-[#b8b8b8]">{t("No video attached.")}</p>
        )}
        {form.existing_videos.map((v) => {
          const removing = form.remove_videos.includes(v);
          return (
            <div key={v} className={`flex items-center justify-between gap-3 p-3 rounded-[12px] border ${removing ? "border-[#ffd9d9] bg-[#fff1f1]" : "border-[#ededed] bg-[#f8f8f8]"}`}>
              <span className="flex items-center gap-2 text-[13px] text-[#3c3c3c] truncate">
                <DashIcon name="play" size={16} /> {v.split("/").pop()}
              </span>
              {!disabled && (
                <button type="button" onClick={() => toggleRemove(v)} className={`text-[12px] medium ${removing ? "text-[#8e8e8e]" : "text-[#f85555]"}`}>
                  {removing ? t("Keep") : t("Remove")}
                </button>
              )}
            </div>
          );
        })}
        {form.cloud_video && (
          <div className="flex items-center justify-between gap-3 p-3 rounded-[12px] border border-[#bfe6cc] bg-[#eaf7ef]">
            <span className="flex items-center gap-2 text-[13px] text-[#2ea84f] truncate">
              <DashIcon name="check" size={16} /> {t("New video ready")}: {form.cloud_video}
            </span>
            {!disabled && (
              <button type="button" onClick={() => patch({ cloud_video: "" })} className="text-[12px] medium text-[#f85555]">{t("Remove")}</button>
            )}
          </div>
        )}
        {!disabled && (
          <>
            <input ref={fileRef} type="file" accept="video/*" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) onUploadVideo?.(f); e.target.value = ""; }} />
            <DashButton type="button" variant="secondary" size="sm" icon="upload" loading={!!uploading?.video} onClick={() => fileRef.current?.click()}>
              {t("Upload Video")}
            </DashButton>
          </>
        )}
      </div>
    </Section>
  );
}
