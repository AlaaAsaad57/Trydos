"use client";
import React, { useState, useRef, useEffect, useCallback } from "react";
import SellerDashboardService from "services/sellerDashboard";
import { translateFunction, LogError } from "utils/functions";
import Spinner from "components/global/Spinner";
import { DashIcon } from "components/SellerDashboard/ui/icons";
import {
  DashButton,
  LoadingState,
  EmptyState,
} from "components/SellerDashboard/ui";

interface ExcelUploadTabProps {
  sellerId: string;
  language: string;
}

interface ExcelCategory {
  id: number | string;
  name?: string;
  title?: string;
}

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
}

// Backend upload_status values.
const EXCEL_STATUS = {
  UPLOADED: "uploaded",
  PROCESSING: "processing",
  COMPLETED: "completed",
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

export default function ExcelUploadTab({ sellerId, language }: ExcelUploadTabProps) {
  // ----- categories -----
  const [categories, setCategories] = useState<ExcelCategory[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState<boolean>(false);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  // ----- template download -----
  const [downloadingTemplate, setDownloadingTemplate] = useState<boolean>(false);

  // ----- file upload -----
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // ----- uploaded excel files table -----
  const [excelFiles, setExcelFiles] = useState<ExcelFile[]>([]);
  const [filesLoading, setFilesLoading] = useState<boolean>(false);
  const [filesError, setFilesError] = useState<string | null>(null);
  const [notesModal, setNotesModal] = useState<ExcelFile | null>(null);

  const getCategoryName = (cat: ExcelCategory) =>
    cat.name || cat.title || `#${cat.id}`;

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
      setCategories(Array.isArray(list) ? list : []);
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

  const handleDownloadTemplate = async () => {
    if (!selectedCategory) return;
    try {
      setDownloadingTemplate(true);
      setStatus(null);
      const { blob, filename } =
        await SellerDashboardService.downloadExcelTemplate(
          sellerId,
          selectedCategory,
        );
      // The backend streams the file itself — turn the blob into a download.
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
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
      // 2) Hand the resulting url to the backend for processing.
      let response=await SellerDashboardService.processExcel(sellerId, uploaded.url);
      if(!response.success){
        throw new Error(response?.message)
      }
      setStatus({
        type: "success",
        message: translateFunction("File uploaded and processed successfully!", language),
      });
      setFile(null);
      // Refresh the uploaded files table with the newly processed file.
      fetchExcelFiles();
    } catch (error: any) {
      LogError({
        scenario: "ExcelUploadTab.handleUpload",
        error: error instanceof Error ? error.message : String(error),
      });
      setStatus({
        type: "error",
        message: error?.message || translateFunction("File upload failed.", language),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full mx-auto space-y-6">
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
        <label className="block text-[13px] medium text-[#505050]">
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
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setStatus(null);
            }}
            className="w-full px-4 h-[48px] border border-[#ededed] rounded-[12px] outline-none focus:border-[#388CFF] text-[14px] text-[#3c3c3c] bg-[#f8f8f8] focus:bg-white transition-colors"
          >
            <option value="">
              {translateFunction("Select a category", language)}
            </option>
            {categories.map((cat) => (
              <option key={cat.id} value={String(cat.id)}>
                {getCategoryName(cat)}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Step 2 — Download template */}
      <DashButton
        variant="secondary"
        fullWidth
        icon="download"
        onClick={handleDownloadTemplate}
        loading={downloadingTemplate}
        disabled={!selectedCategory}
      >
        {downloadingTemplate
          ? translateFunction("Preparing template...", language)
          : translateFunction("Download Template", language)}
      </DashButton>

      {/* Step 3 — Drop zone */}
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
            <div className="text-left overflow-hidden">
              <p className="text-[14px] medium text-[#3c3c3c] truncate">{file.name}</p>
              <p className="text-[12px] text-[#8e8e8e]">
                {(file.size / 1024).toFixed(1)} KB
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
          className={`p-4 rounded-[12px] text-[14px] medium border flex items-start gap-2 animate-fade-in ${
            status.type === "success"
              ? "bg-[#eaf7ef] border-[#bfe6cc] text-[#2ea84f]"
              : "bg-[#fff1f1] border-[#ffd9d9] text-[#f85555]"
          }`}
        >
          <span className="mt-0.5 shrink-0">
            <DashIcon name={status.type === "success" ? "check" : "alert"} size={16} />
          </span>
          <span className="text-left">{status.message}</span>
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

        {filesLoading ? (
          <LoadingState label={translateFunction("Loading files...", language)} />
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
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-[12px] semibold text-[#8e8e8e] border-b border-[#ededed]">
                  <th className="px-3 py-3">{translateFunction("Title", language)}</th>
                  <th className="px-3 py-3">{translateFunction("ID", language)}</th>
                  <th className="px-3 py-3">{translateFunction("Status", language)}</th>
                  <th className="px-3 py-3">{translateFunction("Created At", language)}</th>
                  <th className="px-3 py-3 text-right">{translateFunction("Actions", language)}</th>
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
                        {item.upload_status || "—"}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-[#8e8e8e] whitespace-nowrap">
                      {formatDate(item.created_at)}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center justify-end gap-2">
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
            className="w-full max-w-md bg-white rounded-[20px] p-5 lg:p-6 space-y-4"
            style={{ boxShadow: "0 12px 40px rgba(0,0,0,0.18)" }}
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
    </div>
  );
}
