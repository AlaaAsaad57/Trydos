import NextLink from "components/global/NextLink";
import VerifyUser from "./VerifyUser";
import { GetImageUrl, translateFunction } from "utils/server";

async function Profile({ isRtl, language, local, SafeUserProfile }) {
  return (
    // الحاوية الرئيسية الآن Div وليست Link
    <div
      className={`w-full relative flex h-[138px] rounded-[15px] bg-[#F8F8F8] p-[12px] ${
        isRtl ? "flex-row-reverse" : "flex-row"
      } justify-between overflow-hidden`}
    >
      {/* 1. الرابط الخفي الذي يغطي البطاقة بالكامل (للذهاب للبروفايل) */}
      <NextLink
        isFromSetting={true}
        href={`/${local}/settings/profile`}
        className="absolute inset-0 z-0"
        aria-label="View Profile"
      >
        <></>
      </NextLink>

      {/* 2. المحتوى (يجب أن يكون z-10 ليظهر فوق الرابط الخفي) */}
      <div
        className={`flex items-start flex-col z-10 pointer-events-none ${
          isRtl && "items-end"
        }`}
      >
        <img className="w-[15px] h-[15px]" src="/icons/qr.svg" alt="qr" />

        <div
          className={`flex ${
            isRtl ? "flex-row-reverse" : "flex-row"
          } items-end gap-[10px]`}
        >
          <div className="flex flex-col mt-[5px] items-start">
            <span className="medium text-[#1D1D1D] text-[14px]">
              {SafeUserProfile?.name}
            </span>
            <span className="regular text-[#8D8D8D] text-[12px] mt-[2px]">
              + {SafeUserProfile?.phone?.replace("+", "")}
            </span>
          </div>

          {/* نجعل العناصر التفاعلية pointer-events-auto لتعمل رغم وجود الرابط الخفي */}
          <div className="pointer-events-auto">
            <VerifyUser
              phone={SafeUserProfile?.phone}
              is_phone_verified={SafeUserProfile?.is_phone_verified}
            />
          </div>
        </div>

        <NextLink
          href={`/${local}/settings/profile/size`}
          isFromSetting={true}
          className="pointer-events-auto cursor-pointer whitespace-nowrap w-fit regular text-[12px] text-[#8D8D8D] "
        >
          {translateFunction("Add Size", language)}
        </NextLink>
      </div>

      {/* 3. الصورة (أيضاً فوق الرابط الخفي) */}
      <NextLink
        isFromSetting={true}
        href={`/${local}/settings/profile/picture`}
        className="pointer-events-auto z-10 flex w-[70px] h-[70px] rounded-[12px] justify-center items-center cursor-pointer overflow-hidden bg-white"
        style={{ border: "1px solid #1D1D1D" }}
      >
        {SafeUserProfile?.image ? (
          <img
            className="w-full h-full object-cover"
            src={GetImageUrl(SafeUserProfile?.image)}
            alt="user profile"
          />
        ) : (
          <span className="bold text-[20px] text-[#1D1D1D]">...</span>
        )}
      </NextLink>
    </div>
  );
}

export default Profile;
