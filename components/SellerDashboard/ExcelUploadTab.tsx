"use client";
import React, { useState, useRef, useEffect, useCallback } from "react";
import SellerDashboardService from "services/sellerDashboard";
import { translateFunction } from "utils/functions";
import Spinner from "components/global/Spinner";

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
        return "bg-green-50 text-green-700 border-green-100";
      case EXCEL_STATUS.FAILED:
        return "bg-red-50 text-red-700 border-red-100";
      case EXCEL_STATUS.PROCESSING:
        return "bg-amber-50 text-amber-700 border-amber-100";
      case EXCEL_STATUS.UPLOADED:
        return "bg-blue-50 text-blue-700 border-blue-100";
      default:
        return "bg-gray-50 text-gray-600 border-gray-200";
    }
  };

  const fetchCategories = useCallback(async () => {
    try {
      setCategoriesLoading(true);
      setCategoriesError(null);
      const res = await SellerDashboardService.getExcelCategories(sellerId);
      console.log(res);
      const list: ExcelCategory[] =
        res?.data?.categories || res?.categories || res?.data || [];
      setCategories(Array.isArray(list) ? list : []);
    } catch (error: any) {
      console.error("Error fetching excel categories:", error);
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
      // Response is a Laravel paginator: the rows live in `.data.data`.
      const list: ExcelFile[] = res?.data?.data || res?.data || [];
      setExcelFiles(Array.isArray(list) ? list : []);
    } catch (error: any) {
      console.error("Error fetching excel files:", error);
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
      console.error("Error downloading template:", error);
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
      console.error("Excel upload error:", error);
      setStatus({
        type: "error",
        message: error?.message || translateFunction("File upload failed.", language),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full  mx-auto space-y-8">
    <div className="w-full  mx-auto p-8 bg-white rounded-3xl border border-gray-100 shadow-xs space-y-6">
      <div className="space-y-2 text-center">
        <h2 className="text-[20px] font-bold text-gray-900 tracking-tight">
          {translateFunction("Upload Excel File", language)}
        </h2>
        <p className="text-[14px] text-gray-500">
          {translateFunction(
            "Pick a category, download its template, fill it in, then upload it.",
            language,
          )}
        </p>
      </div>

      {/* Step 1 — Category select */}
      <div className="space-y-2">
        <label className="block text-[14px] font-medium text-gray-800">
          {translateFunction("Category", language)}
        </label>
        {categoriesLoading ? (
          <div className="flex items-center gap-2 py-3">
            <Spinner />
            <span className="text-[14px] text-gray-500">
              {translateFunction("Loading categories...", language)}
            </span>
          </div>
        ) : categoriesError ? (
          <div className="flex items-center justify-between gap-2 p-3 bg-red-50 border border-red-100 rounded-xl">
            <span className="text-[13px] text-red-700">{categoriesError}</span>
            <button
              onClick={fetchCategories}
              className="text-[13px] font-medium text-red-700 underline shrink-0"
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
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-[14px] bg-white"
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
      <button
        onClick={handleDownloadTemplate}
        disabled={!selectedCategory || downloadingTemplate}
        className="w-full py-3 border border-blue-200 text-blue-700 bg-blue-50/60 font-semibold rounded-xl hover:bg-blue-50 disabled:bg-gray-50 disabled:text-gray-400 disabled:border-gray-100 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
      >
        {downloadingTemplate ? (
          <>
            <Spinner />
            <span>{translateFunction("Preparing template...", language)}</span>
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
            </svg>
            <span>{translateFunction("Download Template", language)}</span>
          </>
        )}
      </button>

      {/* Step 3 — Drop zone */}
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={onButtonClick}
        className={`w-full py-12 px-6 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center space-y-4 cursor-pointer transition-all duration-300 ${
          dragActive
            ? "border-blue-500 bg-blue-50/50"
            : "border-gray-200 hover:border-gray-300 hover:bg-gray-50/30"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept={ACCEPT_ATTR}
          onChange={handleChange}
        />
        <div className="p-3 bg-blue-50 text-blue-600 rounded-full">
          <svg
            className="w-8 h-8"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            ></path>
          </svg>
        </div>
        <div className="text-center space-y-1">
          <p className="text-[14px] font-medium text-gray-800">
            {translateFunction("Drag & drop Excel file here, or click to select", language)}
          </p>
          <p className="text-[12px] text-gray-400">
            {translateFunction("Supports .xlsx, .xls, .xlsm, .xlsb", language)}
          </p>
        </div>
      </div>

      {file && (
        <div className="p-4 bg-gray-50 rounded-xl flex items-center justify-between border border-gray-100 animate-fade-in">
          <div className="flex items-center space-x-3 overflow-hidden">
            <svg
              className="w-6 h-6 text-green-600 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              ></path>
            </svg>
            <div className="text-left overflow-hidden">
              <p className="text-[14px] font-medium text-gray-800 truncate">{file.name}</p>
              <p className="text-[12px] text-gray-400">
                {(file.size / 1024).toFixed(1)} KB
              </p>
            </div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setFile(null);
            }}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {status && (
        <div
          className={`p-4 rounded-xl text-[14px] font-medium border flex items-start space-x-2 animate-fade-in ${
            status.type === "success"
              ? "bg-green-50 border-green-100 text-green-800"
              : "bg-red-50 border-red-100 text-red-800"
          }`}
        >
          <span className="mt-0.5 shrink-0">
            {status.type === "success" ? (
              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            )}
          </span>
          <span className="text-left">{status.message}</span>
        </div>
      )}

      <button
        onClick={handleUpload}
        disabled={loading || !file}
        className="w-full py-3.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed shadow-sm transition-all duration-200 flex items-center justify-center space-x-2"
      >
        {loading ? (
          <>
            <Spinner />
            <span>{translateFunction("Uploading...", language)}</span>
          </>
        ) : (
          <span>{translateFunction("Upload Excel", language)}</span>
        )}
      </button>
    </div>

      {/* Uploaded excel files table */}
      <div className="w-full p-6 bg-white rounded-3xl border border-gray-100 shadow-xs space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-[16px] font-bold text-gray-900">
            {translateFunction("Uploaded Excel Files", language)}
          </h3>
          <button
            onClick={fetchExcelFiles}
            disabled={filesLoading}
            className="text-[13px] font-medium text-blue-700 hover:text-blue-800 disabled:text-gray-400 flex items-center gap-1.5"
          >
            <svg
              className={`w-4 h-4 ${filesLoading ? "animate-spin" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {translateFunction("Refresh", language)}
          </button>
        </div>

        {filesLoading ? (
          <div className="flex items-center gap-2 py-8 justify-center">
            <Spinner />
            <span className="text-[14px] text-gray-500">
              {translateFunction("Loading files...", language)}
            </span>
          </div>
        ) : filesError ? (
          <div className="flex items-center justify-between gap-2 p-3 bg-red-50 border border-red-100 rounded-xl">
            <span className="text-[13px] text-red-700">{filesError}</span>
            <button
              onClick={fetchExcelFiles}
              className="text-[13px] font-medium text-red-700 underline shrink-0"
            >
              {translateFunction("Retry", language)}
            </button>
          </div>
        ) : excelFiles.length === 0 ? (
          <div className="py-8 text-center text-[14px] text-gray-400">
            {translateFunction("No files uploaded yet.", language)}
          </div>
        ) : (
          <div className="overflow-x-auto -mx-2">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-[12px] font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100">
                  <th className="px-3 py-2.5">{translateFunction("Title", language)}</th>
                  <th className="px-3 py-2.5">{translateFunction("ID", language)}</th>
                  <th className="px-3 py-2.5">{translateFunction("Status", language)}</th>
                  <th className="px-3 py-2.5">{translateFunction("Created At", language)}</th>
                  <th className="px-3 py-2.5 text-right">{translateFunction("Actions", language)}</th>
                </tr>
              </thead>
              <tbody className="text-[13px] text-gray-700">
                {excelFiles.map((item) => (
                  <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-3 py-3 font-medium text-gray-800 max-w-[180px] truncate">
                      {item.original_filename || "—"}
                    </td>
                    <td className="px-3 py-3 text-gray-500">{item.id}</td>
                    <td className="px-3 py-3">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-medium border capitalize ${statusBadgeClass(
                          item.upload_status,
                        )}`}
                      >
                        {item.upload_status || "—"}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-gray-500 whitespace-nowrap">
                      {formatDate(item.created_at)}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setNotesModal(item)}
                          disabled={!item.processing_notes}
                          title={translateFunction("Show notes", language)}
                          className="px-2.5 py-1.5 rounded-lg text-[12px] font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 disabled:text-gray-300 disabled:border-gray-100 disabled:cursor-not-allowed transition-colors"
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
                            className="px-2.5 py-1.5 rounded-lg text-[12px] font-medium text-blue-700 border border-blue-200 bg-blue-50/60 hover:bg-blue-50 transition-colors"
                          >
                            {translateFunction("Download", language)}
                          </a>
                        ) : (
                          <span className="px-2.5 py-1.5 rounded-lg text-[12px] font-medium text-gray-300 border border-gray-100 cursor-not-allowed">
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 animate-fade-in"
          onClick={() => setNotesModal(null)}
        >
          <div
            className="w-full max-w-md bg-white rounded-2xl shadow-lg p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-[16px] font-bold text-gray-900">
                {translateFunction("Notes", language)}
                {notesModal.original_filename ? ` — ${notesModal.original_filename}` : ""}
              </h4>
              <button
                onClick={() => setNotesModal(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-[14px] text-gray-700 whitespace-pre-wrap max-h-[60vh] overflow-y-auto">
              {notesModal.processing_notes || translateFunction("No notes available.", language)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
