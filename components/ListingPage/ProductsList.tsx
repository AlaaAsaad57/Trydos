"use client";
import "styles/listing.css";
import "styles/globals.css";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { InView } from "react-intersection-observer";
import Spinner from "../global/Spinner";
import homeService from "services/home";
import { dispatchRouteChangeEvent } from "Hooks/events";
import Product from "./Product";
import { filterProducts } from "utils/functions";
import { useParams } from "next/navigation";
function ProductsList({
  Listing_Data_res,
  productCategory,
  boutiqueCategory,
}: {
  Listing_Data_res: any;
  boutiqueCategory: string;
  productCategory: string;
}) {
  const dispatch = useDispatch();
  const products = useSelector((state: any) => state.listing.products);

  const offset = useSelector((state: any) => state.listing.offset);

  const loading = useSelector((state: any) => state.listing.loading);
  const isReachEnd = useSelector((state: any) => state.listing.isReachEnd);
  const GetNextPage = async () => {
    if (!loading && !isReachEnd) {
      dispatch({ type: "PRODUCT_LOADING" });
      await homeService.getNextProduct({
        offset: offset,
        categories: productCategory,
        boutiqueCategory: boutiqueCategory,
      });
    }
  };
  useEffect(() => {
    dispatchRouteChangeEvent("completed");
    document.documentElement.style.overflow = "initial";
    document.documentElement.scrollTop = 0;
    GetNextProd();
    dispatch({ type: "GET_PRODUCTS", payload: Listing_Data_res.body.data });
  }, []);
  const GetNextProd = async () => {
    dispatch({ type: "PRODUCT_LOADING" });
    await homeService.getNextProduct({
      offset: offset,
      categories: productCategory,
      boutiqueCategory: boutiqueCategory,
    });
  };
  const filterEnabled = useSelector(
    (state: any) => state.listing.filterEnabled
  );
  const selectedFilter = useSelector(
    (state: any) => state.details.selectedFilter
  );
  const filters = useSelector((state: any) => state.details.filters);
  const pathName = useParams();
  const filter = () => {
    dispatch({ type: "RESET_LISTING_FILTER" });
    dispatch({ type: "PRODUCT_LOADING" });
    filterProducts({
      boutiqueId: pathName.productCategory,
      lang: pathName.lang,
      sizesAttr: filters.sizesAttr,
      callback: (products) => {
        if (offset === 1)
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
    });
  };
  return (
    <>
      {!filterEnabled && (
        <>
          <div
            className="listing-container flex"
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
              <Product key={i} product={product} priority={i < 3} i={i} />
            ))}
          </div>
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
                  <h2>{loading && <Spinner no={false} className="" />}</h2>
                )}
              </>
            ) : (
              <>Reach End</>
            )}
          </div>
        </>
      )}
    </>
  );
}

export default ProductsList;
