"use client";
import { useEffect, useState } from "react";
import SellerDashboardService from "services/sellerDashboard";
import { translateFunction, LogError } from "utils/functions";
import { DashButton, DashIcon } from "components/SellerDashboard/ui";
import { fileName } from "./helpers";

const t = (s: string) => translateFunction(s);

interface GalleryImage {
  id: number | string;
  url?: string;
  path?: string;
  name?: string;
  file_name?: string;
}

export interface PickedImage {
  url: string;
  name: string;
}

export default function GalleryPickerModal({
  sellerId,
  multiple,
  onClose,
  onPick,
}: {
  sellerId: string;
  multiple: boolean;
  onClose: () => void;
  onPick: (picked: PickedImage[]) => void;
}) {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Map<string, PickedImage>>(new Map());

  const imgUrl = (im: GalleryImage) => im.url ?? im.path ?? "";
  const imgKey = (im: GalleryImage) => String(im.id ?? imgUrl(im));

  const loadPage = async (p: number) => {
    setLoading(true);
    setError(null);
    try {
      const res: any = await SellerDashboardService.getProductImages(sellerId, p, 60);
      if (!res?.success) throw new Error(res?.message || t("Failed to load gallery"));
      const data = res?.data?.images ?? res?.data?.data ?? res?.data ?? [];
      const list: GalleryImage[] = Array.isArray(data) ? data : [];
      setImages((prev) => (p === 1 ? list : [...prev, ...list]));
      const meta = res?.data?.meta ?? res?.meta ?? null;
      setLastPage(Number(meta?.last_page ?? p));
      setPage(p);
    } catch (e: any) {
      const msg = e instanceof Error ? e.message : String(e);
      LogError({ scenario: "GalleryPickerModal.load", error: msg });
      setError(msg || t("Failed to load gallery"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sellerId]);

  const toggle = (im: GalleryImage) => {
    const url = imgUrl(im);
    if (!url) return;
    const key = imgKey(im);
    const picked: PickedImage = { url, name: fileName(url) };
    setSelected((prev) => {
      if (prev.has(key)) {
        const next = new Map(prev);
        next.delete(key);
        return next;
      }
      if (multiple) {
        const next = new Map(prev);
        next.set(key, picked);
        return next;
      }
      return new Map([[key, picked]]);
    });
  };

  const chosen = [...selected.values()];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/45" onClick={onClose} />
      <div
        className="relative bg-white rounded-[20px] z-10 w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden"
        style={{ boxShadow: "0 12px 40px rgba(0,0,0,0.18)" }}
      >
        <div className="p-5 border-b border-[#ededed] flex items-center justify-between">
          <div>
            <h3 className="text-[16px] bold text-[#3c3c3c]">{t("Choose from gallery")}</h3>
            <p className="text-[12px] text-[#8e8e8e] mt-0.5">
              {multiple ? t("Select one or more images.") : t("Select an image.")}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("Close")}
            className="w-8 h-8 rounded-full hover:bg-[#f4f4f4] flex items-center justify-center text-[#8e8e8e] text-[18px] leading-none"
          >
            ✕
          </button>
        </div>

        <div className="p-5 overflow-auto">
          {loading && images.length === 0 ? (
            <p className="text-center text-[13px] text-[#8e8e8e] py-10">{t("Loading…")}</p>
          ) : error && images.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-[13px] text-[#f85555] mb-3">{error}</p>
              <DashButton size="sm" variant="secondary" onClick={() => loadPage(1)}>
                {t("Retry")}
              </DashButton>
            </div>
          ) : images.length === 0 ? (
            <p className="text-center text-[13px] text-[#8e8e8e] py-10">
              {t("No images in your gallery yet.")}
            </p>
          ) : (
            <>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {images.filter((im) => imgUrl(im)).map((im) => {
                  const key = imgKey(im);
                  const on = selected.has(key);
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => toggle(im)}
                      className={`relative aspect-square rounded-[12px] overflow-hidden border-2 transition-colors ${
                        on ? "border-[#5d5d5d]" : "border-transparent opacity-85 hover:opacity-100"
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={imgUrl(im)} alt="" className="w-full h-full object-cover" />
                      {on && (
                        <span className="absolute top-1 right-1 w-5 h-5 rounded-full bg-[#5d5d5d] text-white flex items-center justify-center">
                          <DashIcon name="check" size={12} />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              {error && <p className="text-center text-[12px] text-[#f85555] mt-3">{error}</p>}
            </>
          )}
          {page < lastPage && !error && (
            <div className="text-center mt-4">
              <DashButton
                size="sm"
                variant="secondary"
                loading={loading}
                onClick={() => loadPage(page + 1)}
              >
                {t("Load more")}
              </DashButton>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-[#ededed] flex gap-3">
          <DashButton variant="ghost" fullWidth onClick={onClose}>
            {t("Cancel")}
          </DashButton>
          <DashButton
            icon="check"
            fullWidth
            disabled={chosen.length === 0}
            onClick={() => {
              onPick(chosen);
              onClose();
            }}
          >
            {t("Add selected")}
            {chosen.length ? ` (${chosen.length})` : ""}
          </DashButton>
        </div>
      </div>
    </div>
  );
}
