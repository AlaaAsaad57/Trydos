"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSellerProfile } from "../../../app/(client)/[lang]/sellerProfile/SellerProfileContext";
import SellerDashboardService from "services/sellerDashboard";
import { translateFunction, LogError } from "utils/functions";
import { FlagIcon } from "utils/tinyUtils";
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
  CategoryDiffItem,
  CategoryLookup,
  CountryDiffItem,
  DescriptorDiffItem,
  DescriptorGroup,
  DiffEntry,
  emptyProductForm,
  fileName,
  ImageItem,
  ListDiffItem,
  Lookups,
  mapServerErrors,
  ProductForm,
  sameDescriptorValues,
  scrollToFirstError,
  TranslationDiffItem,
  validate,
  VariantDiffItem,
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

  // Shop-info gating, applied to BOTH paths. Prices are the substance of this
  // screen and they are meaningless without the shop's currency, so the editor
  // never renders on an unresolved shop — it says why instead of quietly
  // letting the seller edit against an unknown shop.
  // `shopInfo === null` means the loader has not settled yet (NOT a failure);
  // `available: false` means it settled but the shop could not be read.
  const shopInfoPending = shopInfo === null;
  // Missing READ_SHOP_INFO: the loader never issued the request and never will,
  // so this is a permission problem, not a load failure — say so plainly rather
  // than offering a retry that cannot succeed.
  const shopInfoForbidden = shopInfo !== null && !shopInfo.permitted;
  const shopInfoUnavailable =
    shopInfo !== null && shopInfo.permitted && !shopInfo.available;
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

  const isUploading = Boolean(uploading.images || uploading.meta || uploading.video);
  const isSaveDisabled = saving || catLoading || isUploading || loading;

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
    if (!form || !initial || isSaveDisabled) return;
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

  // Both paths wait for shop info before rendering any price input, so a form
  // is never shown and then withdrawn once the shop resolves.
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
        message={
          isCreate
            ? t(
                "Adding a product needs permission to view shop info. Ask a shop admin to grant you that permission, then try again.",
              )
            : t(
                "Opening a product needs permission to view shop info. Ask a shop admin to grant you that permission, then try again.",
              )
        }
      />
    );
  // Shop settled but unusable: fail the same way a failed product load fails.
  // Retry clears the record so ShopInfoLoader's sellerId guard stops matching
  // and GET /shop/info is re-issued exactly once — the loader never retries by
  // itself, by design (that would re-fetch on every render).
  if (shopInfoUnavailable)
    return (
      <ErrorState
        message={
          isCreate
            ? t(
                "Couldn't load your shop details. Product creation is unavailable until they load.",
              )
            : t(
                "Couldn't load your shop details. Editing this product is unavailable until they load.",
              )
        }
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
                <DashButton icon="check" onClick={startSave} disabled={isSaveDisabled} loading={saving}>
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
                    <DashButton icon="check" onClick={startSave} disabled={isSaveDisabled} loading={saving}>
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
            {shopInfo.newProductsApproval?
            <InlineAlert tone="success">
              {t(
                "Changes were submitted",
              )}
            </InlineAlert>
            :<InlineAlert tone="success">
              {t(
                "Changes were submitted and are pending admin approval — they go live once approved.",
              )}
            </InlineAlert>}
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
              <DashButton icon="check" onClick={startSave} disabled={isSaveDisabled} loading={saving}>
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

function Scrim({
  children,
  onClose,
  maxWidth = "max-w-[720px]",
}: {
  children: React.ReactNode;
  onClose: () => void;
  maxWidth?: string;
}) {
  return (
    <div className="fixed inset-0 z-[999999999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/45 backdrop-blur-[2px]" onClick={onClose} />
      <div
        className={`relative bg-white rounded-[20px] z-10 w-full ${maxWidth} max-h-[88vh] flex flex-col overflow-hidden transition-all duration-200`}
        style={{ boxShadow: "0 16px 48px rgba(0,0,0,0.2)" }}
      >
        {children}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status?: "added" | "removed" | "modified" | "changed" | string }) {
  if (status === "added") {
    return (
      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#eaf7ef] text-[#2ea84f] border border-[#bce8c9]">
        {t("Added")}
      </span>
    );
  }
  if (status === "removed") {
    return (
      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#fff1f1] text-[#f85555] border border-[#ffd1d1]">
        {t("Removed")}
      </span>
    );
  }
  if (status === "modified" || status === "changed") {
    return (
      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#edf5ff] text-[#2b7fff] border border-[#cbe1ff]">
        {t("Updated")}
      </span>
    );
  }
  return null;
}

function TranslationsDiffView({ details }: { details: TranslationDiffItem[] }) {
  return (
    <div className="space-y-3 mt-2.5 pt-2.5 border-t border-[#e5e7eb]">
      {details.map((tr, idx) => (
        <div key={idx} className="bg-white rounded-[10px] p-3 border border-[#e5e7eb] space-y-2 shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#3c3c3c]" />
              <span className="text-[13px] font-bold text-[#3c3c3c]">{tr.langName}</span>
            </div>
            <StatusBadge status={tr.status} />
          </div>
          <div className="space-y-1.5 pl-3">
            {tr.changes.map((c, i) => (
              <div key={i} className="flex flex-wrap items-center gap-2 text-[12px] bg-[#f9fafb] p-2 rounded-[8px] border border-[#f3f4f6]">
                <span className="font-medium text-[#6b7280] min-w-[110px]">{c.fieldLabel}:</span>
                <span className="text-[#9ca3af] line-through max-w-[200px] truncate">{c.from}</span>
                <DashIcon name="chevronRight" size={12} className="text-[#9ca3af]" />
                <span className="font-semibold text-[#111827] flex-1 min-w-[120px]">{c.to}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function VariantsDiffView({ details }: { details: VariantDiffItem[] }) {
  return (
    <div className="space-y-3 mt-2.5 pt-2.5 border-t border-[#e5e7eb]">
      {details.map((v, idx) => (
        <div key={idx} className="bg-white rounded-[10px] p-3 border border-[#e5e7eb] space-y-2 shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {v.colorCode && (
                <span
                  className="w-4 h-4 rounded-full border border-black/10 shadow-sm shrink-0"
                  style={{ backgroundColor: v.colorCode }}
                />
              )}
              <span className="text-[13px] font-bold text-[#3c3c3c]">{v.title}</span>
            </div>
            <StatusBadge status={v.status} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-1">
            {v.changes.map((c, i) => (
              <div key={i} className="flex items-center justify-between gap-2 text-[12px] bg-[#f9fafb] p-2 rounded-[8px] border border-[#f3f4f6]">
                <span className="font-medium text-[#6b7280]">{c.fieldLabel}:</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[#9ca3af] line-through">{c.from}</span>
                  <DashIcon name="chevronRight" size={12} className="text-[#9ca3af]" />
                  <span className="font-bold text-[#111827]">{c.to}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function ImagesDiffView({ details }: { details: DiffEntry["imageDetails"] }) {
  if (!details) return null;
  const { added, removed, newList } = details;

  return (
    <div className="space-y-3 mt-2.5 pt-2.5 border-t border-[#e5e7eb]">
      {added.length > 0 && (
        <div className="space-y-1.5">
          <span className="text-[11px] font-semibold text-[#2ea84f] uppercase tracking-wider">{t("New Images Added")} ({added.length})</span>
          <div className="flex flex-wrap gap-2">
            {added.map((img, i) => (
              <div key={i} className="relative w-14 h-14 rounded-[8px] overflow-hidden border border-[#bce8c9] bg-white group shadow-2xs">
                <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
                <div className="absolute top-0 right-0 bg-[#2ea84f] text-white p-0.5 rounded-bl text-[9px]">
                  <DashIcon name="check" size={10} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {removed.length > 0 && (
        <div className="space-y-1.5">
          <span className="text-[11px] font-semibold text-[#f85555] uppercase tracking-wider">{t("Removed Images")} ({removed.length})</span>
          <div className="flex flex-wrap gap-2">
            {removed.map((img, i) => (
              <div key={i} className="relative w-14 h-14 rounded-[8px] overflow-hidden border border-[#ffd1d1] bg-white opacity-70">
                <img src={img.url} alt={img.name} className="w-full h-full object-cover grayscale" />
                <div className="absolute top-0 right-0 bg-[#f85555] text-white p-0.5 rounded-bl text-[9px]">
                  <DashIcon name="close" size={10} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-1.5">
        <span className="text-[11px] font-semibold text-[#6b7280] uppercase tracking-wider">{t("Updated Gallery Preview")} ({newList.length})</span>
        <div className="flex flex-wrap gap-2">
          {newList.map((img, i) => (
            <div key={i} className="w-12 h-12 rounded-[6px] overflow-hidden border border-[#e5e7eb] bg-white shadow-2xs">
              <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ColorsDiffView({ details }: { details: DiffEntry["colorDetails"] }) {
  if (!details) return null;
  const { oldList, newList } = details;

  return (
    <div className="space-y-3 mt-2.5 pt-2.5 border-t border-[#e5e7eb]">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="bg-[#f9fafb] p-2.5 rounded-[10px] border border-[#f3f4f6] space-y-1.5">
          <span className="text-[11px] font-semibold text-[#6b7280]">{t("Original Colors")} ({oldList.length})</span>
          <div className="flex flex-wrap gap-1.5">
            {oldList.map((c, i) => (
              <div key={i} className="flex items-center gap-1.5 px-2 py-1 bg-white rounded-[6px] border border-[#e5e7eb] text-[11px]">
                <span className="w-3.5 h-3.5 rounded-full border border-black/10 shrink-0" style={{ backgroundColor: c.code }} />
                <span className="font-medium text-[#374151]">{c.translatedName || c.name}</span>
              </div>
            ))}
            {oldList.length === 0 && <span className="text-[11px] text-[#9ca3af] italic">{t("None")}</span>}
          </div>
        </div>

        <div className="bg-[#f9fafb] p-2.5 rounded-[10px] border border-[#f3f4f6] space-y-1.5">
          <span className="text-[11px] font-semibold text-[#111827]">{t("New Selection")} ({newList.length})</span>
          <div className="flex flex-wrap gap-1.5">
            {newList.map((c, i) => (
              <div key={i} className="flex items-center gap-1.5 px-2 py-1 bg-white rounded-[6px] border border-[#2ea84f]/40 text-[11px]">
                <span className="w-3.5 h-3.5 rounded-full border border-black/10 shrink-0" style={{ backgroundColor: c.code }} />
                <span className="font-semibold text-[#111827]">{c.translatedName || c.name}</span>
              </div>
            ))}
            {newList.length === 0 && <span className="text-[11px] text-[#9ca3af] italic">{t("None")}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

function CountriesDiffView({ details }: { details: CountryDiffItem[] }) {
  if (!details || details.length === 0) return null;

  return (
    <div className="space-y-2 mt-2.5 pt-2.5 border-t border-[#e5e7eb]">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {details.map((c, idx) => (
          <div key={idx} className="flex items-center justify-between p-2 rounded-[8px] bg-white border border-[#e5e7eb] text-[12px] shadow-2xs">
            <div className="flex items-center gap-2">
              <FlagIcon iso={c.iso} />
              <span className="font-semibold text-[#374151]">{c.name}</span>
            </div>
            <div className="flex items-center gap-2">
              {c.oldExtraPrice !== undefined && c.extraPrice !== undefined ? (
                <div className="flex items-center gap-1 text-[11px]">
                  <span className="text-[#9ca3af] line-through">{c.oldExtraPrice}</span>
                  <DashIcon name="chevronRight" size={11} />
                  <span className="font-bold text-[#111827]">{c.extraPrice}</span>
                </div>
              ) : c.extraPrice !== undefined ? (
                <span className="font-bold text-[#2ea84f]">+{c.extraPrice}</span>
              ) : null}
              <StatusBadge status={c.status} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CategoriesDiffView({ details }: { details: CategoryDiffItem[] }) {
  if (!details || details.length === 0) return null;

  return (
    <div className="space-y-3 mt-2.5 pt-2.5 border-t border-[#e5e7eb]">
      {details.map((cat, idx) => (
        <div key={idx} className="bg-white p-2.5 rounded-[8px] border border-[#e5e7eb] space-y-1.5 shadow-2xs">
          <span className="text-[12px] font-bold text-[#374151]">{cat.groupLabel}</span>
          <div className="flex flex-wrap gap-1.5">
            {cat.added.map((name, i) => (
              <span key={i} className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#eaf7ef] text-[#2ea84f] border border-[#bce8c9]">
                + {name}
              </span>
            ))}
            {cat.removed.map((name, i) => (
              <span key={i} className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#fff1f1] text-[#f85555] border border-[#ffd1d1] line-through">
                - {name}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function DescriptorsDiffView({ details }: { details: DescriptorDiffItem[] }) {
  if (!details || details.length === 0) return null;

  return (
    <div className="space-y-2 mt-2.5 pt-2.5 border-t border-[#e5e7eb]">
      {details.map((d, idx) => (
        <div key={idx} className="flex items-center justify-between p-2 rounded-[8px] bg-white border border-[#e5e7eb] text-[12px] shadow-2xs">
          <span className="font-medium text-[#4b5563]">{d.name}</span>
          <div className="flex items-center gap-1.5">
            <span className="text-[#9ca3af] line-through max-w-[120px] truncate">{d.from}</span>
            <DashIcon name="chevronRight" size={12} className="text-[#9ca3af]" />
            <span className="font-semibold text-[#111827] max-w-[160px] truncate">{d.to}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function ListDiffView({ details }: { details: ListDiffItem }) {
  if (!details) return null;

  return (
    <div className="flex flex-wrap gap-1.5 mt-2.5 pt-2.5 border-t border-[#e5e7eb]">
      {details.added.map((name, i) => (
        <span key={i} className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#eaf7ef] text-[#2ea84f] border border-[#bce8c9]">
          + {name}
        </span>
      ))}
      {details.removed.map((name, i) => (
        <span key={i} className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#fff1f1] text-[#f85555] border border-[#ffd1d1] line-through">
          - {name}
        </span>
      ))}
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
  const [expandedKeys, setExpandedKeys] = useState<Record<string, boolean>>({});

  const toggleExpand = (key: string) => {
    setExpandedKeys((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <Scrim onClose={onCancel} maxWidth="max-w-[720px]">
      <div className="p-5 border-b border-[#ededed] bg-[#fafafa]">
        <h3 className="text-[16px] font-bold text-[#111827]">
          {create ? t("Confirm new product") : t("Confirm changes")}
        </h3>
        <p className="text-[12px] text-[#6b7280] mt-0.5">
          {create
            ? `${t("These details will be saved")} (${diff.length} ${t("item(s)")}).`
            : `${t("These fields will be updated")} (${diff.length} ${t("item(s)")}).`}
        </p>
      </div>
      <div className="p-5 overflow-y-auto space-y-3 w-full max-h-[60vh]">
        {diff.map((d, i) => {
          const key = d.key || `diff-${i}`;
          const isExpandable =
            d.type === "translations" ||
            d.type === "variants" ||
            d.type === "image" ||
            d.type === "color" ||
            d.type === "country" ||
            d.type === "categories" ||
            d.type === "descriptors" ||
            d.type === "list";

          const isExpanded = !!expandedKeys[key];

          return (
            <div
              key={key}
              className="p-3.5 rounded-[14px] bg-[#f9fafb] border border-[#e5e7eb] shadow-2xs transition-all duration-150"
            >
              <div
                className={`flex items-center justify-between gap-3 ${
                  isExpandable ? "cursor-pointer select-none" : ""
                }`}
                onClick={isExpandable ? () => toggleExpand(key) : undefined}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-[13px] font-semibold text-[#1f2937]">
                    {d.label}
                  </span>
                  {d.type === "translations" && d.translationsDetails && (
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#edf5ff] text-[#2b7fff] border border-[#cbe1ff]">
                      {d.translationsDetails.length} {t("languages")}
                    </span>
                  )}
                  {d.type === "variants" && d.variantsDetails && (
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#f3e8ff] text-[#7e22ce] border border-[#e9d5ff]">
                      {d.variantsDetails.length} {t("variants")}
                    </span>
                  )}
                  {d.type === "image" && d.imageDetails && (
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#eaf7ef] text-[#2ea84f] border border-[#bce8c9]">
                      {d.to}
                    </span>
                  )}
                  {d.type === "color" && d.colorDetails && (
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#fff8eb] text-[#d97706] border border-[#fef3c7]">
                      {d.colorDetails.newList.length} {t("colors")}
                    </span>
                  )}
                  {d.type === "country" && d.countryDetails && (
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#f3f4f6] text-[#374151] border border-[#e5e7eb]">
                      {d.countryDetails.length} {t("countries")}
                    </span>
                  )}
                </div>

                {!isExpandable && d.from !== undefined && d.to !== undefined && (
                  <div className="flex items-center gap-2 text-[12px] shrink-0">
                    <span className="text-[#9ca3af] line-through max-w-[120px] truncate">
                      {d.from}
                    </span>
                    <DashIcon name="chevronRight" size={12} className="text-[#9ca3af]" />
                    <span className="font-bold text-[#111827] max-w-[160px] truncate">
                      {d.to}
                    </span>
                  </div>
                )}

                {isExpandable && (
                  <button
                    type="button"
                    className="p-1 rounded-full hover:bg-black/5 text-[#6b7280] transition-colors"
                  >
                    <DashIcon
                      name={isExpanded ? "chevronDown" : "chevronRight"}
                      size={16}
                    />
                  </button>
                )}
              </div>

              {/* Nested Expandable Views */}
              {isExpandable && isExpanded && (
                <>
                  {d.type === "translations" && d.translationsDetails && (
                    <TranslationsDiffView details={d.translationsDetails} />
                  )}
                  {d.type === "variants" && d.variantsDetails && (
                    <VariantsDiffView details={d.variantsDetails} />
                  )}
                  {d.type === "image" && d.imageDetails && (
                    <ImagesDiffView details={d.imageDetails} />
                  )}
                  {d.type === "color" && d.colorDetails && (
                    <ColorsDiffView details={d.colorDetails} />
                  )}
                  {d.type === "country" && d.countryDetails && (
                    <CountriesDiffView details={d.countryDetails} />
                  )}
                  {d.type === "categories" && d.categoryDetails && (
                    <CategoriesDiffView details={d.categoryDetails} />
                  )}
                  {d.type === "descriptors" && d.descriptorDetails && (
                    <DescriptorsDiffView details={d.descriptorDetails} />
                  )}
                  {d.type === "list" && d.listDetails && (
                    <ListDiffView details={d.listDetails} />
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
      <div className="p-4 border-t border-[#ededed] bg-[#fafafa] flex gap-3 w-full">
        <DashButton variant="ghost" fullWidth onClick={onCancel} disabled={saving}>
          {t("Cancel")}
        </DashButton>
        <DashButton icon="check" fullWidth className="min-w-[165px]" loading={saving} disabled={saving} onClick={onConfirm}>
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
