"use client";
import { useEffect, useRef, useState } from "react";
import { InView } from "react-intersection-observer";
import Spinner from "components/global/Spinner";
import { translateFunction } from "utils/functions";
import { useParams } from "next/navigation";
import { GetRelatedProducts } from "serverRequests/listing";

interface RelatedProductsInfiniteScrollProps {
  productId: number;
  currency: string;
  offset: any[];
  initialProductIds?: string[];
}

function RelatedProductsInfiniteScroll({
  productId,
  currency,
  offset,
  initialProductIds = [],
}: RelatedProductsInfiniteScrollProps) {
  const { lang }: { lang: string } = useParams();
  let [country, languageVariable] = lang.split("-");

  const translate = (key: string) => {
    return translateFunction(key, languageVariable);
  };

  const [products, setProducts] = useState<any[]>([]);
  const [offsetValue, setOffsetValue] = useState(offset);
  const [loading, setLoading] = useState(false);
  const [isReachEnd, setIsReachEnd] = useState(false);
  const isFetchingRef = useRef(false);
  const offsetRef = useRef(offset);
  const isReachEndRef = useRef(false);
  const seenIdsRef = useRef<Set<string>>(new Set(initialProductIds));

  useEffect(() => {
    offsetRef.current = offsetValue;
  }, [offsetValue]);

  useEffect(() => {
    isReachEndRef.current = isReachEnd;
  }, [isReachEnd]);

  function areArraysEqual(oldArray: any[], newArray: any[]): boolean {
    if (!oldArray || !newArray) return false;
    if (oldArray.length !== newArray.length) return false;
    for (let i = 0; i < oldArray.length; i++) {
      if (oldArray[i] !== newArray[i]) {
        return false;
      }
    }
    return true;
  }

  const getProductsReq = async () => {
    if (isFetchingRef.current || isReachEndRef.current) return;
    isFetchingRef.current = true;
    setLoading(true);

    try {
      const response = await GetRelatedProducts({
        country,
        language: languageVariable,
        currency,
        offset: offsetRef.current,
        productId,
      });

      if (!response) {
        setTimeout(() => {
          getProductsReq();
        }, 3000);
        return;
      }

      const sameOffset = areArraysEqual(offsetRef.current, response.offset);
      if (response.items.length === 0 || sameOffset) {
        isReachEndRef.current = true;
        setIsReachEnd(true);
        return;
      }

      const incomingIds = (response as any).productIds || [];
      const uniqueIndexes = incomingIds
        .map((id: string, index: number) => ({ id, index }))
        .filter(({ id }: { id: string }) => {
          if (!id) return false;
          if (seenIdsRef.current.has(id)) return false;
          seenIdsRef.current.add(id);
          return true;
        })
        .map(({ index }: { index: number }) => index);

      const temp_products =
        uniqueIndexes.length > 0
          ? uniqueIndexes.map((index: number) => response.items[index]).filter(Boolean)
          : response.items;

      if (temp_products.length > 0) {
        setProducts((prev) => [...prev, ...temp_products]);
      }

      offsetRef.current = response.offset;
      setOffsetValue(response.offset);
    } finally {
      isFetchingRef.current = false;
      setLoading(false);
    }
  };

  return (
    <>
      {products}

      <div
        className="get-next-product regular-text color-dark-gray absolute flex justify-center items-end bottom-[40px]"
        data-cy="RelatedReachEnd"
      >
        {!isReachEnd ? (
          <>
            {!loading ? (
              <InView
                threshold={0.5}
                className="spinner-container"
                as="div"
                onChange={(inView) => {
                  if (inView && !loading) {
                    getProductsReq();
                  }
                }}
              ></InView>
            ) : (
              <h2>{loading && <Spinner no={false} className="" />}</h2>
            )}
          </>
        ) : (
          <>{translate("Reach End")}</>
        )}
      </div>
    </>
  );
}

export default RelatedProductsInfiniteScroll;
