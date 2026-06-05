import FeatureProducts from "components/Server/FeatureProducts";

import { GetFeaturedProducts } from "serverRequests/home";
import { getRedeemedIds } from "utils/cookies/getRedeemedIds";

export async function FeaturedProductWrapper({
  lang,
  currency: currencyData,
  mainCategory = null,
}) {
  const [country, language] = lang?.split("-");

  let category;
  if (mainCategory) {
    category = JSON.stringify([mainCategory]);
  }
  let [response, currency, redeemedIds] = await Promise.all([
    GetFeaturedProducts({
      language,
      country,
      category: category,
      limit: 10,
    }),
    currencyData,
    getRedeemedIds(),
  ]);

  const redeemed_ids = redeemedIds ?? [];
  let productsData = response.data.products.map((product) => {
    if (product?.is_luck) {
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
        luck_price: product.luck_price,
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
        is_luck: !redeemed_ids.find((s) => s.id === product.product_id),
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
        luck_price: product.luck_price,
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
    <>
      <FeatureProducts
        currencyData={currency}
        fetauredProductsData={{ data: { products: productsData } }}
        lang={lang}
      />
    </>
  );
}
