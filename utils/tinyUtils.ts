import { translateFunction } from "./functions";

export const getPrice = (num, lang, currency) => {
  let rateVariable = currency?.exchange_rate;
  let price = parseFloat(num);
  price = parseFloat((price * rateVariable).toFixed(0));
  let ceil = 2;
  if (price >= 1000000) {
    return (
      (ceil
        ? Math.ceil(parseFloat((price / 1000000).toFixed(3)) * ceil) / ceil
        : parseFloat((price / 1000000).toFixed(3))) +
      translateFunction("M", lang)
    ); // For millions
  } else if (price >= 1000) {
    return (
      (ceil
        ? Math.ceil(parseFloat((price / 1000).toFixed(3)) * ceil) / ceil
        : parseFloat((price / 1000).toFixed(3))) + translateFunction("K", lang)
    ); // For thousands
  } else {
    return price; // For prices under 1000
  }
};
export const configureSearchParams = ({
  searchParams,
  noFilters,
  noProducts,
  lang,
  offset,
  boutiqueId,
}): URLSearchParams => {
  let params = new URLSearchParams();
  params.set("lang", lang);
  params.set("limit", "8");
  if (offset && offset !== "false") {
    params.set("offset", `[${offset}]`);
  }
  if (noProducts && noProducts !== "false") {
    params.set("with_products", "false");
  }
  if (noFilters && noFilters !== "false") {
    params.set("with_filters", "false");
  }
  if (searchParams.search_text) {
    params.set("search_text", searchParams.search_text);
  }
  if (searchParams.categories) {
    params.set("category_slugs", decodeURIComponent(searchParams.categories));
  }
  if (searchParams.prices) {
    params.set("price", decodeURIComponent(searchParams.prices));
  }
  if (searchParams.sizes) {
    params.set(
      "attributes",
      JSON.stringify([
        {
          id: 1,
          options: JSON.parse(decodeURIComponent(searchParams.sizes)),
          name: "Size",
        },
      ])
    );
  }
  if (searchParams.colors) {
    params.set("colors", decodeURIComponent(searchParams.colors));
  }
  if (searchParams.brands) {
    params.set("brand_slugs", decodeURI(searchParams.brands));
  }
  if (searchParams.boutiques && searchParams.boutiques !== "null") {
    params.set("boutique_slugs", decodeURI(searchParams.boutiques));
  }
  if (boutiqueId && boutiqueId !== "listing" && boutiqueId !== "null") {
    params.set("boutique_slugs", `["${boutiqueId}"]`);
  }

  // console.log(
  //   `params: ${decodeURIComponent(params.toString())} ${JSON.stringify(
  //     searchParams
  //   )}`
  // );
  return params;
};
