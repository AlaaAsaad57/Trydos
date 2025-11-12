import EyeIcon from "public/svg/product/EyeIcon";
import Skeleton from "react-loading-skeleton";

function ProductViews({ views }) {
  return (
    <div className="view-count flex-row align-center">
      <EyeIcon />
      {views >= 0 ? (
        <span>{views ?? "1"}</span>
      ) : (
        <span className="m-0">
          <Skeleton className="m-0" count={1} width={20} height={10} />
        </span>
      )}
    </div>
  );
}

export default ProductViews;
