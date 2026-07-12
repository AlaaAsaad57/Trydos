"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSellerProfile } from "../../../app/(client)/[lang]/sellerProfile/SellerProfileContext";
import SellerDashboardService from "services/sellerDashboard";
import { translateFunction, LogError } from "utils/functions";
import {
  showErrorMessage,
  showSuccessMessage,
} from "components/global/AddToCartMessage";
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
  buildDiff,
  buildFormFromEdit,
  buildUpdateFormData,
  DiffEntry,
  emptyProductForm,
  fileName,
  ImageItem,
  Lookups,
  ProductForm,
  validate,
} from "./helpers";
import {
  CoreSection,
  PricingSection,
  CategoriesSection,
  ClassificationSection,
  CountriesSection,
  SeoSection,
  MediaSection,
  VariantsSection,
  TranslationsSection,
  VideosSection,
  SectionProps,
} from "./sections";

const t = (s: string) => translateFunction(s);

/** Best-effort filename extraction from the media-server /upload/bulk shapes. */
function extractNames(data: any): string[] {
  const arr =
    data?.files ??
    data?.urls ??
    data?.results ??
    data?.data ??
    (data?.url ? [data.url] : Array.isArray(data) ? data : []);
  if (!Array.isArray(arr)) return [];
  return arr
    .map((item: any) => {
      const raw =
        typeof item === "string"
          ? item
          : item?.url ?? item?.path ?? item?.file_name ?? item?.name ?? "";
      return fileName(raw);
    })
    .filter(Boolean);
}

