"use client";
import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
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
  CountriesSection,
  TranslationsSection,
  type SectionProps,
} from "./sections";
import {
  buildFormFromEdit,
  buildUpdatePayload,
  checkBannerFile,
  emptyBoutiqueForm,
  extractUploadedNames,
  fileNameOf,
  mapLanguages,
  ICON_FOLDER,
  BANNER_FOLDER,
  validate,
  DEFAULT_LANG,
  RECOMMENDED_BANNER,
  type BoutiqueForm,
  type BoutiqueLookups,
  type CopyableField,
  type Language,
  type LangCode,
  type TranslationForm,
} from "./helpers";

const t = (s: string) => translateFunction(s);

interface WarnState {
  lang: LangCode;
  file: File;
  dims: string; // "1920×640"
}

interface QueuedBanner {
  lang: LangCode;
  file: File;
}

export default function BoutiqueEditor({
  sellerId,
  boutiqueId,
  local,
  mode = "edit",
}: {
  sellerId: string;
  boutiqueId?: string;
  local: string;
  mode?: "edit" | "create";
}) {
  const [, language] = (local || "").split("-");
  const isRtl = language === "ar" || language === "ku";

  const router = useRouter();
  const isCreate = mode === "create";
  const dashboardHref = `/${local}/sellerProfile/sellerDashboard/${sellerId}`;

  const { sellerPermissions, setSellerPermissions } = useSellerProfile();

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [denied, setDenied] = useState(false);

  const [lookups, setLookups] = useState<BoutiqueLookups | null>(null);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [form, setForm] = useState<BoutiqueForm | null>(null);
  const [initial, setInitial] = useState<BoutiqueForm | null>(null);

  const [editMode, setEditMode] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  // Bumped on a failed save so errored fields re-play the shake animation.
  const [shakeTick, setShakeTick] = useState(0);
  const [activeLang, setActiveLang] = useState<LangCode>(DEFAULT_LANG);
  const [uploading, setUploading] = useState<{ icon?: boolean; banners?: boolean }>({});
  const [saving, setSaving] = useState(false);
  const [statusBlockers, setStatusBlockers] = useState<string[]>([]);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // banner warning queue
  const [warn, setWarn] = useState<WarnState | null>(null);
  const queueRef = useRef<QueuedBanner[]>([]);
  const drainingRef = useRef(false);

  const has = (p: string) =>
    (sellerPermissions || []).includes(p) ||
    (sellerPermissions || []).includes("SUPER_ADMIN");
  const canUpdate = has("UPDATE_BUTIKS");
  const canChangeStatus = has("CHANGE_BOUTIQUE_STATUS");
  const canDelete = has("DELETE_BUTIKS");

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
      // Languages drive the translation tabs — never hardcoded. Falls back to the
      // built-in set if the endpoint is unreachable/empty (mapLanguages handles it).
      const langRes = await SellerDashboardService.getLanguages().catch(() => null);
      const langs = mapLanguages(langRes);
      setLanguages(langs);
      setActiveLang((prev) =>
        langs.some((l) => l.code === prev) ? prev : langs[0]?.code ?? DEFAULT_LANG,
      );

      if (isCreate) {
        const res = await SellerDashboardService.getBoutiqueCreateForm(sellerId);
        // The lookups endpoint returns the datasets directly under `data`
        // ({ countries, ... }); older/edit shapes nest them under `data.lookups`.
        const lk = (res.data?.lookups ?? res.data ?? {}) as BoutiqueLookups;
        const built = emptyBoutiqueForm(langs);
        setLookups(lk);
        setForm(built);
        setInitial(built);
        setEditMode(true); // creation is always an editing session
        return;
      }
      const res = await SellerDashboardService.getBoutiqueForEdit(
        sellerId,
        boutiqueId as string,
      );
      const boutique = res.data?.boutique;
      const lk = (res.data?.lookups || {}) as BoutiqueLookups;
      if (!boutique) throw new Error(t("Boutique not found."));
      const built = buildFormFromEdit(boutique, langs);
      setLookups(lk);
      setForm(built);
      setInitial(built);
    } catch (e: any) {
      const msg = e instanceof Error ? e.message : String(e);
      LogError({
        scenario: "BoutiqueEditor.load",
        error: msg,
        boutiqueId: boutiqueId ?? "new",
      });
      if (/permission|forbidden|403/i.test(msg)) setDenied(true);
      else
        setLoadError(
          msg ||
            (isCreate ? t("Failed to load boutique form.") : t("Failed to load boutique.")),
        );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sellerId, boutiqueId]);

  // Warm the browser cache with EVERY language's remote images once the boutique
  // loads. Each translation tab has its own icon/banner URLs and only the active
  // tab is mounted, so switching tabs (or hitting Cancel, which reverts to these
  // same URLs) otherwise triggers a cold network fetch — a 1–2s blank box before
  // the image paints. Preloading makes those swaps hit the cache and feel instant.
  // Only http(s) URLs are warmed; freshly-uploaded blob: object URLs are already local.
  useEffect(() => {
    if (!initial) return;
    const urls = new Set<string>();
    for (const tr of Object.values(initial.translations)) {
      if (tr.iconPreview?.startsWith("http")) urls.add(tr.iconPreview);
      for (const b of tr.banners) {
        if (b.previewUrl?.startsWith("http")) urls.add(b.previewUrl);
      }
    }
    urls.forEach((url) => {
      const img = new Image();
      img.src = url;
    });
  }, [initial]);

  const patch = (p: Partial<BoutiqueForm>) =>
    setForm((prev) => (prev ? { ...prev, ...p } : prev));

  const patchTranslation = (lang: LangCode, p: Partial<TranslationForm>) =>
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

  /* ---------------------------- copy from a language --------------------------- */

  const onCopyField = (field: CopyableField, fromLang: LangCode) =>
    setForm((prev) => {
      if (!prev) return prev;
      const src = prev.translations[fromLang];
      const dst = prev.translations[activeLang];
      if (!src || !dst) return prev;
      let p: Partial<TranslationForm>;
      if (field === "icon") {
        p = { icon: src.icon, iconPreview: src.iconPreview };
      } else if (field === "banners") {
        // Reuse the same uploaded file refs, but as NEW records for this language.
        p = { banners: src.banners.map((b) => ({ banner: b.banner, previewUrl: b.previewUrl })) };
      } else {
        p = { [field]: src[field] } as Partial<TranslationForm>;
      }
      return {
        ...prev,
        translations: {
          ...prev.translations,
          [activeLang]: { ...dst, ...p },
        },
      };
    });

  /* ------------------------------ uploads ------------------------------- */

  const onUploadIcon = async (lang: LangCode, file: File) => {
    setUploading((u) => ({ ...u, icon: true }));
    try {
      const url = await SellerDashboardService.uploadShopImage(file, ICON_FOLDER);
      // Store the file under ICON_FOLDER but send the backend only the bare
      // filename — it resolves the folder itself (sending it doubles the path).
      const name = fileNameOf(url);
      if (!name) throw new Error(t("Upload returned no file."));
      patchTranslation(lang, { icon: name, iconPreview: URL.createObjectURL(file) });
    } catch (e: any) {
      const msg = e instanceof Error ? e.message : String(e);
      LogError({ scenario: "BoutiqueEditor.uploadIcon", error: msg });
      showErrorMessage(msg || t("Image upload failed."));
    } finally {
      setUploading((u) => ({ ...u, icon: false }));
    }
  };

  const uploadBanner = async (lang: LangCode, file: File) => {
    setUploading((u) => ({ ...u, banners: true }));
    try {
      const data = await SellerDashboardService.bulkUploadImages(
        [file],
        BANNER_FOLDER,
      );
      // Store under BANNER_FOLDER but send only the bare filename in `file_path`
      // — the backend resolves the folder (sending it doubles the path).
      const name = fileNameOf(extractUploadedNames(data)[0] || "");
      if (!name) throw new Error(t("Upload returned no file."));
      setForm((prev) =>
        prev
          ? {
              ...prev,
              translations: {
                ...prev.translations,
                [lang]: {
                  ...prev.translations[lang],
                  banners: [
                    ...prev.translations[lang].banners,
                    { banner: name, previewUrl: URL.createObjectURL(file), isNew: true },
                  ],
                },
              },
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
        const { lang, file } = queueRef.current[0];
        const check = await checkBannerFile(file);
        if (check.hardError) {
          queueRef.current.shift();
          showErrorMessage(t(check.hardError));
          continue;
        }
        if (check.warning) {
          setWarn({ lang, file, dims: check.warning }); // stop; wait for user decision
          drainingRef.current = false; // release lock so resolveWarn() can resume draining
          return;
        }
        queueRef.current.shift();
        await uploadBanner(lang, file);
      }
    } finally {
      drainingRef.current = false;
    }
  };

  const onAddBanners = async (lang: LangCode, files: File[]) => {
    queueRef.current.push(...files.map((file) => ({ lang, file })));
    if (!warn) await processQueue();
  };

  const resolveWarn = async (proceed: boolean) => {
    const current = warn;
    setWarn(null);
    if (!current) return;
    queueRef.current.shift(); // remove the warned file from the head
    if (proceed) await uploadBanner(current.lang, current.file);
    await processQueue();
  };

  const onRemoveBanner = (lang: LangCode, index: number) =>
    setForm((prev) =>
      prev
        ? {
            ...prev,
            translations: {
              ...prev.translations,
              [lang]: {
                ...prev.translations[lang],
                banners: prev.translations[lang].banners.filter((_, i) => i !== index),
              },
            },
          }
        : prev,
    );

  const onMoveBanner = (lang: LangCode, index: number, dir: -1 | 1) =>
    setForm((prev) => {
      if (!prev) return prev;
      const next = [...prev.translations[lang].banners];
      const to = index + dir;
      if (to < 0 || to >= next.length) return prev;
      [next[index], next[to]] = [next[to], next[index]];
      return {
        ...prev,
        translations: {
          ...prev.translations,
          [lang]: { ...prev.translations[lang], banners: next },
        },
      };
    });

  /* -------------------------------- save -------------------------------- */

  const onSave = async () => {
    if (!form || !initial) return;
    const errs = validate(form);
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      // Jump to the first language tab that carries an error so its inline
      // messages are visible, then shake the offending fields.
      const firstKey = Object.keys(errs)[0]; // "translations.<code>.<field>"
      const langWithError = firstKey.split(".")[1];
      if (langWithError && form.translations[langWithError]) setActiveLang(langWithError);
      setShakeTick((n) => n + 1);
      showErrorMessage(t("Please fix the highlighted fields before saving."));
      return;
    }
    setSaving(true);
    setStatusBlockers([]);
    try {
      const payload = buildUpdatePayload(form, languages, isCreate ? "create" : "update");

      // Create: POST /shop/boutiques, then hand off to the new boutique's edit
      // page (where it can be activated). No status step — a brand-new boutique
      // has no id to change-status against yet.
      if (isCreate) {
        const res = await SellerDashboardService.addBoutique(sellerId, payload);
        if (!res?.success) {
          const detail =
            Array.isArray(res?.detailed_error) && res.detailed_error.length
              ? res.detailed_error.map((d: any) => d.message).join(" • ")
              : "";
          throw new Error(detail || res?.message || t("Failed to create boutique."));
        }
        showSuccessMessage(t("Boutique created successfully."));
        // Contract returns `data.boutique_id`; keep the older shapes as fallback.
        const newId =
          res.data?.boutique_id ?? res.data?.boutique?.id ?? res.data?.id;
        router.replace(
          newId != null ? `${dashboardHref}/boutiques/${newId}` : dashboardHref,
        );
        return;
      }

      const res = await SellerDashboardService.updateBoutique(
        sellerId,
        boutiqueId as string,
        payload,
      );
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
          boutiqueId as string,
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
      LogError({
        scenario: isCreate ? "BoutiqueEditor.create" : "BoutiqueEditor.save",
        error: msg,
        boutiqueId: boutiqueId ?? "new",
      });
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

  /* ------------------------------- delete ------------------------------- */

  // Soft-delete this boutique (DELETE_BUTIKS). On success it stops appearing in
  // listings; there is no un-delete, so we confirm first. A 404 ("Boutique not
  // found.") means it's already gone / owned by another seller — treat as done.
  const onDelete = async () => {
    if (isCreate || !boutiqueId) return;
    setDeleting(true);
    try {
      const res = await SellerDashboardService.deleteBoutique(sellerId, boutiqueId);
      const notFound = res?.code === 404 || /not found/i.test(res?.message || "");
      if (!res?.success && !notFound) {
        const detail =
          Array.isArray(res?.detailed_error) && res.detailed_error.length
            ? res.detailed_error.map((d: any) => d.message).join(" • ")
            : "";
        throw new Error(detail || res?.message || t("Failed to delete boutique."));
      }
      setConfirmDelete(false);
      showSuccessMessage(t("Boutique deleted successfully."));
      router.replace(dashboardHref);
    } catch (e: any) {
      const msg = e instanceof Error ? e.message : String(e);
      LogError({ scenario: "BoutiqueEditor.delete", error: msg, boutiqueId });
      showErrorMessage(msg || t("Failed to delete boutique."));
    } finally {
      setDeleting(false);
    }
  };

  /* ------------------------------- render ------------------------------- */

  if (loading) return <LoadingState label={t("Loading boutique…")} />;
  if (denied)
    return <AccessDenied message={t("You don't have permission to view or edit this boutique.")} />;
  if (loadError) return <ErrorState message={loadError} onRetry={load} />;
  if (!form || !lookups) return null;

  const baseTr = form.translations[DEFAULT_LANG] ?? form.translations[activeLang];
  const displayName = baseTr?.name || "";
  const iconPreview = baseTr?.iconPreview || "";

  const sectionProps: SectionProps = {
    form,
    patch,
    patchTranslation,
    errors,
    lookups,
    languages,
    disabled: !editMode,
    activeLang,
    setActiveLang,
    onUploadIcon,
    onAddBanners,
    onRemoveBanner,
    onMoveBanner,
    onCopyField,
    uploading,
    shakeTick,
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
            {iconPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={iconPreview} alt={displayName} className="w-full h-full object-cover" />
            ) : (
              <DashIcon name="boutiques" size={26} strokeWidth={1.4} />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-[18px] bold text-[#3c3c3c] truncate">
                {isCreate ? t("New Boutique") : displayName || t("Unnamed Boutique")}
              </h1>
              {!isCreate && (
                <StatusPill active={form.status === 1}>
                  {form.status === 1 ? t("Active") : t("Inactive")}
                </StatusPill>
              )}
            </div>
            <p className="text-[12px] text-[#8e8e8e] mt-0.5">
              {isCreate
                ? t("Fill in the details and create your boutique.")
                : `${t("ID")}: ${boutiqueId}`}
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {isCreate ? (
              <>
                <DashButton
                  variant="ghost"
                  
                  onClick={() => router.push(dashboardHref)}
                  disabled={saving}
                >
                  {t("Cancel")}
                </DashButton>
                <DashButton icon="check" loading={saving} onClick={onSave}>
                  {t("Create Boutique")}
                </DashButton>
              </>
            ) : (
              <>
                {editMode && canChangeStatus && (
                  <DashButton
                    variant={form.status === 1 ? "danger" : "secondary"}
                 
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
                    {canDelete && (
                      <DashButton
                        variant="danger"
                        icon="trash"
                        onClick={() => setConfirmDelete(true)}
                        disabled={saving || deleting}
                      >
                        {t("Delete boutique")}
                      </DashButton>
                    )}
                    <DashButton variant="ghost" onClick={cancelEdit} disabled={saving}>
                      {t("Cancel")}
                    </DashButton>
                    <DashButton icon="check" loading={saving} onClick={onSave}>
                      {t("Save Changes")}
                    </DashButton>
                  </>
                )}
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
      <TranslationsSection {...sectionProps} />
      <CountriesSection {...sectionProps} />

      {/* Sticky save bar */}
      {editMode && (
        <div className="sticky bottom-3 z-20">
          <div
            className="bg-white rounded-[15px] p-3 flex items-center justify-between gap-3"
            style={{ boxShadow: "0 6px 20px rgba(0,0,0,0.14)" }}
          >
           
            <div className="flex items-center gap-2.5">
              <DashButton
                variant="ghost"
                
                onClick={isCreate ? () => router.push(dashboardHref) : cancelEdit}
                disabled={saving}
              >
                {t("Cancel")}
              </DashButton>
              <DashButton icon="check" loading={saving} onClick={onSave}>
                {isCreate ? t("Create Boutique") : t("Save Changes")}
              </DashButton>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/45"
            onClick={() => !deleting && setConfirmDelete(false)}
          />
          <div
            className="relative bg-white rounded-[20px] z-10 w-full max-w-md p-6 text-center"
            style={{ boxShadow: "0 12px 40px rgba(0,0,0,0.18)" }}
          >
            <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-[#fdecec] text-[#f85555] flex items-center justify-center">
              <DashIcon name="trash" size={24} />
            </div>
            <h3 className="text-[16px] bold text-[#3c3c3c] mb-1.5">
              {t("Delete this boutique?")}
            </h3>
            <p className="text-[13px] text-[#8e8e8e] mb-5">
              {t("This boutique will be permanently removed from your shop and can't be undone.")}
            </p>
            <div className="flex gap-3">
              <DashButton
                variant="ghost"
                fullWidth
                onClick={() => setConfirmDelete(false)}
                disabled={deleting}
              >
                {t("Cancel")}
              </DashButton>
              <DashButton
                variant="danger"
                icon="trash"
                fullWidth
                loading={deleting}
                onClick={onDelete}
                className="min-w-[175px]"
              >
                {t("Delete boutique")}
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
              <DashButton icon="upload" fullWidth onClick={() => resolveWarn(true)} className="min-w-[175px]">
                {t("Ignore & upload")}
              </DashButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
