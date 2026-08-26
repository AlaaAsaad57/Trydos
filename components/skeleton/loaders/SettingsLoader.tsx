"use client";
import Skeleton from "react-loading-skeleton";
import { useParams } from "next/navigation";

/**
 * Settings page skeleton. Mirrors `app/(client)/[lang]/settings/page.tsx` block
 * for block — back bar, profile card, seller row, orders/wallet pair, the six
 * option rows, country/language pair — at the same sizes and spacing, so the
 * real page paints into the same boxes without shifting.
 *
 * Placeholder shapes only: no profile data, no labels, no icons. Every
 * `Skeleton` is `inline` because the library appends a `<br />` after each
 * non-inline one, which would land as a stray flex item in these rows.
 */

// Label widths roughly matching the real option labels (Settings, My Checklist,
// Terms & Conditions, Legal Information, About Us, Share App) so the column
// reads like text rather than six identical bars.
const OPTION_LABEL_WIDTHS = [64, 92, 132, 122, 68, 78];

function SettingsLoader() {
  const params = useParams();
  const lang = typeof params?.lang === "string" ? params.lang : "";
  const language = lang.split("-")[1];
  const isRtl = language === "ar" || language === "ku";
  const row = isRtl ? "flex-row-reverse" : "flex-row";

  return (
    <div
      className="flex-col w-full pt-[20px] px-[12px] flex"
      aria-hidden="true"
      data-pw="settings-loader"
    >
      {/* BackBar */}
      <div
        className={`${row} w-full min-h-[50px] h-[50px] items-center px-[12px] justify-between flex`}
      >
        <Skeleton inline width={24} height={24} borderRadius={6} />
      </div>

      {/* Profile card */}
      <div
        className={`w-full flex h-[138px] rounded-[15px] bg-[#F8F8F8] p-[12px] ${row} justify-between overflow-hidden`}
      >
        <div
          className={`flex flex-col ${isRtl ? "items-end" : "items-start"}`}
        >
          {/* QR button */}
          <Skeleton inline width={15} height={15} borderRadius={4} />

          {/* name + phone, with the verify badge beside them */}
          <div className={`flex ${row} items-end gap-[10px]`}>
            <div
              className={`flex flex-col mt-[5px] ${
                isRtl ? "items-end" : "items-start"
              }`}
            >
              <Skeleton inline width={118} height={14} borderRadius={4} />
              <span className="mt-[2px] flex">
                <Skeleton inline width={92} height={12} borderRadius={4} />
              </span>
            </div>
            <div className="flex flex-col items-center">
              <Skeleton inline width={16} height={16} borderRadius={999} />
              <span className="mt-[4px] flex">
                <Skeleton inline width={38} height={10} borderRadius={4} />
              </span>
            </div>
          </div>

          {/* "Add Size" */}
          <span className="mt-[8px] flex">
            <Skeleton inline width={54} height={12} borderRadius={4} />
          </span>
        </div>

        {/* avatar */}
        <Skeleton inline width={70} height={70} borderRadius={12} />
      </div>

      {/* Seller row — matches GoToSellerDashBoard's h-[50px] my-[12px] box */}
      <div className="my-[12px] flex w-full">
        <Skeleton inline width="100%" height={50} borderRadius={15} />
      </div>

      {/* Orders + Wallet */}
      <div className={`flex w-full ${row} mt-[18px] gap-[12px]`}>
        {[0, 1].map((i) => (
          <div
            key={i}
            className={`flex-col w-1/2 h-[94px] bg-[#F8F8F8] rounded-[12px] p-[12px] ${
              isRtl ? "items-end" : ""
            }`}
          >
            <Skeleton inline width={28} height={25} borderRadius={6} />
            <span className="mt-[4px] flex">
              <Skeleton inline width={62} height={14} borderRadius={4} />
            </span>
            <span className="mt-[4px] flex">
              <Skeleton inline width={48} height={12} borderRadius={4} />
            </span>
          </div>
        ))}
      </div>

      {/* Option rows */}
      <div className="flex-col mt-[8px] flex w-full">
        {OPTION_LABEL_WIDTHS.map((width, i) => (
          <div
            key={i}
            className={`w-full ${row} mt-[4px] h-[53px] rounded-[15px] bg-[#f8f8f8] px-[12px] items-center flex`}
          >
            <Skeleton inline width={25} height={25} borderRadius={6} />
            <span className={`flex ${isRtl ? "mr-[12px]" : "ml-[12px]"}`}>
              <Skeleton inline width={width} height={14} borderRadius={4} />
            </span>
          </div>
        ))}
      </div>

      {/* Country + Language */}
      <div className={`${row} mt-[12px] gap-[12px] flex w-full`}>
        {[0, 1].map((i) => (
          <div
            key={i}
            className={`${row} w-1/2 h-[53px] bg-[#F8F8F8] gap-[12px] rounded-[15px] px-[12px] items-center flex`}
          >
            <Skeleton inline width={25} height={16} borderRadius={3} />
            <Skeleton inline width={72} height={14} borderRadius={4} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default SettingsLoader;
