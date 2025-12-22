import HortiznalScrollBar from "components/global/HortiznalScrollBar";
import NextLink from "components/global/NextLink";

import { translateFunction } from "utils/functions";
import ProductWrapper from "../ServerWrapper/ProductWrapper";

function FeatureProducts({ lang, fetauredProductsData, currencyData }) {
  const [country, language] = lang.split("-");
  const isRtl = language === "ar" || language === "ku";
  let featuredProducts = fetauredProductsData;
  let currency = currencyData;

  if (featuredProducts?.data?.products?.length === 0) return <></>;
  return (
    <div className="flex-col px-[12px] flex items-start max-w-full w-full mt-[10px]">
      <NextLink
        href={`/${lang}/featured`}
        data={{ is_boutique: true }}
        className={`flex-row h-[50px] w-full max-w-[1365px] px-[10px] items-center shadow-sm rounded-[15px] bg-[#f3f3f3] regular text-[#5d5d5d] ${
          isRtl ? "flex-row-reverse " : " "
        }`}
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
        <span className={`ml-[12px] ${isRtl ? " text-right pr-2" : " "}`}>
          {translateFunction("Featured Products", lang.split("-")[1])}
        </span>
      </NextLink>
      <HortiznalScrollBar
        className="featured-products-container py-[10px] gap-[8px] w-full mt-[12px] flex-row justify-start items-center max-w-[1365px] h-auto pb-[8px] "
        id="featured-products-container"
        dataCy="featured-products-container"
      >
        {featuredProducts?.data?.products?.map((product, key) => (
          // <ProductCard
          //   key={key}
          //   product={product}
          //   params={{ lang }}
          //   Sliders={false}
          //   currency={currency}
          //   productColor={null}
          //   language={language}
          // />
          <ProductWrapper
            category_tree={product?.categories?.map((s) => s.name)}
            labels={product?.label_names}
            color={product?.sync_color_images?.[0]?.color_name}
            InitialProductData={{ ...product, id: product?.product_id }}
            country={country}
            images={product?.sync_color_images?.[0]?.images ?? product?.images}
            videos={product?.videos}
            name={product.name}
            slug={product.slug}
            Sliders={false}
            brand={{
              name: product.brand.name,
              icon: product.brand.icon?.file_path ?? product?.brand,
              is_verified: product.brand.is_verified,
            }}
            redeem_price={product.redeem_price}
            currency={currency}
            endDate={product.flash_deal_end_date}
            flash_deal_price={product.flash_deal_price}
            id={product?.product_id ?? product?.id}
            is_flashDeal={product.flash_deal_end_date}
            is_redeem={product.is_redeem}
            language={language}
            offer_price={product.offer_price}
            price={product.price}
          />
        ))}
        {featuredProducts?.data?.products?.length > 8 && (
          <NextLink
            href={`/${lang}/featured`}
            data={{ is_boutique: true }}
            className="product-container items-center justify-center min-w-[150px] max-h-[377px] bg-[#0002]  align-center flex-col relative"
          >
            <div className="flex regular rounded-md p-3 items-center justify-center bg-[#5d5d5d] text-white shadow-md shadow-[#fff]">
              {translateFunction("Show More", lang.split("-")[1])}
            </div>
          </NextLink>
        )}
      </HortiznalScrollBar>
    </div>
  );
}

export default FeatureProducts;
