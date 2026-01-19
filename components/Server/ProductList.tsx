import "styles/listing.css";
import "styles/globals.css";

import ProductsInfiniteScroll from "components/ListingPage/ProductInfiniteScroll";
import ProductWrapper from "components/ServerWrapper/ProductWrapper";
import ListingBreadcrumbList from "serverRequests/meta/StructuredData/ListingBreadcrumbList";

function ProductListServer({
  params,
  parsedFilters,
  products,
  currency,
  offset,
  isFeatured = false,
  isFlashDeals = false,
  boutique,
  target,
  title,
}) {
  let [country, language] = params.lang.split("-");
  const isRtl = language === "ar" || language === "ku";
  return (
    <>
      <div
        className={`${
          isRtl ? "flex-row-reverse flex" : "flex flex-row"
        } listing-container  bg-[#f4f4f4] gap-x-[10px] gap-y-[18px] justify-center  min-w-full min-h-[48vh] relative  pb-[350px] max-w-[1310px] flex-wrap`}
      >
        {products.map((product, key) => {
          return (
            <ProductWrapper
              key={product.slug}
              category_tree={product?.categories?.map((s) => s.name)}
              labels={product?.label_names}
              color={product?.sync_color_images?.[0]?.color_name}
              InitialProductData={{ ...product, id: product?.product_id }}
              country={country}
              images={
                product?.sync_color_images?.[0]?.images ?? product?.images
              }
              videos={product?.videos}
              name={product.name}
              slug={product.slug}
              Sliders={true}
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
          );
        })}
        <ProductsInfiniteScroll
          boutiqueName={boutique?.name}
          analyticsData={products?.map((s) => ({
            item_id: s?.product_id,
            item_name: s?.name,
            category: s?.category?.name,
            brand: s.brand?.name,
            category_id: s?.category?.id,
            brand_id: s?.brand?.id,
          }))}
          parsedFilters={{
            ...parsedFilters,
            featured: isFeatured,
            flashdeal: isFlashDeals,
          }}
          currency={currency}
          offset={offset}
          isFeatured={isFeatured}
          isFlashDeals={isFlashDeals}
        />
      </div>
    </>
  );
}

export default ProductListServer;
