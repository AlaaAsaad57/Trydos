import HortiznalScrollBar from "components/global/HortiznalScrollBar";
import React from "react";
import { translateFunction } from "utils/functions";
import ProductCard from "./ProductCard";
import DataSourceLogger from "components/global/DataSourceLogger";

async function RecomendedProducts({ lang, products, currencyData }) {
  const [country, language] = lang.split("-");
  const isRtl = language === "ar" || language === "ku";
  let featuredProducts = products;
  let currency = currencyData;

  if (featuredProducts?.data?.products?.length === 0) return <></>;
  return (
    <div className="flex-col px-[12px] flex items-start max-w-full w-full">
      <DataSourceLogger
        dataSourceString={`Recomended Products Data Source from elastic ${featuredProducts?.data?.time} ms`}
      />
      <div
        // href={`/${lang}/featured`}
        // data={{ is_boutique: true }}
        className={`flex-row h-[50px] w-full max-w-[1365px] px-[10px] items-center shadow-sm rounded-[15px]  regular bg-[#f3f3f3] regular text-[#5d5d5d] ${
          isRtl ? "flex-row-reverse " : " "
        }`}
      >
        <span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            xmlnsXlink="http://www.w3.org/1999/xlink"
            width="30px"
            height="30px"
            viewBox="0 0 24 24"
            version="1.1"
          >
            <g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
              <g
                id="ic_fluent_recommended_24_filled"
                fill="#5d5d5d"
                fill-rule="nonzero"
              >
                <path
                  d="M17.0020594,17.4830721 L17.0007001,22.2453233 C17.0007001,22.7945586 16.4297842,23.157512 15.9324488,22.9244522 L12.0005291,21.0818879 L8.07069102,22.9243915 C7.5733438,23.1575726 7.00231009,22.7946207 7.00231009,22.2453233 L7.00260026,17.4861909 C8.43218245,18.4424048 10.1509746,19 12,19 C13.8510348,19 15.5715531,18.4411922 17.0020594,17.4830721 Z M12,2 C16.418278,2 20,5.581722 20,10 C20,14.418278 16.418278,18 12,18 C7.581722,18 4,14.418278 4,10 C4,5.581722 7.581722,2 12,2 Z M11.8084497,6.58610926 L11.7712148,6.64234387 L10.8586922,8.49499737 L8.81472896,8.79035658 C8.62860433,8.81725218 8.54185205,9.02358857 8.63135587,9.17274189 L8.67333197,9.22553178 L10.1533251,10.6658938 L9.80260908,12.7010893 C9.77067264,12.8864156 9.94010228,13.0326834 10.1096137,12.9936511 L10.1727912,12.9700424 L12,12.0075816 L13.8272087,12.9700424 C13.9935181,13.0576439 14.1849216,12.9418506 14.2003028,12.7686538 L14.1974269,12.7012993 L13.8484251,10.6658938 L15.326776,9.22542655 C15.4614232,9.09422981 15.4102807,8.87641205 15.2502405,8.80838398 L15.185271,8.79035658 L13.1413078,8.49499737 L12.2287851,6.64234387 C12.1560771,6.494728 11.9762193,6.46192448 11.8558892,6.54393329 L11.8084497,6.58610926 L11.8084497,6.58610926 Z"
                  id="🎨-Color"
                ></path>
              </g>
            </g>
          </svg>
        </span>
        <span className={`ml-[12px] ${isRtl ? " text-right pr-2" : " "}`}>
          {translateFunction("Recommended Products", lang.split("-")[1])}
        </span>
      </div>
      <HortiznalScrollBar
        className="featured-products-container py-[10px] gap-[8px] w-full mt-[12px] flex-row justify-start items-center max-w-[1365px] h-auto pb-[8px] "
        id="featured-products-container"
        dataCy="featured-products-container"
      >
        {featuredProducts?.data?.products?.map((product, key) => (
          <ProductCard
            key={key}
            product={product}
            params={{ lang }}
            Sliders={false}
            currency={currency}
            productColor={null}
            language={language}
          />
        ))}
        {/* <NextLink
          href={`/${lang}/featured`}
          data={{ is_boutique: true }}
          className="product-container items-center justify-center min-w-[150px] max-h-[377px] bg-[#0002]  align-center flex-col relative"
        >
          <div className="flex regular rounded-md p-3 items-center justify-center bg-[#5d5d5d] text-white shadow-md shadow-[#fff]">
            {translateFunction("Show More", lang.split("-")[1])}
          </div>
        </NextLink> */}
      </HortiznalScrollBar>
    </div>
  );
}

export default RecomendedProducts;
