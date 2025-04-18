"use client";
import "styles/listing.css";
import "styles/globals.css";
import { useEffect } from "react";

import { InView } from "react-intersection-observer";
import Spinner from "../global/Spinner";
import homeService from "services/home";
import { dispatchRouteChangeEvent } from "utils/events";
import Product from "./Product";
import { filterProducts, translateFunction } from "utils/functions";
import { useParams, useSearchParams } from "next/navigation";
import ListingSkeleton from "components/skeleton/listing";
import AddToCartWidget from "components/Cart/AddToCartWidget";
import { CurrencyApi } from "models/Api";
import { useAppStore } from "store";

function ProductsList({
  Listing_Data_res,
  productCategory,
  currency,
  boutiqueCategory,
}: {
  Listing_Data_res: any;
  currency: CurrencyApi["data"]["currency"];
  boutiqueCategory: string;
  productCategory: string;
}) {
  const {
    editFilter,
    getProducts,
    setLoadingProducts,
    getNextProducts,
    resetBoutique,
    resetListingFilter,
    products,
    AddToCartOption,
    offset,
    skeleton,
    listing_loading,
    isReachEnd,
    filterEnabled,
    filters,
    selectedFilter,
  } = useAppStore();

  let { lang } = useParams();
  // @ts-ignore
  let languageVariable = lang.split("-")[1];
  const translate = (key, lang?) => {
    return translateFunction(key, languageVariable);
  };
  const SearchParams = useSearchParams();
  const GetNextPage = async () => {
    if (!listing_loading && !isReachEnd) {
      setLoadingProducts(true);
      await homeService.getNextProduct({
        lang: lang,
        offset: offset,
        categories:
          SearchParams.get("boutique_slugs") ||
          (productCategory !== "listing" ? productCategory : null),
        boutiqueCategory: boutiqueCategory,
        noFilter: true,
      });
    }
  };
  useEffect(() => {
    dispatchRouteChangeEvent("completed");
    document.documentElement.style.overflow = "initial";
    document.documentElement.scrollTop = 0;
    resetBoutique();
    getProducts(Listing_Data_res.body.data);

    setTimeout(() => {
      GetNextProd();
    }, 2000);
  }, []);
  const GetNextProd = async () => {
    setLoadingProducts(true);
    await homeService.getNextProduct({
      lang: lang,
      offset: offset ?? Listing_Data_res.body.data.offset,
      categories:
        SearchParams.get("boutique_slugs") ||
        (productCategory !== "listing" ? productCategory : null),
      boutiqueCategory: boutiqueCategory,
      noFilter: true,
    });
  };

  const pathName = useParams();
  const filter = () => {
    resetListingFilter();
    setLoadingProducts(true);

    filterProducts({
      boutiqueId:
        (SearchParams.get("boutique_slugs") &&
          SearchParams.get("boutique_slugs")) ||
        pathName.productCategory,
      lang: pathName.lang,
      sizesAttr: filters.sizesAttr,
      callback: (products) => {
        if (offset === null) Listing_Data_res.body.data({ products });
        else getNextProducts({ products });
      },
      storeCallback: () => {},
      offset: offset,
      newFiltersCallback: ({ filtersVar }) => {
        editFilter(filtersVar);
      },
      searchText: selectedFilter.searchText,
    });
  };

  return (
    <>
      {!filterEnabled && (
        <>
          {skeleton ? (
            <>
              <ListingSkeleton forProducts={true} />
            </>
          ) : (
            <>
              <div
                className={
                  products?.length === 0 &&
                  Listing_Data_res?.body?.data?.products?.length === 0
                    ? "listing-container-empty"
                    : "listing-container flex pb-[350px] max-w-[1310px]"
                }
                data-cy="allCategory"
                onWheelCapture={() => {
                  if (!selectedFilter.filtered) GetNextPage();
                  else if (!listing_loading && !isReachEnd) {
                    filter();
                  }
                }}
              >
                {(
                  (products.length > 0 && products) ||
                  Listing_Data_res?.body?.data?.products
                )?.map((product, i) => (
                  <Product
                    currency={currency}
                    key={product.id}
                    product={product}
                    priority={i < 3}
                    i={i}
                  />
                ))}

                {products.length === 0 &&
                  !(Listing_Data_res?.body?.data?.products?.length > 0) && (
                    <div className="flex p-3 h-10 justify-center items-center light text-[#5d5d5d] text-[14px]">
                      {translate("No Results Found")}
                    </div>
                  )}
              </div>
              {(products.length > 0 ||
                Listing_Data_res?.body?.data?.products?.length > 0) && (
                <div
                  className="get-next-product regular-text color-dark-gray"
                  data-cy="ReachEnd"
                >
                  {!isReachEnd ? (
                    <>
                      {" "}
                      {!listing_loading ? (
                        <InView
                          className="spinner-container"
                          as="div"
                          onChange={(inView) => {
                            if (inView && !listing_loading) {
                              GetNextPage();
                            }
                          }}
                        ></InView>
                      ) : (
                        <h2>
                          {listing_loading && (
                            <Spinner no={false} className="" />
                          )}
                        </h2>
                      )}
                    </>
                  ) : (
                    <>{translate("Reach End")}</>
                  )}
                </div>
              )}
            </>
          )}
        </>
      )}
      {AddToCartOption.enable && <AddToCartWidget />}
    </>
  );
}

export default ProductsList;
