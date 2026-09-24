import StoriesSkeleton from "components/skeleton/StoriesSkeleton";
import FeaturedProductsSkeleton from "components/skeleton/loaders/FeaturedProductsSkeleton";
import OfferListSkeleton from "components/skeleton/OfferList";

/**
 * In-flow home loader. Because the loader now hides the page `children` (rather
 * than overlaying only the lower area at top:350px), it renders the full
 * above-the-fold: stories → featured rows → offer list. The site navbar stays
 * visible (it lives in the layout, outside `children`).
 */
function HomeLoader() {
  return (
    <div className="w-full flex-col flex bg-[#fafafa] overflow-hidden">
      <StoriesSkeleton />
      <FeaturedProductsSkeleton />
      <FeaturedProductsSkeleton />
      <OfferListSkeleton />
    </div>
  );
}

export default HomeLoader;
