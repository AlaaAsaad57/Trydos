"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Spinner from "components/global/Spinner";
import SellerDashboardService from "services/sellerDashboard";
import { translateFunction, LogError } from "utils/functions";
import { pollinateInput } from "@/utils/tinyUtils";
import {
  showErrorNotification,
  showSuccessNotification,
} from "store/notifications/reducer";
import { ImageCropWidget } from "components/global/ImageCropWidget";
import { DashIcon } from "components/SellerDashboard/ui/icons";
import {
  DashButton,
  EmptyState,
  ErrorState,
  LoadingState,
  dashInputClass,
} from "components/SellerDashboard/ui";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SellerStory {
  id: string | number;
  full_video_path?: string | null;
  link?: string | null;
  user_id?: number;
  created_at?: string;
  is_photo?: 0 | 1;
  is_video?: 0 | 1;
  video_duration_in_second?: number | null;
  video_duration_in_seconds?: number | null;
  photo_path?: string | null;
  product_id?: number | null;
  product_slug?: string | null;
  viewers_count?: number;
}

// The stories server (like users_stories) doesn't always carry an explicit
// `is_video` flag — infer it from the presence of a video path.
const isVideoStory = (story: SellerStory): boolean =>
  story.is_video === 1 || (!story.is_video && !!story.full_video_path);

interface PaginationMeta {
  current_page: number;
  last_page: number;
  total: number;
}

interface LinkedProduct {
  id: number;
  name: string;
  slug: string;
  image?: string;
}

// ─── Constants & helpers ──────────────────────────────────────────────────────

const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const MAX_VIDEO_DURATION_SECONDS = 60;

const validateLink = (url: string): { valid: boolean; error: string } => {
  if (!url) return { valid: true, error: "" };
  try {
    const normalized =
      url.startsWith("http://") || url.startsWith("https://")
        ? url
        : `https://${url}`;
    if (normalized.split(".").length < 2) throw new Error();
    new URL(normalized);
    return { valid: true, error: "" };
  } catch {
    return {
      valid: false,
      error: translateFunction(
        "Please enter a valid URL (e.g., example.com or www.example.com)",
      ),
    };
  }
};

const normalizeLink = (url: string) =>
  url && !url.startsWith("http://") && !url.startsWith("https://")
    ? `https://${url}`
    : url || null;

// ─── StoryViewerModal ─────────────────────────────────────────────────────────

