"use client";
import React, { useCallback, useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { ProductInterface } from "models/product";
import { filterProducts, translateFunction, RoundPrice } from "utils/functions";
import AsyncSelectCustom from "./AsyncSelectCustom";
import Link from "next/link";
import CompareLoadingWidget from "./CompareLoadingWidget";
import { toast } from "react-toastify";
import SearchService from "services/search";
import { useAppStore } from "store";
import NextLink from "./NextLink";
const ComparePage: React.FC = ({
  showInstantLoading = true,
}: {
  showInstantLoading?: boolean;
}) => {
  const { currency } = useAppStore();
  const searchParams = useSearchParams();
  const [product1, setProduct1] = useState<any>(null);
  const [product2, setProduct2] = useState<any>(null);
  const [loading1, setLoading1] = useState(false);
  const [loading2, setLoading2] = useState(false);
  const [initialLoading, setInitialLoading] = useState(showInstantLoading);
  const { lang } = useParams();
  useEffect(() => {
    const { f_p, s_p } = {
      f_p: searchParams.get("f_p"),
      s_p: searchParams.get("s_p"),
    };

    // If URL has less than two slugs, check localStorage
    if (!f_p || !s_p) {
      const storedFp = localStorage.getItem("f_p");
      const storedSp = localStorage.getItem("s_p");

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
    setProduct: (product: ProductInterface | null) => void,
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
  const searchFunction = async (inputValue: string) => {
    setSearchLoading(true);
    const productsVar = await fetch(
      process.env.NEXT_PUBLIC_API_BASE_URL +
        `/api/${lang}/search?searchText=${inputValue}&noFilters=true`
    );
    const productsVarJson = await productsVar.json();
    console.log(productsVarJson);
    return productsVarJson;
  };
  const search = async (inputValue: string) => {
    setSearchLoading(true);
    const productsVar = await searchFunction(inputValue);
    setProducts(
      productsVar?.map((p) => ({
        label: p.name,
        value: p.slug,
        thumbnail: p.thumbnail?.file_path,
        price: p.price,
      })) || []
    );
    setSearchLoading(false);
  };

  const [products, setProducts] = useState<any[]>([]);
  const fetchProducts = async (slug1: string, slug2: string) => {
    // Fetch product data based on slugs
    const productData1 = await fetchProductData(slug1);
    const productData2 = await fetchProductData(slug2);

    setProduct1(productData1);
    setProduct2(productData2);
  };

  const fetchProductData = async (slug: string) => {
    // Implement your fetch logic here, e.g., using filterProducts
    const products = await filterProducts({
      boutiqueId: null,
      lang: "en",
      offset: 0,
      callback: () => {},
      newFiltersCallback: () => {},
      sizesAttr: {},
      reset: true,
      storeCallback: () => {},
      searchText: slug,
    });
    return products[0]; // Assuming the first product matches the slug
  };

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
    setProduct: (product: ProductInterface | null) => void,
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
        thumbnail: product.thumbnail,
        price: product.price,
      };
      setProducts([option]);

      const currentParams = new URLSearchParams(window.location.search);
      if (isFirstProduct) {
        currentParams.set("f_p", slug);
      } else {
        currentParams.set("s_p", slug);
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
        setProduct1(null);
      } else {
        currentParams.delete("s_p");
        setProduct2(null);
      }
      window.history.replaceState(
        {},
        "",
        `${window.location.pathname}?${currentParams.toString()}`
      );
      toast.error(
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
      setProducts([]);
      await search(value);
    }, 500),
    []
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
      localStorage.removeItem("f_p");
      window.history.replaceState(
        {},
        "",
        `${window.location.pathname}?${params.toString()}`
      );
    } else {
      setProduct2(null);
      const params = new URLSearchParams(window.location.search);
      params.delete("s_p");
      localStorage.removeItem("s_p");
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
      render: (product: ProductInterface) => (
        <NextLink
          data={{
            is_product: true,
            ...product,
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
      render: (product: ProductInterface) => (
        <Link href={`/${lang}/products/${product.slug}`}>
          <img
            // @ts-ignore
            src={product.thumbnail}
            alt={product.name}
            className="w-32 h-32 object-contain hover:opacity-80 transition-opacity"
          />
        </Link>
      ),
    },
    {
      key: "colors",
      label: translateFunction("Colors"),
      render: (product: ProductInterface) => (
        <div className="flex gap-2">
          {product.colors?.map((colorObj) => (
            <div
              key={colorObj.color}
              className="w-6 h-6 rounded-full border"
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
      render: (product: ProductInterface) => (
        <div className="flex gap-2">
          {product.choice_options
            ?.find((opt) => opt.title === "Size")
            ?.options?.map((size) => (
              <span key={size.name} className="px-2 py-1 bg-gray-100 rounded">
                {size.name}
              </span>
            )) || "-"}
        </div>
      ),
    },
    {
      key: "price",
      label: translateFunction("Price"),
      render: (product: ProductInterface) => (
        <span className="font-semibold">
          {currency?.symbol || "$"}
          {RoundPrice({ num: product.price })}
        </span>
      ),
    },
    {
      key: "offer_price",
      label: translateFunction("Offer Price"),
      render: (product: ProductInterface) =>
        product.offer_price ? (
          <span className="text-green-600 font-semibold">
            {currency?.symbol || "$"}
            {RoundPrice({ num: product.offer_price })}
          </span>
        ) : (
          "-"
        ),
    },
    {
      key: "details",
      label: translateFunction("Details"),
      render: (product: ProductInterface) => {
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
                <span className="font-medium text-gray-700 min-w-[100px]">
                  {detail.title}:
                </span>
                <span className="text-gray-600">{detail.value}</span>
              </div>
            ))}
          </div>
        );
      },
    },
  ];

  return (
    <>
      {initialLoading ? (
        <CompareLoadingWidget />
      ) : (
        <div className="container mx-auto p-4 max-w-7xl pb-[200px]">
          <div className="flex items-center gap-3 mb-8">
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
            <h1 className="text-3xl  text-gray-900">
              {translateFunction("Compare Products")}
            </h1>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex gap-6 mb-8">
              <div className="flex-1">
                <AsyncSelectCustom
                  placeholder={translateFunction("Search for Product 1")}
                  onChange={(option) =>
                    handleSearchChange(option, setProduct1, setLoading1, true)
                  }
                  onClear={() => handleClear(true)}
                  onSearch={debouncedChangeHandler}
                  options={products}
                  isLoading={searchLoading || loading1}
                  className="w-full"
                  selectedOption={
                    product1
                      ? {
                          label: product1.name,
                          value: product1.slug,
                          thumbnail: product1.thumbnail,
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
                  options={products}
                  isLoading={searchLoading || loading2}
                  className="w-full"
                  selectedOption={
                    product2
                      ? {
                          label: product2.name,
                          value: product2.slug,
                          thumbnail: product2.thumbnail,
                          price: product2.price,
                        }
                      : null
                  }
                />
              </div>
            </div>

            <div className="mt-8 overflow-x-auto rounded-lg border border-gray-200">
              <div className="min-w-full">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <tbody>
                      {compareFields.map(({ key, label, render }) => (
                        <tr key={key} className="border-b last:border-b-0">
                          <th className="p-4 text-left bg-gray-50 w-1/4 font-medium text-gray-700 whitespace-nowrap">
                            {label}
                          </th>
                          <td className="p-4 w-[37.5%] bg-white">
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
      )}
    </>
  );
};

export default ComparePage;
