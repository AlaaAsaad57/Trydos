import HortiznalScrollBar from "components/global/HortiznalScrollBar";
import NextLink from "components/global/NextLink";
import { BuyButtonProduct } from "components/ListingPage/Product";

import ProductBanner from "components/products/ProductBanner";
import { SearchResponse } from "models/API/elastic/Search";
import { CurrencyApi } from "models/API/market/CurrencyApi";
import { fetchCurrency, fetchFilteredProducts } from "Server Requests";
import Image from "next/image";
import React, { Suspense } from "react";
import {
  getConfiguredImage,
  RoundPrice,
  translateFunction,
} from "utils/functions";
import { GetImageUrl } from "utils/tinyUtils";

async function FeatureProducts({ lang }) {
  const getFeaturedProducts = async (): Promise<SearchResponse> => {
    try {
      const [country, language] = lang.split("-");
      const result = await fetchFilteredProducts(
        language,
        country,
        [],
        "false",
        "true",
        null,
        null,
        true,
        false
      );
      return {
        data: {
          products: result.data.products as any,
          offset: result.data.offset,
          total_size: result.data.total_size,
          limit: result.data.limit,
          brands: result.data.brands as any,
          categories: result.data.categories as any,
          colors: result.data.colors as any,
          attributes: result.data.attributes as any,
          boutiques: result.data.boutiques as any,
          prices: result.data.prices as any,
          search_time: null,
          search_text: null,
          process_time: "",
        },
      };
    } catch (e) {
      console.log(e);
      return {
        data: {
          products: [],
          offset: null,
          total_size: 0,
          limit: 0,
          brands: [],
          categories: [],
          colors: [],
          attributes: [],
          boutiques: [],
          prices: {
            max_price: null,
            min_price: null,
            priceRanges: [],
          },
          search_time: null,
          search_text: null,
          process_time: "",
        },
      };
    }
  };
  const GetCurrencyData = async (): Promise<
    CurrencyApi["data"]["currency"]
  > => {
    try {
      const [country, language] = lang.split("-");
      const data = await fetchCurrency(language, country);
      return data.data.currency;
    } catch (error) {
      console.log(error, "getCurrencyData");
      return {
        code: "",
        exchange_rate: 1,
        id: 1,
        name: "",
        symbol: "",
      };
    }
  };
  const [featuredProducts, currency] = await Promise.all([
    getFeaturedProducts(),
    GetCurrencyData(),
  ]);

  if (featuredProducts?.data?.products?.length === 0) return <></>;
  return (
    <div className="flex-col px-[12px] flex items-start max-w-full w-full">
      <NextLink
        href={`/${lang}/featured`}
        data={{ is_boutique: true }}
        className="flex-row h-[50px] w-full max-w-[1365px] px-[10px] items-center shadow-sm rounded-[15px] bg-[#f3f3f3] regular text-[#5d5d5d]"
      >
        <span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="#000000"
            width="20px"
            height="20px"
            viewBox="0 0 30 30"
          >
            <path d="M22.005 0c-.194-.002-.372.105-.458.276l-2.197 4.38-4.92.7c-.413.06-.578.56-.278.846l3.805 3.407-.953 4.81c-.07.406.363.715.733.523L22 12.67l4.286 2.273c.37.19.8-.118.732-.522l-.942-4.81 3.77-3.408c.3-.286.136-.787-.278-.846l-4.916-.7-2.2-4.38C22.368.11 22.195.002 22.005 0zM22 1.615l1.863 3.71c.073.148.216.25.38.273l4.168.595-3.227 2.89c-.12.112-.173.276-.145.436l.813 4.08-3.616-1.927c-.147-.076-.322-.076-.47 0l-3.59 1.926.823-4.08c.028-.16-.027-.325-.145-.438l-3.262-2.89 4.166-.594c.165-.023.307-.125.38-.272zM16.5 18c-.822 0-1.5.678-1.5 1.5v9c0 .822.678 1.5 1.5 1.5h9c.822 0 1.5-.678 1.5-1.5v-9c0-.822-.678-1.5-1.5-1.5zm0 1h9c.286 0 .5.214.5.5v9c0 .286-.214.5-.5.5h-9c-.286 0-.5-.214-.5-.5v-9c0-.286.214-.5.5-.5zM1.5 3C.678 3 0 3.678 0 4.5v9c0 .822.678 1.5 1.5 1.5h9c.822 0 1.5-.678 1.5-1.5v-9c0-.822-.678-1.5-1.5-1.5zm0 1h9c.286 0 .5.214.5.5v9c0 .286-.214.5-.5.5h-9c-.286 0-.5-.214-.5-.5v-9c0-.286.214-.5.5-.5zm0 14c-.822 0-1.5.678-1.5 1.5v9c0 .822.678 1.5 1.5 1.5h9c.822 0 1.5-.678 1.5-1.5v-9c0-.822-.678-1.5-1.5-1.5zm0 1h9c.286 0 .5.214.5.5v9c0 .286-.214.5-.5.5h-9c-.286 0-.5-.214-.5-.5v-9c0-.286.214-.5.5-.5z" />
          </svg>
        </span>
        <span className="ml-[12px]">
          {translateFunction("Featured Products", lang.split("-")[1])}
        </span>
      </NextLink>
      <HortiznalScrollBar
        className="featured-products-container w-full mt-[12px] flex-row justify-start items-center max-w-[1365px] h-[290px] pb-[8px] "
        id="featured-products-container"
        dataCy="featured-products-container"
      >
        {featuredProducts?.data?.products?.map((product, key) => (
          <div
            className="max-h-[290px] max-w-[200px] relative mx-[10px] shadow-sm rounded-md"
            data-cy="countProduct"
            key={product.slug}
          >
            <NextLink
              data={{
                is_product: true,
                ...product,
              }}
              ariaLabel={`go to product ${product.slug} ${lang}`}
              suppressHydrationWarning
              href={`/${lang}/products/${product.slug}`}
              className="product-container  align-center flex-col relative shadow-sm max-h-[290px] max-w-[200px]"
              data-cy="featured_product_link"
            >
              <ProductBanner
                featured={product.featured}
                flashDeals={product?.flash_deal_end_date}
                labels={product.label_names}
              />

              <div className="max-h-[220px] w-full">
                <Image
                  alt={product.name}
                  width={200}
                  height={130}
                  className="rounded w-full flex  max-h-[220px] min-h-[220px]"
                  src={getConfiguredImage({
                    src: GetImageUrl(product.images[0]?.file_path),
                    width: 200,
                    height: 400,
                  })}
                />
              </div>
              <div className="product-body w-100 flex-col align-start justify-start max-h-[30px] min-h-[30px]">
                <p
                  className="prouct-details overflow-hidden w-100 regular-text color-dark-gray f-10"
                  data-cy="productName"
                >
                  {product?.brand?.icon &&
                    typeof product.brand.icon === "string" && (
                      <Image
                        alt={product?.brand?.name}
                        loading={"eager"}
                        src={getConfiguredImage({
                          src: GetImageUrl(product?.brand?.icon),
                          height: 100,
                        })}
                        width={16}
                        height={7}
                        className="max-h-[20px] max-w-[40px]"
                      />
                    )}
                  {product.name.substring(0, 50)}

                  {product.category && (
                    <span className="product-category-icon align-center">
                      <span
                        style={{ display: "inline" }}
                        className="justify-start quantity flex f-10 align-center med-text"
                      >
                        1
                      </span>
                      {product?.category?.icon?.length > 0 && (
                        <Image
                          loading={"eager"}
                          src={getConfiguredImage({
                            src: GetImageUrl(product?.category?.icon),
                            height: 100,
                          })}
                          width={10}
                          height={10}
                          style={{
                            display: "inline",
                            minWidth: "10px",
                            minHeight: "10px",
                          }}
                          alt={product?.category?.name}
                          className="max-h-[20px] max-w-[40px]"
                        />
                      )}
                    </span>
                  )}
                </p>
              </div>
              <div className="product-footer w-100 flex-row align-center max-h-[30px]">
                <div
                  className={`${
                    lang.split("-")[1] === "ar" && "dir-rtl"
                  } price-label flex`}
                >
                  {product?.offer_price >= 0 && (
                    <span className="old-price relative f-12 color-dark-gray light-text">
                      {RoundPrice({
                        num: product?.price,
                        rate: currency?.exchange_rate,
                        points: 0,
                      })}
                      <svg
                        className="absolute w-100"
                        xmlns="http://www.w3.org/2000/svg"
                        width="100%"
                        height="1"
                      >
                        <line
                          id="Line_1"
                          data-name="Line 1"
                          x2="100%"
                          transform="translate(0 0.5)"
                          fill="none"
                          stroke="#3c3c3c"
                          strokeWidth="1"
                        />
                      </svg>
                    </span>
                  )}
                  <span className="new-price bold-text color-dark-gray flex f-12">
                    {product?.offer_price >= 0
                      ? RoundPrice({
                          num: product?.offer_price,
                          rate: currency?.exchange_rate,
                          points: 0,
                        })
                      : RoundPrice({
                          num: product?.price,
                          rate: currency?.exchange_rate,
                          points: 0,
                        })}
                  </span>
                  <span className="currency-label light-text color-dark-gray flex f-10">
                    {currency?.symbol}
                  </span>
                </div>
              </div>
            </NextLink>
            <Suspense fallback={<></>}>
              <BuyButtonProduct product={product} />
            </Suspense>
          </div>
        ))}
        <NextLink
          href={`/${lang}/featured`}
          data={{ is_boutique: true }}
          className="product-container items-center justify-center min-w-[150px] max-h-[200px] bg-[#0002]  align-center flex-col relative"
        >
          <div className="flex regular rounded-md p-3 items-center justify-center bg-[#5d5d5d] text-white shadow-md shadow-[#fff]">
            Show More
          </div>
        </NextLink>
      </HortiznalScrollBar>
    </div>
  );
}

export default FeatureProducts;
