import { formatCount } from "utils/formatCount";
import { useProductLike } from "./useProductLike";

function ProductLikeButton({
  total_likes,
  isLiked,
  productId,
  name,
  category,
  brand,
  price,
  brand_id,
  category_id,
  language = "en",
}) {
  const {
    liked: isLikedState,
    totalLikes,
    loading: likeLoading,
    toggle,
  } = useProductLike({
    total_likes,
    isLiked,
    productId,
    name,
    category,
    brand,
    price,
    brand_id,
    category_id,
  });

  const getLikesCount = () => {
    if (totalLikes > 0) return formatCount(totalLikes, language);
    return "";
  };

  return (
    <div
      className={`product-option-item flex-row ${
        likeLoading && "opacity-80 scale-90"
      } transition-all`}
      data-pw="LoveSymbol"
      onClick={toggle}
    >
      {isLikedState ? (
        <img src="/icons/HeartFill.svg" data-pw="LoveClickOnLast" />
      ) : (
        <img src="/icons/Heart.svg" />
      )}
      {<span data-pw="CountOfLoves">{getLikesCount()}</span>}
    </div>
  );
}

export default ProductLikeButton;
