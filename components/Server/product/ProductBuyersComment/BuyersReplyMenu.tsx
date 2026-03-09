"use client";
import Spinner from "components/global/Spinner";
import React, { useEffect, useRef, useState } from "react";
import { LogError, translateFunction } from "utils/functions";
import { REQUESTS_DATA } from "utils/Requests";
import { fetchData } from "utils/fetchData";

type BuyersReplyMenuProps = {
  id: number | string;
  isRtl: boolean;
  language: string;
  sellerReply: string;
};

const BuyersReplyMenu = ({
  id,
  isRtl,
  language,
  sellerReply,
}: BuyersReplyMenuProps) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [translateLoading, setTranslateLoading] = useState(false);
  const [isReplyTranslated, setIsReplyTranslated] = useState(false);
  const [originalReply, setOriginalReply] = useState<string | null>(null);

  const menuRef = useRef<HTMLDivElement | null>(null);

  const handleMenuToggle = () => {
    setMenuOpen((prev) => !prev);
  };

  const handleTranslateReply = async () => {
    const replyElement = document.querySelector<HTMLDivElement>(
      `#comment-${id}-reply-text`,
    );

    if (!replyElement) {
      return;
    }

    if (isReplyTranslated) {
      const textToShow = originalReply ?? sellerReply ?? "";
      replyElement.innerText = textToShow;
      setIsReplyTranslated(false);
      setMenuOpen(false);
      return;
    }

    try {
      setTranslateLoading(true);
      const response = await fetchData({
        url: `/public_comment/comments/${id}/translate`,
        method: "POST",
        body: JSON.stringify({
          target_language: language,
          translate_type: "seller_reply",
        }),
        reqTitle: REQUESTS_DATA.UPDATE_COMMENT,
        server: "comments",
      });

      if (!response.success) throw new Error(response.message);

      if (response?.success) {
        const original = response.original_text || sellerReply;
        if (!originalReply && original) {
          setOriginalReply(original);
        }

        if (response.translated_text) {
          replyElement.innerText = response.translated_text;
          setIsReplyTranslated(true);
        }
      }
      setMenuOpen(false);
    } catch (error) {
      LogError({
        error: error,
        scenario: "Error In handleTranslateReply in BuyersReplyMenu",
      });
    } finally {
      setTranslateLoading(false);
    }
  };

  useEffect(() => {
    if (!menuOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  console.log("sellerReply", sellerReply);
  return (
    <div className="relative">
      {menuOpen && (
        <div
          ref={menuRef}
          style={{
            left: isRtl ? "initial" : "0px",
            right: isRtl ? "0px" : "initial",
          }}
          className="absolute bottom-[24px] z-80 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[120px]"
        >
          <button
            className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
            onClick={handleTranslateReply}
            disabled={translateLoading}
          >
            <img src="/icons/LanguageIcon.svg" className="w-4 h-4" />
            {translateLoading ? (
              <Spinner />
            ) : isReplyTranslated ? (
              translateFunction("Show Original", language)
            ) : (
              translateFunction("Translate", language)
            )}
          </button>
        </div>
      )}
      <div
        className="comment-menu-btn cursor-pointer flex items-center justify-center w-[20px] h-[20px]"
        onClick={handleMenuToggle}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") handleMenuToggle();
        }}
        tabIndex={0}
        role="button"
        aria-label="Reply options menu"
      >
        <svg
          style={{
            filter: "drop-shadow(0px 1px 2px rgba(0,0,0,0.1))",
          }}
          xmlns="http://www.w3.org/2000/svg"
          width="24px"
          height="24px"
          viewBox="0 0 24 24"
          id="three-dots-reply"
        >
          <g
            id="_20x20_three-dots--grey-reply"
            data-name="20x20/three-dots--grey-reply"
            transform="translate(24) rotate(90)"
          >
            <rect id="Rectangle" width="24" height="24" fill="none" />
            <circle
              id="Oval"
              cx="1"
              cy="1"
              r="1"
              transform="translate(5 11)"
              stroke="#000000"
              strokeMiterlimit="10"
              strokeWidth="0.5"
            />
            <circle
              id="Oval-2"
              data-name="Oval"
              cx="1"
              cy="1"
              r="1"
              transform="translate(11 11)"
              stroke="#000000"
              strokeMiterlimit="10"
              strokeWidth="0.5"
            />
            <circle
              id="Oval-3"
              data-name="Oval"
              cx="1"
              cy="1"
              r="1"
              transform="translate(17 11)"
              stroke="#000000"
              strokeMiterlimit="10"
              strokeWidth="0.5"
            />
          </g>
        </svg>
      </div>
    </div>
  );
};

export default BuyersReplyMenu;
