"use client";
import { useEffect, useRef, useState } from "react";
import Spinner from "components/global/Spinner";
import { translateFunction } from "utils/functions";
import { useParams } from "next/navigation";
import { GetRelatedProducts } from "serverRequests/listing";
import ProductCard from "components/products/ProductCard";

interface RelatedProductsInfiniteScrollProps {
  productId: number;
  currency: string;
  offset: any[];
  initialProductIds?: string[];
  pit_id?: string | null;
}

function RelatedProductsInfiniteScroll({
  productId,
  currency,
  offset,
  initialProductIds = [],
  pit_id = null,
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
  // PIT snapshot id for this carousel session (ADR-009), rotated per response.
  const pitIdRef = useRef<string | null>(pit_id);
  // Bounded auto-advance guard for all-already-seen pages (AC-9).
  const emptyPagesRef = useRef(0);
  const seenIdsRef = useRef<Set<string>>(new Set(initialProductIds));
  // Related pages are requested with limit 3 (see GetRelatedProducts).
  const PAGE_LIMIT = 3;
  const MAX_CONSECUTIVE_EMPTY_PAGES = 5;

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
    if (isFetchingRef.current || isReachEndRef.current || loading) return;
    isFetchingRef.current = true;
    setLoading(true);

    let scheduleNext = false;
    try {
      const response = await GetRelatedProducts({
        country,
        language: languageVariable,
        currency,
        offset: offsetRef.current,
        productId,
        // PIT snapshot pagination (ADR-009): carry the session snapshot id.
        pit_id: pitIdRef.current,
      });

      if (!response) {
        setTimeout(() => {
          getProductsReq();
        }, 3000);
        return;
      }

      const sameOffset = areArraysEqual(offsetRef.current, response.offset);
      // End on empty, unchanged cursor, or short (final) page — but append any
      // new items on a short page first.
      const reachedEnd =
        response.products.length === 0 ||
        sameOffset ||
        response.products.length < PAGE_LIMIT;

      const incomingIds: string[] = ((response as any).productIds || []).map(
        (id: any) => String(id),
      );
      const uniqueIndexes = incomingIds
        .map((id: string, index: number) => ({ id, index }))
        .filter(({ id }: { id: string }) => {
          if (!id || id === "undefined") return false;
          if (seenIdsRef.current.has(id)) return false;
          seenIdsRef.current.add(id);
          return true;
        })
        .map(({ index }: { index: number }) => index);

      // Hard guarantee: only append never-seen items (no whole-page fallback).
      const temp_products = uniqueIndexes
        .map((index: number) => response.products[index])
        .filter(Boolean);

      if (temp_products.length > 0) {
        setProducts((prev) => [...prev, ...temp_products]);
      }

      offsetRef.current = response.offset;
      pitIdRef.current = (response as any).pit_id ?? pitIdRef.current;
      setOffsetValue(response.offset);

      if (reachedEnd) {
        isReachEndRef.current = true;
        setIsReachEnd(true);
        return;
      }

      // All-already-seen full page → advance to the next page (bounded) so the
      // "Show More" button never appears to do nothing.
      if (temp_products.length === 0) {
        emptyPagesRef.current += 1;
        if (emptyPagesRef.current >= MAX_CONSECUTIVE_EMPTY_PAGES) {
          isReachEndRef.current = true;
          setIsReachEnd(true);
          return;
        }
        scheduleNext = true;
      } else {
        emptyPagesRef.current = 0;
      }
    } finally {
      isFetchingRef.current = false;
      setLoading(false);
    }

    if (scheduleNext) {
      setTimeout(() => {
        getProductsReq();
      }, 0);
    }
  };

  return (
    <>
      {products.map((product) => (
        <ProductCard
          key={product?.product_id ?? product?.slug}
          product={product}
          currency={currency}
          country={country}
          language={languageVariable}
          sliders={false}
        />
      ))}

      <div
        className="get-next-product regular-text color-dark-gray  flex justify-center items-end bottom-[40px]"
        data-pw="RelatedReachEnd"
      >
        {!isReachEnd ? (
          <>
            {
              <div
                className="product-container items-center justify-center min-w-[150px] max-h-[377px] bg-[#0002] align-center flex-col relative cursor-pointer"
                onClick={getProductsReq}
              >
                <div className="flex regular rounded-md p-3 items-center justify-center bg-[#5d5d5d] text-white shadow-md shadow-white">
                  {loading?<Spinner no={false} className="" />:translateFunction("Show More", languageVariable)}
                </div>
              </div>
            }
          </>
        ) : (
          <>{translate("Reach End")}</>
        )}
      </div>
    </>
  );
}

export default RelatedProductsInfiniteScroll;
