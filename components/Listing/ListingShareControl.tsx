"use client";

import { useEffect, useState } from "react";
import "styles/share-options.css";
import {
  EmailIcon,
  FacebookIcon,
  FacebookShareButton,
  TelegramIcon,
  TelegramShareButton,
  TwitterIcon,
  TwitterShareButton,
  WhatsappIcon,
  WhatsappShareButton,
} from "react-share";
import BottomSheet from "components/global/BottomSheet";
import { translateFunction } from "utils/functions";
import { showSuccessNotification } from "@/store/notifications/reducer";

/**
 * ListingShareControl — the listing-bar share widget.
 *
 * Replaces the old `ShareBoutiquePageButton`, which silently copied the URL to
 * the clipboard with no feedback. This opens a bottom sheet (same pattern as
 * `ListingSortControl`) that lets the user share the *current listing page URL*
 * to external apps — Facebook, X, WhatsApp, Telegram, Email, Copy Link, and the
 * native share sheet where supported.
 *
 * Deliberately leaner than the product page's `ShareOptions`:
 *   • NO backend/tracking endpoint (no `share_product_on_apps` POST).
 *   • NO analytics event.
 *   • NO share-to-chat / contacts list (no store state, no product payload).
 * Each target is fire-and-forget; the only thing shared is the page URL. The
 * visual grid reuses `styles/share-options.css` so it matches the product widget.
 */
