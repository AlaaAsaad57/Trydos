"use client";
import React, { useEffect, useState } from "react";
import SellerDashboardService from "services/sellerDashboard";
import { translateFunction, LogError } from "utils/functions";
import {
  DashButton,
  DashField,
  DashIcon,
  InlineAlert,
  dashInputClass,
} from "components/SellerDashboard/ui";
import Spinner from "components/global/Spinner";
import LocationMapPicker, { MapPoint } from "./LocationMapPicker";
import { CountryOption, ShopLocation } from "./types";

const t = (s: string) => translateFunction(s);

interface FormState {
  name: string;
  country_id: string;
  address: string;
  latitude: string;
  longitude: string;
}

const EMPTY_FORM: FormState = {
  name: "",
  country_id: "",
  address: "",
  latitude: "",
  longitude: "",
};

/** The API returns lat/lng as decimal strings; keep them as strings in state so
 *  the inputs stay controlled and an empty field means "no coordinate". */
const toFormState = (location: ShopLocation): FormState => ({
  name: location.name ?? "",
  country_id: location.country?.id != null ? String(location.country.id) : "",
  address: location.address ?? "",
  latitude: location.latitude != null ? String(location.latitude) : "",
  longitude: location.longitude != null ? String(location.longitude) : "",
});

/**
 * Create/edit modal for a shop location.
 *
 * Create and edit share one form because the payload is identical (§3 / §5 of
 * the contract). `status` is deliberately absent: it cannot be changed through
 * either endpoint — the list's toggle owns it.
 */
