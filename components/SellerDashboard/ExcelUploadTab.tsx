"use client";
import React, { useState, useRef, useEffect, useCallback } from "react";
import SellerDashboardService from "services/sellerDashboard";
import { translateFunction, LogError } from "utils/functions";
import Spinner from "components/global/Spinner";
import { DashIcon } from "components/SellerDashboard/ui/icons";
import {
  DashButton,
  EmptyState,
  InlineAlert,
} from "components/SellerDashboard/ui";
import { ListRowsSkeleton } from "components/skeleton/loaders/SellerDashboardLoader";

interface ExcelUploadTabProps {
  sellerId: string;
  language: string;
}

interface ExcelCategory {
  id: number | string;
  display_name?: string;
  name?: string;
  title?: string;
  // 0, 1 or 2 — how deep the category sits in the tree.
  level?: number;
  // How many of this seller's products are in the category, at any level.
  products_count?: number;
}

// "template" = the empty sheet for new products; "products" = the seller's own
// products of the category, for updating them.
type ExcelMode = "template" | "products";

// One row from GET /shop/excel/getUploadedExcelFiles (Laravel paginator → data[]).
interface ExcelFile {
  id: number;
  original_filename: string;
  s3_path: string;
  file_size: number;
  mime_type: string;
  uploaded_by_user_type: number;
  uploaded_by_user_id: number;
  upload_status: string;
  processing_notes: string;
  created_at: string;
  updated_at: string;
  // Rows of this file that were not imported (0 while it is still processing).
  failed_rows_count?: number;
}

// Backend upload_status values.
const EXCEL_STATUS = {
  UPLOADED: "uploaded",
  PROCESSING: "processing",
  COMPLETED: "completed",
  COMPLETED_WITH_ERRORS: "completed_with_errors",
  FAILED: "failed",
} as const;

const ACCEPTED_EXTENSIONS = ["xlsx", "xls", "xlsm", "xlsb"];
const ACCEPT_ATTR = ".xlsx,.xls,.xlsm,.xlsb";

const MEDIA_SERVER_BASE_URL =
  process.env.NEXT_PUBLIC_MEDIA_SERVER_BASE_URL?.replace(/\/$/, "") ?? "";
const EXCEL_FOLDER = "excel";

// Build the media-server download URL: <base>/excel/<original_filename>.
const buildDownloadUrl = (file: ExcelFile) => {
  if (!MEDIA_SERVER_BASE_URL || !file.original_filename) return "";
  return `${MEDIA_SERVER_BASE_URL}/file/upload/${EXCEL_FOLDER}/${encodeURIComponent(
    file.original_filename,
  )}`;
};

const productsCount = (cat: ExcelCategory) => Number(cat.products_count) || 0;

