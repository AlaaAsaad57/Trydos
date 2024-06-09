"use client";
import "styles/listing.css";
import "styles/globals.css";
import { memo, useEffect, useState } from "react";
import ProductNoColors from "./ProductNoColors";
import ProductCover from "./ProductCover";
import { useDispatch, useSelector } from "react-redux";
import { InView } from "react-intersection-observer";
import Spinner from "../global/Spinner";
import { useParams } from "next/navigation";
import homeService from "services/home";
import { dispatchRouteChangeEvent } from "Hooks/events";
function ProductCard({ Listing_Data_res }: { Listing_Data_res: any }) {
  const dispatch = useDispatch();
  const params = useParams();
  const products = useSelector((state: any) => state.listing.products);
  const [offset, setOffset] = useState(2);
  const loading = useSelector((state: any) => state.listing.loading);
  const isReachEnd = useSelector((state: any) => state.listing.isReachEnd);
  const GetNextPage = async () => {
    if (!loading && !isReachEnd) {
      dispatch({ type: "PRODUCT_LOADING" });
      await homeService.getNextProduct({
        offset: offset,
        categories: params.productCategory,
      });
      setOffset(offset + 1);
    }
  };
  useEffect(() => {
    dispatchRouteChangeEvent("completed");
    GetNextPage();
    // console.log(Listing_Data_res);
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
        {products.map((product, i) => (
          <div key={i}>
            {!product.sync_color_images && (
              <ProductNoColors product={product} />
            )}
            {product.sync_color_images && <ProductCover product={product} />}
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

export default memo(ProductCard);