export default function ListingShareControl({
  language,
  isRtl = false,
}: {
  language: string;
  isRtl?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);

  // The Web Share API isn't available everywhere (e.g. Firefox desktop). Detect
  // after mount to avoid a hydration mismatch, and only render the native
  // "More" button where it actually works — the explicit buttons are the
  // fallback everywhere else. Mirrors ShareOptions.
  const [canNativeShare, setCanNativeShare] = useState(false);
  useEffect(() => {
    setCanNativeShare(
      typeof navigator !== "undefined" && typeof navigator.share === "function",
    );
  }, []);

  const t = (key: string) => translateFunction(key, language);

  // The page URL, tagged with a utm_source per app (attribution parity with the
  // product share widget — still just this page's URL, no endpoint involved).
  const generateUrlForSharing = (app: string) => {
    const searchParams = new URLSearchParams(window.location.search);
    searchParams.set("utm_source", app);
    return `${window.location.origin}${window.location.pathname}?${searchParams.toString()}`;
  };

  const nativeShare = async () => {
    try {
      await navigator.share({
        title: document.title,
        url: generateUrlForSharing("native_share"),
      });
    } catch (err: any) {
      // navigator.share rejects with AbortError when the user dismisses the
      // sheet — not an error, and there's nothing else to clean up.
      if (err?.name === "AbortError") return;
    }
  };

  const shareViaEmail = (e: React.MouseEvent) => {
    e?.preventDefault();
    const subject = document.title || "Check this out";
    const body = generateUrlForSharing("email");

    // Desktops now expose navigator.share too, so branch on the actual UA:
    // mobile → native mailto; desktop → Gmail compose (bypasses the mailto
    // user-gesture blocker). Same approach as ShareOptions.
    const isMobile =
      typeof navigator !== "undefined" &&
      /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

    if (isMobile) {
      window.location.href = `mailto:?subject=${encodeURIComponent(
        subject,
      )}&body=${encodeURIComponent(body)}`;
      return;
    }

    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&su=${encodeURIComponent(
      subject,
    )}&body=${encodeURIComponent(body)}`;
    const link = document.createElement("a");
    link.href = gmailUrl;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyLink = () => {
    if (typeof navigator !== "undefined") {
      navigator.clipboard.writeText(window.location.href).then(() => {
        showSuccessNotification(t("Link Copied to Clipboard"));
      });
    }
  };

  return (
    <>
      <button
        type="button"
        data-cy="share_ortion"
        className="filter-option relative flex items-center justify-center border-0 bg-transparent p-0"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-label={t("Share this page")}
        onClick={() => setIsOpen(true)}
      >
        <img src="/icons/shareIcon.svg" data-cy="share_ortion_svg" alt="" />
      </button>

      {isOpen && (
        <BottomSheet isOpen={isOpen} onClose={() => setIsOpen(false)} height={60}>
          <div
            dir={isRtl ? "rtl" : "ltr"}
            role="dialog"
            aria-label={t("Share this page")}
            className="w-full px-[14px] pb-[28px]"
            style={{ textAlign: isRtl ? "right" : "left" }}
          >
            {/* Header — mirrors ListingSortControl's header block. */}
            <div className="flex flex-col gap-[2px] mb-[18px]">
              <span className="text-[16px] semibold text-[#3c3c3c]">
                {t("Share this page")}
              </span>
              <span className="text-[12px] regular text-[#707070]">
                {t("Send this page to your favourite apps")}
              </span>
            </div>

            {/* Share grid — reuses styles/share-options.css for parity with the
                product share widget. No tracking, no contacts. */}
            <div className="share-options">
              <div className="share-avatar" data-cy="Facebook">
                <div className="share-image social shadow-none">
                  <FacebookShareButton url={generateUrlForSharing("facebook")}>
                    <FacebookIcon size={70} borderRadius={20} />
                  </FacebookShareButton>
                </div>
                <div className="share-name">Facebook</div>
              </div>

              <div className="share-avatar" data-cy="Twitter">
                <div className="share-image social shadow-none">
                  <TwitterShareButton
                    url={generateUrlForSharing("X")}
                    title={generateUrlForSharing("X")}
                  >
                    <TwitterIcon size={70} borderRadius={20} />
                  </TwitterShareButton>
                </div>
                <div className="share-name">Twitter / X</div>
              </div>

              <div className="share-avatar" data-cy="Whatsapp">
                <div className="share-image social shadow-none">
                  <WhatsappShareButton url={generateUrlForSharing("whatsapp")}>
                    <WhatsappIcon size={70} borderRadius={20} />
                  </WhatsappShareButton>
                </div>
                <div className="share-name">WhatsApp</div>
              </div>

              <div className="share-avatar" data-cy="Telegram">
                <div className="share-image social shadow-none">
                  <TelegramShareButton url={generateUrlForSharing("Telegram")}>
                    <TelegramIcon size={70} borderRadius={20} />
                  </TelegramShareButton>
                </div>
                <div className="share-name">Telegram</div>
              </div>

              <div className="share-avatar" data-cy="Email">
                <div className="share-image social shadow-none">
                  <button
                    type="button"
                    className="cursor-pointer flex items-start bg-transparent border-none p-0 outline-none appearance-none"
                    onClick={shareViaEmail}
                  >
                    <EmailIcon size={70} borderRadius={20} />
                  </button>
                </div>
                <div className="share-name">{t("Email")}</div>
              </div>

              <div className="share-avatar">
                <div
                  data-cy="copy_link_button"
                  className="share-image social shadow-none flex justify-center items-center bg-[#f8f8e4]"
                  onClick={copyLink}
                >
                  <img
                    src="/icons/copyIcon.svg"
                    width={30}
                    height={30}
                    className="h-[30px] object-contain"
                    alt=""
                  />
                </div>
                <div className="share-name">{t("Copy Link")}</div>
              </div>

              {canNativeShare && (
                <div className="share-avatar" data-cy="NativeShare">
                  <div
                    className="share-image social shadow-none flex justify-center items-center bg-[#f0f0f0]"
                    onClick={nativeShare}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="32"
                      height="32"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#505050"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="18" cy="5" r="3" />
                      <circle cx="6" cy="12" r="3" />
                      <circle cx="18" cy="19" r="3" />
                      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                    </svg>
                  </div>
                  <div className="share-name">{t("More")}</div>
                </div>
              )}
            </div>
          </div>
        </BottomSheet>
      )}
    </>
  );
}
