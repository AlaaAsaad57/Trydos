import "styles/listing.css";
import "styles/globals.css";
import { GetRelatedProducts } from "serverRequests/listing";
import RelatedProductsInfiniteScroll from "components/Product/RelatedProductsInfiniteScroll";
import { translateFunction } from "utils/server";
import HortiznalScrollBar from "components/global/HortiznalScrollBar";
import ProductCard from "components/products/ProductCard";

interface RelatedProductsSectionProps {
  globalPromise: Promise<any>;
  language: string;
  country: string;
  currency: Promise<any>;
}

async function RelatedProductsSection({
  globalPromise,
  language,
  country,
  currency,
}: RelatedProductsSectionProps) {
  let [product, resolvedCurrency] = await Promise.all([
    globalPromise,
    currency,
  ]);
  if (!product?.id) return null;

  const response = await GetRelatedProducts({
    language,
    country,
    productId: product.id,
    offset: [],
    currency: resolvedCurrency,
  });

  if (!response || !response.products || response.products.length === 0) {
    return null;
  }

  const isRtl = language === "ar" || language === "ku";

  return (
    <div className={`w-full flex-col mt-[24px] px-[16px] ${isRtl ? "items-end" : "items-start"}`}>
      <div className={`flex-row items-center gap-[8px] mb-[12px] ${isRtl ? "flex-row-reverse" : ""}`}>
        <span className="text-[#1d1d1d] bold text-[14px]">
          {translateFunction("You May Also Like", language)}
        </span>
      </div>


        <HortiznalScrollBar
        className="featured-products-container py-[10px] gap-[8px] w-full mt-[12px] flex-row justify-start items-center max-w-[1365px] h-auto pb-[8px] "
        id="related-products-container"
        dataCy="related-products-container"
        >
    {response.products.map((product) => (
      <ProductCard
        key={product?.product_id ?? product?.slug}
        product={product}
        currency={resolvedCurrency}
        country={country}
        language={language}
        sliders={false}
      />
    ))}

    <RelatedProductsInfiniteScroll
          productId={product.id}
          currency={resolvedCurrency}
          offset={response.offset}
          initialProductIds={(response as any).productIds || []}
          pit_id={(response as any).pit_id ?? null}
        />
        </HortiznalScrollBar>
       
        
  
    </div>
  );
}

export default RelatedProductsSection;
