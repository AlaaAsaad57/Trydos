"use client";
import React from "react";
import NextLink from "components/global/NextLink";
import VerifyUser from "./VerifyUser";
import { GetImageUrl, isGuestName } from "utils/tinyUtils";
import { translateFunction } from "utils/functions";
import { formatPhoneInternational } from "utils/formatPhone";
import { useAppStore } from "store";

function Profile({ isRtl, language, local, SafeUserProfile }) {
  const { userProfile: clientUser, setLoginOpen } = useAppStore();
  const user = clientUser || SafeUserProfile;

  const isNotLoggedIn = !user ||
    user.phone === "0" ||
    user.phone === 0 ||
    user.phone === null ||
    user.phone === undefined ||
    String(user.phone).trim() === "" ||
    String(user.phone).length < 3;

  const handleCardClick = (e: React.MouseEvent) => {
    if (isNotLoggedIn) {
      e.preventDefault();
      e.stopPropagation();
      setLoginOpen(true);
    }
  };

  const isInvalidImage = (img: any) => {
    if (!img) return true;
    if (typeof img !== "string") return false;
    const lower = img.toLowerCase().trim();
    return lower === "guest" || lower === "verified_guest" || lower === "verfied_guest" || lower === "null" || lower === "";
  };

  const displayName = isGuestName(user?.name) ? "" : (user?.name || "");
  const displayPhone = isNotLoggedIn ? "" : formatPhoneInternational(user?.phone);

  return (
    <div
      onClick={handleCardClick}
      className={`w-full relative flex h-[138px] rounded-[15px] bg-[#F8F8F8] p-[12px] ${isRtl ? "flex-row-reverse" : "flex-row"
        } justify-between overflow-hidden cursor-pointer ${isNotLoggedIn && "opacity-65"}`}
    >
      {/* 1. الرابط الخفي الذي يغطي البطاقة بالكامل (للذهاب للبروفايل) */}
      {!isNotLoggedIn && (
        <NextLink
          isFromSetting={true}
          href={`/${local}/settings/profile`}
          className="absolute inset-0 z-0"
          aria-label="View Profile"
        >
          <></>
        </NextLink>
      )}

      {/* 2. المحتوى (يجب أن يكون z-10 ليظهر فوق الرابط الخفي) */}
      <div
        className={`flex items-start flex-col z-10 pointer-events-none ${isRtl && "items-end"
          }`}
      >
        {isNotLoggedIn &&
          <div className="flex gap-2 items-center text-[#1d1d1d] medium ">
            <span>{translateFunction('Login')}</span>
            <img alt="login" className="w-[15px] h-[15px]" src="/icons/login.svg" />
          </div>
        }
        {!isNotLoggedIn && <img className="w-[15px] h-[15px]" src="/icons/qr.svg" alt="qr" />
        }
        {!isNotLoggedIn && <div
          className={`flex ${isRtl ? "flex-row-reverse" : "flex-row"
            } items-end gap-[10px]`}
        >
          <div className="flex flex-col mt-[5px] items-start">
            <span className="medium text-[#1D1D1D] text-[14px]">
              {displayName}
            </span>
            {displayPhone && (
              <span className="regular text-[#8D8D8D] text-[12px] mt-[2px]">
                {displayPhone}
              </span>
            )}
          </div>

          {/* نجعل العناصر التفاعلية pointer-events-auto لتعمل رغم وجود الرابط الخفي */}
          {!isNotLoggedIn && <div className="pointer-events-auto">
            <VerifyUser phone={user?.phone} />
          </div>}
        </div>}

        {!isNotLoggedIn ? (
          <NextLink
            href={`/${local}/settings/profile/size`}
            isFromSetting={true}
            className="pointer-events-auto cursor-pointer whitespace-nowrap w-fit regular text-[12px] text-[#8D8D8D]"
          >
            {translateFunction("Add Size", language)}
          </NextLink>
        ) : (
          <span className="regular text-[12px] text-[#8D8D8D]">
            {/* {translateFunction("Add Size", language)} */}
          </span>
        )}
      </div>

      {/* 3. الصورة (أيضاً فوق الرابط الخفي) */}
      {!isNotLoggedIn ? (
        <NextLink
          isFromSetting={true}
          href={`/${local}/settings/profile/picture`}
          className="pointer-events-auto z-10 flex w-[70px] h-[70px] rounded-[12px] justify-center items-center cursor-pointer overflow-hidden bg-white"
          style={{ border: "1px solid #1D1D1D" }}
        >
          {isInvalidImage(user?.image) ? (
            <img
              className="w-full h-full object-cover p-2"
              src="/icons/userIcon.svg"
              alt="user profile placeholder"
            />
          ) : (
            <img
              className="w-full h-full object-cover"
              src={GetImageUrl(user?.image)}
              alt="user profile"
            />
          )}
        </NextLink>
      ) : (
        <div
          className="z-10 flex w-[70px] h-[70px] rounded-[12px] justify-center items-center overflow-hidden bg-white"
          style={{ border: "1px solid #1D1D1D" }}
        >
          <img
            className="w-full h-full object-cover p-2 bg-[#f1efef]"
            src="/icons/userIcon.svg"
            alt="user profile placeholder"
          />
        </div>
      )}
    </div>
  );
}

export default Profile;

