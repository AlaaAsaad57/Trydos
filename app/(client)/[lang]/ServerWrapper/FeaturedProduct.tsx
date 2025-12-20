import FeatureProducts from "components/Server/FeatureProducts";
import { api } from "lib/eden";
import { getCookieServer } from "utils/cookies/cookie-manager";

export async function FeaturedProductWrapper({
  lang,
  currency: currencyData,
  mainCategory = null,
}) {
  const [country, language] = lang?.split("-");
  let start = process.hrtime.bigint();
  let query: any = { limit: 10, offset: null };
  if (mainCategory) {
    query.categoy_slugs = [mainCategory];
  }
  let response: any = await api.products.featured.get({
    headers: { country: country, language: language },
    query: query,
    fetch: {
      next: {
        revalidate: 60,
      },
    },
  });
  let end = process.hrtime.bigint();
  const redeemed_ids = (await getCookieServer<any[]>("redemed_ids")) ?? [];
  let productsData = response.data.data.products.map((product) => {
    if (product?.is_redeem) {
      return {
        name: product?.name,
        slug: product?.slug,
        label_names: product?.label_names,
        category_tree: product?.category_tree,
        videos: product.videos,
        colors: product?.colors,
        sync_color_images: product?.sync_color_images,
        ...(!product?.sync_color_images ||
        product?.sync_color_images?.length === 0
          ? { images: product.images }
          : {}),
        price: product.price,
        offer_price: product.offer_price,
        redeem_price: product.redeem_price,
        categories: product?.categories?.map((s) => ({
          name: s.name,
          id: s.id,
        })),
        brand: {
          id: product?.brand?.id,
          icon: product?.brand?.icon,
          is_verified: product?.brand?.is_verified,
        },
        flash_deal_end_date: product.flash_deal_end_date,
        flash_deal_price: product.flash_deal_price,
        product_id: product.product_id,
        is_redeem: !redeemed_ids.find((s) => s.id === product.product_id),
      };
    } else
      return {
        name: product?.name,
        slug: product?.slug,
        label_names: product?.label_names,
        category_tree: product?.category_tree,
        videos: product.videos,
        colors: product?.colors,
        sync_color_images: product?.sync_color_images,
        ...(!product?.sync_color_images ||
        product?.sync_color_images?.length === 0
          ? { images: product.images }
          : {}),
        price: product.price,
        offer_price: product.offer_price,
        redeem_price: product.redeem_price,
        categories: product?.categories?.map((s) => ({
          name: s.name,
          id: s.id,
        })),
        brand: {
          id: product?.brand?.id,
          icon: product?.brand?.icon,
          is_verified: product?.brand?.is_verified,
        },
        flash_deal_end_date: product.flash_deal_end_date,
        flash_deal_price: product.flash_deal_price,
        product_id: product.product_id,
      };
  });

  return (
    <FeatureProducts
      dataSourceString={`Feature Products Data Source: Products From Elastic, currency from ${
        currencyData?.redis ? "redis" : "laravel api"
      } in ${Number(end - start) / 1_000_000} ms`}
      currencyData={currencyData}
      fetauredProductsData={{ data: { products: productsData } }}
      lang={lang}
    />
  );
}
