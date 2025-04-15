"use server";
import dynamic from "next/dynamic";

import BackBar from "components/products/BackBar";
import ProductDetailsSlider from "components/products/ProductDetailsSlider";
import ProductFooterSection from "components/products/ProductFooterSection";
import ProuctDetailsBody from "components/products/ProuctDetailsBody";
import React from "react";
import { getProductDetails } from "store/homepage/cachedActions";
import { fetchWithRetry } from "utils/functions";

async function ProductDetailsServer({ productId, lang }) {
  let [product, data] = await getProductDetails({ productId, lang });
  const getCurrency = async ({ lang, country }) => {
    let data = await fetchWithRetry(
      process.env.NEXT_PUBLIC_BACKEND_URL + "/mobile/home/currency",
      {
        next: {
          revalidate: parseInt(process.env.NEXT_PUBLIC_REVALIDATE),
        },
        headers: new Headers({
          Accept: "application/json",
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
          lang: lang,
          country: country,
        }),
      },
      "Get Currency"
    );
    return data.data.currency;
  };
  const currency = await getCurrency({
    country: lang.split("-")[0],
    lang: lang.split("-")[1],
  });
  return (
    <div className="product-details-container w-full">
      <BackBar link={true} close={null} data={data} />
      <ProductDetailsSlider product={product} currency={currency} />
      <ProuctDetailsBody product={product} lang={lang} />
      <ProductFooterSection product={product} currency={currency} />
    </div>
  );
}

export default ProductDetailsServer;
