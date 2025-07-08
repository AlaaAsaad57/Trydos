import { useAppStore } from "store";
import { translateFunction } from "./functions";
import replaceString from "replace-string";
import { allCountries } from "country-telephone-data";
import { textMarshal } from "node_modules/text-marshal/lib";
import { GA_GLOBAL_SCREEN } from "./GAEvents";
import { fetchData } from "./fetchData";
// TypeScript interfaces for filter system
export interface FilterParams {
  boutiques?: string[];
  categories?: string[];
  brands?: string[];
  colors?: string[];
  sizes?: string[];
  prices?: string[];
  search_text?: string[];
}

export interface FilterItemProps {
  term: string;
  item: any;
  filterParams: FilterParams | any;
  isUsingParsedFilters: boolean;
  currency: any;
  params: any;
  boutique: any;
}

export interface FilterState {
  isFiltered: boolean;
  href: string;
}

export interface FilterListProps {
  parsedFilters?: FilterParams;
  searchParams?: any;
  params: any;
  filters: any;
  currency: any;
  boutique: any;
  isFeatured?: boolean;
  isFlashDeals?: boolean;
}

export const CielNumber = (price) => {
  return Math.ceil(price * 1000) / 1000;
};
export const getPrice = (num, lang, currency, decimal = 0) => {
  let rateVariable = currency?.exchange_rate;
  let price = parseFloat(num);
  price = parseFloat((price * rateVariable).toFixed(decimal));

  if (price >= 1000000) {
    return CielNumber(price / 1000000) + translateFunction("M", lang); // For millions
  } else if (price >= 100000) {
    return CielNumber(price / 1000) + translateFunction("K", lang); // For thousands
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
  filters_offset = null,
}): URLSearchParams => {
  let params = new URLSearchParams();
  params.set("lang", lang);
  params.set("limit", "10");
  if (filters_offset && filters_offset !== "") {
    params.set("filters_offset", filters_offset);
  }
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
    params.set("boutique_slugs", decodeURIComponent(searchParams.boutiques));
  }
  if (boutiqueId && boutiqueId !== "listing" && boutiqueId !== null) {
    params.set("boutique_slugs", `["${decodeURIComponent(boutiqueId)}"]`);
  }
  if (searchParams.tags_names && searchParams.tags_names !== "null") {
    params.set("tags_names", decodeURIComponent(searchParams.tags_names));
  }
  // console.log(
  //   `params: ${decodeURIComponent(params.toString())} ${JSON.stringify(
  //     searchParams
  //   )}`
  // );

  return params;
};
export const GetFilterUrlParams = ({
  boutiqueId,
  searchParams: filtersSearchParams,
}) => {
  let searchFilters, searchFiltersEdit;
  if (filtersSearchParams?.get("categories")?.length > 0) {
    searchFilters = {
      ...searchFilters,
      categories: JSON.parse(
        decodeURIComponent(filtersSearchParams?.get("categories"))
      )?.map((s) => ({ slug: s })),
    };
  }
  if (filtersSearchParams?.get("brands")?.length > 0) {
    searchFilters = {
      ...searchFilters,
      brands: JSON.parse(
        decodeURIComponent(filtersSearchParams?.get("brands"))
      ).map((s) => ({ slug: s })),
    };
  }
  if (filtersSearchParams?.get("colors")?.length > 0) {
    searchFilters = {
      ...searchFilters,
      colors: JSON.parse(
        decodeURIComponent(filtersSearchParams?.get("colors"))
      ),
    };
  }
  if (filtersSearchParams?.get("sizes")?.length > 0) {
    searchFilters = {
      ...searchFilters,
      sizes: JSON.parse(decodeURIComponent(filtersSearchParams?.get("sizes"))),
    };
  }
  if (filtersSearchParams?.get("prices")?.length > 0) {
    searchFilters = {
      ...searchFilters,
      prices: JSON.parse(
        decodeURIComponent(filtersSearchParams?.get("prices"))
      ),
    };
  }
  if (
    boutiqueId === "listing" &&
    filtersSearchParams?.get("boutiques")?.length > 0
  ) {
    searchFilters = {
      ...searchFilters,
      boutiques: JSON.parse(
        decodeURIComponent(filtersSearchParams?.get("boutiques"))
      ).map((s) => ({ slug: s })),
    };
  }
  if (boutiqueId !== "listing") {
    searchFilters = {
      ...searchFilters,
      boutiques: JSON.parse(decodeURIComponent(`["${boutiqueId}"]`)).map(
        (s) => ({
          slug: s,
        })
      ),
    };
  }
  if (filtersSearchParams?.search_text?.length > 0) {
    searchFilters = {
      ...searchFilters,
      search_text: filtersSearchParams?.search_text,
    };
  }

  if (searchFilters?.categories && searchFilters.categories.length > 0) {
    searchFiltersEdit = {
      ...searchFiltersEdit,
      categories: JSON.stringify(searchFilters.categories.map((s) => s.slug)),
    };
  }
  if (searchFilters?.brands && searchFilters.brands.length > 0) {
    searchFiltersEdit = {
      ...searchFiltersEdit,
      brands: JSON.stringify(searchFilters.brands.map((s) => s.slug)),
    };
  }
  if (searchFilters?.boutiques && searchFilters.boutiques.length > 0) {
    searchFiltersEdit = {
      ...searchFiltersEdit,
      boutiques: JSON.stringify(searchFilters.boutiques.map((s) => s.slug)),
    };
  }
  if (searchFilters?.colors && searchFilters.colors.length > 0) {
    searchFiltersEdit = {
      ...searchFiltersEdit,
      colors: JSON.stringify(searchFilters.colors.map((s) => s)),
    };
  }
  if (searchFilters?.sizes && searchFilters.sizes.length > 0) {
    searchFiltersEdit = {
      ...searchFiltersEdit,
      sizes: JSON.stringify(searchFilters.sizes.map((s) => s)),
    };
  }
  if (searchFilters?.prices?.length > 0) {
    searchFiltersEdit = {
      ...searchFiltersEdit,
      prices: JSON.stringify(searchFilters?.prices?.map((s) => s)),
    };
  }
  if (searchFilters?.search_text?.length > 0) {
    searchFiltersEdit = {
      ...searchFiltersEdit,
      search_text: searchFilters?.search_text,
    };
  }
  let requestSearchParams = new URLSearchParams();
  if (searchFiltersEdit && Object.keys(searchFiltersEdit)?.length > 0) {
    requestSearchParams.set("searchParams", JSON.stringify(searchFiltersEdit));
  }
  requestSearchParams.set("noProducts", "true");
  return requestSearchParams;
};
export const ChatConroller = (payload) => {
  const { openChat, setChatOpen } = useAppStore.getState();
  if (payload) document.documentElement.style.overflow = "hidden";
  else document.documentElement.style.overflow = "initial";
  window.history.pushState({ isPopup: true }, "open Chat");
  openChat(payload);
  setChatOpen(payload);
};
export const getCurrency = async ({ callback }) => {
  let response = await fetchData({
    url: "/mobile/home/currency",
    reqTitle: "Currency Request",
    method: "GET",
    server: "market",
  });

  callback({ currency: response.data?.currency, res: {} });
  return response.data?.currency;
};
export const FlagIcon = ({ iso }) => {
  if (iso.toLowerCase() === "sy")
    return (
      <img
        src="/svg/sy.svg"
        alt={translateFunction("sy")}
        width={15}
        height={10}
      />
    );

  return (
    <img
      src={`/svg/flag/${iso?.toLowerCase()}.svg`}
      alt={translateFunction(iso)}
      width={15}
      height={10}
    />
  );
};
export const formatTime = (timeString: string) => {
  const MONTH_NAMES = [
    translateFunction("January"),
    translateFunction("February"),
    translateFunction("March"),
    translateFunction("April"),
    translateFunction("May"),
    translateFunction("June"),
    translateFunction("July"),
    translateFunction("August"),
    translateFunction("September"),
    translateFunction("October"),
    translateFunction("November"),
    translateFunction("December"),
  ];
  let date = !timeString?.includes("Z")
    ? new Date(timeString + "Z")
    : new Date(timeString);
  if (isNaN(date?.getTime())) {
    date = new Date(timeString + "Z");
  }
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const seconds = date.getSeconds().toString().padStart(2, "0");
  const timeFormat = `${hours}:${minutes}:${seconds}`;

  if (date.toDateString() === today.toDateString()) {
    return `Today | ${timeFormat}`;
  }

  if (date.toDateString() === yesterday.toDateString()) {
    return `Yesterday | ${timeFormat}`;
  }

  const isSameYear = date.getFullYear() === today.getFullYear();
  const isNewerThanToday = date > today;

  if (isSameYear && isNewerThanToday) {
    const day = date.getDate();
    const monthName = MONTH_NAMES[date.getMonth()];
    return `${day} ${monthName}`;
  }

  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();

  return `${day}/${month}/${year} | ${timeFormat}`;
};
export const formatTimeForAddress = (timeString: string) => {
  const MONTH_NAMES = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const date = new Date(timeString);

  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const seconds = date.getSeconds().toString().padStart(2, "0");
  const timeFormat = `${hours}:${minutes}:${seconds}`;

  if (date.toDateString() === today.toDateString()) {
    return `Today | ${timeFormat}`;
  }

  if (date.toDateString() === yesterday.toDateString()) {
    return `Yesterday | ${timeFormat}`;
  }

  const isSameYear = date.getFullYear() === today.getFullYear();
  const isNewerThanToday = date > today;

  if (isSameYear && isNewerThanToday) {
    const day = date.getDate();
    const monthName = MONTH_NAMES[date.getMonth()];
    return `${day} ${monthName}`;
  }

  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();

  return `${day}/${month}/${year} | ${timeFormat}`;
};
export const GetAddressString = (location) => {
  let str = "";
  if (
    location?.province &&
    location?.province.length > 0 &&
    location?.province !== "null"
  )
    str += `${location?.province}`;
  if (location?.city && location?.city.length > 0 && location?.city !== "null")
    str += ` | ${location?.city}`;
  if (location?.town && location?.town.length > 0 && location?.town !== "null")
    str += ` | ${location?.town}`;
  if (
    location?.street &&
    location?.street?.length > 0 &&
    location?.street !== "null"
  )
    str += ` | ${location.street}`;
  if (
    location?.building &&
    location?.building?.length > 0 &&
    location?.building !== "null"
  )
    str += ` | ${location?.building}`;
  return str;
};
export const GetImageUrl = (url) => {
  if (url?.file_path) {
    if (url?.file_path?.includes("cloudinary")) {
      return url?.file_path;
    } else {
      return process.env.NEXT_PUBLIC_BASE_CLOUDINARY_URL + url?.file_path;
    }
  }
  if (!url || typeof url !== "string") return url;
  if (url && url?.includes("http")) return url;
  return process.env.NEXT_PUBLIC_BASE_CLOUDINARY_URL + url;
};
export const formatPhone = (phone) => {
  let pattern = null,
    valid = false;
  let country = getCountry(phone);
  if (country) {
    pattern = replaceString(country.format || "", ".", "x");

    pattern = replaceString(pattern, "-", "");
    pattern = replaceString(pattern, " ", "");
    pattern = replaceString(pattern, "+", "");
  }
  pattern = pattern || "xxxxxxxxxxxxxxxxx";
  let data = textMarshal({
    input: phone,
    template: pattern,
    disallowCharacters: [/[a-z]/],
  });
  if (
    data.plaintext.length ===
    pattern?.split("").filter((letter) => letter === "x").length
  ) {
    valid = true;
  } else {
    valid = false;
  }
  return { data, pattern, valid };
};
export const getCountry = (text?: string) => {
  return allCountries.filter((countryItem) =>
    text.startsWith(countryItem.dialCode)
  ).length === 1
    ? allCountries.filter((countryItem) =>
        text.startsWith(countryItem.dialCode)
      )[0]
    : allCountries.filter((countryItem) =>
        text.startsWith(countryItem.dialCode)
      )[0];
};

