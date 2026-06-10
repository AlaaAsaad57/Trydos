"use client";
import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Spinner from "components/global/Spinner";
import SellerDashboardService from "services/sellerDashboard";
import { translateFunction } from "utils/functions";

interface GalleryImage {
  id: number | string;
  url?: string;
  path?: string;
  name?: string;
  file_name?: string;
}

interface GalleryMeta {
  current_page: number;
  last_page: number;
  total: number;
}

const PER_PAGE = 60;

export default function GalleryTab({
  sellerId,
  canUpload = false,
  canDelete = false,
}: {
  sellerId: string;
  canUpload?: boolean;
  canDelete?: boolean;
}) {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [meta, setMeta] = useState<GalleryMeta | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [showConfirm, setShowConfirm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<GalleryImage | null>(null);
  const [deletingId, setDeletingId] = useState<string | number | null>(null);
  const [copySuccessId, setCopySuccessId] = useState<string | number | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const folderInputRef = useRef<HTMLInputElement>(null);
  const filesInputRef = useRef<HTMLInputElement>(null);

  // Set webkitdirectory attribute on the folder input (not in TS DOM types)
  useEffect(() => {
    if (folderInputRef.current) {
      folderInputRef.current.setAttribute("webkitdirectory", "");
    }
  }, []);

  const fetchImages = useCallback(async (p: number) => {
    try {
      setLoading(true);
      setError(null);
      const res = await SellerDashboardService.getProductImages(sellerId, p, PER_PAGE);
      const data = res.data?.images ?? res.data?.data ?? res.data ?? [];
      setImages(Array.isArray(data) ? data : []);
      setMeta(res.data?.meta ?? res.meta ?? null);
      setPage(p);
    } catch (e: any) {
      setError(e?.message || translateFunction("Failed to load images"));
    } finally {
      setLoading(false);
    }
  }, [sellerId]);

  useEffect(() => {
    fetchImages(1);
  }, [fetchImages]);

  // Object URLs for confirmation modal previews
  const previewUrls = useMemo(
    () => selectedFiles.map((f) => URL.createObjectURL(f)),
    [selectedFiles],
  );
  useEffect(() => {
    return () => previewUrls.forEach((url) => URL.revokeObjectURL(url));
  }, [previewUrls]);

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const images = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (images.length === 0) return;
    setSelectedFiles(images);
    setShowConfirm(true);
    setUploadError(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleSubmitUpload = async () => {
    if (selectedFiles.length === 0) return;
    try {
      setUploading(true);
      setUploadError(null);
      await SellerDashboardService.uploadProductImages(selectedFiles, sellerId);
      setShowConfirm(false);
      setSelectedFiles([]);
      fetchImages(1);
    } catch (e: any) {
      setUploadError(e?.message || translateFunction("Upload failed"));
    } finally {
      setUploading(false);
    }
  };

  const handleCancelConfirm = () => {
    setShowConfirm(false);
    setSelectedFiles([]);
    setUploadError(null);
    // Reset inputs so the same selection can be re-triggered
    if (filesInputRef.current) filesInputRef.current.value = "";
    if (folderInputRef.current) folderInputRef.current.value = "";
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const imageId = deleteTarget.id;
    try {
      setDeletingId(imageId);
      await SellerDashboardService.deleteProductImage(imageId, sellerId);
      setImages((prev) => prev.filter((img) => String(img.id) !== String(imageId)));
      setDeleteTarget(null);
    } catch (e: any) {
      setError(e?.message || translateFunction("Failed to delete image"));
    } finally {
      setDeletingId(null);
    }
  };

  const copyToClipboard = async (url: string, id: string | number) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopySuccessId(id);
      setTimeout(() => setCopySuccessId(null), 1500);
    } catch {}
  };

  const getImageUrl = (img: GalleryImage) => img.url ?? img.path ?? "";
  const getImageName = (img: GalleryImage) => img.name ?? img.file_name ?? String(img.id);

  return (
    <div className="space-y-6">
      {/* Upload Zone */}
      {canUpload && (
      <div
        className={`border-2 border-dashed rounded-[15px] p-8 text-center transition-colors ${
          dragOver ? "border-blue-500 bg-blue-50" : "border-gray-300 bg-white"
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        <img
          src="/icons/image.svg"
          alt=""
          width={40}
          height={40}
          className="mx-auto mb-3 opacity-70"
        />
        <p className="text-[16px] font-semibold text-[#1d1d1d] mb-1">
          {translateFunction("Drop images here")}
        </p>
        <p className="text-[14px] text-[#8D8D8D] mb-4">
          {translateFunction("or choose files / folder")}
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          <button
            onClick={() => filesInputRef.current?.click()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-[14px]"
          >
            {translateFunction("Select Files")}
          </button>
          <button
            onClick={() => folderInputRef.current?.click()}
            className="px-4 py-2 bg-white border border-gray-300 text-[#1d1d1d] rounded-lg hover:bg-gray-50 text-[14px]"
          >
            {translateFunction("Select Folder")}
          </button>
        </div>
        {/* Hidden file inputs */}
        <input
          ref={filesInputRef}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <input
          ref={folderInputRef}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>
      )}

      {/* Error banner */}
      {error && (
        <div className="p-3 bg-red-100 border border-red-300 rounded-lg text-red-700 text-[14px] flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            title={translateFunction("Close")}
            className="ml-3 shrink-0 hover:opacity-70"
          >
            <img src="/icons/CloseIcon.svg" alt="" width={12} height={12} />
          </button>
        </div>
      )}

      {/* Gallery Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner />
          <span className="ml-3 text-[#3c3c3c]">{translateFunction("Loading images...")}</span>
        </div>
      ) : images.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-[#8D8D8D]">{translateFunction("No images found")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 pb-[30px]">
          {images.map((img) => (
            <div
              key={img.id}
              className="bg-white rounded-xl shadow-sm overflow-hidden group relative"
            >
              <div className="relative w-full aspect-square bg-[#f8f8f8]">
                <img
                  src={getImageUrl(img)}
                  alt={getImageName(img)}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                {/* Action overlay on hover */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    title={translateFunction("View")}
                    onClick={() => setLightboxUrl(getImageUrl(img))}
                    className="w-8 h-8 bg-white/90 rounded-full flex items-center justify-center hover:bg-white"
                  >
                    <img src="/icons/EyeIcon.svg" alt="" width={15} height={15} />
                  </button>
                  <button
                    title={
                      copySuccessId === img.id
                        ? translateFunction("Copied!")
                        : translateFunction("Copy URL")
                    }
                    onClick={() => copyToClipboard(getImageUrl(img), img.id)}
                    className="w-8 h-8 bg-white/90 rounded-full flex items-center justify-center hover:bg-white"
                  >
                    <img
                      src={copySuccessId === img.id ? "/icons/CheckIcon.svg" : "/icons/copyIcon.svg"}
                      alt=""
                      width={15}
                      height={15}
                    />
                  </button>
                  {canDelete && (
                    <button
                      title={translateFunction("Delete")}
                      onClick={() => setDeleteTarget(img)}
                      disabled={deletingId === img.id}
                      className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 disabled:opacity-50"
                    >
                      {deletingId === img.id ? (
                        <Spinner />
                      ) : (
                        <img src="/icons/DeleteIcon.svg" alt="" width={14} height={14} />
                      )}
                    </button>
                  )}
                </div>
              </div>
              <p className="text-[11px] text-[#8D8D8D] px-2 py-1 truncate">
                {getImageName(img)}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {meta && meta.last_page > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button
            onClick={() => fetchImages(page - 1)}
            disabled={page === 1 || loading}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-[#1d1d1d] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            {translateFunction("Previous")}
          </button>
          <span className="text-[14px] text-[#8D8D8D]">
            {translateFunction("Page")} {meta.current_page}{" "}
            {translateFunction("of")} {meta.last_page}
          </span>
          <button
            onClick={() => fetchImages(page + 1)}
            disabled={page >= meta.last_page || loading}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-[#1d1d1d] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            {translateFunction("Next")}
          </button>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[20px] p-6 max-w-2xl w-full max-h-[80vh] flex flex-col shadow-2xl">
            <h2 className="text-[20px] font-bold text-[#1d1d1d] mb-1">
              {translateFunction("Confirm Upload")}
            </h2>
            <p className="text-[14px] text-[#8D8D8D] mb-4">
              {selectedFiles.length} {translateFunction("files selected")}
            </p>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 overflow-y-auto flex-1 mb-4">
              {selectedFiles.map((file, i) => (
                <div key={i} className="rounded-lg overflow-hidden bg-[#f8f8f8] relative">
                  <span className="absolute bg-red-500 text-[12px] font-black w-[25px] h-[25px] flex items-center justify-center top-0 right-1 cursor-pointer text-white rounded-full hover:bg-red-600" onClick={() => {
                    const newFiles = [...selectedFiles];
                    newFiles.splice(i, 1);
                    setSelectedFiles(newFiles);
                    if (newFiles.length === 0) setShowConfirm(false);
                  }}>
                    x
                    </span>
                  <img
                    src={previewUrls[i]}
                    alt={file.name}
                    className="w-full aspect-square object-cover"
                  />
                  <p className="text-[10px] text-[#8D8D8D] px-1 py-1 truncate">{file.name}</p>
                </div>
              ))}
            </div>
            {uploadError && (
              <p className="text-red-600 text-[13px] mb-3">{uploadError}</p>
            )}
            <div className="flex gap-3 justify-end">
              <button
                onClick={handleCancelConfirm}
                disabled={uploading}
                className="px-5 py-2 border border-gray-300 rounded-lg text-[14px] hover:bg-gray-50 disabled:opacity-50"
              >
                {translateFunction("Cancel")}
              </button>
              <button
                onClick={handleSubmitUpload}
                disabled={uploading}
                className="px-5 py-2 bg-blue-500 text-white rounded-lg text-[14px] hover:bg-blue-600 disabled:opacity-50 flex items-center gap-2"
              >
                {uploading && <Spinner />}
                {uploading ? translateFunction("Uploading...") : translateFunction("Upload")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
          onClick={() => deletingId === null && setDeleteTarget(null)}
        >
          <div
            className="bg-white rounded-[20px] p-6 max-w-sm w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-14 h-14 mx-auto mb-4 bg-red-500 rounded-full flex items-center justify-center">
              <img src="/icons/DeleteIcon.svg" alt="" width={22} height={22} />
            </div>
            <h2 className="text-[18px] font-bold text-[#1d1d1d] text-center mb-1">
              {translateFunction("Delete Image")}
            </h2>
            <p className="text-[14px] text-[#8D8D8D] text-center mb-5">
              {translateFunction("Are you sure you want to delete this image? This action cannot be undone.")}
            </p>
            <div className="w-24 h-24 mx-auto mb-5 rounded-lg overflow-hidden bg-[#f8f8f8]">
              <img
                src={getImageUrl(deleteTarget)}
                alt={getImageName(deleteTarget)}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deletingId !== null}
                className="flex-1 px-5 py-2 border border-gray-300 rounded-lg text-[14px] hover:bg-gray-50 disabled:opacity-50"
              >
                {translateFunction("Cancel")}
              </button>
              <button
                onClick={handleDelete}
                disabled={deletingId !== null}
                className="flex-1 px-5 py-2 bg-red-500 text-white rounded-lg text-[14px] hover:bg-red-600 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deletingId !== null && <Spinner />}
                {translateFunction("Delete")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setLightboxUrl(null)}
        >
          <button
            className="absolute top-4 right-4 text-white text-[36px] leading-none hover:opacity-70"
            onClick={() => setLightboxUrl(null)}
          >
            ×
          </button>
          <img
            src={lightboxUrl}
            alt="Preview"
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
