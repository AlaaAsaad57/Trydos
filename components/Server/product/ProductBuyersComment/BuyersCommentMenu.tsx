"use client";
import Spinner from "components/global/Spinner";
import DeleteCommentIcon from "public/svg/DeleteCommentIcon";
import LanguageIcon from "public/svg/LanguageIcon";
import PenIcon from "public/svg/PenIcon";
import React, { useEffect, useRef, useState } from "react";
import { translateFunction } from "utils/functions";
import { REQUESTS_DATA } from "utils/Requests";
import ThreePointsIcon from "public/svg/threepoints";
import { fetchData } from "utils/fetchData";
import { useAppStore } from "store";

function BuyersCommentMenu({
  id,
  ownerID,
  ownerType,
  isRtl,
  language,
  isOwner,
  comment,
}) {
  const [loading, setLoading] = useState(false);
  const { BuyerCommentModalOption, setBuyerCommentModalOption } = useAppStore();
  const [translatedComment, setTranslatedComment] = useState<string | null>(
    null
  );
  const [originalComment, setOriginalComment] = useState<string | null>(null);
  const [translateLoading, setTranslateLoading] = useState(false);

  const [isCommentTranslated, setIsCommentTranslated] = useState(false);

  const [menuOpen, setMenuOpen] = useState(false);
  const handleMenuToggle = () => {
    setMenuOpen(!menuOpen);
  };
  const menuRef = useRef<HTMLDivElement>(null);

  const handleTranslateComment = async () => {
    if (isCommentTranslated) {
      setIsCommentTranslated(false);
      setTranslatedComment(null);
      setMenuOpen(false);
      document.querySelector<HTMLDivElement>(
        `#comment-${comment.id}-text`
      ).innerText = comment?.comment ?? "";
      return;
    }

    try {
      setTranslateLoading(true);
      const response = await fetchData({
        url: `/public_comment/comments/${id}/translate`,
        method: "POST",
        body: JSON.stringify({
          target_language: language,
          translate_type: "comment",
        }),
        reqTitle: REQUESTS_DATA.UPDATE_COMMENT,
        server: "comments",
      });

      if (!response.success) throw new Error(response.message);

      if (response?.success) {
        // Store original text from API response or comment
        const original = response.original_text;
        if (!originalComment && original) {
          setOriginalComment(original);
        }

        // Check if it's already in the target language
        if (response.translated_text) {
          setTranslatedComment(response.translated_text);
          setIsCommentTranslated(true);
        }

        document.querySelector<HTMLDivElement>(
          `#comment-${comment.id}-text`
        ).innerText = response.translated_text;
      }
      setMenuOpen(false);
    } catch (error) {
      console.error("Error translating comment:", error);
    } finally {
      setTranslateLoading(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);
  return (
    <>
      {menuOpen && (
        <div
          ref={menuRef}
          style={{
            right: isRtl ? "initial" : "10px",
            left: isRtl ? "10px" : "initial",
          }}
          className={`${
            isOwner ? "top-[0px]" : "top-[20px]"
          }  absolute z-[80]   bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[120px]`}
        >
          <button
            className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
            onClick={handleTranslateComment}
            disabled={translateLoading}
          >
            <LanguageIcon className="w-4 h-4" />
            {translateLoading ? (
              <Spinner />
            ) : isCommentTranslated ? (
              translateFunction("Show Original", language)
            ) : (
              translateFunction("Translate", language)
            )}
          </button>
          {isOwner && (
            <button
              className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
              onClick={() => {
                setBuyerCommentModalOption({
                  option: "Update",
                  ...comment,
                  ownerID,
                  ownerType,
                });
                setMenuOpen(false);
              }}
              disabled={loading}
            >
              <PenIcon className="w-4 h-4" />
              {loading ? "Updating..." : translateFunction("Edit")}
            </button>
          )}
          {isOwner && (
            <button
              className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-gray-100 flex items-center gap-2"
              onClick={() => {
                setBuyerCommentModalOption({
                  option: "Delete",
                  ...comment,
                  ownerID,
                  ownerType,
                });
                setMenuOpen(false);
              }}
            >
              <DeleteCommentIcon className="w-4 h-4" />
              {translateFunction("Delete")}
            </button>
          )}
        </div>
      )}
      {!BuyerCommentModalOption && (
        <div
          className="comment-menu-btn absolute z-50 top-[45px] cursor-pointer flex items-center justify-center w-[20px] h-[20px]"
          style={{
            borderRadius: "50%",
            transition: "background-color 0.2s ease",
            right: isRtl ? "initial" : "10px",
            left: isRtl ? "10px" : "initial",
          }}
          onClick={handleMenuToggle}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") handleMenuToggle();
          }}
          tabIndex={0}
          role="button"
          aria-label="Comment options menu"
        >
          <ThreePointsIcon
            style={{
              filter: "drop-shadow(0px 1px 2px rgba(0,0,0,0.1))",
            }}
          />
        </div>
      )}
    </>
  );
}

export default BuyersCommentMenu;
