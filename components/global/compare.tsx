"use client";
import React, { useCallback, useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";

import {
  translateFunction,
  RoundPrice,
  getConfiguredImage,
} from "utils/functions";
import AsyncSelectCustom from "./AsyncSelectCustom";
import Link from "next/link";
import CompareLoadingWidget from "./CompareLoadingWidget";

import { useAppStore } from "store";
import NextLink from "./NextLink";
import { GetImageUrl } from "utils/tinyUtils";
import { ComparePageComponentPropsType } from "models/componentType/compareTypes/ComparePageComponentPropsType";
import { showErrorNotification } from "@/store/notifications/reducer";
import {
  getCookie,
  setCookie,
  deleteCookie,
} from "utils/cookies/cookie-manager";
const ComparePage = ({
  showInstantLoading = true,
}: ComparePageComponentPropsType) => {
  const { currency, setIsNavigating } = useAppStore();
  const searchParams = useSearchParams();
  const [product1, setProduct1] = useState<any>(null);
  const [product2, setProduct2] = useState<any>(null);
  const [loading1, setLoading1] = useState(false);
  const [loading2, setLoading2] = useState(false);
  const [initialLoading, setInitialLoading] = useState(showInstantLoading);
  const { lang } = useParams();
  // @ts-ignore
  let languageVariable = lang.split("-")[1];
  const isRtl = languageVariable === "ar" || languageVariable === "ku";
  useEffect(() => {
    setIsNavigating(false);
    const { f_p, s_p } = {
      f_p: searchParams.get("f_p"),
      s_p: searchParams.get("s_p"),
    };

    // If URL has less than two slugs, check cookies
    if (!f_p || !s_p) {
      const storedFp = getCookie<string>("f_p");
      const storedSp = getCookie<string>("s_p");

      if (storedFp || storedSp) {
        setInitialLoading(true);
        const promises = [];

        if (storedFp) {
          promises.push(
            handleProductSelect(storedFp, setProduct1, setLoading1, true)
          );
        }
        if (storedSp) {
          promises.push(
            handleProductSelect(storedSp, setProduct2, setLoading2, false)
          );
        }

        Promise.all(promises).finally(() => {
          setInitialLoading(false);
        });
        return;
      }
      if (!f_p && !s_p && !storedFp && !storedSp) {
        setInitialLoading(false);
      }
    }

    // Original URL-based logic
    if (f_p && s_p) {
      setInitialLoading(true);
      Promise.all([
        handleProductSelect(f_p, setProduct1, setLoading1, true),
        handleProductSelect(s_p, setProduct2, setLoading2, false),
      ]).finally(() => {
        setInitialLoading(false);
      });
    } else if (f_p) {
      setInitialLoading(true);
      handleProductSelect(f_p, setProduct1, setLoading1, true).finally(() => {
        setInitialLoading(false);
      });
    } else if (s_p) {
      setInitialLoading(true);
      handleProductSelect(s_p, setProduct2, setLoading2, false).finally(() => {
        setInitialLoading(false);
      });
    }
  }, []);

  const handleSearchChange = (
    selectedOption: { label: string; value: string } | null,
    setProduct: (product: any | null) => void,
    setLoading: (loading: boolean) => void,
    isFirstProduct: boolean
  ) => {
    if (!selectedOption) {
      setProducts([]);
      return;
    }
    handleProductSelect(
      selectedOption.value,
      setProduct,
      setLoading,
      isFirstProduct
    );
  };

  const [searchLoading, setSearchLoading] = useState(false);
  const [country, language] = (lang as string)?.split("-");

  const searchFunction = async (inputValue: string) => {
    if (!inputValue || inputValue.trim().length === 0) {
      return [];
    }

    try {
      const params = new URLSearchParams();
      params.set("search_text", inputValue.trim());
      params.set("filters_offset", "1");
      params.set("limit", "10");
      params.set("noFilters", "true");
      params.set("noProducts", "false");
      const response = await fetch(`/api/products/searchInCatalog?${params}`, {
        method: "GET",
        headers: {
          country: country || "sy",
          language: language || "en",
        },
      });

      if (!response.ok) {
        throw new Error("Search request failed");
      }

      const result = await response.json();
      return result.data?.products || [];
    } catch (error) {
      console.error("Search error:", error);
      return [];
    }
  };

  const [products, setProducts] = useState<any[]>([]);

  const GetProductData = async (slug: string) => {
    try {
      let DETAILS_URL = "/web/product/globalDetails";
      let QTY_URL = "/web/product/qtyPriceDetails";
      let res = await fetch(
        process.env.NEXT_PUBLIC_BACKEND_URL + DETAILS_URL + `/${slug}?lang=en`,
        {
          method: "GET",
          headers: {
            country: lang.toString().split("-")[0],
            lang: lang.toString().split("-")[1],
          },
        }
      );
      if (!res.ok) throw new Error("Product not found");
      const globalDetails = await res.json();
      let res1 = await fetch(
        process.env.NEXT_PUBLIC_BACKEND_URL + QTY_URL + `/${slug}?lang=en`,
        {
          method: "GET",
          headers: {
            country: lang.toString().split("-")[0],
            lang: lang.toString().split("-")[1],
          },
        }
      );
      if (!res1.ok) throw new Error("Product not found");
      const QtyDetails = await res1.json();
      return { ...globalDetails.data, ...QtyDetails.data };
    } catch (error) {
      throw new Error("Product not found");
    }
  };

  const handleProductSelect = async (
    slug: string,
    setProduct: (product: any | null) => void,
    setLoading: (loading: boolean) => void,
    isFirstProduct: boolean
  ) => {
    setLoading(true);
    try {
      const product = await GetProductData(slug);
      setProduct(product);
      const option = {
        label: product.name,
        value: product.slug,
        images:
          product?.sync_color_images?.[0].images[0] ?? product?.images?.[0],
        price: product.price,
      };
      setProducts([option]);

      const currentParams = new URLSearchParams(window.location.search);
      if (isFirstProduct) {
        currentParams.set("f_p", slug);
        setCookie("f_p", slug);
      } else {
        currentParams.set("s_p", slug);
        setCookie("s_p", slug);
      }
      window.history.replaceState(
        {},
        "",
        `${window.location.pathname}?${currentParams.toString()}`
      );
    } catch (error) {
      console.error("Error fetching product:", error);
      const currentParams = new URLSearchParams(window.location.search);
      if (isFirstProduct) {
        currentParams.delete("f_p");
        deleteCookie("f_p");
        setProduct1(null);
      } else {
        currentParams.delete("s_p");
        deleteCookie("s_p");
        setProduct2(null);
      }
      window.history.replaceState(
        {},
        "",
        `${window.location.pathname}?${currentParams.toString()}`
      );
      showErrorNotification(
        translateFunction(
          "One of the products was not found. Please try searching for a different product."
        )
      );
    } finally {
      setLoading(false);
    }
  };

  const loadOptions = (
    inputValue: string,
    callback: (options: any[]) => void
  ) => {
    const options =
      products?.map((s) => ({ label: s.name, value: s.slug })) || [];
    callback(options);
    return Promise.resolve(options);
  };
  const debounce = <T extends (...args: any[]) => Promise<void>>(
    func: T,
    delay: number
  ) => {
    let timeout: NodeJS.Timeout;
    return async (...args: Parameters<T>): Promise<void> => {
      if (timeout) clearTimeout(timeout);
      return new Promise((resolve) => {
        timeout = setTimeout(async () => {
          await func(...args);
          resolve();
        }, delay);
      });
    };
  };
  const debouncedChangeHandler = useCallback(
    debounce(async (value: string) => {
      if (!value || value.trim().length === 0) {
        setProducts([]);
        setSearchLoading(false);
        return;
      }
      setSearchLoading(true);
      try {
        const productsVar = await searchFunction(value);
        setProducts(
          productsVar?.map((p) => ({
            label: p.name,
            value: p.slug,
            images:
              p?.sync_color_images?.[0]?.images?.[0] ||
              p.images?.[0]?.file_path ||
              p.thumbnail?.file_path ||
              "",
            price: p.price,
          })) || []
        );
      } catch (error) {
        console.error("Search error:", error);
        setProducts([]);
      } finally {
        setSearchLoading(false);
      }
    }, 500),
    [language, country]
  );

  const LoadingCell = () => (
    <div className="animate-pulse flex space-x-4">
      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
    </div>
  );

  const handleClear = (isFirstProduct: boolean) => {
    if (isFirstProduct) {
      setProduct1(null);
      const params = new URLSearchParams(window.location.search);
      params.delete("f_p");
      deleteCookie("f_p");
      window.history.replaceState(
        {},
        "",
        `${window.location.pathname}?${params.toString()}`
      );
    } else {
      setProduct2(null);
      const params = new URLSearchParams(window.location.search);
      params.delete("s_p");
      deleteCookie("s_p");
      window.history.replaceState(
        {},
        "",
        `${window.location.pathname}?${params.toString()}`
      );
    }
  };
  const compareFields = [
    {
      key: "name",
      label: translateFunction("Name"),
      render: (product: any) => (
        <NextLink
          data={{
            is_product: true,
            ...product,
            href: `/${lang}/products/${product.slug}`,
          }}
          ariaLabel={`Compare Product ${product.slug} ${lang}`}
          href={`/${lang}/products/${product.slug}`}
          className="text-blue-600 hover:text-blue-800 hover:underline"
        >
          {product.name}
        </NextLink>
      ),
    },
    {
      key: "image",
      label: translateFunction("Image"),
      render: (product: any) => (
        <Link href={`/${lang}/products/${product.slug}`}>
          <img
            // @ts-ignore
            src={getConfiguredImage({
              src: GetImageUrl(
                product?.sync_color_images?.[0]?.images?.[0] ??
                  product.images?.[0]
              ),
              height: 100,
              width: 100,
            })}
            alt={product.name}
            className="w-32 h-32 object-contain hover:opacity-80 transition-opacity"
          />
        </Link>
      ),
    },
    {
      key: "colors",
      label: translateFunction("Colors"),
      render: (product: any) => (
        <div className="flex gap-2">
          {product.colors?.map((colorObj) => (
            <div
              key={colorObj.color}
              className="w-6 h-6 rounded-full border regular"
              style={{ backgroundColor: colorObj.color }}
              title={colorObj.name}
            />
          ))}
        </div>
      ),
    },
    {
      key: "sizes",
      label: translateFunction("Sizes"),
      render: (product: any) => (
        <div className="flex gap-2">
          {product.choice_options
            ?.find((opt) => opt.title === "Size")
            ?.options?.map((size) => (
              <span
                key={size.name}
                className="px-2 py-1 bg-gray-100 rounded regular"
              >
                {size.name}
              </span>
            )) || "-"}
        </div>
      ),
    },
    {
      key: "price",
      label: translateFunction("Price"),
      render: (product: any) => (
        <span className="font-semibold regular">
          {RoundPrice({ num: product.price })} {currency?.symbol || "$"}
        </span>
      ),
    },
    {
      key: "offer_price",
      label: translateFunction("Offer Price"),
      render: (product: any) =>
        product.offer_price ? (
          <span className="text-green-600 font-semibold regular">
            {RoundPrice({ num: product.offer_price })} {currency?.symbol || "$"}
          </span>
        ) : (
          "-"
        ),
    },
    {
      key: "details",
      label: translateFunction("Details"),
      render: (product: any) => {
        if (!product.details) return "-";

        if (typeof product.details === "string") {
          return (
            <div
              className="prose prose-sm max-w-none text-gray-600"
              dangerouslySetInnerHTML={{ __html: product.details }}
            />
          );
        }

        return (
          <div className="space-y-2">
            {product.details.map((detail, index) => (
              <div key={index} className="flex items-start gap-2">
                <span className="font-medium text-gray-700 min-w-[100px] regular">
                  {detail.title}:
                </span>
                <span className="text-gray-600 regular">{detail.value}</span>
              </div>
            ))}
          </div>
        );
      },
    },
  ];

  return (
    <>
      <div className="container mx-auto p-4 max-w-7xl pb-[200px]">
        <div
          className={`flex items-center gap-3 mb-8 flex-row ${
            isRtl ? "flex-row-reverse" : " "
          }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            xmlnsXlink="http://www.w3.org/1999/xlink"
            width="25"
            height="25"
            viewBox="0 0 25 25"
          >
            <g
              id="Mask_Group_364"
              data-name="Mask Group 364"
              clipPath="url(#clipPath)"
            >
              <g
                id="Group_3489"
                data-name="Group 3489"
                transform="translate(3.75 0)"
              >
                <g id="Group_3488" data-name="Group 3488">
                  <g
                    id="Rectangle_4149"
                    data-name="Rectangle 4149"
                    fill="none"
                    stroke="#404040"
                    strokeWidth="0.625"
                  >
                    <rect width="17.5" height="12.5" rx="2.5" stroke="none" />
                    <rect
                      x="0.313"
                      y="0.313"
                      width="16.875"
                      height="11.875"
                      rx="2.188"
                      fill="none"
                    />
                  </g>
                  <rect
                    id="Rectangle_4150"
                    data-name="Rectangle 4150"
                    width="5"
                    height="7.5"
                    rx="1.25"
                    transform="translate(6.25 2.5)"
                    fill="#8e8e8e"
                  />
                </g>
                <g
                  id="Group_3486"
                  data-name="Group 3486"
                  transform="translate(0 12.5)"
                >
                  <g
                    id="Rectangle_4148"
                    data-name="Rectangle 4148"
                    fill="none"
                    stroke="#404040"
                    strokeWidth="0.625"
                  >
                    <rect width="17.5" height="12.5" rx="2.5" stroke="none" />
                    <rect
                      x="0.313"
                      y="0.313"
                      width="16.875"
                      height="11.875"
                      rx="2.188"
                      fill="none"
                    />
                  </g>
                  <rect
                    id="Rectangle_4151"
                    data-name="Rectangle 4151"
                    width="5"
                    height="7.5"
                    rx="1.25"
                    transform="translate(6.25 2.5)"
                    fill="#8e8e8e"
                  />
                </g>
              </g>
            </g>
          </svg>
          <h1 className="text-3xl  text-gray-900 regular">
            {translateFunction("Compare Products")}
          </h1>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex gap-6 mb-4">
            <div className="min-w-[25%]" />
            <div className="flex-1">
              <AsyncSelectCustom
                placeholder={translateFunction("Search for Product 1")}
                onChange={(option) =>
                  handleSearchChange(option, setProduct1, setLoading1, true)
                }
                onClear={() => handleClear(true)}
                onSearch={debouncedChangeHandler}
                options={products.map((p) => ({
                  ...p,
                  images:
                    typeof p.images === "string"
                      ? { file_path: p.images }
                      : p.images,
                }))}
                isLoading={searchLoading || loading1}
                className="w-full"
                selectedOption={
                  product1
                    ? {
                        label: product1.name,
                        value: product1.slug,
                        images:
                          product1.images && product1.images[0]
                            ? { file_path: product1.images[0].file_path }
                            : undefined,
                        price: product1.price,
                      }
                    : null
                }
              />
            </div>
            <div className="flex-1">
              <AsyncSelectCustom
                placeholder={translateFunction("Search for Product 2")}
                onChange={(option) =>
                  handleSearchChange(option, setProduct2, setLoading2, false)
                }
                onClear={() => handleClear(false)}
                onSearch={debouncedChangeHandler}
                options={products.map((p) => ({
                  ...p,
                  images:
                    typeof p.images === "string"
                      ? { file_path: p.images }
                      : p.images,
                }))}
                isLoading={searchLoading || loading2}
                className="w-full"
                selectedOption={
                  product2
                    ? {
                        label: product2.name,
                        value: product2.slug,
                        images:
                          product2.images && product2.images[0]
                            ? { file_path: product2.images[0].file_path }
                            : undefined,
                        price: product2.price,
                      }
                    : null
                }
              />
            </div>
          </div>

          <div className="mt-8 overflow-x-auto rounded-xl border border-gray-200 bg-gray-50 shadow-md">
            <div className="min-w-full">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-gray-800 regular">
                  <tbody>
                    {compareFields.map(({ key, label, render }) => (
                      <tr
                        key={key}
                        className="border-b last:border-b-0 hover:bg-blue-50 transition-colors"
                      >
                        <th className="p-4 text-left bg-blue-100 w-1/4 font-semibold text-blue-900 whitespace-nowrap border-r border-gray-200 regular">
                          {label}
                        </th>
                        <td className="p-4 w-[37.5%] bg-white border-r border-gray-100">
                          <div className="flex flex-col gap-2">
                            {loading1 ? (
                              <LoadingCell />
                            ) : product1 ? (
                              render ? (
                                render(product1)
                              ) : (
                                product1[key] || "-"
                              )
                            ) : (
                              "-"
                            )}
                          </div>
                        </td>
                        <td className="p-4 w-[37.5%] bg-white">
                          <div className="flex flex-col gap-2">
                            {loading2 ? (
                              <LoadingCell />
                            ) : product2 ? (
                              render ? (
                                render(product2)
                              ) : (
                                product2[key] || "-"
                              )
                            ) : (
                              "-"
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ComparePage;
