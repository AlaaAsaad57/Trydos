import EyeIcon from "public/svg/product/EyeIcon";

function ProductViews({ views }) {
  return (
    <div className="view-count flex-row align-center">
      <EyeIcon />
      <span>{views ?? "1"}</span>
    </div>
  );
}

export default ProductViews;
