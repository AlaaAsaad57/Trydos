"use client";
import { useEffect, useState } from "react";
import { LogError, translateFunction } from "utils/functions";
import auth from "services/auth";
import FeaturedProductsSkeleton from "components/skeleton/loaders/FeaturedProductsSkeleton";
import { useAppStore } from "store";
import Spinner from "components/global/Spinner";
import { showErrorMessage } from "components/global/AddToCartMessage";
import { GetNextRecommendations } from "serverRequests/home";
function RecomendedProducts({ lang, InitialOffset, userId }) {
  const { user } = useAppStore();
  const [products, setProducts] = useState([]);
  const [offset, setOffset] = useState(InitialOffset ?? []);
  const [totalSize, setTotalSize] = useState(Infinity);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadMore = async () => {
    try {
      setLoadingMore(true);
      let res = await GetNextRecommendations({
        country: country,
        language: language,
        limit: 7,
        offset: JSON.stringify(offset),
        userId: auth.UserID() ?? user.id,
      });

      if (res.items?.length === 0) {
        setTotalSize(products.length);
      }
      setOffset(res.offset);
      setProducts([...products, ...res.items]);
      setLoadingMore(false);
    } catch (error) {
      showErrorMessage(
        translateFunction("Failed To Load Products Retring in 3 seconds"),
      );
      LogError({
        error: error,
        scenario: "Error In loadMore Recomended in RecommendedProducts",
      });
    }
  };
  useEffect(() => {
    if (user && String(user?.id) !== String(userId)) {
      setOffset([]);
      setTotalSize(Infinity);
    }
  }, [user]);

  const [country, language] = lang.split("-");
  if (loading) return <FeaturedProductsSkeleton />;

  return (
    <>
      {products}
      {products?.length !== totalSize && (
        <div
          onClick={() => {
            if (!loadingMore) {
              loadMore();
            }
          }}
          className="product-container items-center justify-center min-w-[150px] max-h-[377px] bg-[#0002]  align-center flex-col relative"
        >
          <div className="flex regular rounded-md p-3 items-center justify-center bg-[#5d5d5d] text-white shadow-md shadow-[#fff]">
            {loadingMore ? (
              <Spinner />
            ) : (
              translateFunction("Show More", lang.split("-")[1])
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default RecomendedProducts;
