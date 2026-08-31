import FlashDealsProducts from "components/Server/FlashDealsProducts";
import { GetFlashDealProducts } from "serverRequests/home";
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
  let [response, currency] = await Promise.all([
    GetFlashDealProducts({
      language,
      country,
      category: category,
      limit: 10,
    }),
    currencyData,
  ]);

  let productsData = response.data.products.map(normalizeListingProduct);
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
