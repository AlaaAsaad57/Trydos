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

const ACCEPTED_EXTENSIONS = ["xlsx", "xls", "xlsm", "xlsb"];
const ACCEPT_ATTR = ".xlsx,.xls,.xlsm,.xlsb";

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

  const getCategoryName = (cat: ExcelCategory) =>
    cat.name || cat.title || `#${cat.id}`;

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

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

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
    if (!selectedCategory) {
      setStatus({
        type: "error",
        message: translateFunction("Please select a category first", language),
      });
      return;
    }
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
      await SellerDashboardService.processExcel(sellerId, uploaded.url);
      setStatus({
        type: "success",
        message: translateFunction("File uploaded and processed successfully!", language),
      });
      setFile(null);
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
    <div className="w-full max-w-xl mx-auto p-8 bg-white rounded-3xl border border-gray-100 shadow-xs space-y-6">
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
        disabled={loading || !file || !selectedCategory}
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
  );
}