export default function ProductEditor({
  sellerId,
  productId,
  local,
  mode = "edit",
}: {
  sellerId: string;
  productId?: string;
  local: string;
  mode?: "edit" | "create";
}) {
  const router = useRouter();
  const isCreate = mode === "create";
  const { sellerProducts, sellerPermissions, setSellerPermissions } =
    useSellerProfile();

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [denied, setDenied] = useState(false);

  const [lookups, setLookups] = useState<Lookups | null>(null);
  const [form, setForm] = useState<ProductForm | null>(null);
  const [initial, setInitial] = useState<ProductForm | null>(null);
  const [productMeta, setProductMeta] = useState<{
    requires_approval?: boolean;
    request_status?: number;
  }>({});

  const [editMode, setEditMode] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState<{
    images?: boolean;
    meta?: boolean;
    video?: boolean;
  }>({});

  const [confirm, setConfirm] = useState<DiffEntry[] | null>(null);
  const [saving, setSaving] = useState(false);
  const [approvalNote, setApprovalNote] = useState(false);

  // status (allow-to-purchase) toggle
  const [statusTarget, setStatusTarget] = useState<0 | 1 | null>(null);
  const [statusSaving, setStatusSaving] = useState(false);
  const [statusBlockers, setStatusBlockers] = useState<string[]>([]);
  const [status, setStatus] = useState<number>(0);

  const has = (p: string) =>
    (sellerPermissions || []).includes(p) ||
    (sellerPermissions || []).includes("SUPER_ADMIN");
  const canUpdate = has("UPDATE_PRODUCT");
  const canChangeStatus = has("CHANGE_PRODUCT_STATUS");
  const canCreate = has("CREATE_PRODUCT");

  const listProduct = useMemo(
    () =>
      (sellerProducts || []).find(
        (p: any) => String(p.product_id ?? p.id) === String(productId),
      ),
    [sellerProducts, productId],
  );

  // Deep-link safety: hydrate permissions if the context is empty.
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
          scenario: "ProductEditor.getSellerPermissions",
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
      if (isCreate) {
        const res = await SellerDashboardService.getProductCreateForm(sellerId);
        const lk = (res.data?.lookups || {}) as Lookups;
        const built = emptyProductForm();
        setLookups(lk);
        setForm(built);
        setInitial(built);
        setStatus(0);
        setEditMode(true);
        return;
      }
      const res = await SellerDashboardService.getProductForEdit(
        sellerId,
        productId as string,
      );
      const product = res.data?.product;
      const lk = (res.data?.lookups || {}) as Lookups;
      if (!product) throw new Error("Product not found");
      const built = buildFormFromEdit(product, lk);
      setLookups(lk);
      setForm(built);
      setInitial(built);
      setStatus(Number(product.status ?? 0));
      setProductMeta({ request_status: product.request_status });
    } catch (e: any) {
      const msg = e instanceof Error ? e.message : String(e);
      LogError({ scenario: "ProductEditor.load", error: msg, productId: productId ?? "new" });
      if (/permission|forbidden|403/i.test(msg)) setDenied(true);
      else setLoadError(msg || t("Failed to load product"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sellerId, productId]);

  const patch = (p: Partial<ProductForm>) =>
    setForm((prev) => (prev ? { ...prev, ...p } : prev));

  /* ----------------------------- media uploads ---------------------------- */

  const onUploadImages = async (files: File[]) => {
    setUploading((u) => ({ ...u, images: true }));
    try {
      const data = await SellerDashboardService.bulkUploadImages(
        files,
        "product",
      );
      const names = extractNames(data);
      const items: ImageItem[] = names.map((name, i) => ({
        name,
        url: files[i] ? URL.createObjectURL(files[i]) : "",
        isNew: true,
      }));
      if (!items.length) throw new Error("Upload returned no files");
      setForm((prev) =>
        prev ? { ...prev, images: [...prev.images, ...items] } : prev,
      );
    } catch (e: any) {
      const msg = e instanceof Error ? e.message : String(e);
      LogError({ scenario: "ProductEditor.uploadImages", error: msg });
      showErrorMessage(msg || t("Image upload failed"));
    } finally {
      setUploading((u) => ({ ...u, images: false }));
    }
  };

  const onUploadMeta = async (file: File) => {
    setUploading((u) => ({ ...u, meta: true }));
    try {
      const data = await SellerDashboardService.bulkUploadImages(
        [file],
        "product/meta",
      );
      const name = extractNames(data)[0];
      if (!name) throw new Error("Upload returned no file");
      setForm((prev) =>
        prev
          ? { ...prev, meta_image: name, meta_image_url: URL.createObjectURL(file) }
          : prev,
      );
    } catch (e: any) {
      const msg = e instanceof Error ? e.message : String(e);
      LogError({ scenario: "ProductEditor.uploadMeta", error: msg });
      showErrorMessage(msg || t("Image upload failed"));
    } finally {
      setUploading((u) => ({ ...u, meta: false }));
    }
  };

  const onUploadVideo = async (file: File) => {
    setUploading((u) => ({ ...u, video: true }));
    try {
      const url = await SellerDashboardService.uploadShopImage(file, "product");
      const name = fileName(url);
      if (!name) throw new Error("Upload returned no file");
      patch({ cloud_video: name });
    } catch (e: any) {
      const msg = e instanceof Error ? e.message : String(e);
      LogError({ scenario: "ProductEditor.uploadVideo", error: msg });
      showErrorMessage(msg || t("Video upload failed"));
    } finally {
      setUploading((u) => ({ ...u, video: false }));
    }
  };

  /* -------------------------------- save ---------------------------------- */

  const startSave = () => {
    if (!form || !initial) return;
    const errs = validate(form);
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      showErrorMessage(t("Please fix the highlighted fields before saving."));
      return;
    }
    const diff = buildDiff(initial, form, lookups as Lookups);
    if (diff.length === 0) {
      showErrorMessage(t("No changes to save."));
      return;
    }
    setConfirm(diff);
  };

  const confirmSave = async () => {
    if (!form) return;
    setSaving(true);
    setApprovalNote(false);
    try {
      const fd = buildUpdateFormData(form);
      if (isCreate) {
        const res = await SellerDashboardService.addProduct(sellerId, fd);
        if (!res?.success) {
          const detail =
            Array.isArray(res?.detailed_error) && res.detailed_error.length
              ? res.detailed_error.map((d: any) => d.message).join(" • ")
              : "";
          throw new Error(detail || res?.message || t("Failed to create product"));
        }
        setConfirm(null);
        showSuccessMessage(t("Product created successfully."));
        const newId = res.data?.product_id ?? res.data?.id;
        router.replace(
          newId != null
            ? `/${local}/sellerProfile/sellerDashboard/${sellerId}/products/${newId}`
            : `/${local}/sellerProfile/sellerDashboard/${sellerId}`,
        );
        return;
      }
      const res = await SellerDashboardService.updateProduct(
        sellerId,
        productId as string,
        fd,
      );
      if (!res?.success) {
        const detail =
          Array.isArray(res?.detailed_error) && res.detailed_error.length
            ? res.detailed_error.map((d: any) => d.message).join(" • ")
            : "";
        throw new Error(detail || res?.message || t("Failed to update product"));
      }
      // success
      setConfirm(null);
      setInitial(form);
      setEditMode(false);
      setErrors({});
      const requiresApproval = !!res.data?.requires_approval;
      setApprovalNote(requiresApproval);
      if (!requiresApproval) showSuccessMessage(t("Product updated successfully."));
    } catch (e: any) {
      const msg = e instanceof Error ? e.message : String(e);
      LogError({ scenario: "ProductEditor.update", error: msg, productId: productId ?? "new" });
      showErrorMessage(msg);
      setConfirm(null);
    } finally {
      setSaving(false);
    }
  };

  const cancelEdit = () => {
    setForm(initial);
    setErrors({});
    setEditMode(false);
  };

  /* --------------------------- change status ------------------------------ */

  const confirmStatus = async () => {
    if (statusTarget === null) return;
    setStatusSaving(true);
    setStatusBlockers([]);
    try {
      const res = await SellerDashboardService.changeProductStatus(
        sellerId,
        productId,
        statusTarget,
      );
      if (!res?.success) {
        const blockers =
          Array.isArray(res?.detailed_error) && res.detailed_error.length
            ? res.detailed_error.map((d: any) => d.message)
            : [res?.message || t("Could not change status")];
        setStatusBlockers(blockers);
        return;
      }
      setStatus(res.data?.status ?? statusTarget);
      setStatusTarget(null);
      showSuccessMessage(t("Status updated."));
    } catch (e: any) {
      const msg = e instanceof Error ? e.message : String(e);
      LogError({ scenario: "ProductEditor.changeStatus", error: msg, productId });
      setStatusBlockers([msg]);
    } finally {
      setStatusSaving(false);
    }
  };

  /* ------------------------------- render --------------------------------- */

  if (loading) return <LoadingState label={t("Loading product…")} />;
  if (denied)
    return (
      <AccessDenied
        message={t("You don't have permission to view or edit this product.")}
      />
    );
  if (loadError)
    return <ErrorState message={loadError} onRetry={load} />;
  if (!form || !lookups) return null;

  const sectionProps: SectionProps = {
    form,
    patch,
    errors,
    lookups,
    disabled: !editMode,
    onUploadImages,
    onUploadMeta,
    onUploadVideo,
    uploading,
    sellerId,
    canUseGallery: has("READ_PRODUCT_IMAGES"),
  };

  const cover = form.images[0]?.url || listProduct?.images?.[0];

  return (
    <div className="space-y-5">
      {/* Header card */}
      <div
        className="bg-white rounded-[15px] p-4 lg:p-5"
        style={{ boxShadow: "0 3px 10px rgba(0,0,0,0.1)" }}
      >
        <div className="flex items-center gap-4 flex-wrap">
          <div className="w-[64px] h-[64px] rounded-[12px] overflow-hidden bg-[#f4f4f4] border border-[#ededed] shrink-0 flex items-center justify-center">
            {cover ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={cover} alt={form.name} className="w-full h-full object-cover" />
            ) : (
              <DashIcon name="products" size={26} strokeWidth={1.4} />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-[18px] bold text-[#3c3c3c] truncate">
                {isCreate ? t("New Product") : form.name || t("Untitled Product")}
              </h1>
              {!isCreate && (
                <StatusPill active={status === 1}>
                  {status === 1 ? t("Purchasable") : t("Disabled")}
                </StatusPill>
              )}
              {!isCreate && productMeta.request_status === 0 && (
                <span className="px-2.5 py-1 rounded-full text-[10px] semibold bg-[#fbf6e6] text-[#b8860b]">
                  {t("Pending Approval")}
                </span>
              )}
            </div>
            <p className="text-[12px] text-[#8e8e8e] mt-0.5">
              {isCreate
                ? t("Fill in the details and create your product.")
                : `${t("ID")}: ${productId} · ${form.seller_product_id}`}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2.5">
            {isCreate ? (
              <>
                <DashButton
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    router.push(`/${local}/sellerProfile/sellerDashboard/${sellerId}`)
                  }
                >
                  {t("Cancel")}
                </DashButton>
                <DashButton icon="check" onClick={startSave}>
                  {t("Create Product")}
                </DashButton>
              </>
            ) : (
              <>
                {canChangeStatus && (
                  <DashButton
                    variant={status === 1 ? "danger" : "secondary"}
                    size="sm"
                    icon={status === 1 ? "lock" : "check"}
                    onClick={() => {
                      setStatusBlockers([]);
                      setStatusTarget(status === 1 ? 0 : 1);
                    }}
                  >
                    {status === 1 ? t("Disable") : t("Allow Purchase")}
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
                    <DashButton variant="ghost" size="sm" onClick={cancelEdit}>
                      {t("Cancel")}
                    </DashButton>
                    <DashButton icon="check" onClick={startSave}>
                      {t("Save Changes")}
                    </DashButton>
                  </>
                )}
              </>
            )}
          </div>
        </div>

        {approvalNote && (
          <div className="mt-4">
            <InlineAlert tone="success">
              {t(
                "Changes were submitted and are pending admin approval — they go live once approved.",
              )}
            </InlineAlert>
          </div>
        )}
        {!editMode && canUpdate && (
          <p className="mt-3 text-[12px] text-[#8e8e8e]">
            {t("You're viewing this product. Tap Edit to make changes.")}
          </p>
        )}
      </div>

      {/* Sections */}
      <CoreSection {...sectionProps} />
      <PricingSection {...sectionProps} />
      <VariantsSection {...sectionProps} />
      <MediaSection {...sectionProps} />
      <CategoriesSection {...sectionProps} />
      <ClassificationSection {...sectionProps} />
      <CountriesSection {...sectionProps} />
      <SeoSection {...sectionProps} />
      <TranslationsSection {...sectionProps} />
      <VideosSection {...sectionProps} />

      {/* Sticky save bar in edit mode */}
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
              <DashButton
                variant="ghost"
                size="sm"
                onClick={
                  isCreate
                    ? () =>
                        router.push(
                          `/${local}/sellerProfile/sellerDashboard/${sellerId}`,
                        )
                    : cancelEdit
                }
              >
                {t("Cancel")}
              </DashButton>
              <DashButton icon="check" onClick={startSave}>
                {isCreate ? t("Create Product") : t("Save Changes")}
              </DashButton>
            </div>
          </div>
        </div>
      )}

      {/* Confirm-diff dialog */}
      {confirm && (
        <ConfirmDialog
          diff={confirm}
          saving={saving}
          create={isCreate}
          onCancel={() => !saving && setConfirm(null)}
          onConfirm={confirmSave}
        />
      )}

      {/* Status change dialog */}
      {statusTarget !== null && (
        <StatusDialog
          target={statusTarget}
          saving={statusSaving}
          blockers={statusBlockers}
          onCancel={() => !statusSaving && setStatusTarget(null)}
          onConfirm={confirmStatus}
        />
      )}
    </div>
  );
}

