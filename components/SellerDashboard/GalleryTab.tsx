"use client";
import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Spinner from "components/global/Spinner";
import SellerDashboardService from "services/sellerDashboard";
import { translateFunction, LogError } from "utils/functions";
import { DashIcon } from "components/SellerDashboard/ui/icons";
import {
  DashButton,
  LoadingState,
  EmptyState,
  Pagination,
} from "components/SellerDashboard/ui";

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

  // Multi-select / bulk delete
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkDelete, setShowBulkDelete] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

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
      if (!res?.success) {
        throw new Error(res?.message || "Failed to load images");
      }
      const data = res.data?.images ?? res.data?.data ?? res.data ?? [];
      setImages(Array.isArray(data) ? data : []);
      setMeta(res.data?.meta ?? res.meta ?? null);
      setPage(p);
    } catch (e: any) {
      LogError({
        scenario: "GalleryTab.fetchImages",
        error: e instanceof Error ? e.message : String(e),
      });
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
      const res = await SellerDashboardService.uploadProductImages(
        selectedFiles,
        sellerId,
      );
      if (res && res.success === false) {
        throw new Error(res?.message || "Upload failed");
      }
      setShowConfirm(false);
      setSelectedFiles([]);
      fetchImages(1);
    } catch (e: any) {
      LogError({
        scenario: "GalleryTab.handleSubmitUpload",
        error: e instanceof Error ? e.message : String(e),
      });
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
      const res = await SellerDashboardService.deleteProductImages(imageId, sellerId);
      if (res?.success === false) {
        throw new Error(res?.message || translateFunction("Failed to delete image"));
      }
      setImages((prev) => prev.filter((img) => String(img.id) !== String(imageId)));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(String(imageId));
        return next;
      });
      setDeleteTarget(null);
    } catch (e: any) {
      LogError({
        scenario: "GalleryTab.handleDelete",
        error: e instanceof Error ? e.message : String(e),
      });
      setError(e?.message || translateFunction("Failed to delete image"));
    } finally {
      setDeletingId(null);
    }
  };

  // ---- Multi-select helpers ----
  const enterSelectMode = () => {
    setSelectMode(true);
    setLightboxUrl(null);
  };

  const exitSelectMode = () => {
    setSelectMode(false);
    setSelectedIds(new Set());
  };

  const toggleSelect = (id: string | number) => {
    const key = String(id);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const allSelected =
    images.length > 0 && images.every((img) => selectedIds.has(String(img.id)));

  const toggleSelectAll = () => {
    if (allSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(images.map((img) => String(img.id))));
  };

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    try {
      setBulkDeleting(true);
      const res = await SellerDashboardService.deleteProductImages(ids, sellerId);
      if (res?.success === false) {
        throw new Error(res?.message || translateFunction("Failed to delete images"));
      }
      setImages((prev) => prev.filter((img) => !selectedIds.has(String(img.id))));
      setShowBulkDelete(false);
      exitSelectMode();
    } catch (e: any) {
      LogError({
        scenario: "GalleryTab.handleBulkDelete",
        error: e instanceof Error ? e.message : String(e),
      });
      setError(e?.message || translateFunction("Failed to delete images"));
    } finally {
      setBulkDeleting(false);
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
          dragOver
            ? "border-[#388CFF] bg-[#388CFF]/[0.06]"
            : "border-[#dcdcdc] bg-[#fafafa]"
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        <span className="inline-flex text-[#5d5d5d] mb-3">
          <DashIcon name="upload" size={40} strokeWidth={1.4} />
        </span>
        <p className="text-[16px] semibold text-[#3c3c3c] mb-1">
          {translateFunction("Drop images here")}
        </p>
        <p className="text-[14px] text-[#8e8e8e] mb-4">
          {translateFunction("or choose files / folder")}
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          <DashButton
            icon="upload"
            onClick={() => filesInputRef.current?.click()}
          >
            {translateFunction("Select Files")}
          </DashButton>
          <DashButton
            variant="secondary"
            onClick={() => folderInputRef.current?.click()}
          >
            {translateFunction("Select Folder")}
          </DashButton>
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
        <div className="p-3 bg-[#fff1f1] border border-[#ffd9d9] rounded-[12px] text-[#f85555] text-[14px] flex items-center justify-between">
          <span className="flex items-center gap-2">
            <DashIcon name="alert" size={16} />
            {error}
          </span>
          <button
            onClick={() => setError(null)}
            aria-label={translateFunction("Close")}
            className="ml-3 shrink-0 hover:opacity-70 text-[#f85555]"
          >
            <DashIcon name="close" size={16} />
          </button>
        </div>
      )}

      {/* Gallery Grid */}
      {loading ? (
        <LoadingState label={translateFunction("Loading images...")} />
      ) : images.length === 0 ? (
        <EmptyState
          icon="gallery"
          title={translateFunction("No images found")}
          subtitle={translateFunction(
            "Uploaded product images will appear here.",
          )}
        />
      ) : (
        <>
          {/* Selection toolbar — sticks under the page header while scrolling a
              long gallery so the bulk actions stay reachable. */}
          {canDelete && (
            <div className="sticky top-0 z-20 -mt-2 mb-1 py-2 bg-white/85 backdrop-blur-sm flex items-center justify-between gap-3 flex-wrap">
              {selectMode ? (
                <>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-[14px] semibold text-[#3c3c3c]">
                      {selectedIds.size > 0
                        ? `${selectedIds.size} ${translateFunction("selected")}`
                        : translateFunction("Select images to delete")}
                    </span>
                    <button
                      onClick={toggleSelectAll}
                      className="text-[13px] medium text-[#388CFF] hover:opacity-80 active:scale-[0.98]"
                    >
                      {allSelected
                        ? translateFunction("Deselect all")
                        : translateFunction("Select all")}
                    </button>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <DashButton
                      variant="ghost"
                      size="sm"
                      onClick={exitSelectMode}
                    >
                      {translateFunction("Cancel")}
                    </DashButton>
                    <DashButton
                      variant="danger"
                      size="sm"
                      icon="trash"
                      disabled={selectedIds.size === 0}
                      onClick={() => setShowBulkDelete(true)}
                    >
                      {translateFunction("Delete")}
                      {selectedIds.size > 0 ? ` (${selectedIds.size})` : ""}
                    </DashButton>
                  </div>
                </>
              ) : (
                <>
                  <span className="text-[13px] text-[#8e8e8e]">
                    {meta?.total ?? images.length} {translateFunction("images")}
                  </span>
                  <DashButton
                    variant="secondary"
                    size="sm"
                    icon="check"
                    onClick={enterSelectMode}
                  >
                    {translateFunction("Select")}
                  </DashButton>
                </>
              )}
            </div>
          )}

          <div className="grid grid-cols-3 lg:grid-cols-6 gap-3 pb-[30px]">
            {images.map((img) => {
              const selected = selectedIds.has(String(img.id));
              return (
                <div
                  key={img.id}
                  onClick={selectMode ? () => toggleSelect(img.id) : undefined}
                  className={`bg-[#f8f8f8] rounded-[12px] border overflow-hidden group relative transition-all ${
                    selectMode ? "cursor-pointer" : ""
                  } ${
                    selected
                      ? "border-[#388CFF] ring-2 ring-[#388CFF] ring-offset-1"
                      : "border-[#ededed]"
                  }`}
                >
                  <div className="relative w-full aspect-square bg-[#e6e6e6]">
                    <img
                      src={getImageUrl(img)}
                      alt={getImageName(img)}
                      className={`w-full h-full object-cover transition-opacity ${
                        selectMode && !selected ? "opacity-90" : ""
                      }`}
                      loading="lazy"
                    />

                    {/* Selection tint */}
                    {selectMode && selected && (
                      <div className="absolute inset-0 bg-[#388CFF]/15 pointer-events-none" />
                    )}

                    {/* Checkbox — visible in select mode (and on hover otherwise
                        as an affordance to start selecting). */}
                    {canDelete && (
                      <button
                        type="button"
                        aria-label={
                          selected
                            ? translateFunction("Deselect")
                            : translateFunction("Select")
                        }
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!selectMode) setSelectMode(true);
                          toggleSelect(img.id);
                        }}
                        className={`absolute top-2 left-2 z-10 w-6 h-6 rounded-full flex items-center justify-center border transition-all active:scale-[0.9] ${
                          selected
                            ? "bg-[#388CFF] border-[#388CFF] text-white"
                            : "bg-white/85 border-white/90 text-transparent"
                        } ${
                          selectMode
                            ? "opacity-100"
                            : "opacity-0 group-hover:opacity-100"
                        }`}
                      >
                        <DashIcon name="check" size={14} strokeWidth={3} />
                      </button>
                    )}

                    {/* Action overlay on hover — disabled while selecting */}
                    {!selectMode && (
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button
                          title={translateFunction("View")}
                          onClick={() => setLightboxUrl(getImageUrl(img))}
                          className="w-8 h-8 bg-white/90 text-[#3c3c3c] rounded-full flex items-center justify-center hover:bg-white transition-colors active:scale-[0.95]"
                        >
                          <DashIcon name="eye" size={15} />
                        </button>
                        <button
                          title={
                            copySuccessId === img.id
                              ? translateFunction("Copied!")
                              : translateFunction("Copy URL")
                          }
                          onClick={() => copyToClipboard(getImageUrl(img), img.id)}
                          className={`w-8 h-8 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition-colors active:scale-[0.95] ${
                            copySuccessId === img.id ? "text-[#2ea84f]" : "text-[#3c3c3c]"
                          }`}
                        >
                          <DashIcon
                            name={copySuccessId === img.id ? "check" : "copy"}
                            size={15}
                          />
                        </button>
                        {canDelete && (
                          <button
                            title={translateFunction("Delete")}
                            onClick={() => setDeleteTarget(img)}
                            disabled={deletingId === img.id}
                            className="w-8 h-8 bg-[#f85555] text-white rounded-full flex items-center justify-center hover:bg-[#e84444] disabled:opacity-50 transition-colors active:scale-[0.95]"
                          >
                            {deletingId === img.id ? (
                              <Spinner />
                            ) : (
                              <DashIcon name="trash" size={14} />
                            )}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  <p className="text-[11px] text-[#8e8e8e] px-2 py-1 truncate">
                    {getImageName(img)}
                  </p>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Pagination */}
      {meta && meta.last_page > 1 && (
        <Pagination
          current={meta.current_page || page}
          last={meta.last_page}
          disabled={loading}
          onPrev={() => fetchImages(page - 1)}
          onNext={() => fetchImages(page + 1)}
        />
      )}

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div
            className="bg-white rounded-[20px] p-5 lg:p-6 max-w-2xl w-full max-h-[80vh] flex flex-col"
            style={{ boxShadow: "0 12px 40px rgba(0,0,0,0.18)" }}
          >
            <h2 className="text-[16px] bold text-[#3c3c3c] mb-1">
              {translateFunction("Confirm Upload")}
            </h2>
            <p className="text-[14px] text-[#8e8e8e] mb-4">
              {selectedFiles.length} {translateFunction("files selected")}
            </p>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 overflow-y-auto flex-1 mb-4">
              {selectedFiles.map((file, i) => (
                <div key={i} className="rounded-[12px] overflow-hidden bg-[#f8f8f8] border border-[#ededed] relative">
                  <button
                    type="button"
                    aria-label={translateFunction("Cancel")}
                    className="absolute bg-[#f85555] w-[24px] h-[24px] flex items-center justify-center top-1 right-1 cursor-pointer text-white rounded-full hover:bg-[#e84444] z-10"
                    onClick={() => {
                      const newFiles = [...selectedFiles];
                      newFiles.splice(i, 1);
                      setSelectedFiles(newFiles);
                      if (newFiles.length === 0) setShowConfirm(false);
                    }}
                  >
                    <DashIcon name="close" size={13} strokeWidth={2} />
                  </button>
                  <img
                    src={previewUrls[i]}
                    alt={file.name}
                    className="w-full aspect-square object-cover"
                  />
                  <p className="text-[10px] text-[#8e8e8e] px-1 py-1 truncate">{file.name}</p>
                </div>
              ))}
            </div>
            {uploadError && (
              <p className="text-[#f85555] text-[13px] mb-3 flex items-center gap-1.5">
                <DashIcon name="alert" size={15} />
                {uploadError}
              </p>
            )}
            <div className="flex gap-3 justify-end">
              <DashButton
                variant="ghost"
                onClick={handleCancelConfirm}
                disabled={uploading}
              >
                {translateFunction("Cancel")}
              </DashButton>
              <DashButton
                icon="upload"
                onClick={handleSubmitUpload}
                loading={uploading}
              >
                {uploading
                  ? translateFunction("Uploading...")
                  : translateFunction("Upload")}
              </DashButton>
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
            className="bg-white rounded-[20px] p-5 lg:p-6 max-w-sm w-full"
            style={{ boxShadow: "0 12px 40px rgba(0,0,0,0.18)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-14 h-14 mx-auto mb-4 bg-[#fff1f1] text-[#f85555] rounded-full flex items-center justify-center">
              <DashIcon name="trash" size={24} />
            </div>
            <h2 className="text-[16px] bold text-[#3c3c3c] text-center mb-1">
              {translateFunction("Delete Image")}
            </h2>
            <p className="text-[14px] text-[#8e8e8e] text-center mb-5">
              {translateFunction("Are you sure you want to delete this image? This action cannot be undone.")}
            </p>
            <div className="w-24 h-24 mx-auto mb-5 rounded-[12px] overflow-hidden bg-[#f8f8f8] border border-[#ededed]">
              <img
                src={getImageUrl(deleteTarget)}
                alt={getImageName(deleteTarget)}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex gap-3">
              <DashButton
                variant="ghost"
                fullWidth
                onClick={() => setDeleteTarget(null)}
                disabled={deletingId !== null}
              >
                {translateFunction("Cancel")}
              </DashButton>
              <button
                onClick={handleDelete}
                disabled={deletingId !== null}
                className="flex-1 h-[44px] rounded-[12px] min-w-[100px] bg-[#f85555] text-white medium text-[14px] hover:bg-[#e84444] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deletingId !== null && <Spinner />}
                <DashIcon name="trash" size={16} />
                {translateFunction("Delete")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Modal */}
      {showBulkDelete && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
          onClick={() => !bulkDeleting && setShowBulkDelete(false)}
        >
          <div
            className="bg-white rounded-[20px] p-5 lg:p-6 max-w-md w-full"
            style={{ boxShadow: "0 12px 40px rgba(0,0,0,0.18)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-14 h-14 mx-auto mb-4 bg-[#fff1f1] text-[#f85555] rounded-full flex items-center justify-center">
              <DashIcon name="trash" size={24} />
            </div>
            <h2 className="text-[16px] bold text-[#3c3c3c] text-center mb-1">
              {translateFunction("Delete")} {selectedIds.size}{" "}
              {translateFunction("images")}
            </h2>
            <p className="text-[14px] text-[#8e8e8e] text-center mb-5">
              {translateFunction(
                "Are you sure you want to delete the selected images? This action cannot be undone.",
              )}
            </p>
            {/* Thumbnails of the selection (capped) */}
            <div className="flex flex-wrap gap-2 justify-center mb-5 max-h-[160px] overflow-y-auto">
              {images
                .filter((img) => selectedIds.has(String(img.id)))
                .slice(0, 12)
                .map((img) => (
                  <div
                    key={img.id}
                    className="w-14 h-14 rounded-[10px] overflow-hidden bg-[#f8f8f8] border border-[#ededed]"
                  >
                    <img
                      src={getImageUrl(img)}
                      alt={getImageName(img)}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              {selectedIds.size > 12 && (
                <div className="w-14 h-14 rounded-[10px] bg-[#f4f4f4] border border-[#ededed] flex items-center justify-center text-[12px] semibold text-[#8e8e8e]">
                  +{selectedIds.size - 12}
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <DashButton
                variant="ghost"
                fullWidth
                onClick={() => setShowBulkDelete(false)}
                disabled={bulkDeleting}
              >
                {translateFunction("Cancel")}
              </DashButton>
              <button
                onClick={handleBulkDelete}
                disabled={bulkDeleting}
                className="flex-1 h-[44px] rounded-[12px] min-w-[100px] bg-[#f85555] text-white medium text-[14px] hover:bg-[#e84444] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {bulkDeleting && <Spinner />}
                <DashIcon name="trash" size={16} />
                {translateFunction("Delete")} ({selectedIds.size})
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
            aria-label={translateFunction("Close")}
            className="absolute top-4 right-4 text-white hover:opacity-70"
            onClick={() => setLightboxUrl(null)}
          >
            <DashIcon name="close" size={32} />
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
