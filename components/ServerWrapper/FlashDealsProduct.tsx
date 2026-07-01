import FlashDealsProducts from "components/Server/FlashDealsProducts";
import { GetFlashDealProducts } from "serverRequests/home";
import { getRedeemedIds } from "utils/cookies/getRedeemedIds";
import { normalizeListingProduct } from "utils/listing/normalizeListingProduct";

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
  let [response, currency, redeemedIds] = await Promise.all([
    GetFlashDealProducts({
      language,
      country,
      category: category,
      limit: 10,
    }),
    currencyData,
    getRedeemedIds(),
  ]);
  const redeemed_ids = redeemedIds ?? [];
  let productsData = response.data.products.map((product) =>
    normalizeListingProduct(product, redeemed_ids),
  );
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
