import { formatCount } from "utils/formatCount";

function ProductViews({ views, language = "en" }) {
  return (
    <div className="view-count flex-row align-center">
      <img src="/icons/EyeIcon.svg" />
      <span>{formatCount(views ?? 1, language)}</span>
    </div>
  );
}

export default ProductViews;