/**
 * Parse filters from URL path parameters
 * Expected order: boutiques > categories > brands > colors > sizes > prices > search
 * @param params - Array of URL path segments
 * @returns Object with filter arrays
 */
export const parseFiltersFromParams = (
  params: string[] = []
): Record<string, string[]> => {
  const filters: Record<string, string[]> = {};

  if (!params || params.length === 0) return filters;

  // Handle potential encoding issues in the entire params array
  const cleanParams = params.map((param) => {
    try {
      // First try to decode in case the entire param is encoded
      return decodeURIComponent(param);
    } catch (e) {
      // If that fails, just return the original
      return param;
    }
  });

  let currentIndex = 0;
  const filterOrder = [
    "boutiques",
    "categories",
    "brands",
    "colors",
    "sizes",
    "prices",
    "search",
    "tags_names",
  ];

  while (currentIndex < cleanParams.length) {
    const filterType = cleanParams[currentIndex];

    if (!filterOrder.includes(filterType)) {
      currentIndex++;
      continue;
    }

    // Get the values for this filter (next segment)
    if (currentIndex + 1 < cleanParams.length) {
      let values = cleanParams[currentIndex + 1];

      // Handle URL encoded commas (%2C) and other encoded characters
      try {
        values = decodeURIComponent(values);
      } catch (e) {
        // If decoding fails, use the original value
        console.warn("Failed to decode URL component:", values, e);
      }

      if (filterType === "search") {
        // Search is a single value, not comma-separated
        filters.search_text = [values];
      } else if (filterType === "colors") {
        // Colors are hex values - ensure they have # prefix for internal use
        filters[filterType] = values.split(",").map((color) => {
          // Handle potential double encoding
          let cleanColor = color;
          try {
            cleanColor = decodeURIComponent(color);
          } catch (e) {
            // If decoding fails, use original
          }
          return cleanColor.startsWith("#") ? cleanColor : `#${cleanColor}`;
        });
      } else {
        // Other filters are comma-separated
        filters[filterType] = values.split(",").map((value) => {
          // Handle potential double encoding of individual values
          try {
            return decodeURIComponent(value);
          } catch (e) {
            return value;
          }
        });
      }

      currentIndex += 2; // Skip the filter type and its values
    } else {
      currentIndex++;
    }
  }

  return filters;
};

