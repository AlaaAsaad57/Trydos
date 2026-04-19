import FlashDealsProducts from "components/Server/FlashDealsProducts";
import { GetFlashDealProducts } from "serverRequests/home";
import { getCookieServer } from "utils/cookies/cookie-manager";

export async function FlashProductWrapper({
  lang,
  currency: currencyData,
  mainCategory = null,
}) {
  const [country, language] = lang?.split("-");

  let category;
  if (mainCategory) {
    category = JSON.stringify([mainCategory]);
  }
  let [response, currency] = await Promise.all([
    GetFlashDealProducts({
      language,
      country,
      category: category,
      limit: 10,
    }),
    currencyData,
  ]);
  const redeemed_ids = (await getCookieServer<any[]>("redemed_ids")) ?? [];
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
      <FlashDealsProducts
        currencyData={currency}
        flashDealsProducts={{ data: { products: productsData } }}
        lang={lang}
      />
    </>
  );
}
