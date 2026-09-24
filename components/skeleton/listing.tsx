import "styles/listing-components.css";
import Skeleton from "react-loading-skeleton";
import Image from "next/image";
import { getConfiguredImage } from "utils/functions";
import { GetImageUrl } from "utils/tinyUtils";

// Filter circles row — mirrors FilterList → FilterItemsRow → FilterItem so the
// skeleton occupies the exact same layout (boutique-category-filter / 103px row,
// category-circle + category-text-container) and never shifts when real filters
// swap in.
const FilterCirclesRow = ({ count = 10 }: { count?: number }) => (
  <div className={`w-full relative flex-row items-center pl-3.75`}>
    <div className="flex-row flex ml-11.25 items-center pr-5 justify-start align-start filter-container overflow-auto scroll-smooth">
      <div className="boutique-category-filter flex-row">
        <div className="category-row-container flex-row">
          {Array.from({ length: count }).map((_, index) => (
            <div
              key={index}
              className="category-circle flex-col align-center extended-circle"
            >
              <div className="relative w-[70px] h-[70px] z-10">
                <Skeleton width={70} height={70} borderRadius={"50%"} />
              </div>
              <div className="category-text-container flex-col align-center max-w-[70px]">
                <Skeleton width={50} height={10} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

// Single product card — mirrors ProductWrapper: product-container (200×377)
// with the product-container-slider image area, product-body title and
// product-footer price, so cards line up 1:1 with the rendered grid.
export const ProductCardSkeleton = () => (
  <div className="relative flex">
    <div className="product-container align-center flex-col relative pb-[12px]">
      <div className="product-container-slider h-[290px] duration-300 w-full relative">
        <Skeleton
          width={200}
          height={290}
          borderRadius={15}
          style={{ display: "block" }}
        />
      </div>
      <div className="product-body pl-[13px] pr-[15px] z-10 flex-1 mt-[8px] w-full flex-col align-start justify-start max-h-[60px] min-h-[30px]">
        <Skeleton width={120} height={12} />
      </div>
      <div className="product-footer justify-between pl-[17.5px] pr-[15px] left-0 bottom-[10px] absolute w-full flex-row align-center max-h-[30px]">
        <Skeleton width={60} height={12} />
      </div>
    </div>
  </div>
);

// Product grid — mirrors ProductListServer's listing-container wrapper exactly
// (gaps, justify-center, padding) so the swap to real products is shift-free.
const ProductGridSkeleton = ({ count = 8 }: { count?: number }) => (
  <div
    className={
      "flex flex-row listing-container mt-2 bg-[#f4f4f4] gap-x-[10px] gap-y-[18px] justify-center min-w-full min-h-[48vh] relative pb-[390px] max-w-[1310px] flex-wrap"
    }
  >
    {Array.from({ length: count }).map((_, index) => (
      <ProductCardSkeleton key={index} />
    ))}
  </div>
);

function ListingSkeleton({
  forProducts,
  withBanners,
  justFilters,
  boutique,
  isForSearch,
}: any) {
  if (justFilters) {
    return <FilterCirclesRow />;
  }
  return (
    <>
      {forProducts !== true && withBanners && (
        <>
          {!isForSearch && (
            <div className="filter-listing-bar relative flex-row align-center  w-full h-[50px] pl-[15px] pr-[20px] justify-between bg-white z-10">
              <div className="back-icon">
                <Skeleton width={20} height={20} borderRadius={"50%"} />
              </div>
              <div className="filter-bar-options flex-row align-center justify-between w-[170px]">
                <div className="filter-option">
                  <Skeleton width={20} height={20} borderRadius={"50%"} />
                </div>
                <div className="filter-option">
                  <Skeleton width={20} height={20} borderRadius={"50%"} />
                </div>
                <div className="filter-option">
                  <Skeleton width={20} height={20} borderRadius={"50%"} />
                </div>
                <div className="filter-option">
                  <Skeleton width={20} height={20} borderRadius={"50%"} />
                </div>
              </div>
            </div>
          )}
          <div className={`boutique-header flex-col align-center`}>
            <div className="boutique-top-info flex-col">
              <div className="boutique-logo-container flex-row align-center">
                {boutique?.icon ? (
                  <>
                    <img
                      width={130}
                      height={20}
                      src={GetImageUrl(boutique?.icon)}
                    />
                  </>
                ) : (
                  <Skeleton
                    className="w-fu"
                    width={130}
                    height={20}
                    borderRadius={"30"}
                  />
                )}
              </div>
              <div className="boutique-text">
                {boutique?.name ? (
                  <>{boutique.name}</>
                ) : (
                  <Skeleton width={200} height={10} />
                )}
              </div>
            </div>
            <div className="boutique-photo-holder">
              <div className="offer-slider-container">
                <div className="offer-slide-item" style={{ width: "100%" }}>
                  <div className="image-offer">
                    <div
                      className="image-inner-shadow"
                      style={{ height: "100%" }}
                    />

                    {boutique?.banners && boutique?.banners?.length > 0 ? (
                      <>
                        <Image
                          loading={"eager"}
                          fetchPriority={"high"}
                          style={{ borderRadius: "15px", height: "auto" }}
                          className="OfferImage object-cover"
                          src={getConfiguredImage({
                            src: GetImageUrl(boutique.banners[0]?.file_path),
                            height: 342,
                            width: 900,
                          })}
                          width={380}
                          height={135}
                          alt="offer"
                        />
                      </>
                    ) : (
                      <Skeleton
                        className="w-full h-full"
                        width={380}
                        height={135}
                        borderRadius={"30"}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
            <FilterCirclesRow />
          </div>
        </>
      )}
      <ProductGridSkeleton />
    </>
  );
}

export default ListingSkeleton;
