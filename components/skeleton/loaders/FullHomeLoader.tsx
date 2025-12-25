import FeaturedProductsSkeleton from "components/skeleton/loaders/FeaturedProductsSkeleton";
import MobileNavigationSkeleton from "components/skeleton/MobileNavigation";
import OfferListSkeleton from "components/skeleton/OfferList";
import StoriesSkeleton from "components/skeleton/StoriesSkeleton";
import SearchIcon from "public/svg/SearchIcon";
import "styles/globals.css";
function loading() {
  return (
    <div
      style={{
        zIndex: "99999999999999",
        top: "100px",
      }}
      className="site-container items-center fixed max-w-[1365px] mx-auto bg-[#fafafa] min-h-screen  flex    w-screen  overflow-hidden"
    >
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