/**
 * Build URL path parameters from filters object
 * @param filters - Object with filter arrays
 * @returns Array of path segments
 */
export const buildParamsFromFilters = (
  filters: Record<string, string[]>
): string[] => {
  const params: string[] = [];
  const filterOrder = [
    "boutiques",
    "tags_names",
    "categories",
    "brands",
    "colors",
    "sizes",
    "prices",
    "search",
  ];

  filterOrder.forEach((filterType) => {
    const values = filters[filterType];
    if (values && values.length > 0) {
      // Add filter type
      const paramName = filterType === "search" ? "search" : filterType;
      params.push(paramName);

      // Add values
      if (filterType === "search") {
        // Search is a single value
        params.push(encodeURIComponent(values[0]));
      } else if (filterType === "colors") {
        // Colors should be hex without #
        const colorValues = values.map((color) =>
          color.startsWith("#") ? color.substring(1) : color
        );
        params.push(colorValues.join(","));
      } else {
        // Other filters are comma-separated
        params.push(values.join(","));
      }
    }
  });

  return params;
};

/**
 * Convert filters object to the format expected by configureSearchParams
 * @param filters - Parsed filters from URL params
 * @returns SearchParams object
 */
export const filtersToSearchParams = (filters: Record<string, string[]>) => {
  const searchParams: any = {};

  Object.keys(filters).forEach((key) => {
    const values = filters[key];
    if (values && values.length > 0) {
      if (key === "search_text") {
        searchParams[key] = values[0];
      } else {
        searchParams[key] = JSON.stringify(values);
      }
    }
  });

  return searchParams;
};