// The proxy does not forward the backend's file name, so the tab builds one.
// Characters a file name may not hold become "_".
const safeFileName = (name: string) =>
  name.replace(/[\\/:*?"<>|]+/g, "_").trim() || "file";

// Hand a downloaded file to the browser.
const saveBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// The last category, products-only box and choice, kept per seller so the next
// visit starts where the seller left off. Storage can be off or full, so every
// call is guarded and a failure only means nothing is remembered.
interface RememberedChoice {
  categoryId?: string;
  onlyWithProducts?: boolean;
  mode?: string;
}
const storageKey = (sellerId: string) => `bulk-import:shop:${sellerId}`;
const readRemembered = (sellerId: string): RememberedChoice | null => {
  try {
    const raw = window.localStorage.getItem(storageKey(sellerId));
    return raw ? (JSON.parse(raw) as RememberedChoice) : null;
  } catch {
    return null;
  }
};
const writeRemembered = (sellerId: string, choice: RememberedChoice) => {
  try {
    window.localStorage.setItem(storageKey(sellerId), JSON.stringify(choice));
  } catch {}
};

export default function ExcelUploadTab({ sellerId, language }: ExcelUploadTabProps) {
  const isRtl = language === "ar" || language === "ku";
  // ----- categories -----
  const [categories, setCategories] = useState<ExcelCategory[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState<boolean>(false);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [onlyWithProducts, setOnlyWithProducts] = useState<boolean>(false);
  const [mode, setMode] = useState<ExcelMode>("template");
  // Which seller's remembered choice has been read. Nothing is written for a
  // seller until then, so the defaults never overwrite what was stored.
  const [restoredFor, setRestoredFor] = useState<string | null>(null);

  // ----- template download -----
  const [downloadingTemplate, setDownloadingTemplate] = useState<boolean>(false);

  // ----- file upload -----
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [status, setStatus] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  // The backend asked whether a sheet made for another category should be
  // imported anyway; holds what is needed to answer it.
  const [pendingMismatch, setPendingMismatch] = useState<{
    key: string;
    fileCategory: string;
    chosenCategory: string;
  } | null>(null);

  // ----- uploaded excel files table -----
  const [excelFiles, setExcelFiles] = useState<ExcelFile[]>([]);
  const [filesLoading, setFilesLoading] = useState<boolean>(false);
  const [filesError, setFilesError] = useState<string | null>(null);
  const [notesModal, setNotesModal] = useState<ExcelFile | null>(null);
  const [failedRowsBusy, setFailedRowsBusy] = useState<number | null>(null);
  const [tableNotice, setTableNotice] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const getCategoryName = (cat: ExcelCategory) =>
   cat.display_name|| cat.name || cat.title || `#${cat.id}`;

  const selected = categories.find((cat) => String(cat.id) === selectedCategory);
  const selectedCount = selected ? productsCount(selected) : 0;
  const withProductsCount = categories.filter((cat) => productsCount(cat) > 0).length;
  // "Update my products" needs a category that holds some of the seller's products.
  const updateDisabled = !selected || selectedCount === 0;
  const effectiveMode: ExcelMode = updateDisabled ? "template" : mode;

  const visibleCategories = categories.filter(
    (cat) => !onlyWithProducts || productsCount(cat) > 0,
  );

  const categoryLabel = (cat: ExcelCategory) => {
    const count = productsCount(cat);
    const suffix =
      count > 0
        ? ` (${translateFunction("{count} Products", language).replace("{count}", String(count))})`
        : "";
    return `${getCategoryName(cat)}${suffix}`;
  };

  // Apply the remembered choice to a freshly loaded category list. Category,
  // box and choice are set together, so no rule sees half a restore.
  const restoreChoice = (list: ExcelCategory[]) => {
    const saved = readRemembered(sellerId);
    if (saved) {
      const only = saved.onlyWithProducts === true && list.some((cat) => productsCount(cat) > 0);
      const cat = list.find((c) => String(c.id) === String(saved.categoryId));
      const keep = cat && !(only && productsCount(cat) === 0) ? cat : undefined;
      setOnlyWithProducts(only);
      setSelectedCategory(keep ? String(keep.id) : "");
      setMode(saved.mode === "products" && keep && productsCount(keep) > 0 ? "products" : "template");
    }
    setRestoredFor(sellerId);
  };

  const formatDate = (value?: string) => {
    if (!value) return "—";
    const date = new Date(value);
    if (isNaN(date.getTime())) return value;
    return date.toLocaleString(language || undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const statusBadgeClass = (status?: string) => {
    switch ((status || "").toLowerCase()) {
      case EXCEL_STATUS.COMPLETED:
        return "bg-[#eaf7ef] text-[#2ea84f]";
      case EXCEL_STATUS.COMPLETED_WITH_ERRORS:
        return "bg-[#fff4e8] text-[#e07b00]";
      case EXCEL_STATUS.FAILED:
        return "bg-[#fff1f1] text-[#f85555]";
      case EXCEL_STATUS.PROCESSING:
        return "bg-[#fbf6e6] text-[#b8860b]";
      case EXCEL_STATUS.UPLOADED:
        return "bg-[#388CFF]/[0.1] text-[#388CFF]";
      default:
        return "bg-[#f2f2f2] text-[#8e8e8e]";
    }
  };

  const fetchCategories = useCallback(async () => {
    try {
      setCategoriesLoading(true);
      setCategoriesError(null);
      const res = await SellerDashboardService.getExcelCategories(sellerId);
      if (!res?.success) {
        throw new Error(res?.message || "Failed to load categories");
      }
      const list: ExcelCategory[] =
        res?.data?.categories || res?.categories || res?.data || [];
      const loaded = Array.isArray(list) ? list : [];
      setCategories(loaded);
      restoreChoice(loaded);
    } catch (error: any) {
      LogError({
        scenario: "ExcelUploadTab.fetchCategories",
        error: error instanceof Error ? error.message : String(error),
      });
      setCategoriesError(
        error?.message || translateFunction("Failed to load categories", language),
      );
    } finally {
      setCategoriesLoading(false);
    }
  }, [sellerId, language]);

  const fetchExcelFiles = useCallback(async () => {
    try {
      setFilesLoading(true);
      setFilesError(null);
      const res = await SellerDashboardService.getExcelFiles(sellerId);
      if (!res?.success) {
        throw new Error(res?.message || "Failed to load uploaded files");
      }
      // Response is a Laravel paginator: the rows live in `.data.data`.
      const list: ExcelFile[] = res?.data?.data || res?.data || [];
      setExcelFiles(Array.isArray(list) ? list : []);
    } catch (error: any) {
      LogError({
        scenario: "ExcelUploadTab.fetchExcelFiles",
        error: error instanceof Error ? error.message : String(error),
      });
      setFilesError(
        error?.message || translateFunction("Failed to load uploaded files", language),
      );
    } finally {
      setFilesLoading(false);
    }
  }, [sellerId, language]);

  useEffect(() => {
    fetchCategories();
    fetchExcelFiles();
  }, [fetchCategories, fetchExcelFiles]);

  // Keep the remembered choice in step with the screen — only once this
  // seller's stored choice has been read.
  useEffect(() => {
    if (restoredFor !== sellerId) return;
    writeRemembered(sellerId, {
      categoryId: selectedCategory,
      onlyWithProducts,
      mode: effectiveMode,
    });
  }, [restoredFor, sellerId, selectedCategory, onlyWithProducts, effectiveMode]);

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
    setStatus(null);
    const cat = categories.find((c) => String(c.id) === value);
    // A category with no products has nothing to update.
    if (!cat || productsCount(cat) === 0) setMode("template");
  };

  const handleOnlyWithProducts = (checked: boolean) => {
    setOnlyWithProducts(checked);
    // The picked category is about to disappear from the list: let it go.
    if (checked && selected && productsCount(selected) === 0) {
      setSelectedCategory("");
      setMode("template");
    }
  };

  const handleDownloadTemplate = async () => {
    if (!selected) return;
    try {
      setDownloadingTemplate(true);
      setStatus(null);
      const baseName = safeFileName(selected.name || getCategoryName(selected));
      const { blob, filename } =
        await SellerDashboardService.downloadExcelTemplate(
          sellerId,
          selectedCategory,
          effectiveMode,
          `${baseName}_${effectiveMode}.xlsx`,
        );
      // The backend streams the file itself — turn the blob into a download.
      saveBlob(blob, filename);
    } catch (error: any) {
      LogError({
        scenario: "ExcelUploadTab.handleDownloadTemplate",
        error: error instanceof Error ? error.message : String(error),
      });
      setStatus({
        type: "error",
        message:
          error?.message || translateFunction("Failed to download template", language),
      });
    } finally {
      setDownloadingTemplate(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (selectedFile: File) => {
    const fileExtension = selectedFile.name.split(".").pop()?.toLowerCase();
    if (fileExtension && ACCEPTED_EXTENSIONS.includes(fileExtension)) {
      setFile(selectedFile);
      setStatus(null);
    } else {
      setFile(null);
      setStatus({
        type: "error",
        message: translateFunction(
          "Please upload a valid Excel file (.xlsx, .xls, .xlsm, .xlsb)",
          language,
        ),
      });
    }
  };

  const onButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleUpload = async () => {
    if (!file) {
      setStatus({
        type: "error",
        message: translateFunction("No file selected", language),
      });
      return;
    }

    try {
      setLoading(true);
      setStatus(null);
      // 1) Upload the filled excel to the media server (dummy — user will write).
      const uploaded = await SellerDashboardService.uploadExcelFile(file);
      // 2) Hand the resulting url to the backend for processing, with the
      //    category the seller picked so the backend can check the sheet is for it.
      let response = await SellerDashboardService.processExcel(
        sellerId,
        uploaded.key,
        expectedCategory(),
      );
      // The sheet was made for another category: ask the seller first.
      if (response?.httpStatus === 409 && response?.data?.category_mismatch) {
        setPendingMismatch({
          key: uploaded.key,
          fileCategory: response.data.file_category?.name ?? "",
          chosenCategory: response.data.chosen_category?.name ?? "",
        });
        return;
      }
      finishUpload(response);
    } catch (error: any) {
      reportUploadError(error, "ExcelUploadTab.handleUpload");
    } finally {
      setLoading(false);
    }
  };

  const expectedCategory = () =>
    selectedCategory
      ? { expectedCategoryId: Number(selectedCategory) || selectedCategory }
      : {};

  const finishUpload = (response: any) => {
    if (!response.success) {
      throw new Error(response?.message);
    }
    setStatus({
      type: "success",
      message: translateFunction("File uploaded and processed successfully!", language),
    });
    setFile(null);
    // Refresh the uploaded files table with the newly processed file.
    fetchExcelFiles();
  };

  const reportUploadError = (error: any, scenario: string) => {
    LogError({
      scenario,
      error: error instanceof Error ? error.message : String(error),
    });
    setStatus({
      type: "error",
      message: error?.message || translateFunction("File upload failed.", language),
    });
  };

  // Yes: import the sheet into its own category. The file is already on the
  // media server, so only the processing request is sent again.
  const confirmMismatch = async () => {
    if (!pendingMismatch) return;
    const { key } = pendingMismatch;
    setPendingMismatch(null);
    try {
      setLoading(true);
      setStatus(null);
      const response = await SellerDashboardService.processExcel(sellerId, key, {
        ...expectedCategory(),
        confirmCategory: true,
      });
      finishUpload(response);
    } catch (error: any) {
      reportUploadError(error, "ExcelUploadTab.confirmMismatch");
    } finally {
      setLoading(false);
    }
  };

  // No: nothing was imported, and nothing more is sent.
  const cancelMismatch = () => {
    setPendingMismatch(null);
    setStatus({
      type: "info",
      message: translateFunction("Upload cancelled. Nothing was imported.", language),
    });
  };

  const handleDownloadFailedRows = async (item: ExcelFile) => {
    try {
      setFailedRowsBusy(item.id);
      setTableNotice(null);
      const baseName = safeFileName(
        (item.original_filename || `file-${item.id}`).replace(/\.[^.]+$/, ""),
      );
      const { blob, filename } = await SellerDashboardService.downloadFailedRows(
        sellerId,
        item.id,
        `${baseName}_failed_rows.xlsx`,
      );
      saveBlob(blob, filename);
      setTableNotice({
        type: "success",
        message: translateFunction(
          "Fix the rows, keep the Id column, and upload this file again. The Reason column is ignored.",
          language,
        ),
      });
    } catch (error: any) {
      LogError({
        scenario: "ExcelUploadTab.handleDownloadFailedRows",
        error: error instanceof Error ? error.message : String(error),
      });
      setTableNotice({
        type: "error",
        message:
          error?.message || translateFunction("Failed to download the failed rows", language),
      });
    } finally {
      setFailedRowsBusy(null);
    }
  };

  return (
    <div dir={isRtl ? "rtl" : "ltr"} className="w-full mx-auto space-y-6">
    <div
      className="w-full mx-auto p-5 lg:p-8 bg-white rounded-[15px] border border-[#ededed] space-y-6"
      style={{ boxShadow: "0 3px 10px rgba(0,0,0,0.1)" }}
    >
      <div className="space-y-2 text-center">
        <span className="inline-flex text-[#5d5d5d]">
          <DashIcon name="excel" size={34} strokeWidth={1.4} />
        </span>
        <h2 className="text-[18px] bold text-[#3c3c3c]">
          {translateFunction("Upload Excel File", language)}
        </h2>
        <p className="text-[14px] text-[#8e8e8e]">
          {translateFunction(
            "Pick a category, download its template, fill it in, then upload it.",
            language,
          )}
        </p>
      </div>

      {/* Step 1 — Category select */}
      <div className="space-y-2">
        <label id="excel-category-label" className="block text-[13px] medium text-[#505050]">
          {translateFunction("Category", language)}
        </label>
        {categoriesLoading ? (
          <div className="flex items-center gap-2 py-3">
            <Spinner />
            <span className="text-[14px] text-[#8e8e8e]">
              {translateFunction("Loading categories...", language)}
            </span>
          </div>
        ) : categoriesError ? (
          <div className="flex items-center justify-between gap-2 p-3 bg-[#fff1f1] border border-[#ffd9d9] rounded-[12px]">
            <span className="text-[13px] text-[#f85555]">{categoriesError}</span>
            <button
              onClick={fetchCategories}
              className="text-[13px] medium text-[#f85555] underline shrink-0"
            >
              {translateFunction("Retry", language)}
            </button>
          </div>
        ) : (
          <>
            <label className="flex items-center gap-2 text-[13px] text-[#505050] cursor-pointer has-[:disabled]:cursor-not-allowed has-[:disabled]:text-[#b8b8b8]">
              <input
                type="checkbox"
                data-pw="seller-excel-only-with-products"
                checked={onlyWithProducts}
                disabled={withProductsCount === 0}
                onChange={(e) => handleOnlyWithProducts(e.target.checked)}
                className="w-4 h-4 accent-[#388CFF]"
              />
              <span>
                {translateFunction("Show only categories that have my products", language)}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-[#f0f0f0] text-[12px] medium text-[#5d5d5d]">
                {withProductsCount}
              </span>
            </label>
            <CategoryPicker
              categories={visibleCategories}
              value={selectedCategory}
              onChange={handleCategoryChange}
              labelOf={categoryLabel}
              searchTextOf={getCategoryName}
              language={language}
            />
          </>
        )}
      </div>

      {/* Step 2 — What to download */}
      <fieldset className="space-y-2">
        <legend className="block mb-2 text-[13px] medium text-[#505050]">
          {translateFunction("What do you want to do?", language)}
        </legend>
        <label className="flex items-start gap-3 p-3 rounded-[12px] border border-[#ededed] cursor-pointer">
          <input
            type="radio"
            name="excel-mode"
            data-pw="seller-excel-mode-template"
            value="template"
            checked={effectiveMode === "template"}
            onChange={() => setMode("template")}
            aria-labelledby="excel-mode-template-label"
            aria-describedby="excel-mode-template-hint"
            className="mt-1 accent-[#388CFF]"
          />
          <span className="space-y-0.5">
            <span id="excel-mode-template-label" className="block text-[14px] medium text-[#3c3c3c]">
              {translateFunction("Add new products", language)}
            </span>
            <span id="excel-mode-template-hint" className="block text-[12px] text-[#8e8e8e]">
              {translateFunction(
                "Download an empty template: column headers and lists only, no product rows. Your existing products are not changed.",
                language,
              )}
            </span>
          </span>
        </label>
        <label
          className={`flex items-start gap-3 p-3 rounded-[12px] border border-[#ededed] ${
            updateDisabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"
          }`}
        >
          <input
            type="radio"
            name="excel-mode"
            data-pw="seller-excel-mode-products"
            value="products"
            checked={effectiveMode === "products"}
            disabled={updateDisabled}
            onChange={() => setMode("products")}
            aria-labelledby="excel-mode-products-label"
            aria-describedby="excel-mode-products-hint"
            className="mt-1 accent-[#388CFF]"
          />
          <span className="space-y-0.5">
            <span id="excel-mode-products-label" className="block text-[14px] medium text-[#3c3c3c]">
              {translateFunction("Update my products", language)}
            </span>
            <span id="excel-mode-products-hint" className="block text-[12px] text-[#8e8e8e]">
              {translateFunction(
                "Download your products of this category with their current values, edit them and upload the file. Do not change the Id.",
                language,
              )}
            </span>
            {selected && selectedCount === 0 && (
              <span className="block text-[12px] text-[#b8860b]">
                {translateFunction(
                  "You have no products in this category yet. Use Add new products.",
                  language,
                )}
              </span>
            )}
          </span>
        </label>
      </fieldset>

      {/* Step 3 — Download */}
      <DashButton
        data-pw="seller-excel-download"
        variant="secondary"
        fullWidth
        icon="download"
        onClick={handleDownloadTemplate}
        loading={downloadingTemplate}
        disabled={!selected}
      >
        {downloadingTemplate
          ? translateFunction("Preparing file...", language)
          : effectiveMode === "products"
            ? translateFunction("Download {count} products", language).replace(
                "{count}",
                String(selectedCount),
              )
            : translateFunction("Download empty template", language)}
      </DashButton>

      {/* Step 4 — Drop zone */}
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={onButtonClick}
        className={`w-full py-12 px-6 border-2 border-dashed rounded-[15px] flex flex-col items-center justify-center space-y-4 cursor-pointer transition-colors duration-300 ${
          dragActive
            ? "border-[#388CFF] bg-[#388CFF]/[0.06]"
            : "border-[#dcdcdc] hover:border-[#b8b8b8] hover:bg-[#f8f8f8]"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept={ACCEPT_ATTR}
          onChange={handleChange}
        />
        <div className="p-3 bg-[#5d5d5d]/[0.1] text-[#5d5d5d] rounded-full">
          <DashIcon name="upload" size={30} strokeWidth={1.5} />
        </div>
        <div className="text-center space-y-1">
          <p className="text-[14px] medium text-[#3c3c3c]">
            {translateFunction("Drag & drop Excel file here, or click to select", language)}
          </p>
          <p className="text-[12px] text-[#8e8e8e]">
            {translateFunction("Supports .xlsx, .xls, .xlsm, .xlsb", language)}
          </p>
        </div>
      </div>

      {file && (
        <div className="p-4 bg-[#f8f8f8] rounded-[12px] flex items-center justify-between border border-[#ededed] animate-fade-in">
          <div className="flex items-center gap-3 overflow-hidden">
            <span className="text-[#2ea84f] shrink-0">
              <DashIcon name="file" size={22} />
            </span>
            <div className="text-start overflow-hidden">
              <p className="text-[14px] medium text-[#3c3c3c] truncate">{file.name}</p>
              <p className="text-[12px] text-[#8e8e8e]">
                {(file.size / 1024).toFixed(1)} {translateFunction("KB")}
              </p>
            </div>
          </div>
          <button
            aria-label={translateFunction("Cancel", language)}
            onClick={(e) => {
              e.stopPropagation();
              setFile(null);
            }}
            className="text-[#8e8e8e] hover:text-[#3c3c3c] transition-colors p-1"
          >
            <DashIcon name="close" size={20} />
          </button>
        </div>
      )}

      {status && (
        <div
          data-pw="seller-excel-status"
          data-type={status.type}
          className={`p-4 rounded-[12px] text-[14px] medium border flex items-start gap-2 animate-fade-in ${
            status.type === "success"
              ? "bg-[#eaf7ef] border-[#bfe6cc] text-[#2ea84f]"
              : status.type === "info"
                ? "bg-[#fbf6e6] border-[#efe1b4] text-[#b8860b]"
                : "bg-[#fff1f1] border-[#ffd9d9] text-[#f85555]"
          }`}
        >
          <span className="mt-0.5 shrink-0">
            <DashIcon name={status.type === "success" ? "check" : "alert"} size={16} />
          </span>
          <span className="text-start">{status.message}</span>
        </div>
      )}

      <DashButton
        fullWidth
        icon="upload"
        onClick={handleUpload}
        loading={loading}
        disabled={!file}
      >
        {loading
          ? translateFunction("Uploading...", language)
          : translateFunction("Upload Excel", language)}
      </DashButton>
    </div>

      {/* Uploaded excel files table */}
      <div
        className="w-full p-5 lg:p-6 bg-white rounded-[15px] border border-[#ededed] space-y-4"
        style={{ boxShadow: "0 3px 10px rgba(0,0,0,0.1)" }}
      >
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-[15px] semibold text-[#3c3c3c] flex items-center gap-2">
            <span className="text-[#5d5d5d]">
              <DashIcon name="excel" size={18} />
            </span>
            {translateFunction("Uploaded Excel Files", language)}
          </h3>
          <button
            onClick={fetchExcelFiles}
            disabled={filesLoading}
            className="text-[13px] medium text-[#388CFF] hover:opacity-80 disabled:text-[#b8b8b8] flex items-center gap-1.5"
          >
            <span className={filesLoading ? "animate-spin" : ""}>
              <DashIcon name="refresh" size={15} />
            </span>
            {translateFunction("Refresh", language)}
          </button>
        </div>

        {tableNotice && (
          <InlineAlert tone={tableNotice.type}>{tableNotice.message}</InlineAlert>
        )}

        {filesLoading ? (
          <ListRowsSkeleton rows={3} />
        ) : filesError ? (
          <div className="flex items-center justify-between gap-2 p-3 bg-[#fff1f1] border border-[#ffd9d9] rounded-[12px]">
            <span className="text-[13px] text-[#f85555]">{filesError}</span>
            <button
              onClick={fetchExcelFiles}
              className="text-[13px] medium text-[#f85555] underline shrink-0"
            >
              {translateFunction("Retry", language)}
            </button>
          </div>
        ) : excelFiles.length === 0 ? (
          <EmptyState
            icon="excel"
            title={translateFunction("No files uploaded yet.", language)}
          />
        ) : (
          <div className="overflow-x-auto -mx-2">
            <table className="w-full text-start border-collapse">
              <thead>
                <tr className="text-[12px] semibold text-[#8e8e8e] border-b border-[#ededed]">
                  <th className="px-3 py-3">{translateFunction("Title", language)}</th>
                  <th className="px-3 py-3">{translateFunction("ID", language)}</th>
                  <th className="px-3 py-3">{translateFunction("Status", language)}</th>
                  <th className="px-3 py-3">{translateFunction("Created At", language)}</th>
                  <th className="px-3 py-3 text-end">{translateFunction("Actions", language)}</th>
                </tr>
              </thead>
              <tbody className="text-[13px] text-[#505050]">
                {excelFiles.map((item) => (
                  <tr key={item.id} className="border-b border-[#f2f2f2] hover:bg-[#f8f8f8] transition-colors">
                    <td className="px-3 py-3 medium text-[#3c3c3c] max-w-[180px] truncate">
                      {item.original_filename || "—"}
                    </td>
                    <td className="px-3 py-3 text-[#8e8e8e]">{item.id}</td>
                    <td className="px-3 py-3">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-[11px] semibold capitalize ${statusBadgeClass(
                          item.upload_status,
                        )}`}
                      >
                        {item.upload_status === EXCEL_STATUS.COMPLETED_WITH_ERRORS
                          ? translateFunction("Completed with errors", language)
                          : item.upload_status || "—"}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-[#8e8e8e] whitespace-nowrap">
                      {formatDate(item.created_at)}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {Number(item.failed_rows_count) > 0 && (
                          <button
                            data-pw="seller-excel-failed-rows"
                            onClick={() => handleDownloadFailedRows(item)}
                            disabled={failedRowsBusy === item.id}
                            title={translateFunction("Fix these rows and upload the file again", language)}
                            className="px-2.5 py-1.5 rounded-[10px] text-[12px] medium text-[#e07b00] border border-[#e07b00] hover:bg-[#e07b00]/[0.06] disabled:opacity-60 disabled:cursor-wait whitespace-nowrap transition-colors"
                          >
                            {failedRowsBusy === item.id
                              ? translateFunction("Preparing file...", language)
                              : translateFunction("Download {count} failed rows", language).replace(
                                  "{count}",
                                  String(item.failed_rows_count),
                                )}
                          </button>
                        )}
                        <button
                          onClick={() => setNotesModal(item)}
                          disabled={!item.processing_notes}
                          title={translateFunction("Show notes", language)}
                          className="px-2.5 py-1.5 rounded-[10px] text-[12px] medium text-[#505050] border border-[#ededed] hover:bg-[#f5f5f5] disabled:text-[#c4c2c2] disabled:border-[#f2f2f2] disabled:cursor-not-allowed transition-colors"
                        >
                          {translateFunction("Notes", language)}
                        </button>
                        {buildDownloadUrl(item) ? (
                          <a
                            href={buildDownloadUrl(item)}
                            target="_blank"
                            rel="noopener noreferrer"
                            download
                            title={translateFunction("Download", language)}
                            className="px-2.5 py-1.5 rounded-[10px] text-[12px] medium text-[#388CFF] border border-[#388CFF] hover:bg-[#388CFF]/[0.06] transition-colors"
                          >
                            {translateFunction("Download", language)}
                          </a>
                        ) : (
                          <span className="px-2.5 py-1.5 rounded-[10px] text-[12px] medium text-[#c4c2c2] border border-[#f2f2f2] cursor-not-allowed">
                            {translateFunction("Download", language)}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Notes modal */}
      {notesModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 animate-fade-in"
          onClick={() => setNotesModal(null)}
        >
          <div
            dir={isRtl ? "rtl" : "ltr"}
            className="w-full max-w-md bg-white rounded-[20px] p-5 lg:p-6 space-y-4"
            style={{ direction: isRtl ? "rtl" : "ltr", boxShadow: "0 12px 40px rgba(0,0,0,0.18)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-[16px] bold text-[#3c3c3c]">
                {translateFunction("Notes", language)}
                {notesModal.original_filename ? ` — ${notesModal.original_filename}` : ""}
              </h4>
              <button
                onClick={() => setNotesModal(null)}
                aria-label={translateFunction("Close", language)}
                className="text-[#8e8e8e] hover:text-[#3c3c3c] transition-colors p-1"
              >
                <DashIcon name="close" size={20} />
              </button>
            </div>
            <p className="text-[14px] text-[#505050] whitespace-pre-wrap max-h-[60vh] overflow-y-auto">
              {notesModal.processing_notes || translateFunction("No notes available.", language)}
            </p>
          </div>
        </div>
      )}

      {/* The sheet is for another category: ask before importing it */}
      {pendingMismatch && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 animate-fade-in"
          onClick={cancelMismatch}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="excel-mismatch-question"
            dir={isRtl ? "rtl" : "ltr"}
            className="w-full max-w-md bg-white rounded-[20px] p-5 lg:p-6 space-y-5"
            style={{ direction: isRtl ? "rtl" : "ltr", boxShadow: "0 12px 40px rgba(0,0,0,0.18)" }}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key === "Escape") cancelMismatch();
            }}
          >
            <p id="excel-mismatch-question" className="text-[15px] medium text-[#3c3c3c]">
              {translateFunction(
                'This file is for "{file}", but "{chosen}" is selected. Import it into "{file}"?',
                language,
              )
                .split("{file}")
                .join(pendingMismatch.fileCategory)
                .replace("{chosen}", pendingMismatch.chosenCategory)}
            </p>
            <div className="flex items-center justify-end gap-2">
              <DashButton variant="ghost" onClick={cancelMismatch}>
                {translateFunction("No", language)}
              </DashButton>
              <DashButton onClick={confirmMismatch} autoFocus>
                {translateFunction("Yes", language)}
              </DashButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// The category picker: a closed field that opens a panel with a search box on
// top and the categories under it, like the product editor's Select. It follows
// the select-only combobox pattern, so it works by keyboard (arrows, Enter,
// Escape) and with a screen reader.
function CategoryPicker({
  categories,
  value,
  onChange,
  labelOf,
  searchTextOf,
  language,
}: {
  categories: ExcelCategory[];
  value: string;
  onChange: (value: string) => void;
  labelOf: (cat: ExcelCategory) => string;
  searchTextOf: (cat: ExcelCategory) => string;
  language: string;
}) {
  const [open, setOpen] = useState<boolean>(false);
  const [query, setQuery] = useState<string>("");
  const [active, setActive] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);

  const selectedCat = categories.find((cat) => String(cat.id) === value);
  const q = query.trim().toLowerCase();
  // The search matches the full path, in any letter case.
  const shown = categories.filter(
    (cat) => !q || searchTextOf(cat).toLowerCase().includes(q),
  );

  const openPanel = () => {
    setActive(Math.max(0, categories.findIndex((cat) => String(cat.id) === value)));
    setOpen(true);
  };

  const close = (refocus = false) => {
    setOpen(false);
    setQuery("");
    if (refocus) triggerRef.current?.focus();
  };

  const choose = (cat: ExcelCategory) => {
    onChange(String(cat.id));
    close(true);
  };

  // While open: focus the search box, and close on a click outside the picker.
  useEffect(() => {
    if (!open) return;
    searchRef.current?.focus();
    const onMouseDown = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [open]);

  const onSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(shown.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (shown[active]) choose(shown[active]);
    } else if (e.key === "Escape") {
      e.preventDefault();
      close(true);
    }
  };

  const optionId = (cat: ExcelCategory) => `excel-category-option-${cat.id}`;

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        role="combobox"
        data-pw="seller-excel-category"
        data-value={value}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls="excel-category-list"
        aria-labelledby="excel-category-label"
        onClick={() => (open ? close() : openPanel())}
        onKeyDown={(e) => {
          if (!open && (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            openPanel();
          }
        }}
        className="w-full px-4 h-[48px] flex items-center justify-between gap-2 border border-[#ededed] rounded-[12px] outline-none focus:border-[#388CFF] text-[14px] text-start bg-[#f8f8f8] focus:bg-white transition-colors"
      >
        <span className={`truncate ${selectedCat ? "text-[#3c3c3c]" : "text-[#8e8e8e]"}`}>
          {selectedCat
            ? labelOf(selectedCat)
            : translateFunction("Select a category", language)}
        </span>
        <span
          className={`shrink-0 text-[#8e8e8e] transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        >
          <DashIcon name="chevronDown" size={14} />
        </span>
      </button>

      {open && (
        <div
          className="absolute start-0 end-0 top-full z-50 mt-1.5 bg-white rounded-[12px] border border-[#ededed] p-2 space-y-1.5"
          style={{ boxShadow: "0 8px 24px rgba(0,0,0,0.14)" }}
        >
          <input
            ref={searchRef}
            type="search"
            data-pw="seller-excel-search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            onKeyDown={onSearchKeyDown}
            placeholder={translateFunction("Search categories", language)}
            aria-label={translateFunction("Search categories", language)}
            aria-controls="excel-category-list"
            aria-activedescendant={shown[active] ? optionId(shown[active]) : undefined}
            className="w-full h-[36px] px-3 bg-[#f8f8f8] border border-[#ededed] rounded-[8px] text-[13px] text-[#3c3c3c] outline-none focus:border-[#388CFF] focus:bg-white"
          />
          <ul
            id="excel-category-list"
            role="listbox"
            aria-labelledby="excel-category-label"
            className="max-h-60 overflow-y-auto space-y-0.5"
          >
            {shown.length === 0 ? (
              <li role="presentation" className="px-3 py-2 text-[12px] text-[#b8b8b8] text-center">
                {translateFunction("No categories match", language)}
              </li>
            ) : (
              shown.map((cat, i) => {
                const id = String(cat.id);
                const level = Math.max(0, Math.min(2, Number(cat.level) || 0));
                const isSelected = id === value;
                return (
                  <li
                    key={id}
                    id={optionId(cat)}
                    role="option"
                    aria-selected={isSelected}
                    data-pw="seller-excel-category-option"
                    data-value={id}
                    data-level={level}
                    // Keep the focus in the search box while the mouse picks.
                    onMouseDown={(e) => e.preventDefault()}
                    onMouseEnter={() => setActive(i)}
                    onClick={() => choose(cat)}
                    // One indent step per category level.
                    style={{ paddingInlineStart: 12 + level * 16 }}
                    className={`pe-3 py-2 rounded-[8px] text-[13px] cursor-pointer truncate transition-colors ${
                      isSelected ? "text-[#388CFF] medium" : "text-[#3c3c3c]"
                    } ${i === active ? "bg-[#f4f4f4]" : ""}`}
                  >
                    {labelOf(cat)}
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
