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

// ─── Icons ────────────────────────────────────────────────────────────────────

const CloseIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z" fill="currentColor" />
  </svg>
);

const FileIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2ZM18 20H6V4H13V9H18V20Z" fill="currentColor" />
  </svg>
);

const LinkIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3.9 12C3.9 10.29 5.29 8.9 7 8.9H11V7H7C4.24 7 2 9.24 2 12C2 14.76 4.24 17 7 17H11V15.1H7C5.29 15.1 3.9 13.71 3.9 12ZM8 13H16V11H8V13ZM17 7H13V8.9H17C18.71 8.9 20.1 10.29 20.1 12C20.1 13.71 18.71 15.1 17 15.1H13V17H17C19.76 17 22 14.76 22 12C22 9.24 19.76 7 17 7Z" fill="currentColor" />
  </svg>
);

const PlaceholderIcon = () => (
  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM19 19H5V5H19V19ZM15 15V13H13V15H11V13H9V11H11V9H13V11H15V9H17V11H19V13H17V15H15Z" fill="currentColor" />
  </svg>
);

const ProductIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20.54 5.23L19.15 3.55C18.88 3.21 18.47 3 18 3H6C5.53 3 5.12 3.21 4.84 3.55L3.46 5.23C3.17 5.57 3 6.02 3 6.5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V6.5C21 6.02 20.83 5.57 20.54 5.23ZM12 17.5L6.5 12H10V10H14V12H17.5L12 17.5ZM5.12 5L5.93 4H17.93L18.87 5H5.12Z" fill="currentColor" />
  </svg>
);

const VideoIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M17 10.5V7C17 6.45 16.55 6 16 6H4C3.45 6 3 6.45 3 7V17C3 17.55 3.45 18 4 18H16C16.55 18 17 17.55 17 17V13.5L21 17.5V6.5L17 10.5Z" fill="currentColor" />
  </svg>
);

const PhotoIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 15.2C13.7673 15.2 15.2 13.7673 15.2 12C15.2 10.2327 13.7673 8.8 12 8.8C10.2327 8.8 8.8 10.2327 8.8 12C8.8 13.7673 10.2327 15.2 12 15.2Z" fill="currentColor" />
    <path d="M9 2L7.17 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4H16.83L15 2H9ZM12 17C9.24 17 7 14.76 7 12C7 9.24 9.24 7 12 7C14.76 7 17 9.24 17 12C17 14.76 14.76 17 12 17Z" fill="currentColor" />
  </svg>
);

const EyeIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 4.5C7 4.5 2.73 7.61 1 12C2.73 16.39 7 19.5 12 19.5C17 19.5 21.27 16.39 23 12C21.27 7.61 17 4.5 12 4.5ZM12 17C9.24 17 7 14.76 7 12C7 9.24 9.24 7 12 7C14.76 7 17 9.24 17 12C17 14.76 14.76 17 12 17ZM12 9C10.34 9 9 10.34 9 12C9 13.66 10.34 15 12 15C13.66 15 15 13.66 15 12C15 10.34 13.66 9 12 9Z" fill="currentColor" />
  </svg>
);

const StoriesEmptyIcon = () => (
  <svg width="72" height="72" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M21 3H3C1.9 3 1 3.9 1 5V19C1 20.1 1.9 21 3 21H21C22.1 21 23 20.1 23 19V5C23 3.9 22.1 3 21 3ZM21 19H3V5H21V19ZM8 15H16V17H8V15ZM8 11H16V13H8V11ZM8 7H16V9H8V7Z" fill="currentColor" />
  </svg>
);

// ─── Types ────────────────────────────────────────────────────────────────────

