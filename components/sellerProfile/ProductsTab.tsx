"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { getProductsAndFiltersFromElastic } from "services/elastic/elasticSearch";
import { useParams } from "node_modules/next/navigation";
import { getConfiguredImage, RoundPrice } from "utils/functions";
import { getCurrency, GetImageUrl } from "utils/tinyUtils";
import { useAppStore } from "store";

// Adjust this import path to where getProductsAndFilters lives in your repo

function ProductsTab({ sellerId }: { sellerId: string }) {
  const LIMIT = 8;
  const { lang } = useParams();
  const { setCurrency, currency } = useAppStore();
  const [country, language] = (lang as string).split("-");
  const [products, setProducts] = useState<any[]>([]);
  const [offset, setOffset] = useState<any>(null);
  const [total, setTotal] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPage = async (limit: number) => {
    setLoading(true);
    setError(null);
    try {
      // adapt call shape if your function API differs
      const res = await getProductsAndFiltersFromElastic({
        country: country,
        limit,
        search_after: offset,
        filters: { sellerId },
        language_code: language,
        noFilters: true,
      });

      // expected: { products: Product[], total: number } or similar
      const dataProducts: any[] = res.products ?? [];
      const dataTotal: number = res.total_size;
      if (res.offset === null || res.offset.length === 0) {
        setProducts(dataProducts);
      } else {
        setProducts((p) => [...p, ...dataProducts]);
        setOffset(res.offset);
      }
      setTotal(dataTotal);
    } catch (err: any) {
      console.error(err);
      setError(err?.message ?? "Failed to load products");
    } finally {
      setLoading(false);
    }
  };
  const initialPage = async () => {
    setLoading(true);
    setOffset(null);
    setProducts([]);
    await getCurrency({
      callback: (data) => {
        setCurrency(data.currency);
      },
    });
    setTotal(null);
    await fetchPage(LIMIT);
    setLoading(false);
  };
  useEffect(() => {
    // reset when seller changes
    initialPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sellerId]);

  const loadMore = async () => {
    await fetchPage(LIMIT);
  };
  return (
    <div>
      {error && <div className="text-red-600 mb-4">{error}</div>}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {products.map((p) => (
          <div
            key={p.id}
            className="bg-white rounded-lg shadow p-3 flex flex-col"
          >
            <div className="w-full h-[200px] bg-gray-100 rounded overflow-hidden mb-3 flex items-center justify-center">
              <Image
                src={getConfiguredImage({
                  src: GetImageUrl(p.images?.[0]),
                  width: 400,
                  height: 300,
                })}
                alt={p.name}
                width={400}
                height={300}
                className="object-cover w-full h-full"
              />
            </div>

            <div className="flex-1">
              <h3 className="text-sm font-medium text-gray-800 mb-1 line-clamp-2">
                {p.name}
              </h3>

              <div className="flex items-center gap-3 mb-2">
                {/* colors */}
                <div className="flex items-center gap-2">
                  {(p.colors ?? []).slice(0, 5).map((c, i) => (
                    <span
                      key={i}
                      className="w-4 h-4 rounded-full border"
                      style={{ backgroundColor: c.color }}
                      title={c}
                    />
                  ))}
                  {(p.colors ?? []).length > 5 && (
                    <span className="text-xs text-gray-500">
                      +{(p.colors ?? []).length - 5}
                    </span>
                  )}
                </div>

                {/* status */}
                {/* {p.seller_status && (
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full ml-auto ${
                      p?.seller_status?.toLowerCase() === "approved"
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {p.seller_status}
                  </span>
                )} */}
              </div>

              {/* price */}
              <div className="mt-2">
                {p?.offer_price != null ? (
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg font-semibold text-gray-900">
                      {currency?.symbol}
                      {RoundPrice({
                        num: p.offer_price,
                      })}
                    </span>
                    {p.price != null && (
                      <span className="text-sm text-gray-400 line-through">
                        {currency?.symbol}
                        {RoundPrice({
                          num: p.price,
                        })}
                      </span>
                    )}
                  </div>
                ) : p.price != null ? (
                  <span className="text-lg font-semibold text-gray-900">
                    {currency?.symbol}
                    {RoundPrice({
                      num: p.price,
                    })}
                  </span>
                ) : (
                  <span className="text-sm text-gray-500">
                    Price not available
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}

        {products.length === 0 && !loading && (
          <div className="col-span-full text-center text-gray-500 py-8">
            No products found.
          </div>
        )}
      </div>

      <div className="mt-6 flex justify-center">
        {loading ? (
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded-md"
            disabled
          >
            Loading...
          </button>
        ) : total != null && products.length < total ? (
          <button
            onClick={loadMore}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
          >
            Load more
          </button>
        ) : null}
      </div>
    </div>
  );
}

export default ProductsTab;
