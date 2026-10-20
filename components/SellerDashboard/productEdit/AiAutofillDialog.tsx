"use client";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import SellerDashboardService from "services/sellerDashboard";
import { translateFunction, LogError } from "utils/functions";
import { DashButton, DashIcon } from "components/SellerDashboard/ui";
import { extractNames } from "./helpers";
import { setAiPrefill } from "./aiPrefill";

const t = (s: string) => translateFunction(s);

const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];
const ROUTE = "/api/seller/products/ai-autofill";

// The route answers with these keys; anything else (or a non-JSON answer, such
// as a platform timeout page) is shown as the generic failure.
const KNOWN_MESSAGES = new Set([
  "You do not have permission for this action.",
  "The image must be uploaded to the media server",
  "Too many requests. Please try again in a moment.",
  "The AI service is busy right now. Please try again in a moment.",
  "AI analysis failed",
]);

/**
 * "Add with AI": pick one photo, upload it to the media server like any
 * product image, ask the AI route for suggestions, then open the normal
 * create form filled with them. Nothing is saved here.
 */
export default function AiAutofillDialog({
  sellerId,
  local,
  onClose,
  onNavigate,
}: {
  sellerId: string;
  local: string;
  onClose: () => void;
  /** Called right before navigating, as the dashboard's own links do. */
  onNavigate?: () => void;
}) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  // A late answer after the dialog closed must not open the form. The request
  // itself is not aborted: if the route renewed the session, its answer carries
  // the new cookies, and dropping it would lose them.
  const closedRef = useRef(false);
  const handedOffRef = useRef(false);

  useEffect(() => {
    closedRef.current = false;
    return () => {
      closedRef.current = true;
    };
  }, []);

  // Free the previous preview when the photo changes or the dialog goes away —
  // except the one handed to the form, which still shows it.
  useEffect(() => {
    return () => {
      if (preview && !handedOffRef.current) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const close = () => {
    closedRef.current = true;
    onClose();
  };

  const pick = (picked: File | undefined) => {
    setError(null);
    if (!picked) return;
    if (!ACCEPTED.includes(picked.type)) {
      setFile(null);
      setPreview("");
      setError(t("Please choose a JPEG, PNG or WebP photo."));
      return;
    }
    setFile(picked);
    setPreview(URL.createObjectURL(picked));
  };

  const analyze = async () => {
    if (!file || busy) return;
    setBusy(true);
    setError(null);
    let navigating = false;
    try {
      let name = "";
      try {
        name = extractNames(await SellerDashboardService.bulkUploadImages([file], "product"))[0] || "";
      } catch (e: any) {
        LogError({ scenario: "AiAutofillDialog.upload", error: e instanceof Error ? e.message : String(e) });
      }
      if (!name) {
        if (!closedRef.current) setError(t("Image upload failed"));
        return;
      }

      const res = await fetch(ROUTE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ sellerId, image: name }),
      });
      const json: any = await res.json().catch(() => null);
      if (closedRef.current) return;

      if (res.ok && json?.success && json.data) {
        handedOffRef.current = true;
        setAiPrefill(sellerId, {
          suggestion: json.data,
          image: { name, url: preview, isNew: true },
        });
        navigating = true;
        onNavigate?.();
        router.push(`/${local}/sellerProfile/sellerDashboard/${sellerId}/products/new`);
        return;
      }
      const message = KNOWN_MESSAGES.has(json?.message) ? json.message : "AI analysis failed";
      setError(t(message));
    } catch (e: any) {
      LogError({ scenario: "AiAutofillDialog.analyze", error: e instanceof Error ? e.message : String(e) });
      if (!closedRef.current) setError(t("AI analysis failed"));
    } finally {
      if (!navigating && !closedRef.current) setBusy(false);
    }
  };

  // Portal to <body> like the carts / orders / stories modals: rendered inline,
  // `fixed` is measured against the scaled dashboard box and the backdrop
  // stops short of the page edges.
  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[999999999] flex items-center justify-center p-4"
      data-pw="ai-autofill-dialog"
    >
      <div className="absolute inset-0 bg-black/45" onClick={close} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t("Add with AI")}
        className="relative bg-white rounded-[20px] z-10 w-full max-w-md flex flex-col overflow-hidden"
        style={{ boxShadow: "0 12px 40px rgba(0,0,0,0.18)" }}
      >
        <div className="p-5 border-b border-[#ededed] flex items-center justify-between">
          <div>
            <h3 className="text-[16px] bold text-[#3c3c3c]">{t("Add with AI")}</h3>
            <p className="text-[12px] text-[#8e8e8e] mt-0.5">
              {t("Upload a product photo and AI will fill in the product details for you.")}
            </p>
          </div>
          <button
            type="button"
            onClick={close}
            aria-label={t("Close")}
            className="w-8 h-8 rounded-full hover:bg-[#f4f4f4] flex items-center justify-center text-[#8e8e8e] text-[18px] leading-none"
          >
            ✕
          </button>
        </div>

        <div className="p-5">
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED.join(",")}
            className="hidden"
            data-pw="ai-autofill-file"
            onChange={(e) => {
              pick(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
            className="w-full aspect-[4/3] rounded-[16px] border border-dashed border-[#d4d4d4] bg-[#f9f9f9] flex flex-col items-center justify-center gap-2 overflow-hidden disabled:opacity-60"
          >
            {preview ? (
              <img src={preview} alt={t("Product photo")} className="w-full h-full object-contain" />
            ) : (
              <>
                <DashIcon name="upload" size={26} strokeWidth={1.4} />
                <span className="text-[13px] text-[#5d5d5d] medium">{t("Choose a photo")}</span>
              </>
            )}
          </button>
          {busy && (
            <p className="text-[12px] text-[#8e8e8e] mt-3 text-center" aria-live="polite">
              {t("Analyzing photo...")}
            </p>
          )}
          {error && (
            <p role="alert" className="text-[12px] text-[#f85555] mt-3">
              {error}
            </p>
          )}
        </div>

        <div className="p-5 pt-0 flex gap-2 justify-end">
          <DashButton variant="ghost" type="button" onClick={close}>
            {t("Cancel")}
          </DashButton>
          <DashButton
            type="button"
            data-pw="ai-autofill-analyze"
            disabled={!file}
            loading={busy}
            onClick={analyze}
          >
            {t("Analyze with AI")}
          </DashButton>
        </div>
      </div>
    </div>,
    document.body,
  );
}