export default function LocationFormModal({
  sellerId,
  location,
  language,
  canSubmit,
  onClose,
  onSaved,
}: {
  sellerId: string;
  /** `null` = create, otherwise the row being edited. */
  location: ShopLocation | null;
  language?: string;
  /** CREATE_LOCATION (create) or UPDATE_LOCATION (edit); false = read-only. */
  canSubmit: boolean;
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const isEdit = !!location;
  const [form, setForm] = useState<FormState>(
    location ? toFormState(location) : EMPTY_FORM,
  );
  const [countries, setCountries] = useState<CountryOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  const patch = (next: Partial<FormState>) => {
    setForm((prev) => ({ ...prev, ...next }));
    // Clear the inline error for every field the seller just touched — the
    // duplicate-name 422 is cleared by editing EITHER name or country, since
    // the uniqueness rule spans the pair.
    setErrors((prev) => {
      const cleared = { ...prev };
      Object.keys(next).forEach((key) => delete cleared[key]);
      if ("name" in next || "country_id" in next) {
        delete cleared.name;
        delete cleared.country_id;
      }
      return cleared;
    });
  };

  // Countries come from a different place depending on the mode: the create
  // lookups endpoint is CREATE_LOCATION-gated, while the edit response carries
  // its own `lookups.countries` — so an update-only user never touches lookups.
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setFormError(null);
      try {
        if (isEdit && location) {
          const res: any = await SellerDashboardService.getShopLocationForEdit(
            sellerId,
            location.id,
          );
          if (!res?.success) {
            throw new Error(res?.message || t("Failed to load locations"));
          }
          if (cancelled) return;
          const fresh: ShopLocation | undefined = res?.data?.location;
          if (fresh) setForm(toFormState(fresh));
          setCountries(res?.data?.lookups?.countries || []);
        } else {
          const res: any =
            await SellerDashboardService.getShopLocationLookups(sellerId);
          if (!res?.success) {
            throw new Error(res?.message || t("Failed to load locations"));
          }
          if (cancelled) return;
          setCountries(res?.data?.countries || []);
        }
      } catch (e: any) {
        const msg = e instanceof Error ? e.message : String(e);
        LogError({ scenario: "LocationFormModal.load", error: msg });
        if (!cancelled) setFormError(msg || t("Failed to load locations"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [sellerId, location?.id]);

  // Escape closes, matching the gallery picker.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const point: MapPoint | null =
    form.latitude !== "" && form.longitude !== ""
      ? (() => {
          const lat = parseFloat(form.latitude);
          const lng = parseFloat(form.longitude);
          return Number.isFinite(lat) && Number.isFinite(lng)
            ? { lat, lng }
            : null;
        })()
      : null;

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (!form.name.trim()) next.name = t("Name is required");
    if (!form.country_id) next.country_id = t("Country is required");
    if (form.latitude !== "") {
      const lat = parseFloat(form.latitude);
      if (!Number.isFinite(lat) || lat < -90 || lat > 90)
        next.latitude = t("Latitude must be between -90 and 90");
    }
    if (form.longitude !== "") {
      const lng = parseFloat(form.longitude);
      if (!Number.isFinite(lng) || lng < -180 || lng > 180)
        next.longitude = t("Longitude must be between -180 and 180");
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || saving) return;
    if (!validate()) return;

    setSaving(true);
    setFormError(null);
    try {
      // Optional fields are sent only when filled, so clearing a coordinate
      // isn't misread as 0 — the same "omit when unset" rule the product
      // editor uses for location_id.
      const payload: Record<string, unknown> = {
        name: form.name.trim(),
        country_id: Number(form.country_id),
      };
      if (form.address.trim()) payload.address = form.address.trim();
      if (form.latitude !== "") payload.latitude = parseFloat(form.latitude);
      if (form.longitude !== "") payload.longitude = parseFloat(form.longitude);

      const res: any = isEdit
        ? await SellerDashboardService.updateShopLocation(
            sellerId,
            location!.id,
            payload,
          )
        : await SellerDashboardService.addShopLocation(sellerId, payload);

      if (!res?.success) {
        // `detailed_error[].code` IS the field name — bind each entry to its
        // input, and keep the envelope message as the form-level summary.
        const detailed: { code?: string; message?: string }[] = Array.isArray(
          res?.detailed_error,
        )
          ? res.detailed_error
          : [];
        const fieldErrors: Record<string, string> = {};
        detailed.forEach((entry) => {
          if (entry?.code && entry?.message) fieldErrors[entry.code] = entry.message;
        });
        if (Object.keys(fieldErrors).length > 0) setErrors(fieldErrors);
        throw new Error(res?.message || t("Failed to save location"));
      }

      onSaved(
        isEdit
          ? t("Location updated successfully")
          : t("Location created successfully"),
      );
    } catch (e: any) {
      const msg = e instanceof Error ? e.message : String(e);
      LogError({ scenario: "LocationFormModal.submit", error: msg });
      setFormError(msg || t("Failed to save location"));
    } finally {
      setSaving(false);
    }
  };

  const readOnly = !canSubmit;

  return (
    <div className="fixed inset-0 z-[999999999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/45" onClick={onClose} />
      <div
        className="relative bg-white rounded-[20px] z-10 w-full max-w-2xl max-h-[88vh] flex flex-col overflow-hidden"
        style={{ boxShadow: "0 12px 40px rgba(0,0,0,0.18)" }}
      >
        <div className="p-5 border-b border-[#ededed] w-full flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-[16px] bold text-[#3c3c3c]">
              {isEdit ? t("Edit Location") : t("Add Location")}
            </h3>
            <p className="text-[12px] text-[#8e8e8e] mt-0.5 truncate">
              {t("Warehouses and pickup points for this shop")}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("Close")}
            className="shrink-0 w-8 h-8 rounded-full hover:bg-[#f4f4f4] flex items-center justify-center text-[#8e8e8e]"
          >
            <DashIcon name="close" size={16} />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Spinner />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col min-h-0 flex-1 w-full">
            <div className="p-5 overflow-auto space-y-5 w-full">
              {formError && <InlineAlert tone="error">{formError}</InlineAlert>}
              {readOnly && (
                <div className="flex items-center gap-1.5 text-[12px] text-[#8e8e8e]">
                  <DashIcon name="lock" size={13} />
                  {t("Read only")}
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <DashField label={t("Name")} error={errors.name}>
                  <input
                    type="text"
                    value={form.name}
                    maxLength={255}
                    disabled={readOnly}
                    onChange={(e) => patch({ name: e.target.value })}
                    placeholder={t("Location name")}
                    className={`${dashInputClass} disabled:opacity-60 ${
                      errors.name ? "border-[#f85555]" : ""
                    }`}
                  />
                </DashField>

                <DashField label={t("Country")} error={errors.country_id}>
                  <select
                    value={form.country_id}
                    disabled={readOnly}
                    onChange={(e) => patch({ country_id: e.target.value })}
                    className={`${dashInputClass} disabled:opacity-60 ${
                      errors.country_id ? "border-[#f85555]" : ""
                    }`}
                  >
                    <option value="">{t("Select")}</option>
                    {countries.map((c) => (
                      <option key={c.id} value={String(c.id)}>
                        {c.nicename || c.name}
                      </option>
                    ))}
                  </select>
                </DashField>
              </div>

              <DashField label={t("Address")} error={errors.address}>
                <textarea
                  rows={3}
                  value={form.address}
                  disabled={readOnly}
                  onChange={(e) => patch({ address: e.target.value })}
                  placeholder={t("Address")}
                  className="w-full px-4 py-3 rounded-[12px] bg-[#f8f8f8] border border-[#ededed] text-[14px] text-[#3c3c3c] placeholder:text-[#b8b8b8] outline-none focus:border-[#5d5d5d] focus:bg-white resize-none transition-colors disabled:opacity-60"
                />
              </DashField>

              <LocationMapPicker
                value={point}
                language={language}
                disabled={readOnly}
                onPick={(p) =>
                  patch({
                    latitude: p.lat.toFixed(6),
                    longitude: p.lng.toFixed(6),
                  })
                }
              />

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <DashField label={t("Latitude")} error={errors.latitude}>
                  <input
                    type="number"
                    step="any"
                    min={-90}
                    max={90}
                    value={form.latitude}
                    disabled={readOnly}
                    onChange={(e) => patch({ latitude: e.target.value })}
                    placeholder="24.713552"
                    className={`${dashInputClass} disabled:opacity-60 ${
                      errors.latitude ? "border-[#f85555]" : ""
                    }`}
                  />
                </DashField>
                <DashField label={t("Longitude")} error={errors.longitude}>
                  <input
                    type="number"
                    step="any"
                    min={-180}
                    max={180}
                    value={form.longitude}
                    disabled={readOnly}
                    onChange={(e) => patch({ longitude: e.target.value })}
                    placeholder="46.675257"
                    className={`${dashInputClass} disabled:opacity-60 ${
                      errors.longitude ? "border-[#f85555]" : ""
                    }`}
                  />
                </DashField>
              </div>
            </div>

            <div className="p-5 border-t border-[#ededed] flex items-center w-full justify-end gap-3">
              <DashButton type="button" variant="ghost" onClick={onClose}>
                {t("Cancel")}
              </DashButton>
              {canSubmit && (
                <DashButton type="submit" icon="check" loading={saving}>
                  {t("Save Changes")}
                </DashButton>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
