"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSellerProfile } from "../../../app/(client)/[lang]/sellerProfile/SellerProfileContext";
import SellerDashboardService from "services/sellerDashboard";
import { translateFunction, LogError } from "utils/functions";
import { useAppStore } from "store";
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
  buildDescriptorSyncPayload,
  buildDiff,
  buildFormFromEdit,
  buildUpdateFormData,
  CategoryLookup,
  DescriptorGroup,
  DiffEntry,
  emptyProductForm,
  fileName,
  ImageItem,
  Lookups,
  mapServerErrors,
  ProductForm,
  sameDescriptorValues,
  scrollToFirstError,
  validate,
} from "./helpers";
import {
  CoreSection,
  PricingSection,
  CategoriesSection,
  DescriptorsSection,
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

  // Shop info (fetched dashboard-wide by ShopInfoLoader). Only trusted when it
  // belongs to THIS shop — otherwise the inputs render without an overlay.
  const dashboardShopInfo = useAppStore((s) => s.dashboardShopInfo);
  const setDashboardShopInfo = useAppStore((s) => s.setDashboardShopInfo);
  const shopInfo =
    dashboardShopInfo?.sellerId === sellerId ? dashboardShopInfo : null;
  const currency = shopInfo?.currency.code ?? "";

  // Create-path approval gating. `shopInfo === null` means the loader has not
  // settled yet (NOT a failure); `available: false` means it settled but the
  // standing is unknown. Both are create-only — editing an existing product is
  // never affected by shop info in any way.
  const shopInfoPending = isCreate && shopInfo === null;
  // Missing READ_SHOP_INFO: the loader never issued the request and never will,
  // so this is a permission problem, not a load failure — say so plainly rather
  // than offering a retry that cannot succeed.
  const shopInfoForbidden = isCreate && shopInfo !== null && !shopInfo.permitted;
  const shopInfoUnavailable =
    isCreate && shopInfo !== null && shopInfo.permitted && !shopInfo.available;
  // Restrict ONLY on a usable record that explicitly says the seller is not
  // approved. Never on the edit path, never on an unknown standing.
  const pricesLocked =
    isCreate && !!shopInfo?.available && !shopInfo.newProductsApproval;

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [denied, setDenied] = useState(false);

  const [lookups, setLookups] = useState<Lookups | null>(null);
  const [form, setForm] = useState<ProductForm | null>(null);
  const [initial, setInitial] = useState<ProductForm | null>(null);
  const [productMeta, setProductMeta] = useState<{
    requires_approval?: boolean;
    request_status?: number;
    /** Live product has a submitted update awaiting an admin decision. */
    is_product_updated_and_need_approval?: boolean;
  }>({});

  const [editMode, setEditMode] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState<{
    images?: boolean;
    meta?: boolean;
    video?: boolean;
  }>({});

  // Per-category-id cache of cascading lookups; merged over base lookups on
  // every category-selection change. Deselecting a category drops its entry.
  const catCache = useRef<
    Map<
      number,
      {
        sub_categories: CategoryLookup[];
        sub_sub_categories: CategoryLookup[];
        descriptor_groups: DescriptorGroup[];
      }
    >
  >(new Map());
  const catSeq = useRef(0); // race guard: only the latest sync applies
  const baseLookups = useRef<Lookups | null>(null); // lookups from /edit, pre-merge
  const [catLoading, setCatLoading] = useState(false);

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
        // Create lookups sit flat under `data`; the edit endpoint nests them
        // under `data.lookups`. Same datasets, different nesting.
        const lk = (res.data || {}) as Lookups;
        const built = emptyProductForm();
        baseLookups.current = lk;
        catCache.current = new Map();
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
      // Saved descriptor values sit beside product/lookups on the edit
      // response (data.descriptor_values[] — product-descriptors-edit.md).
      const built = buildFormFromEdit(product, lk, res.data?.descriptor_values);
      baseLookups.current = lk;
      catCache.current = new Map();
      setLookups(lk);
      setForm(built);
      setInitial(built);
      setStatus(Number(product.status ?? 0));
      setProductMeta({
        request_status: product.request_status,
        is_product_updated_and_need_approval:
          !!product.is_product_updated_and_need_approval,
      });
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

  const catKey = form
    ? [...form.category_id, ...form.sub_category_id, ...form.sub_sub_category_id].join(",")
    : "";
  useEffect(() => {
    if (!form || !baseLookups.current) return;
    syncCategoryLookups(
      form.category_id,
      form.sub_category_id,
      form.sub_sub_category_id,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [catKey]);

  const patch = (p: Partial<ProductForm>) =>
    setForm((prev) => (prev ? { ...prev, ...p } : prev));

  // Merge every cached category-branch lookup over the base lookups, dedupe by
  // id (descriptor groups by group id, descriptors within a group by id), and
  // return the merged Lookups. Base parent_categories/boutiques/brands/etc. are
  // preserved; only the three cascading arrays are replaced by the union.
  //
  // Bucket each response by the queried id's LEVEL (we fire on every level):
  // the endpoint returns a category's DIRECT children under `sub_categories`.
  // So a MAIN id's `sub_categories` are true sub-categories and its
  // `sub_sub_categories` are grandchildren; a SUB id's `sub_categories` are
  // actually sub-sub categories. Bucketing by level keeps items from being
  // mislabeled. Descriptors are branch-wide and always merged.
  const mergeLookups = (
    mainIds: Set<number>,
    subIds: Set<number>,
  ): Lookups => {
    const base = baseLookups.current as Lookups;
    const subs = new Map<number, CategoryLookup>();
    const subSubs = new Map<number, CategoryLookup>();
    const groups = new Map<number, DescriptorGroup>();
    for (const [id, entry] of catCache.current.entries()) {
      if (mainIds.has(id)) {
        for (const s of entry.sub_categories) subs.set(s.id, s);
        for (const s of entry.sub_sub_categories) subSubs.set(s.id, s);
      } else if (subIds.has(id)) {
        for (const s of entry.sub_categories) subSubs.set(s.id, s);
      }
      // (sub-sub ids contribute descriptors only — they are leaves)
      for (const g of entry.descriptor_groups) {
        const existing = groups.get(g.id);
        if (!existing) {
          groups.set(g.id, { ...g, descriptors: [...(g.descriptors || [])] });
        } else {
          const seen = new Set(existing.descriptors.map((d) => d.id));
          for (const d of g.descriptors || [])
            if (!seen.has(d.id)) existing.descriptors.push(d);
        }
      }
    }
    return {
      ...base,
      sub_categories: [...subs.values()],
      sub_sub_categories: [...subSubs.values()],
      descriptor_groups: [...groups.values()],
    };
  };

  // Fetch lookups for every newly-selected category id (across all levels), drop
  // deselected ones, then merge and prune now-invalid sub / sub-sub / descriptor
  // selections.
  const syncCategoryLookups = async (
    mainArr: number[],
    subArr: number[],
    subSubArr: number[],
  ) => {
    if (!baseLookups.current) return;
    const selectedIds = [...mainArr, ...subArr, ...subSubArr];
    const wanted = new Set(selectedIds);
    // Drop cache entries for deselected categories.
    for (const id of [...catCache.current.keys()])
      if (!wanted.has(id)) catCache.current.delete(id);
    const missing = selectedIds.filter((id) => !catCache.current.has(id));

    const seq = ++catSeq.current;
    if (missing.length) setCatLoading(true);
    try {
      const results = await Promise.all(
        missing.map(async (id) => {
          try {
            return {
              id,
              data: await SellerDashboardService.getCategoryLookups(sellerId, id),
              ok: true,
            };
          } catch (e: any) {
            LogError({
              scenario: "ProductEditor.getCategoryLookups",
              error: e instanceof Error ? e.message : String(e),
              categoryId: id,
            });
            return { id, data: null, ok: false };
          }
        }),
      );
      if (seq !== catSeq.current) return; // superseded by a newer selection
      // Cache only successful fetches — a failed id stays a cache miss so the
      // next sync retries it, and its branch never becomes a poisoned empty entry.
      for (const r of results) if (r.ok) catCache.current.set(r.id, r.data as any);
      const anyError = results.some((r) => !r.ok);

      const merged = mergeLookups(new Set(mainArr), new Set(subArr));
      const subIds = new Set(merged.sub_categories.map((s) => s.id));
      const subSubIds = new Set(merged.sub_sub_categories.map((s) => s.id));
      const descIds = new Set(
        merged.descriptor_groups.flatMap((g) => (g.descriptors || []).map((d) => d.id)),
      );
      setLookups(merged);
      // Prune stale selections ONLY when every selected branch loaded. If any
      // fetch failed, its sub / sub-sub aren't in `merged`, so pruning here would
      // wrongly drop the product's real saved categories (and could clear them on
      // save). Skip the prune on error; a later successful sync reconciles.
      if (!anyError) {
        setForm((prev) =>
          prev
            ? {
                ...prev,
                sub_category_id: prev.sub_category_id.filter((id) => subIds.has(id)),
                sub_sub_category_id: prev.sub_sub_category_id.filter((id) => subSubIds.has(id)),
                descriptor_values: Object.fromEntries(
                  Object.entries(prev.descriptor_values).filter(([id]) => descIds.has(Number(id))),
                ),
              }
            : prev,
        );
      }
    } finally {
      if (seq === catSeq.current) setCatLoading(false);
    }
  };

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
      const url = await SellerDashboardService.uploadShopImage(file, "product/videos");
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
    // isCreate gates the three checks the backend enforces only at create
    // (boutique, category, description) — applying them on edit would block
    // saving an existing product that legitimately has one of them empty.
    const errs = validate(form, isCreate, pricesLocked);
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      showErrorMessage(t("Please fix the highlighted fields before saving."));
      scrollToFirstError(errs);
      return;
    }
    const diff = buildDiff(initial, form, lookups as Lookups);
    if (diff.length === 0) {
      showErrorMessage(t("No changes to save."));
      return;
    }
    setConfirm(diff);
  };

  /** A rejected save. The backend's structured errors are mapped onto the form's
   *  own fields; nothing the backend wrote is ever rendered — a 422 body reaches
   *  us verbatim through the proxy and can carry raw PHP text, SQL or hostnames.
   *  Every message shown here is one of our own translated constants. */
  const handleSaveRejection = (res: any, fallback: string) => {
    const { errors: mapped, attributed } = mapServerErrors(res);
    setErrors(mapped);
    setConfirm(null);
    if (attributed && Object.keys(mapped).length > 0) {
      scrollToFirstError(mapped);
    }
    LogError({
      scenario: "ProductEditor.saveRejected",
      error: res?.message ?? "rejected",
      detailed: res?.detailed_error,
      productId: productId ?? "new",
    });
    showErrorMessage(
      attributed ? t("Please fix the highlighted fields before saving.") : fallback,
    );
  };

  const confirmSave = async () => {
    if (!form) return;
    setSaving(true);
    setApprovalNote(false);
    try {
      const fd = buildUpdateFormData(form, isCreate);
      if (isCreate) {
        const res = await SellerDashboardService.addProduct(sellerId, fd);
        if (!res?.success) {
          handleSaveRejection(res, t("Failed to create product"));
          return;
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
        handleSaveRejection(res, t("Failed to update product"));
        return;
      }
      // Descriptors persist through their own full-replace endpoint (same
      // UPDATE_PRODUCT permission as this save). Synced only when they actually
      // changed, so an ordinary field edit can never touch the stored set.
      let savedForm = form;
      let descriptorsOk = true;
      if (
        !sameDescriptorValues(
          initial?.descriptor_values || {},
          form.descriptor_values,
        )
      ) {
        const dres = await SellerDashboardService.syncProductDescriptors(
          sellerId,
          productId as string,
          buildDescriptorSyncPayload(
            form.descriptor_values,
            lookups?.descriptor_groups || [],
          ),
        );
        if (!dres?.success) {
          // Product fields saved but attributes did not — roll the form back to
          // the stored set so the page never shows an unsaved value as saved.
          descriptorsOk = false;
          savedForm = {
            ...form,
            descriptor_values: initial?.descriptor_values || {},
          };
          setForm(savedForm);
          LogError({
            scenario: "ProductEditor.syncDescriptors",
            error: dres?.message ?? "rejected",
            detailed: dres?.detailed_error,
            productId,
          });
          showErrorMessage(t("Product updated, but attributes failed to save."));
        }
      }
      // success
      setConfirm(null);
      setInitial(savedForm);
      setEditMode(false);
      setErrors({});
      const requiresApproval = !!res.data?.requires_approval;
      setApprovalNote(requiresApproval);
      if (!requiresApproval && descriptorsOk)
        showSuccessMessage(t("Product updated successfully."));
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

  /* ------------------------------ draft save/load ------------------------- */

  const getDraftKey = () => `trydos_product_editor_draft_${sellerId}_${productId || "new"}`;

  const handleSaveDraft = () => {
    if (!form || typeof window === "undefined") return;
    try {
      const dataStr = JSON.stringify(form);
      const primaryKey = getDraftKey();
      const genericKey = `trydos_product_editor_draft_${sellerId}`;
      localStorage.setItem(primaryKey, dataStr);
      localStorage.setItem(genericKey, dataStr);
      showSuccessMessage(t("Draft saved successfully."));
    } catch (e) {
      showErrorMessage(t("Failed to save draft."));
    }
  };

  const handleLoadDraft = () => {
    if (!form || typeof window === "undefined") return;
    try {
      const primaryKey = getDraftKey();
      const genericKey = `trydos_product_editor_draft_${sellerId}`;
      const savedStr =
        localStorage.getItem(primaryKey) ||
        localStorage.getItem(genericKey) ||
        localStorage.getItem("trydos_product_editor_draft");
      if (!savedStr) {
        showErrorMessage(t("No saved draft found."));
        return;
      }
      const draftData = JSON.parse(savedStr);
      if (!draftData || typeof draftData !== "object") {
        showErrorMessage(t("No saved draft found."));
        return;
      }
      const merged: ProductForm = {
        ...emptyProductForm(),
        ...draftData,
        category_id: Array.isArray(draftData.category_id) ? draftData.category_id : [],
        sub_category_id: Array.isArray(draftData.sub_category_id) ? draftData.sub_category_id : [],
        sub_sub_category_id: Array.isArray(draftData.sub_sub_category_id) ? draftData.sub_sub_category_id : [],
        labels: Array.isArray(draftData.labels) ? draftData.labels : [],
        tags_ids: Array.isArray(draftData.tags_ids) ? draftData.tags_ids : [],
        descriptor_values:
          draftData.descriptor_values && typeof draftData.descriptor_values === "object"
            ? draftData.descriptor_values
            : {},
        countries_iso: Array.isArray(draftData.countries_iso) ? draftData.countries_iso : [],
        extra_price_for_country: Array.isArray(draftData.extra_price_for_country)
          ? draftData.extra_price_for_country
          : [],
        images: Array.isArray(draftData.images) ? draftData.images : [],
        colors: Array.isArray(draftData.colors) ? draftData.colors : [],
        sizes: Array.isArray(draftData.sizes) ? draftData.sizes : [],
        variations:
          draftData.variations && typeof draftData.variations === "object"
            ? draftData.variations
            : {},
        colorImages:
          draftData.colorImages && typeof draftData.colorImages === "object"
            ? draftData.colorImages
            : {},
        translations: Array.isArray(draftData.translations) ? draftData.translations : [],
      };
      setForm(merged);
      showSuccessMessage(t("Draft loaded successfully."));
    } catch (e) {
      showErrorMessage(t("Failed to load draft."));
    }
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

  // Create waits for the seller's approval standing before rendering any price
  // input, so the unrestricted form is never shown and then withdrawn.
  if (loading || shopInfoPending)
    return <LoadingState label={t("Loading product…")} />;
  if (denied)
    return (
      <AccessDenied
        message={t("You don't have permission to view or edit this product.")}
      />
    );
  if (shopInfoForbidden)
    return (
      <AccessDenied
        message={t(
          "Adding a product needs permission to view shop info. Ask a shop admin to grant you that permission, then try again.",
        )}
      />
    );
  // Standing settled but unusable: fail the same way a failed product load
  // fails. Retry clears the record so ShopInfoLoader's sellerId guard stops
  // matching and GET /shop/info is re-issued exactly once — the loader never
  // retries by itself, by design (that would re-fetch on every render).
  if (shopInfoUnavailable)
    return (
      <ErrorState
        message={t(
          "Couldn't load your shop details. Product creation is unavailable until they load.",
        )}
        onRetry={() => {
          setDashboardShopInfo(null);
          load();
        }}
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
    pricesLocked,
    onUploadImages,
    onUploadMeta,
    onUploadVideo,
    uploading,
    sellerId,
    canUseGallery: has("READ_PRODUCT_IMAGES"),
    busy: catLoading,
    isCreate,
    currency,
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
              {/* Suppressed while a pending update exists — that state gets its
                  own banner and the pill would contradict it. */}
              {!isCreate &&
                productMeta.request_status === 0 &&
                !productMeta.is_product_updated_and_need_approval && (
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
                 
                  onClick={() =>
                    router.push(`/${local}/sellerProfile/sellerDashboard/${sellerId}`)
                  }
                >
                  {t("Cancel")}
                </DashButton>
                <DashButton
                  variant="secondary"
                 
                  icon="download"
                  onClick={handleSaveDraft}
                >
                  {t("Save Draft")}
                </DashButton>
                <DashButton
                  variant="secondary"
                 
                  icon="upload"
                  onClick={handleLoadDraft}
                >
                  {t("Load Draft")}
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
                    <DashButton variant="ghost"  onClick={cancelEdit}>
                      {t("Cancel")}
                    </DashButton>
                    {/* <DashButton
                      variant="secondary"
                      
                      icon="download"
                      onClick={handleSaveDraft}
                    >
                      {t("Save Draft")}
                    </DashButton>
                    <DashButton
                      variant="secondary"
                      
                      icon="upload"
                      onClick={handleLoadDraft}
                    >
                      {t("Load Draft")}
                    </DashButton> */}
                    <DashButton icon="check" onClick={startSave}>
                      {t("Save Changes")}
                    </DashButton>
                  </>
                )}
              </>
            )}
          </div>
        </div>

        {/* Persistent approval banners (survive reload, unlike approvalNote
            below which only marks the transient post-save moment). The pending
            banner wins: it implies an already-approved product, so the two
            states are mutually exclusive and it takes precedence if both. */}
        {!isCreate && productMeta.is_product_updated_and_need_approval && (
          <div className="mt-4">
            <InlineAlert tone="warning">
              {t(
                "This product has pending changes awaiting admin approval. The form below shows your submitted changes; the live product still shows the previous values until approval.",
              )}
            </InlineAlert>
          </div>
        )}
        {!isCreate &&
          !productMeta.is_product_updated_and_need_approval &&
          productMeta.request_status === 2 && (
            <div className="mt-4">
              <InlineAlert tone="warning">
                {t(
                  "Your last changes to this product were denied. The live product still shows the previous values.",
                )}
              </InlineAlert>
            </div>
          )}

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
      <SeoSection {...sectionProps} />
      <TranslationsSection {...sectionProps} />
      <PricingSection {...sectionProps} />
      <VariantsSection {...sectionProps} />
      <MediaSection {...sectionProps} />
      <CategoriesSection {...sectionProps} />
      {/* Attributes sync through their own edit-flow endpoint (needs a product
          id + UPDATE_PRODUCT), so create never shows the section — the seller
          adds them from the edit screen after creation, like videos. */}
      {!isCreate && <DescriptorsSection {...sectionProps} />}
      <ClassificationSection {...sectionProps} />
      <CountriesSection {...sectionProps} />
      {/* The create endpoint ignores cloud_video / remove_videos and always stores
          videos as null, so offering the upload here would silently drop it. Video
          becomes available on the edit screen the seller is redirected to. */}
      {!isCreate && <VideosSection {...sectionProps} />}

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
              {/* <DashButton
                variant="secondary"
                
                icon="download"
                onClick={handleSaveDraft}
              >
                {t("Save Draft")}
              </DashButton>
              <DashButton
                variant="secondary"
                
                icon="upload"
                onClick={handleLoadDraft}
              >
                {t("Load Draft")}
              </DashButton> */}
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
    <div className="fixed inset-0 z-[999999999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/45" onClick={onClose} />
      <div
        className="relative bg-white rounded-[20px] z-10 w-full max-w-[400px] max-h-[85vh] flex flex-col overflow-hidden"
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
      <div className="p-5 overflow-auto space-y-2.5 w-full">
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
      <div className="p-4 border-t border-[#ededed] flex gap-3 w-full">
        <DashButton variant="ghost" fullWidth onClick={onCancel} disabled={saving}>
          {t("Cancel")}
        </DashButton>
        <DashButton icon="check" fullWidth className="min-w-[165px]" loading={saving} onClick={onConfirm}>
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
          <DashButton variant="ghost"  onClick={onCancel} disabled={saving}>
            {t("Cancel")}
          </DashButton>
          <button
            onClick={onConfirm}
            
            disabled={saving}
            className={`flex-1 w-full min-w-[100px] h-[44px] rounded-[12px] text-white medium text-[14px] disabled:opacity-50 active:scale-[0.98] ${
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
