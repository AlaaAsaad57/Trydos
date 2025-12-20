import FeaturedProductsSkeleton from "components/skeleton/loaders/FeaturedProductsSkeleton";
import MobileNavigationSkeleton from "components/skeleton/MobileNavigation";
import OfferListSkeleton from "components/skeleton/OfferList";
import StoriesSkeleton from "components/skeleton/StoriesSkeleton";
import SearchIcon from "public/svg/SearchIcon";
import "styles/globals.css";
function loading() {
  return (
    <div className="site-container items-center">
      <div
        className={`  bg-white flex-row  w-full pl-[10px] shadow-[0px_0px_6px_rgb(0,0,0,0.1)] z-[999999995]`}
      >
        <SearchIcon />
        <MobileNavigationSkeleton />
      </div>
      <StoriesSkeleton />
      <FeaturedProductsSkeleton />
      <FeaturedProductsSkeleton />
      <OfferListSkeleton />
    </div>
  );
}

export default loading;