/**
 * Get filter URL for navigation
 * @param currentFilters - Current filters object
 * @param filterType - Type of filter to modify
 * @param value - Value to add/remove
 * @param lang - Language code
 * @param boutiqueId - Boutique ID (optional)
 * @returns New URL path
 */
export const getFilterUrl = (
  currentFilters: Record<string, string[]>,
  filterType: string,
  value: string,
  lang: string,
  boutiqueId?: string
): string => {
  const newFilters = { ...currentFilters };

  // Handle special case for prices - only allow one value
  if (filterType === "prices") {
    if (newFilters[filterType]?.includes(value)) {
      newFilters[filterType] = [];
    } else {
      newFilters[filterType] = [value];
    }
  } else {
    // For other filters, toggle the value
    if (!newFilters[filterType]) {
      newFilters[filterType] = [];
    }

    if (newFilters[filterType].includes(value)) {
      newFilters[filterType] = newFilters[filterType].filter(
        (v) => v !== value
      );
    } else {
      newFilters[filterType] = [...newFilters[filterType], value];
    }
  }

  // Clean up empty filters
  Object.keys(newFilters).forEach((key) => {
    if (!newFilters[key] || newFilters[key].length === 0) {
      delete newFilters[key];
    }
  });

  const pathParams = buildParamsFromFilters(newFilters);
  const basePath = boutiqueId
    ? `/${lang}/filters/boutiques/${boutiqueId}`
    : `/${lang}/filters`;

  return pathParams.length > 0
    ? `${basePath}/${pathParams.join("/")}`
    : basePath;
};
export const DetectScreen = () => {
  let pathname = window.location.pathname;
  let searchParams = new URLSearchParams(window.location.search);
  if (searchParams.get("cart") === "true") {
    return GA_GLOBAL_SCREEN.CART_SCREEN;
  }
  if (pathname?.includes("/products")) {
    return GA_GLOBAL_SCREEN.PRODUCT_SCREEN;
  } else if (pathname.includes("/filters")) {
    return GA_GLOBAL_SCREEN.BOUTIQUE_SCREEN;
  } else {
    return GA_GLOBAL_SCREEN.HOME_SCREEN;
  }
};
export function generateCloudinaryUrl({
  width,
  height,
  publicIds,
  overlayText,
}) {
  const baseUrl = `https://res.cloudinary.com/dtcmozf4d/image`;
  const baseTransform = `upload/v1/h_${height},w_${width}/f_auto/q_auto:good/fl_lossy/so_0`;

  // remove leading slash if exists
  const cleanPublicIds = publicIds.map((id) => id.replace(/^\//, ""));
  const cleanBackgroundId = "product%2F2025-05-12-6821f4684c309".replace(
    /^\//,
    ""
  );
  const backgroundId = cleanBackgroundId;
  const layerWidth = Math.floor(width / publicIds.length);

  const layers = cleanPublicIds.map((id, i) => {
    const safeId = id.replace(/\//g, ":"); // Cloudinary folder-safe
    const x = i * layerWidth;
    return `l_${safeId},w_${layerWidth},h_${height},o_90,c_fill,g_north_west,x_${x},y_0`;
  });

  const encodedText = encodeURIComponent(
    `            ${overlayText}            `
  ).replace(/%20/g, " ");
  const textLayer = `l_text:arial_90_thin:${encodedText},co_rgb:1d1d1d,g_south,y_20`;

  const allTransforms = [baseTransform, ...layers, textLayer].join("/");

  const bgImage = backgroundId; // Already cleaned
  console.log(
    `${baseUrl}/${allTransforms}/${bgImage}.jpg`,
    "SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS"
  );
  return `${baseUrl}/${allTransforms}/${bgImage}.jpg`;
}