/* ------------------------------- dialogs --------------------------------- */

function Scrim({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/45" onClick={onClose} />
      <div
        className="relative bg-white rounded-[20px] z-10 w-full max-w-md max-h-[85vh] flex flex-col overflow-hidden"
        style={{ boxShadow: "0 12px 40px rgba(0,0,0,0.18)" }}
      >
        {children}
      </div>
    </div>
  );
}

function ConfirmDialog({
  diff,
  saving,
  create,
  onCancel,
  onConfirm,
}: {
  diff: DiffEntry[];
  saving: boolean;
  create?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Scrim onClose={onCancel}>
      <div className="p-5 border-b border-[#ededed]">
        <h3 className="text-[16px] bold text-[#3c3c3c]">
          {create ? t("Confirm new product") : t("Confirm changes")}
        </h3>
        <p className="text-[12px] text-[#8e8e8e] mt-0.5">
          {create
            ? `${t("These details will be saved")} (${diff.length}).`
            : `${t("These fields will be updated")} (${diff.length}).`}
        </p>
      </div>
      <div className="p-5 overflow-auto space-y-2.5">
        {diff.map((d, i) => (
          <div
            key={i}
            className="flex items-start gap-3 p-3 rounded-[12px] bg-[#f8f8f8] border border-[#ededed]"
          >
            <span className="text-[12px] medium text-[#505050] w-[40%] shrink-0">
              {d.label}
            </span>
            <span className="text-[12px] text-[#b8b8b8] line-through truncate max-w-[28%]">
              {d.from}
            </span>
            <DashIcon name="chevronRight" size={13} />
            <span className="text-[12px] semibold text-[#3c3c3c] truncate flex-1">
              {d.to}
            </span>
          </div>
        ))}
      </div>
      <div className="p-4 border-t border-[#ededed] flex gap-3">
        <DashButton variant="ghost" fullWidth onClick={onCancel} disabled={saving}>
          {t("Cancel")}
        </DashButton>
        <DashButton icon="check" fullWidth loading={saving} onClick={onConfirm}>
          {t("Confirm & Save")}
        </DashButton>
      </div>
    </Scrim>
  );
}

