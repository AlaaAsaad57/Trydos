"use client";
import NextLink from "components/global/NextLink";
import Spinner from "components/global/Spinner";
import { getConfiguredImage, translateFunction } from "utils/functions";
import { GetImageUrl } from "utils/tinyUtils";
import { WishlistItem } from "services/wishlist";

// One checklist row, in the settings visual language (#F8F8F8 / rounded-[15px]).
// The whole row navigates to the product; the remove button sits on top of it
// and stops propagation so removing never navigates. While the row is being
// removed it dims and stops accepting input — per row, so the rest of the list
// stays usable.
function ChecklistItem({
  item,
  local,
  language,
  isRtl,
  isRemoving,
  onRemove,
}: {
  item: WishlistItem;
  local: string;
  language: string;
  isRtl: boolean;
  isRemoving: boolean;
  onRemove: (productId: string) => void;
}) {
  const handleRemove = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onRemove(String(item.id));
  };

  return (
    <div
      data-cy="checklist-item"
      style={{ direction: isRtl ? "rtl" : "ltr" }}
      className={`relative w-full mt-[8px] rounded-[15px] bg-[#F8F8F8] transition-opacity duration-200 ${
        isRemoving ? "opacity-50 pointer-events-none" : ""
      }`}
    >
      <NextLink
        isFromSetting={true}
        data={{ is_product: true, ...item }}
        ariaLabel={item.name}
        data-cy="checklist-item-link"
        href={`/${local}/products/${item.slug}`}
        className={`${
          isRtl ? "flex-row-reverse" : "flex-row"
        } w-full items-center gap-[12px] p-[12px] cursor-pointer`}
      >
        <img
          data-cy="checklist-item-image"
          src={getConfiguredImage({
            src: GetImageUrl(item.image),
            width: 128,
            height: 144,
          })}
          alt={item.name}
          className="w-[64px] h-[72px] shrink-0 rounded-[10px] bg-white object-cover"
        />
        <span
          data-cy="checklist-item-name"
          className={`flex-1 text-[14px] regular text-[#1D1D1D] line-clamp-2 ${
            isRtl ? "text-right" : "text-left"
          }`}
        >
          {item.name}
        </span>
      </NextLink>

      <button
        type="button"
        data-cy="checklist-item-delete"
        aria-label={translateFunction("Remove", language)}
        aria-busy={isRemoving}
        onClick={handleRemove}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") handleRemove(e);
        }}
        className={`absolute top-[12px] ${
          isRtl ? "left-[12px]" : "right-[12px]"
        } w-[28px] h-[28px] flex-row items-center justify-center rounded-full bg-white text-[#8D8D8D] hover:text-[#1D1D1D] transition-colors cursor-pointer`}
      >
        {isRemoving ? (
          <Spinner />
        ) : (
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        )}
      </button>
    </div>
  );
}

export default ChecklistItem;
