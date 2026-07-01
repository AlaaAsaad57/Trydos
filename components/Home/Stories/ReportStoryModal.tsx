"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useAppStore } from "store";
import { translateFunction } from "utils/functions";
import {
  showSuccessNotification,
  showErrorNotification,
} from "store/notifications/reducer";
import StoryServiceClass from "services/story";
import Spinner from "components/global/Spinner";

// Reasons are modeled as { value, labelKey } pairs: the stable, language-
// independent `value` is what is sent to the backend (so moderation/aggregation
// is not tied to the viewer's display language — spec C-2/AC-13), while
// `labelKey` is the English key resolved through translateFunction for display.
export const REPORT_REASONS: { value: string; labelKey: string }[] = [
  { value: "inappropriate_content", labelKey: "Inappropriate Content" },
  {
    value: "harassment",
    labelKey: "Harassment or Hate Speech",
  },
  { value: "spam", labelKey: "Spam or Scam" },
  {
    value: "intellectual_property",
    labelKey: "Intellectual Property Violation",
  },
  {
    value: "violence",
    labelKey: "Violence or Dangerous Content",
  },
  { value: "other", labelKey: "Other" },
];

const DETAILS_MAX = 500;

interface ReportStoryModalProps {
  storyId: string | number;
  onClose: () => void;
}

export default function ReportStoryModal({
  storyId,
  onClose,
}: ReportStoryModalProps) {
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);
  const detailsRef = useRef<HTMLTextAreaElement>(null);

  const { language ,userProfile} = useAppStore();
  const isRtl = language === "ar" || language === "ku";

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleReason = (value: string) => {
    setSelectedReasons((prev) => {
      const willSelect = !prev.includes(value);
      // Selecting "Other" sends focus straight to the free-text area so the
      // user can start typing the required explanation immediately.
      if (value === "other" && willSelect) {
        // Defer until after the state-driven re-render so the textarea exists/focusable.
        requestAnimationFrame(() => detailsRef.current?.focus());
      }
      return willSelect ? [...prev, value] : prev.filter((r) => r !== value);
    });
  };

  const handleDetailsChange = (value: string) => {
    const next = value.slice(0, DETAILS_MAX);
    setDetails(next);
    // Typing any details implies the "Other" reason; clearing it removes that
    // implication again (without disturbing the user's other selections).
    setSelectedReasons((prev) => {
      const hasOther = prev.includes("other");
      if (next.trim().length > 0 && !hasOther) return [...prev, "other"];
      if (next.trim().length === 0 && hasOther)
        return prev.filter((r) => r !== "other");
      return prev;
    });
  };

  const canSubmit = selectedReasons.length > 0 || details.trim().length > 0;

  const handleSubmit = async () => {
    if (!canSubmit) {
      showErrorNotification(
        translateFunction(
          "Please select at least one reason or provide details.",
        ),
      );
      return;
    }

    setSubmitting(true);
    try {
      await StoryServiceClass.reportStory(
        storyId,
        userProfile?.id,
        selectedReasons,
        details.trim(),
      );
      showSuccessNotification(
        translateFunction("Story reported successfully."),
      );
      onClose();
    } catch (err: any) {
      // Keep the sheet open and selections intact so the user can retry.
      showErrorNotification(
        err?.message || translateFunction("Failed to report story."),
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!mounted || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[99999999999] flex items-end justify-center bg-black/45"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[480px] bg-white rounded-t-[20px] shadow-[0_3px_10px_rgba(0,0,0,0.1)] flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
        style={{ direction: isRtl ? "rtl" : "ltr" }}
        role="dialog"
        aria-modal="true"
        aria-label={translateFunction("Report Story")}
      >
        {/* Grabber */}
        {/* Header */}
        <div className="relative flex items-center w-full justify-center px-6 py-3">
          <h3 className="text-[16px] font-medium text-[#3c3c3c]">
            {translateFunction("Report Story")}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label={translateFunction("Cancel")}
            className={`absolute top-1/2 -translate-y-1/2 rounded-full p-1.5 hover:bg-gray-100 ${
              isRtl ? "left-4" : "right-4"
            }`}
          >
            <svg
              className="h-5 w-5 text-[#707070]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 pb-2">
          <p className="mb-3 text-[13px] text-[#707070]">
            {translateFunction("Report Reason")}
          </p>

          {/* Reasons — selection by outline + tint (no checkboxes). */}
          <div className="mb-4 flex flex-col gap-2">
            {REPORT_REASONS.map((reason) => {
              const selected = selectedReasons.includes(reason.value);
              return (
                <button
                  key={reason.value}
                  type="button"
                  onClick={() => toggleReason(reason.value)}
                  aria-pressed={selected}
                  className={`w-full rounded-[15px] border px-4 py-3 text-[14px] font-medium transition-colors ${
                    isRtl ? "text-right" : "text-left"
                  } ${
                    selected
                      ? "border-[#5b3fe0] bg-[#5b3fe0]/[0.06] text-[#3c3c3c]"
                      : "border-[#e6e6e6] bg-[#f2f2f2] text-[#3c3c3c] hover:border-[#d9d9de]"
                  }`}
                >
                  {translateFunction(reason.labelKey)}
                </button>
              );
            })}
          </div>

          {/* Optional details */}
          <div className="mb-2 flex flex-col">
            <label className="mb-2 text-[13px] text-[#505050]">
              {!selectedReasons.includes('other')?translateFunction("Details (optional)"):translateFunction("Details")}
            </label>
            <textarea
              ref={detailsRef}
              value={details}
              onChange={(e) => handleDetailsChange(e.target.value)}
              placeholder={translateFunction("Write details here...")}
              maxLength={DETAILS_MAX}
              className={`h-[100px] w-full resize-none rounded-[15px] border border-[#e6e6e6] p-3 text-[14px] text-[#3c3c3c] focus:border-[#5b3fe0] focus:outline-hidden ${
                isRtl ? "text-right" : "text-left"
              }`}
            />
            <div
              className={`mt-1 text-[11px] text-[#929191] ${
                isRtl ? "text-left" : "text-right"
              }`}
            >
              {details.length}/{DETAILS_MAX}
            </div>
          </div>
        </div>

        {/* Footer — disabled→enabled CTA pair, same geometry */}
        <div className="flex gap-3 border-t border-[#e6e6e6] px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="flex-1 rounded-full border border-[#e6e6e6] bg-white py-2.5 text-[14px] font-semibold text-[#3c3c3c] hover:bg-gray-50 disabled:opacity-50"
          >
            {translateFunction("Cancel")}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || !canSubmit}
            className="flex flex-1 items-center w-[200px] justify-center gap-2 rounded-full bg-[#5b3fe0] py-2.5 text-[14px] font-semibold text-white hover:bg-[#4b33d9] disabled:cursor-not-allowed disabled:bg-[#d9d9de]"
          >
            {submitting ? <Spinner /> : translateFunction("Submit Report")}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