interface SellerStory {
  id: string;
  full_video_path: string | null;
  link: string | null;
  user_id: number;
  created_at: string;
  is_photo: 0 | 1;
  is_video: 0 | 1;
  video_duration_in_second: number | null;
  photo_path: string | null;
  product_id: number | null;
  product_slug: string | null;
  viewers_count: number;
}

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
  const mediaUrl = story.is_video ? story.full_video_path : story.photo_path;

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
          className="absolute -top-10 right-0 text-white text-4xl leading-none hover:opacity-70"
        >
          ×
        </button>

        {/* Media */}
        {story.is_video && mediaUrl ? (
          <video
            src={mediaUrl}
            controls
            autoPlay
            className="w-full h-auto rounded-xl"
          />
        ) : mediaUrl ? (
          <img
            src={mediaUrl}
            alt="Story"
            className="w-full h-auto rounded-xl object-contain"
          />
        ) : (
          <div className="w-full h-100 bg-gray-800 rounded-xl flex items-center justify-center text-gray-400">
            <PlaceholderIcon />
          </div>
        )}

        {/* Meta */}
        <div className="mt-3 text-white text-[13px] space-y-1.5 px-1">
          {story.link && (
            <p>
              <a
                href={story.link}
                target="_blank"
                rel="noopener noreferrer"
                className="underline break-all opacity-80 hover:opacity-100"
                onClick={(e) => e.stopPropagation()}
              >
                {story.link}
              </a>
            </p>
          )}
          {story.product_slug && (
            <p className="text-gray-300">
              {translateFunction("Linked to product")}: {story.product_slug}
            </p>
          )}
          <p className="text-gray-400 text-[11px]">
            {story.viewers_count} {translateFunction("viewers")} ·{" "}
            {story.created_at?.slice(0, 10)}
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
    <div className="fixed inset-0 z-999999999 bg-black/50 flex items-center justify-center">
      <div className="bg-white rounded-[15px] p-6 max-w-sm w-full mx-4 shadow-xl">
        <h3 className="text-[18px] font-semibold text-[#1d1d1d] mb-2">
          {translateFunction("Delete Story")}
        </h3>
        <p className="text-[14px] text-[#8D8D8D] mb-6">
          {translateFunction(
            "Are you sure you want to delete this story? This action cannot be undone.",
          )}
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-[#1d1d1d] hover:bg-gray-50 text-[14px] disabled:opacity-50"
          >
            {translateFunction("Cancel")}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 text-[14px] disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading && <Spinner />}
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
        const data = res.data?.products || res.data || [];
        if (p > 1) {
          setProducts((prev) => [...prev, ...(Array.isArray(data) ? data : [])]);
        } else {
          setProducts(Array.isArray(data) ? data : []);
        }
        setMeta(res.data?.meta || null);
        setPage(p);
      } catch {
        // silently fail — list will show empty state
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
        className="bg-white rounded-[15px] p-6 max-w-lg w-full mx-4 max-h-[80vh] flex flex-col shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4 w-full flex justify-between">
          <h3 className="text-[18px] font-semibold text-[#1d1d1d]">
            {translateFunction("Select Product")}
          </h3>
          <button
            onClick={onClose}
            className="text-[#8D8D8D] text-3xl leading-none hover:text-[#1d1d1d]"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-10">
              <Spinner />
            </div>
          ) : products.length === 0 ? (
            <p className="text-center text-[#8D8D8D] py-10 text-[14px]">
              {translateFunction("No products found")}
            </p>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
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
                      className="flex flex-col border border-gray-200 rounded-[10px] overflow-hidden hover:border-blue-400 hover:shadow-md transition-all text-left"
                    >
                      <div className="w-full h-22.5 bg-gray-100">
                        {imgSrc ? (
                          <img
                            src={imgSrc}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <ProductIcon />
                          </div>
                        )}
                      </div>
                      <p className="text-[12px] text-[#1d1d1d] p-2 line-clamp-2">
                        {product.name || "Unnamed Product"}
                      </p>
                    </button>
                  );
                })}
              </div>

              {meta && meta.current_page < meta.last_page && (
                <div className="flex justify-center mt-4">
                  <button
                    onClick={() => fetchProducts(page + 1)}
                    disabled={loadingMore}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center gap-2 text-[14px]"
                  >
                    {loadingMore && <Spinner />}
                    {translateFunction("Load more")}
                  </button>
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
  onUploaded,
  onClose,
}: {
  sellerId: string;
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
      await SellerDashboardService.saveSellerStory(sellerId, {
        file_path: filePath,
        is_video: isVideo ? 1 : 0,
        is_photo: isVideo ? 0 : 1,
        link: normalizeLink(link),
        product_id: linkedProduct?.id ?? null,
        video_duration_in_second: durationSeconds ?? null,
      });
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

      <div className="fixed top-0 left-0 w-screen h-screen text-[#5d5d5d] z-999999999 bg-white rounded-t-2xl shadow-lg p-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-[#1d1d1d]">
            {translateFunction("Add Story")}
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Body */}
        <div
          className={`${uploading ? "opacity-70 pointer-events-none" : ""} flex h-[calc(100vh-250px)] max-w-312.5`}
        >
          {/* Preview pane */}
          <div className="flex-1 flex items-center w-1/2 justify-center border-r border-gray-200 pr-4">
            {preview ? (
              <div className="relative w-full h-75 rounded-lg overflow-hidden">
                {selectedFile?.type.startsWith("video/") ? (
                  <video
                    src={preview}
                    className="object-contain"
                    controls={false}
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
                  className="absolute top-2 right-2 bg-black/50 text-white p-2 rounded-full"
                >
                  <CloseIcon />
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-gray-400">
                <PlaceholderIcon />
                <p className="mt-2">
                  {translateFunction("No media selected")}
                </p>
              </div>
            )}
          </div>

          {/* Options pane */}
          <div className="pl-4 w-1/2 flex flex-col gap-4 items-start">
            {/* File picker */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-3 p-3 hover:bg-gray-100 rounded-lg"
            >
              <FileIcon />
              <span>{translateFunction("Upload Photo/Video")}</span>
            </button>

            {/* Link input */}
            <div className="flex items-center gap-3 p-3">
              <LinkIcon />
              <div className="flex-1">
                <input
                  type="url"
                  value={link}
                  onChange={handleLinkChange}
                  onBlur={() => {
                    const sanitized = pollinateInput(link);
                    if (link !== sanitized) setLink(sanitized);
                  }}
                  placeholder={translateFunction("Add link...")}
                  className={`w-full outline-hidden ${
                    linkError ? "border-b border-red-500" : ""
                  }`}
                />
                {linkError && (
                  <p className="text-red-500 text-sm mt-1">{linkError}</p>
                )}
              </div>
            </div>

            {/* Product picker */}
            <div className="p-3 w-full">
              {linkedProduct ? (
                <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-lg p-2">
                  {linkedProduct.image && (
                    <img
                      src={linkedProduct.image}
                      alt={linkedProduct.name}
                      className="w-10 h-10 rounded-md object-cover shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-medium text-[#1d1d1d] truncate">
                      {linkedProduct.name}
                    </p>
                    <div className="flex gap-2 mt-0.5">
                      <button
                        onClick={() => setShowProductPicker(true)}
                        className="text-[11px] text-blue-500 hover:underline"
                      >
                        {translateFunction("Change")}
                      </button>
                      <span className="text-gray-300">|</span>
                      <button
                        onClick={() => setLinkedProduct(null)}
                        className="text-[11px] text-red-500 hover:underline"
                      >
                        {translateFunction("Remove")}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowProductPicker(true)}
                  className="flex items-center gap-3 p-3 hover:bg-gray-100 rounded-lg"
                >
                  <ProductIcon />
                  <span>{translateFunction("Link to Product")}</span>
                </button>
              )}
            </div>

            {/* Submit */}
            {preview && (
              <button
                onClick={handleShareStory}
                disabled={!!linkError || uploading}
                className="w-full bg-blue-500 text-white flex justify-center items-center py-2 rounded-lg hover:bg-blue-600 mt-auto disabled:bg-blue-200"
              >
                {uploading ? <Spinner /> : translateFunction("Share Story")}
              </button>
            )}
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.gif,.mp4,.mov,.3gp,.avi"
          className="hidden"
          onChange={handleFileSelect}
        />
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
}: {
  story: SellerStory;
  onView: () => void;
  onDelete: () => void;
}) {
  const thumb = story.is_video ? story.full_video_path : story.photo_path;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow flex flex-col">
      {/* Thumbnail (clickable → viewer) */}
      <button
        onClick={onView}
        className="relative w-full aspect-9/16 bg-gray-100 block shrink-0"
      >
        {thumb ? (
          story.is_video ? (
            <video
              src={thumb}
              className="w-full h-full object-cover"
              muted
              preload="metadata"
            />
          ) : (
            <img
              src={thumb}
              alt="Story thumbnail"
              className="w-full h-full object-cover"
            />
          )
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            {story.is_video ? <VideoIcon /> : <PlaceholderIcon />}
          </div>
        )}

        {/* Type badge */}
        <span className="absolute top-2 left-2 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
          {story.is_video ? <VideoIcon /> : <PhotoIcon />}
        </span>
      </button>

      {/* Info */}
      <div className="p-2.5 space-y-1.5 flex flex-col flex-1">
        <div className="flex items-center justify-between text-[11px] text-[#8D8D8D]">
          <span className="flex items-center gap-1"><EyeIcon /> {story.viewers_count}</span>
          <span>{story.created_at?.slice(0, 10)}</span>
        </div>

        {story.link && (
          <p className="text-[11px] text-blue-500 truncate">{story.link}</p>
        )}

        {story.product_slug && (
          <p className="text-[11px] text-green-600 truncate">
            {story.product_slug}
          </p>
        )}

        <button
          onClick={onDelete}
          className="mt-auto w-full py-1.5 text-[12px] text-red-500 hover:bg-red-50 rounded-lg border border-red-100 transition-colors"
        >
          {translateFunction("Delete")}
        </button>
      </div>
    </div>
  );
}

// ─── StoriesTab (main) ────────────────────────────────────────────────────────

export default function StoriesTab({ sellerId }: { sellerId: string }) {
  const [stories, setStories] = useState<SellerStory[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
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
        const res = await SellerDashboardService.getSellerStories(sellerId, p);
        const data =
          res.data?.stories ?? res.data?.data ?? res.data ?? [];
        setStories(Array.isArray(data) ? data : []);
        setMeta(res.data?.meta ?? null);
        setPage(p);
      } catch (e: any) {
        setError(
          e?.message ?? translateFunction("Failed to load stories"),
        );
      } finally {
        setLoading(false);
      }
    },
    [sellerId],
  );

  useEffect(() => {
    fetchStories(1);
  }, [fetchStories]);

  const handleDelete = async () => {
    if (!deletingStory) return;
    try {
      setDeleteLoading(true);
      await SellerDashboardService.deleteSellerStory(
        deletingStory.id,
        sellerId,
      );
      setStories((prev) =>
        prev.filter((s) => s.id !== deletingStory.id),
      );
      setDeletingStory(null);
    } catch (e: any) {
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
      <div className="flex items-center justify-between">
        <h2 className="text-[20px] font-bold text-[#1d1d1d]">
          {translateFunction("Stories")}
          {meta && (
            <span className="ml-2 text-[14px] text-[#8D8D8D] font-normal">
              ({meta.total})
            </span>
          )}
        </h2>
        <button
          onClick={() => setShowUploadModal(true)}
          className="px-4 py-2 bg-blue-500 text-white rounded-[10px] hover:bg-blue-600 text-[14px] flex items-center gap-1.5 transition-colors"
        >
          <span className="text-[16px] leading-none">+</span>
          {translateFunction("Add Story")}
        </button>
      </div>

      {/* Error state */}
      {error && !loading && (
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-red-500 mb-4 text-[14px]">{error}</p>
          <button
            onClick={() => fetchStories(page)}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-[14px]"
          >
            {translateFunction("Retry")}
          </button>
        </div>
      )}

      {/* Loading state */}
      {loading && stories.length === 0 && (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && stories.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-[#8D8D8D]">
          <span className="mb-4"><StoriesEmptyIcon /></span>
          <p className="text-[16px] font-medium text-[#1d1d1d]">
            {translateFunction("No stories yet")}
          </p>
          <p className="text-[14px] mt-1">
            {translateFunction(
              "Upload your first story to get started",
            )}
          </p>
        </div>
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
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {meta && meta.last_page > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button
            onClick={() => fetchStories(page - 1)}
            disabled={page === 1 || loading}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-[#1d1d1d] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 text-[14px]"
          >
            {translateFunction("Previous")}
          </button>
          <span className="text-[14px] text-[#8D8D8D]">
            {translateFunction("Page")} {meta.current_page}{" "}
            {translateFunction("of")} {meta.last_page}
          </span>
          <button
            onClick={() => fetchStories(page + 1)}
            disabled={page >= meta.last_page || loading}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-[#1d1d1d] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 text-[14px]"
          >
            {translateFunction("Next")}
          </button>
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
          onUploaded={() => fetchStories(1)}
          onClose={() => setShowUploadModal(false)}
        />
      )}
    </div>
  );
}
