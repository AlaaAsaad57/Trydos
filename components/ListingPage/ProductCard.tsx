"use client";
import { memo, useEffect } from "react";
import ProductNoColors from "./ProductNoColors";
import ProductCover from "./ProductCover";
// Import Swiper styles
import "swiper/css";
import "swiper/css/bundle";
import { useDispatch, useSelector } from "react-redux";
import { InView } from "react-intersection-observer";
import Spinner from "../global/Spinner";
import { LISTING_INFO_URL, OTP_URL } from "utils/endpointConfig";
import { LogData } from "store/homepage/actions";
import { useParams } from "next/navigation";
function ProductCard({ Listing_Data_res }: { Listing_Data_res: any }) {
  const dispatch = useDispatch();
  const params = useParams();
  const products = useSelector((state: any) => state.listing.products);
  const offset = useSelector((state: any) => state.listing.offset);
  const loading = useSelector((state: any) => state.listing.loading);
  const isReachEnd = useSelector((state: any) => state.listing.isReachEnd);
  const GetNextPage = async () => {
    if (!loading) {
      dispatch({ type: "PRODUCT_LOADING" });
      let axios = (await import("axios")).default;
      await axios
        .get(
          OTP_URL +
            LISTING_INFO_URL +
            `?offset=${offset}&limit=${20}&boutique_slug=${params.categories}`
        )
        .then((data) => {
          dispatch({ type: "GET_NEXT_PRODUCT", payload: data.data.data });
        });
    }
  };

  useEffect(() => {
    LogData({
      listing_req_data: Listing_Data_res,
    });
    GetNextPage();
    dispatch({ type: "GET_PRODUCTS", payload: Listing_Data_res.body.data });
  }, []);
  return (
    <>
      <div
        className="listing-container"
        onScroll={() => {
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
                onChange={(inView, entry) => {
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
