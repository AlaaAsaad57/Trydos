"use client";
import React, { useEffect, useRef, useState } from "react";
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
  const drainingRef = useRef(false);

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
    if (drainingRef.current) return;
    drainingRef.current = true;
    try {
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
          drainingRef.current = false; // release lock so resolveWarn() can resume draining
          return;
        }
        queueRef.current.shift();
        await uploadBanner(file);
      }
    } finally {
      drainingRef.current = false;
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
      let statusFailed = false;
      if (form.status !== initial.status) {
        const sres = await SellerDashboardService.changeBoutiqueStatus(
          sellerId,
          boutiqueId,
          form.status as 0 | 1,
        );
        if (!sres?.success) {
          statusFailed = true;
          const blockers =
            Array.isArray(sres?.detailed_error) && sres.detailed_error.length
              ? sres.detailed_error.map((d: any) => d.message)
              : [sres?.message || t("Could not change status.")];
          setStatusBlockers(blockers);
          savedStatus = initial.status; // revert the toggle; edits stay saved
          showErrorMessage(t("Your changes were saved, but the status could not be updated."));
        } else {
          savedStatus = Number(sres.data?.status ?? form.status);
        }
      }

      const persisted = { ...form, status: savedStatus };
      setForm(persisted);
      setInitial(persisted);
      setEditMode(false);
      setErrors({});
      if (!statusFailed) {
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