function StatusDialog({
  target,
  saving,
  blockers,
  onCancel,
  onConfirm,
}: {
  target: 0 | 1;
  saving: boolean;
  blockers: string[];
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const enabling = target === 1;
  return (
    <Scrim onClose={onCancel}>
      <div className="p-6 text-center">
        <div
          className={`w-14 h-14 mx-auto mb-4 rounded-full flex items-center justify-center ${
            enabling ? "bg-[#eaf7ef] text-[#2ea84f]" : "bg-[#fff1f1] text-[#f85555]"
          }`}
        >
          <DashIcon name={enabling ? "check" : "lock"} size={24} />
        </div>
        <h3 className="text-[16px] bold text-[#3c3c3c] mb-1.5">
          {enabling ? t("Allow this product to be purchased?") : t("Disable purchasing?")}
        </h3>
        <p className="text-[13px] text-[#8e8e8e] mb-4">
          {enabling
            ? t("Customers will be able to buy this product once it passes activation checks.")
            : t("The product will be hidden from purchase until you re-enable it.")}
        </p>

        {blockers.length > 0 && (
          <div className="text-left mb-4 p-3 rounded-[12px] bg-[#fff1f1] border border-[#ffd9d9]">
            <p className="text-[12px] semibold text-[#f85555] mb-1.5">
              {t("Cannot enable yet — resolve these first:")}
            </p>
            <ul className="space-y-1">
              {blockers.map((b, i) => (
                <li key={i} className="text-[12px] text-[#f85555] flex items-start gap-1.5">
                  <DashIcon name="alert" size={13} /> {b}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex gap-3">
          <DashButton variant="ghost" fullWidth onClick={onCancel} disabled={saving}>
            {t("Cancel")}
          </DashButton>
          <button
            onClick={onConfirm}
            disabled={saving}
            className={`flex-1 h-[44px] rounded-[12px] text-white medium text-[14px] disabled:opacity-50 active:scale-[0.98] ${
              enabling ? "bg-[#2ea84f] hover:bg-[#279247]" : "bg-[#f85555] hover:bg-[#e84444]"
            }`}
          >
            {saving ? t("Saving…") : enabling ? t("Allow Purchase") : t("Disable")}
          </button>
        </div>
      </div>
    </Scrim>
  );
}
