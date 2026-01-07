import ActiveCategoryIcon from "public/svg/listing/ActiveCategoryIcon";
import { getConfiguredImage } from "utils/functions";
import { GetImageUrl } from "utils/tinyUtils";
function BrandItem({ brand, onClick, isActive }) {
  return (
    <div
      className="brand-item min-w-[81px] p-0 relative ml-2 "
      data-cy="brand-result"
      onClick={() => onClick()}
    >
      {isActive && (
        <ActiveCategoryIcon
          data-cy="IsActive"
          style={{ top: "-6px", left: "-4px", scale: "0.6" }}
          className="absolute"
        />
      )}

      <img
        src={getConfiguredImage({ src: GetImageUrl(brand.icon), height: 40 })}
        className="h-full max-h-[30px] object-contain"
      />
    </div>
  );
}

export default BrandItem;