function StoryViewerModal({
  story,
  onClose,
}: {
  story: SellerStory;
  onClose: () => void;
}) {
  const isVideo = isVideoStory(story);
  const mediaUrl = isVideo ? story.full_video_path : story.photo_path;

  return createPortal(
    <div
      className="fixed inset-0 z-999999999 bg-black/90 flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="relative max-w-140 w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          aria-label={translateFunction("Close")}
          className="absolute -top-12 right-0 w-9 h-9 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors active:scale-[0.95]"
        >
          <DashIcon name="close" size={20} />
        </button>

        {/* Media */}
        {isVideo && mediaUrl ? (
          <video
            src={mediaUrl}
            controls
            autoPlay
            className="w-full h-auto rounded-[15px]"
          />
        ) : mediaUrl ? (
          <img
            src={mediaUrl}
            alt="Story"
            className="w-full h-auto rounded-[15px] object-contain"
          />
        ) : (
          <div className="w-full h-100 bg-white/[0.06] rounded-[15px] flex items-center justify-center text-white/40">
            <DashIcon name="gallery" size={56} strokeWidth={1.2} />
          </div>
        )}

        {/* Meta */}
        <div className="mt-4 text-white text-[13px] space-y-2 px-1">
          {story.link && (
            <a
              href={story.link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 break-all opacity-80 hover:opacity-100 transition-opacity"
              onClick={(e) => e.stopPropagation()}
            >
              <DashIcon name="link" size={14} />
              <span className="underline">{story.link}</span>
            </a>
          )}
          {story.product_slug && (
            <p className="flex items-center gap-1.5 text-white/75">
              <DashIcon name="products" size={14} />
              {translateFunction("Linked to product")}: {story.product_slug}
            </p>
          )}
          <p className="flex items-center gap-3 text-white/50 text-[11px]">
            <span className="inline-flex items-center gap-1">
              <DashIcon name="eye" size={13} /> {story.viewers_count ?? 0}{" "}
              {translateFunction("viewers")}
            </span>
            <span>{story.created_at?.slice(0, 10)}</span>
          </p>
        </div>
      </div>
    </div>,
    document.body,
  );
}

// ─── DeleteConfirmModal ───────────────────────────────────────────────────────

function DeleteConfirmModal({
  onConfirm,
  onCancel,
  loading,
}: {
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  return createPortal(
    <div className="fixed inset-0 z-999999999 bg-black/45 flex items-center justify-center p-4">
      <div
        className="bg-white rounded-[20px] p-6 max-w-sm w-full text-center"
        style={{ boxShadow: "0 12px 40px rgba(0,0,0,0.18)" }}
      >
        <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-[#fff1f1] text-[#f85555] flex items-center justify-center">
          <DashIcon name="trash" size={24} />
        </div>
        <h3 className="text-[17px] bold text-[#1d1d1d] mb-1.5">
          {translateFunction("Delete Story")}
        </h3>
        <p className="text-[14px] text-[#8e8e8e] mb-5">
          {translateFunction(
            "Are you sure you want to delete this story? This action cannot be undone.",
          )}
        </p>
        <div className="flex gap-3">
          <DashButton
            variant="ghost"
            fullWidth
            onClick={onCancel}
            disabled={loading}
          >
            {translateFunction("Cancel")}
          </DashButton>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 h-[44px]  min-w-[125px] rounded-[12px] bg-[#f85555] text-white medium text-[14px] hover:bg-[#e84444] disabled:opacity-50 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          >
            {loading && <Spinner />}
            <DashIcon name="trash" size={16} />
            {translateFunction("Delete")}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

// ─── ProductPickerModal ────────────────────────────────────────────────────────

function ProductPickerModal({
  sellerId,
  onSelect,
  onClose,
}: {
  sellerId: string;
  onSelect: (product: LinkedProduct) => void;
  onClose: () => void;
}) {
  const [products, setProducts] = useState<any[]>([]);
  const [meta, setMeta] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchProducts = useCallback(
    async (p: number) => {
      try {
        if (p === 1) setLoading(true);
        else setLoadingMore(true);
        const res = await SellerDashboardService.getSellerProducts(sellerId, p);
        if (!res?.success) {
          throw new Error(res?.message || "Failed to load products");
        }
        const data = res.data?.products || res.data || [];
        if (p > 1) {
          setProducts((prev) => [...prev, ...(Array.isArray(data) ? data : [])]);
        } else {
          setProducts(Array.isArray(data) ? data : []);
        }
        setMeta(res.data?.meta || null);
        setPage(p);
      } catch (error) {
        // list will show empty state — still log the failure
        LogError({
          scenario: "StoriesTab.fetchProducts",
          error: error instanceof Error ? error.message : String(error),
        });
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [sellerId],
  );

  useEffect(() => {
    fetchProducts(1);
  }, [fetchProducts]);

  return createPortal(
    <div
      className="fixed inset-0 z-999999999 bg-black/50 flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-[20px] max-w-lg w-full mx-4 max-h-[80vh] flex flex-col"
        style={{ boxShadow: "0 12px 40px rgba(0,0,0,0.18)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-2 p-5 lg:p-6 border-b border-[#ededed] w-full">
          <h3 className="text-[16px] bold text-[#3c3c3c] flex items-center gap-2">
            <span className="text-[#5d5d5d]">
              <DashIcon name="products" size={19} />
            </span>
            {translateFunction("Select Product")}
          </h3>
          <button
            onClick={onClose}
            aria-label={translateFunction("Close")}
            className="text-[#8e8e8e] hover:text-[#3c3c3c] transition-colors p-1"
          >
            <DashIcon name="close" size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 lg:p-6">
          {loading ? (
            <LoadingState label={translateFunction("Loading products...")} />
          ) : products.length === 0 ? (
            <EmptyState
              icon="products"
              title={translateFunction("No products found")}
            />
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {products.map((product: any) => {
                  const imgSrc =
                    typeof product.images?.[0] === "string"
                      ? product.images[0]
                      : product.images?.[0]?.file_path;
                  return (
                    <button
                      key={product.product_id || product.id}
                      onClick={() =>
                        onSelect({
                          id: product.product_id || product.id,
                          name: product.name || "Product",
                          slug: product.slug || "",
                          image: imgSrc,
                        })
                      }
                      className="group flex flex-col bg-[#f8f8f8] border border-[#ededed] rounded-[12px] overflow-hidden hover:border-[#5d5d5d]/40 hover:shadow-[0_3px_10px_rgba(0,0,0,0.08)] transition-all active:scale-[0.98] text-left"
                    >
                      <div className="w-full aspect-square bg-[#e6e6e6]">
                        {imgSrc ? (
                          <img
                            src={imgSrc}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[#c4c2c2]">
                            <DashIcon name="products" size={26} />
                          </div>
                        )}
                      </div>
                      <p className="text-[12px] medium text-[#3c3c3c] p-2 line-clamp-2">
                        {product.name || translateFunction("Unnamed Product")}
                      </p>
                    </button>
                  );
                })}
              </div>

              {meta && meta.current_page < meta.last_page && (
                <div className="flex justify-center mt-5">
                  <DashButton
                    variant="secondary"
                    size="sm"
                    onClick={() => fetchProducts(page + 1)}
                    loading={loadingMore}
                  >
                    {translateFunction("Load more")}
                  </DashButton>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}

// ─── UploadStoryModal ─────────────────────────────────────────────────────────

function UploadStoryModal({
  sellerId,
  userId,
  onUploaded,
  onClose,
}: {
  sellerId: string;
  userId: number | string;
  onUploaded: () => void;
  onClose: () => void;
}) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [imageToEdit, setImageToEdit] = useState<File | null>(null);
  const [showImageEditor, setShowImageEditor] = useState(false);
  const [link, setLink] = useState("");
  const [linkError, setLinkError] = useState("");
  const [linkedProduct, setLinkedProduct] = useState<LinkedProduct | null>(null);
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type === "image/svg+xml") {
      showErrorNotification(translateFunction("SVG Images Not Allowed"));
      e.target.value = "";
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      showErrorNotification(
        translateFunction(`File size should not exceed ${MAX_FILE_SIZE_MB} MB`),
      );
      e.target.value = "";
      return;
    }

    if (file.type.startsWith("image/")) {
      setImageToEdit(file);
      setShowImageEditor(true);
      return;
    }

    if (file.type.startsWith("video/")) {
      const video = document.createElement("video");
      const objectUrl = URL.createObjectURL(file);
      video.src = objectUrl;
      video.onloadedmetadata = () => {
        URL.revokeObjectURL(objectUrl);
        if (video.duration > MAX_VIDEO_DURATION_SECONDS) {
          showErrorNotification(translateFunction("1 minutes video only"));
          if (fileInputRef.current) fileInputRef.current.value = "";
          return;
        }
        setSelectedFile(file);
        const reader = new FileReader();
        reader.onloadend = () => setPreview(reader.result as string);
        reader.readAsDataURL(file);
      };
    }
  };

  const handleEditedImage = (edited: File) => {
    setSelectedFile(edited);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
      setShowImageEditor(false);
      setImageToEdit(null);
    };
    reader.readAsDataURL(edited);
  };

  const clearPreview = () => {
    setPreview(null);
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleLinkChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const sanitized = pollinateInput(e.target.value);
    setLink(sanitized);
    setLinkError(validateLink(sanitized).error);
  };

  const handleShareStory = async () => {
    if (!selectedFile) return;
    const { valid, error } = validateLink(link);
    if (!valid) {
      setLinkError(error);
      return;
    }
    try {
      setUploading(true);
      const { url, durationSeconds } =
        await SellerDashboardService.uploadStoryToMediaServer(selectedFile);
      const filePath = process.env.NEXT_PUBLIC_MEDIA_SERVER_BASE_URL + url;
      const isVideo = selectedFile.type.startsWith("video/");
      const saveRes = await SellerDashboardService.saveSellerStory(
        sellerId,
        userId,
        {
          file_path: filePath,
          is_video: isVideo ? 1 : 0,
          link: normalizeLink(link),
          product_id: linkedProduct?.id ?? null,
          product_slug: linkedProduct?.slug ?? null,
          video_duration_in_seconds: durationSeconds ?? null,
        },
      );
      if (!saveRes?.success) {
        throw new Error(saveRes?.message || "Failed to save seller story");
      }
      showSuccessNotification(translateFunction("Story uploaded successfully"));
      onUploaded();
      onClose();
    } catch (error) {
      LogError({ error, scenario: "Upload Seller Story" });
      showErrorNotification(translateFunction("Upload Failed Try Again"));
    } finally {
      setUploading(false);
    }
  };

  return createPortal(
    <>
      {showImageEditor && imageToEdit && (
        <ImageCropWidget
          image={imageToEdit}
          onSave={handleEditedImage}
          onClose={() => {
            setShowImageEditor(false);
            setImageToEdit(null);
            if (fileInputRef.current) fileInputRef.current.value = "";
          }}
        />
      )}

      {showProductPicker && (
        <ProductPickerModal
          sellerId={sellerId}
          onSelect={(p) => {
            setLinkedProduct(p);
            setShowProductPicker(false);
          }}
          onClose={() => setShowProductPicker(false)}
        />
      )}

      <div className="fixed inset-0 z-999999999 flex items-center justify-center p-4 bg-black/45">
        <div
          className={`relative w-full max-[400px] max-h-[92vh] flex flex-col bg-white rounded-[20px] overflow-hidden text-[#3c3c3c] ${
            uploading ? "pointer-events-none" : ""
          }`}
          style={{ boxShadow: "0 12px 40px rgba(0,0,0,0.18)" }}
        >
          {/* Header */}
          <div className="flex justify-between items-center gap-2 p-5 lg:p-6 border-b border-[#ededed] w-full">
            <h3 className="text-[16px] bold text-[#3c3c3c] flex items-center gap-2">
              <span className="text-[#5d5d5d]">
                <DashIcon name="stories" size={19} />
              </span>
              {translateFunction("Add Story")}
            </h3>
            <button
              onClick={onClose}
              aria-label={translateFunction("Close")}
              className="text-[#8e8e8e] hover:text-[#3c3c3c] transition-colors p-1"
            >
              <DashIcon name="close" size={20} />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 w-full overflow-y-auto p-5 lg:p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 lg:gap-6">
              {/* Preview pane — 9:16 story frame */}
              <div className="flex flex-col">
                <p className="text-[13px] medium text-[#505050] mb-2">
                  {translateFunction("Preview")}
                </p>
                {preview ? (
                  <div className="relative w-full aspect-9/16 max-h-[360px] mx-auto rounded-[15px] overflow-hidden bg-black border border-[#ededed]">
                    {selectedFile?.type.startsWith("video/") ? (
                      <video
                        src={preview}
                        className="w-full h-full object-contain"
                        controls={false}
                        autoPlay
                        muted
                        loop
                      />
                    ) : (
                      <Image
                        src={preview}
                        alt="Preview"
                        fill
                        className="object-contain"
                      />
                    )}
                    <button
                      onClick={clearPreview}
                      aria-label={translateFunction("Remove")}
                      className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center bg-black/55 text-white rounded-full hover:bg-black/75 transition-colors active:scale-[0.95]"
                    >
                      <DashIcon name="close" size={16} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full aspect-9/16 max-h-[360px] mx-auto rounded-[15px] border-2 border-dashed border-[#dcdcdc] bg-[#fafafa] hover:border-[#5d5d5d]/50 hover:bg-[#f8f8f8] transition-colors flex flex-col items-center justify-center gap-2 text-[#c4c2c2]"
                  >
                    <span className="w-14 h-14 rounded-full bg-[#5d5d5d]/[0.08] text-[#5d5d5d] flex items-center justify-center">
                      <DashIcon name="upload" size={26} strokeWidth={1.5} />
                    </span>
                    <span className="text-[13px] medium text-[#3c3c3c]">
                      {translateFunction("No media selected")}
                    </span>
                    <span className="text-[12px] text-[#8e8e8e]">
                      {translateFunction("Photo or video, up to")} {MAX_FILE_SIZE_MB}{translateFunction("MB")}
                    </span>
                  </button>
                )}
              </div>

              {/* Options pane */}
              <div className="flex flex-col gap-5">
                {/* File picker */}
                <DashButton
                  variant="secondary"
                  fullWidth
                  icon={preview ? "edit" : "upload"}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {preview
                    ? translateFunction("Change media")
                    : translateFunction("Upload Photo/Video")}
                </DashButton>

                {/* Link input */}
                <div className="w-full">
                  <label className="block text-[13px] medium text-[#505050] mb-1.5">
                    {translateFunction("Link")}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8e8e8e] pointer-events-none">
                      <DashIcon name="link" size={16} />
                    </span>
                    <input
                      type="url"
                      value={link}
                      onChange={handleLinkChange}
                      onBlur={() => {
                        const sanitized = pollinateInput(link);
                        if (link !== sanitized) setLink(sanitized);
                      }}
                      placeholder={translateFunction("Add link...")}
                      className={`${dashInputClass} pl-10 ${
                        linkError
                          ? "border-[#f85555] focus:border-[#f85555]"
                          : ""
                      }`}
                    />
                  </div>
                  {linkError && (
                    <p className="text-[12px] text-[#f85555] mt-1 flex items-center gap-1">
                      <DashIcon name="alert" size={13} />
                      {linkError}
                    </p>
                  )}
                </div>

                {/* Product picker */}
                <div className="w-full">
                  <label className="block text-[13px] medium text-[#505050] mb-1.5">
                    {translateFunction("Linked product")}
                  </label>
                  {linkedProduct ? (
                    <div className="flex items-center gap-3 bg-[#388CFF]/[0.06] border border-[#388CFF]/20 rounded-[12px] p-2.5">
                      {linkedProduct.image ? (
                        <img
                          src={linkedProduct.image}
                          alt={linkedProduct.name}
                          className="w-11 h-11 rounded-[10px] object-cover shrink-0"
                        />
                      ) : (
                        <span className="w-11 h-11 rounded-[10px] bg-[#388CFF]/10 text-[#388CFF] flex items-center justify-center shrink-0">
                          <DashIcon name="products" size={20} />
                        </span>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] medium text-[#3c3c3c] truncate">
                          {linkedProduct.name}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <button
                            onClick={() => setShowProductPicker(true)}
                            className="text-[12px] medium text-[#388CFF] hover:opacity-80"
                          >
                            {translateFunction("Change")}
                          </button>
                          <span className="text-[#dcdcdc]">·</span>
                          <button
                            onClick={() => setLinkedProduct(null)}
                            className="text-[12px] medium text-[#f85555] hover:opacity-80"
                          >
                            {translateFunction("Remove")}
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowProductPicker(true)}
                      className="w-full flex items-center gap-2.5 px-4 h-[48px] rounded-[12px] bg-[#f8f8f8] border border-[#ededed] text-[#505050] hover:bg-white hover:border-[#5d5d5d]/40 transition-colors active:scale-[0.99]"
                    >
                      <span className="text-[#5d5d5d]">
                        <DashIcon name="products" size={17} />
                      </span>
                      <span className="text-[14px]">
                        {translateFunction("Link to Product")}
                      </span>
                      <span className="ml-auto text-[#c4c2c2]">
                        <DashIcon name="plus" size={16} />
                      </span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-5 w-full lg:p-6 border-t border-[#ededed] bg-[#fafafa] flex items-center justify-end gap-3">
            <DashButton type="button" variant="ghost" onClick={onClose}>
              {translateFunction("Cancel")}
            </DashButton>
            <DashButton
              icon="check"
              onClick={handleShareStory}
              loading={uploading}
              disabled={!preview || !!linkError}
            >
              {translateFunction("Share Story")}
            </DashButton>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.gif,.mp4,.mov,.3gp,.avi"
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>
      </div>
    </>,
    document.body,
  );
}

// ─── StoryCard ────────────────────────────────────────────────────────────────

function StoryCard({
  story,
  onView,
  onDelete,
  canDelete,
}: {
  story: SellerStory;
  onView: () => void;
  onDelete: () => void;
  canDelete: boolean;
}) {
  const isVideo = isVideoStory(story);
  const thumb = isVideo ? story.full_video_path : story.photo_path;

  const hasFooter = !!story.link || !!story.product_slug || canDelete;

  return (
    <div className="group bg-white rounded-[16px] border border-[#ededed] overflow-hidden hover:border-transparent hover:shadow-[0_10px_28px_rgba(0,0,0,0.10)] hover:-translate-y-1 transition-all duration-300 flex flex-col">
      {/* Thumbnail (clickable → viewer) */}
      <button
        onClick={onView}
        className="relative w-full aspect-9/16 bg-[#f0f0f0] block shrink-0 overflow-hidden"
      >
        {thumb ? (
          isVideo ? (
            <video
              src={thumb}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"
              muted
              preload="metadata"
            />
          ) : (
            <img
              src={thumb}
              alt="Story thumbnail"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"
            />
          )
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[#c4c2c2]">
            <DashIcon name={isVideo ? "video" : "gallery"} size={32} strokeWidth={1.4} />
          </div>
        )}

        {/* Scrims for badge legibility */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/55 pointer-events-none" />

        {/* Type badge */}
        <span className="absolute top-2 left-2 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-black/40 backdrop-blur-md text-white text-[10px] medium">
          <DashIcon name={isVideo ? "video" : "gallery"} size={12} />
          {isVideo ? translateFunction("Video") : translateFunction("Photo")}
        </span>

        {/* Views analytics chip */}
        <span className="absolute top-2 right-2 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-black/40 backdrop-blur-md text-white text-[10px] semibold">
          <DashIcon name="eye" size={12} />
          {story.viewers_count ?? 0}
        </span>

        {/* Play affordance for video */}
        {isVideo && thumb && (
          <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="w-12 h-12 rounded-full bg-white/15 backdrop-blur-[2px] border border-white/30 text-white flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
              <DashIcon name="play" size={18} />
            </span>
          </span>
        )}

        {/* Date */}
        {story.created_at && (
          <span className="absolute bottom-2 left-2.5 text-[11px] medium text-white/90 drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
            {story.created_at.slice(0, 10)}
          </span>
        )}
      </button>

      {/* Info */}
      {hasFooter && (
        <div className="p-2.5 space-y-1.5 flex flex-col flex-1">
          {story.link && (
            <p className="inline-flex items-center gap-1 text-[11px] text-[#388CFF] min-w-0">
              <DashIcon name="link" size={12} />
              <span className="truncate">{story.link}</span>
            </p>
          )}

          {story.product_slug && (
            <p className="inline-flex items-center gap-1 text-[11px] text-[#2ea84f] min-w-0">
              <DashIcon name="products" size={12} />
              <span className="truncate">{story.product_slug}</span>
            </p>
          )}

          {canDelete && (
            <button
              onClick={onDelete}
              className="mt-auto w-[100px] py-1.5 text-[12px] min-w-[100px] medium text-[#f85555] hover:bg-[#fff1f1] rounded-[10px] border border-[#ffd9d9] transition-all active:scale-[0.98] flex items-center justify-center gap-1.5"
            >
              <DashIcon name="trash" size={14} />
              {translateFunction("Delete")}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── StoriesTab (main) ────────────────────────────────────────────────────────

export default function StoriesTab({
  sellerId,
  userId,
  canCreate = false,
  canDelete = false,
}: {
  sellerId: string;
  userId: number | string;
  canCreate?: boolean;
  canDelete?: boolean;
}) {
  const [stories, setStories] = useState<SellerStory[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [viewingStory, setViewingStory] = useState<SellerStory | null>(null);
  const [deletingStory, setDeletingStory] = useState<SellerStory | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);

  const fetchStories = useCallback(
    async (p: number) => {
      try {
        setLoading(true);
        setError(null);
        const res = await SellerDashboardService.getSellerStories(
          sellerId,
          userId,
          p,
        );
        if (!res?.success) {
          throw new Error(res?.message || "Failed to load stories");
        }
        // The stories server mirrors users_stories: the list lives under
        // `data.data` (or `data.stories`). It may come back flat or grouped
        // (each group carrying a nested `stories` array) — flatten defensively.
        const payload = res.data ?? {};
        const raw = payload.data ?? payload.stories ?? payload ?? [];
        const list: any[] = Array.isArray(raw) ? raw : [];
        const flat: SellerStory[] = list.some((it) =>
          Array.isArray(it?.stories),
        )
          ? list.flatMap((g) => (Array.isArray(g.stories) ? g.stories : []))
          : list;
        setStories(flat);
        // Pagination: prefer `meta`, fall back to a `next_page_url` flag.
        const metaObj = payload.meta ?? null;
        setMeta(metaObj);
        setHasMore(
          metaObj
            ? metaObj.current_page < metaObj.last_page
            : Boolean(payload.next_page_url),
        );
        setPage(p);
      } catch (e: any) {
        LogError({
          scenario: "StoriesTab.fetchStories",
          error: e instanceof Error ? e.message : String(e),
        });
        setError(
          e?.message ?? translateFunction("Failed to load stories"),
        );
      } finally {
        setLoading(false);
      }
    },
    [sellerId, userId],
  );

  useEffect(() => {
    fetchStories(1);
  }, [fetchStories]);

  const handleDelete = async () => {
    if (!deletingStory) return;
    try {
      setDeleteLoading(true);
      const res = await SellerDashboardService.deleteSellerStory(
        deletingStory.id,
        sellerId,
        userId,
      );
      if (!res?.success) {
        throw new Error(res?.message || "Failed to delete story");
      }
      setStories((prev) =>
        prev.filter((s) => s.id !== deletingStory.id),
      );
      setDeletingStory(null);
    } catch (e: any) {
      LogError({
        scenario: "StoriesTab.handleDelete",
        error: e instanceof Error ? e.message : String(e),
      });
      showErrorNotification(
        e?.message ?? translateFunction("Failed to delete story"),
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="text-[#5d5d5d] shrink-0">
            <DashIcon name="stories" size={20} />
          </span>
          <h2 className="text-[16px] semibold text-[#3c3c3c] truncate">
            {translateFunction("Stories")}
          </h2>
          {meta && (
            <span className="shrink-0 min-w-[22px] h-[22px] px-1.5 flex items-center justify-center rounded-full bg-[#5d5d5d]/10 text-[#5d5d5d] text-[11px] semibold">
              {meta.total}
            </span>
          )}
        </div>
        {canCreate && (
          <DashButton icon="plus" onClick={() => setShowUploadModal(true)}>
            {translateFunction("Add Story")}
          </DashButton>
        )}
      </div>

      {/* Error state */}
      {error && !loading && (
        <ErrorState message={error} onRetry={() => fetchStories(page)} />
      )}

      {/* Loading state */}
      {loading && stories.length === 0 && (
        <LoadingState label={translateFunction("Loading stories...")} />
      )}

      {/* Empty state */}
      {!loading && !error && stories.length === 0 && (
        <EmptyState
          icon="stories"
          title={translateFunction("No stories yet")}
          subtitle={translateFunction(
            "Upload your first story to get started",
          )}
        />
      )}

      {/* Stories grid */}
      {stories.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {stories.map((story) => (
            <StoryCard
              key={story.id}
              story={story}
              onView={() => setViewingStory(story)}
              onDelete={() => setDeletingStory(story)}
              canDelete={canDelete}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {(page > 1 || hasMore) && (
        <div className="flex items-center justify-center gap-3 mt-6">
          <DashButton
            variant="secondary"
            size="sm"
            icon="chevronLeft"
            onClick={() => fetchStories(page - 1)}
            disabled={page === 1 || loading}
          >
            {translateFunction("Previous")}
          </DashButton>
          <span className="text-[13px] text-[#8e8e8e]">
            {translateFunction("Page")} {meta?.current_page ?? page}
            {meta?.last_page
              ? ` ${translateFunction("of")} ${meta.last_page}`
              : ""}
          </span>
          <DashButton
            variant="secondary"
            size="sm"
            iconRight="chevronRight"
            onClick={() => fetchStories(page + 1)}
            disabled={!hasMore || loading}
          >
            {translateFunction("Next")}
          </DashButton>
        </div>
      )}

      {/* Portals */}
      {viewingStory && (
        <StoryViewerModal
          story={viewingStory}
          onClose={() => setViewingStory(null)}
        />
      )}

      {deletingStory && (
        <DeleteConfirmModal
          onConfirm={handleDelete}
          onCancel={() => setDeletingStory(null)}
          loading={deleteLoading}
        />
      )}

      {showUploadModal && (
        <UploadStoryModal
          sellerId={sellerId}
          userId={userId}
          onUploaded={() => fetchStories(1)}
          onClose={() => setShowUploadModal(false)}
        />
      )}
    </div>
  );
}
