import "styles/listing.css";
import "styles/globals.css";

import ProductsInfiniteScroll from "components/ListingPage/ProductInfiniteScroll";
import ProductCard from "components/products/ProductCard";
import SortableGrid from "components/Server/SortableGrid";

function ProductListServer({
  params,
  parsedFilters,
  products,
  currency,
  offset,
  pit_id = null,
  isFeatured = false,
  isFlashDeals = false,
  boutique,
  target,
  title,
  recomended_offset = null,
  sort = undefined,
}) {
  let [country, language] = params.lang.split("-");
  const isRtl = language === "ar" || language === "ku";
  return (
    <>
      <div
        className={`${
          isRtl ? "flex-row-reverse flex" : "flex flex-row"
        } listing-container mt-2  bg-[#f4f4f4] gap-x-[10px] gap-y-[18px] justify-center  min-w-full min-h-[48vh] relative  pb-[390px] max-w-[1310px] flex-wrap`}
      >
        <SortableGrid
          serverSort={sort ?? ""}
          currency={currency}
          boutiqueName={boutique?.name}
          parsedFilters={{
            ...parsedFilters,
            featured: isFeatured,
            flashdeal: isFlashDeals,
          }}
          isFeatured={isFeatured}
          isFlashDeals={isFlashDeals}
          sizesFilters={
            parsedFilters?.sizes?.length > 0 ? parsedFilters.sizes : null
          }
        >
          {products.map((product, key) => (
            <ProductCard
              key={product.slug}
              product={product}
              currency={currency}
              country={country}
              language={language}
              sliders={true}
              priority={key < 4}
              sizesFilters={
                parsedFilters?.sizes?.length > 0 ? parsedFilters.sizes : null
              }
            />
          ))}
          <ProductsInfiniteScroll
            recomended_offset={recomended_offset}
            pit_id={pit_id}
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
            sort={sort}
            sizes_filters={
              parsedFilters?.sizes?.length > 0 ? parsedFilters.sizes : null
            }
          />
        </SortableGrid>
      </div>
    </>
  );
}

export default ProductListServer;
