"use client";
import "styles/listing.css";
import "styles/globals.css";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { InView } from "react-intersection-observer";
import Spinner from "../global/Spinner";
import homeService from "services/home";
import { dispatchRouteChangeEvent } from "utils/events";
import Product from "./Product";
import { filterProducts, translateFunction } from "utils/functions";
import { useParams, useSearchParams } from "next/navigation";
import ListingSkeleton from "components/skeleton/listing";
import AddToCartWidget from "components/Cart/AddToCartWidget";
import { LogData } from "store/homepage/actions";

function ProductsList({
  Listing_Data_res,
  productCategory,
  boutiqueCategory,
  response,
}: {
  Listing_Data_res: any;
  boutiqueCategory: string;
  productCategory: string;
  response?: any;
}) {
  const dispatch = useDispatch();
  let { lang } = useParams();
  // @ts-ignore
  let languageVariable = lang.split("-")[1];
  const translate = (key, lang?) => {
    return translateFunction(key, languageVariable);
  };
  const products = useSelector(
    (state: StateInterface) => state.listing.products
  );
  const AddToCartOption = useSelector(
    (state: StateInterface) => state.cart.AddToCartOption
  );

  const offset = useSelector((state: StateInterface) => state.listing.offset);
  const loading = useSelector((state: StateInterface) => state.listing.loading);
  const skeleton = useSelector(
    (state: StateInterface) => state.listing.skeleton
  );
  const isReachEnd = useSelector(
    (state: StateInterface) => state.listing.isReachEnd
  );
  const SearchParams = useSearchParams();
  const GetNextPage = async () => {
    if (!loading && !isReachEnd) {
      dispatch({ type: "PRODUCT_LOADING" });
      await homeService.getNextProduct({
        offset: offset,
        categories:
          SearchParams.get("boutique_slugs") ||
          (productCategory !== "listing" ? productCategory : null),
        boutiqueCategory: boutiqueCategory,
      });
    }
  };
  useEffect(() => {
    LogData(response);
    dispatchRouteChangeEvent("completed");
    document.documentElement.style.overflow = "initial";
    document.documentElement.scrollTop = 0;

    dispatch({ type: "GET_PRODUCT", payload: Listing_Data_res.body.data });
    setTimeout(() => {
      GetNextProd();
    }, 2000);
  }, []);
  const GetNextProd = async () => {
    dispatch({ type: "PRODUCT_LOADING" });
    await homeService.getNextProduct({
      offset: offset ?? Listing_Data_res.body.data.offset,
      categories:
        SearchParams.get("boutique_slugs") ||
        (productCategory !== "listing" ? productCategory : null),
      boutiqueCategory: boutiqueCategory,
    });
  };
  const filterEnabled = useSelector(
    (state: StateInterface) => state.listing.filterEnabled
  );
  const selectedFilter = useSelector(
    (state: StateInterface) => state.details.selectedFilter
  );
  const filters = useSelector((state: StateInterface) => state.details.filters);
  const pathName = useParams();
  const filter = () => {
    dispatch({ type: "RESET_LISTING_FILTER" });
    dispatch({ type: "PRODUCT_LOADING" });

    filterProducts({
      boutiqueId:
        (SearchParams.get("boutique_slugs") &&
          SearchParams.get("boutique_slugs")) ||
        pathName.productCategory,
      lang: pathName.lang,
      sizesAttr: filters.sizesAttr,
      callback: (products) => {
        if (offset === null)
          dispatch({ type: "GET_PRODUCT", payload: { products } });
        else
          dispatch({
            type: "GET_NEXT_PRODUCT",
            payload: { products },
          });
      },
      storeCallback: () => {},
      offset: offset,
      newFiltersCallback: ({ filtersVar }) => {
        dispatch({ type: "EDIT-FILTER", payload: filtersVar });
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
                  (products.length === 0 && products) ||
                  Listing_Data_res?.body?.data?.products?.length === 0
                    ? "listing-container-empty"
                    : "listing-container flex"
                }
                onWheelCapture={() => {
                  if (!selectedFilter.filtered) GetNextPage();
                  else if (!loading && !isReachEnd) {
                    filter();
                  }
                }}
              >
                {(
                  (products.length > 0 && products) ||
                  Listing_Data_res?.body?.data?.products
                )?.map((product, i) => (
                  <Product
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
                <div className="get-next-product regular-text color-dark-gray">
                  {!isReachEnd ? (
                    <>
                      {" "}
                      {!loading ? (
                        <InView
                          className="spinner-container"
                          as="div"
                          onChange={(inView) => {
                            if (inView && !loading) {
                              GetNextPage();
                            }
                          }}
                        ></InView>
                      ) : (
                        <h2>
                          {loading && <Spinner no={false} className="" />}
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
