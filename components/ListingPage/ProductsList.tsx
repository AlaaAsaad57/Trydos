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
  const [offset, setOffset] = useState(2);
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
      setOffset(offset + 1);
    }
  };
  useEffect(() => {
    dispatchRouteChangeEvent("completed");
    document.documentElement.style.overflow = "initial";
    document.documentElement.scrollTop = 0;
    GetNextPage();
    console.log(Listing_Data_res);
    dispatch({ type: "GET_PRODUCTS", payload: Listing_Data_res.body.data });
  }, []);
  return (
    <>
      <div
        className="listing-container"
        onWheel={() => {
          GetNextPage();
        }}
      >
        {(
          (products.length > 0 && products) ||
          Listing_Data_res.body.data.products
        ).map((product, i) => (
          <div key={i}>
            <Product product={product} priority={i < 3} />
          </div>
        ))}
      </div>
      <div className="get-next-product">
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
  );
}

export default ProductsList;
