import { getConfiguredImage } from "utils/functions";
import { GetImageUrl } from "utils/tinyUtils";

function BoutiqueItem({ boutique, onClick, isActive }) {
  return (
    <div
      className="brand-item boutique-item relative"
      data-pw="boutique-result"
      onClick={() => onClick()}
    >
      {isActive && (
        <img
          src="/icons/ActiveCategoryIcon.svg"
          style={{ top: "-6px", left: "-4px", scale: "0.6" }}
          className="absolute"
        />
      )}
      <img
        src={getConfiguredImage({
          src: GetImageUrl(boutique?.banner?.file_path),
          width: "80",
          height: "30",
        })}
        className="rounded-xl min-w-[80px]"
      />
    </div>
  );
}

export default BoutiqueItem;
