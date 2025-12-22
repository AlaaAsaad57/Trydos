"use server";

import ImageCircel from "components/ListingPage/filterComponents/FiltersWindow/ImageCircel";
import { getProductsAndFiltersFromElastic } from "services/elastic/elasticSearch";
import { HandleIsActive } from "utils/server";

export async function GetFilters({
  language,
  country,
  filter_offset = 1,
  filters,
}) {
  try {
    let response = await getProductsAndFiltersFromElastic({
      country,
      language_code: language,
      filters: filters,
      filters_offset: filter_offset,
      limit: 10,
    });
    let new_filters: any = {};
    if (response.categories.length) {
      new_filters.categories = response.categories;
    }
    if (response.brands?.length) {
      new_filters.brands = response.brands;
    }
    if (response.colors?.length) {
      new_filters.colors = response.colors;
    }
    if (response.attributes?.[0]?.options?.length) {
      new_filters.sizes = response.attributes?.[0]?.options;
    }
    if (response.prices?.[0] >= 0 && response.prices?.[1] >= 0) {
      new_filters.prices = new_filters.prices;
    }
    //   if (response.boutiques.length) {
    //     new_filters.boutiques = response.boutiques;
    //   }

    return {
      categories: new_filters?.categories?.map((category) => (
        <ImageCircel
          key={category.slug}
          isActive={HandleIsActive({
            values: filters.categories,
            item: category.slug,
          })}
          name={category.name}
          term={"Category"}
          value={category.slug}
          image={category.most_viewed_product_thumbnail}
        />
      )),
      brands: new_filters?.brands?.map((brand) => (
        <ImageCircel
          key={brand.slug}
          isActive={HandleIsActive({
            values: filters.brands,
            item: brand.slug,
          })}
          name={brand.name}
          term={"Category"}
          value={brand.slug}
          image={brand.icon}
        />
      )),
      colors: new_filters.colors.map((color) => (
        <ImageCircel
          key={color}
          isActive={HandleIsActive({
            values: filters?.colors?.map((s) => s?.replace("#", "")),
            item: color.replace("#", ""),
          })}
          color={color}
          name={color}
          value={color}
          term={"Color"}
        />
      )),
      sizes: new_filters.sizes.map((size) => (
        <ImageCircel
          isActive={HandleIsActive({
            values: filters?.sizes,
            item: size,
          })}
          key={size}
          name={size}
          value={size}
          term={"Size"}
        />
      )),
      prices: new_filters.prices,
      total_size: response.total_size,
    };
  } catch (error) {
    console.log(error);
  }
}
