import HortiznalScrollBar from "components/global/HortiznalScrollBar";
import NextLink from "components/global/NextLink";
import { BuyButtonProduct } from "components/ListingPage/Product";
import FlashDealBanner from "components/products/FlashDealBanner";
import ProductBanner from "components/products/ProductBanner";
import { SearchResponse } from "models/API/elastic/Search";
import { CurrencyApi } from "models/API/market/CurrencyApi";
import Image from "next/image";
import React, { Suspense } from "react";
import {
  getConfiguredImage,
  RoundPrice,
  translateFunction,
} from "utils/functions";
import { GetImageUrl } from "utils/tinyUtils";
import { fetchCurrency, fetchFilteredProducts } from "Server Requests";

async function FlashDealsProducts({ lang }) {
  const getFeaturedProducts = async () => {
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
        false,
        true
      );
      return result;
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
      return (
        data.data.currency || {
          code: "",
          exchange_rate: 1,
          id: 1,
          name: "",
          symbol: "",
        }
      );
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
  const [flashDealsProducts, currency] = await Promise.all([
    getFeaturedProducts(),
    GetCurrencyData(),
  ]);

  if (flashDealsProducts?.data?.products?.length === 0) return <></>;
  return (
    <div className="flex-col px-[12px] flex items-start max-w-full w-full">
      <NextLink
        href={`/${lang}/flashDeals`}
        data={{ is_boutique: true }}
        className="flex-row h-[50px] w-full max-w-[1365px] px-[10px] items-center shadow-sm rounded-[15px] bg-[#f3f3f3] regular text-[#5d5d5d]"
      >
        <span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20px"
            height="20px"
            viewBox="0 0 24 24"
            fill="none"
          >
            <path
              d="M13 2L3 14H12L11 22L21 10H12L13 2Z"
              fill="#ff6b35"
              stroke="#ff6b35"
              strokeWidth="1"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <span className="ml-[12px]">
          {translateFunction("Flash Deals Products", lang.split("-")[1])}
        </span>
      </NextLink>
      <HortiznalScrollBar
        className="featured-products-container w-full mt-[12px] flex-row justify-start items-center max-w-[1365px] h-[290px] pb-[8px] "
        id="featured-products-container"
        dataCy="featured-products-container"
      >
        {flashDealsProducts?.data?.products?.map((product, key) => (
          <div
            className="max-h-[290px] max-w-[200px] relative mx-[10px]"
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
                flashDeals={product.end_date}
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
          className="product-container items-center justify-center min-w-[200px] max-h-[290px] bg-[#0002]  align-center flex-col relative"
        >
          <div className="flex regular rounded-md p-3 items-center justify-center bg-[#5d5d5d] text-white shadow-md shadow-[#fff]">
            Show More
          </div>
        </NextLink>
      </HortiznalScrollBar>
    </div>
  );
}

export default FlashDealsProducts;
