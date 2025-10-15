import { useAppStore } from "store";
import { translateFunction } from "./functions";
import replaceString from "replace-string";
import { allCountries } from "country-telephone-data";
import { textMarshal } from "node_modules/text-marshal/lib";
import { GA_GLOBAL_SCREEN } from "./GAEvents";
import { fetchData } from "./fetchData";
import Image from "node_modules/next/image";
import { REQUESTS_DATA } from "./Requests";
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

  isFeatured?: boolean;
  isFlashDeals?: boolean;
}

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

  return params;
};
export const ChatConroller = (payload) => {
  try {
    const { openChat, setChatOpen } = useAppStore.getState();
    if (payload) DisableScroll();
    else EnableScroll();
    openChat(payload);
    setChatOpen(payload);
  } catch (error) {}
};
export const getCurrency = async ({ callback }) => {
  try {
    let response = await fetchData({
      url: "/mobile/home/currency",
      reqTitle: REQUESTS_DATA.CURRENCY_REQUEST,
      method: "GET",
      server: "market",
    });
    // @ts-ignore
    if (!response.success) {
      throw new Error(response.message);
    }
    callback({ currency: response.data?.currency, res: {} });
    return response.data?.currency;
  } catch (err) {
    callback({ currency: null, res: {} });
    return null;
  }
};
export const FlagIcon = ({ iso }) => {
  if (iso.toLowerCase() === "sy")
    return (
      <Image
        src="/svg/sy.svg"
        alt={translateFunction("sy") || "sy"}
        width={15}
        height={10}
      />
    );

  return (
    <Image
      src={`/svg/flag/${iso?.toLowerCase()}.svg`}
      alt={translateFunction(iso) || "iso"}
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
export const formatTimeForAddress = (
  timeString: string,
  languageVar = null
) => {
  const { language } = useAppStore.getState();
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
    let translated_month = translateFunction(
      MONTH_NAMES[date.getMonth()],
      languageVar || language
    );
    const day = date.getDate();
    const monthName = translated_month;
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
/**
 * Get the best Cloudinary video URL with optional clip segment and size.
 * @param input - Cloudinary video URL or public ID (e.g., 'folder/video.mp4' or full URL)
 * @param options - Optional: { start?: number (seconds), end?: number (seconds), width?: number, height?: number }
 * @returns Cloudinary video URL with best quality, size, and optional clip
 */
export const getVideoUrl = (
  input: string,
  options?: {
    start?: number | string;
    end?: number | string;
    width?: number | string;
    height?: number | string;
  }
): string => {
  // Build transformation string
  let transformations = [];
  if (options?.height) {
    transformations.push(`h_${options.height}`);
  }
  const width = options?.width ?? 720;
  transformations.push(`w_${width}`, "c_limit");
  transformations.push("f_auto");
  transformations.push("q_auto:best");
  transformations.push("vc_auto");
  // Default to 5s-15s if not provided
  const start = options?.start ?? 1;
  const end = options?.end ?? 10;

  transformations.push(`so_${start}`);
  transformations.push(`eo_${end}`);

  const transformStr = transformations.join(",");

  // If input is a full Cloudinary URL, insert the transformation after '/upload/' and before '/v1/'
  if (input.startsWith("http") && input.includes("/video/upload/")) {
    return input.replace(
      /\/video\/upload\/(v\d+)?/,
      `/video/upload/${transformStr}/$1`
    );
  }

  // Otherwise, treat input as public ID and build the correct format
  const cloudinaryBase = "https://res.cloudinary.com/dtcmozf4d/video/upload/";
  const version = "v1";
  const folder = "product/videos";

  // Remove any leading slash and ensure .mp4 extension
  let filename = input.replace(/^\//, "");
  if (!filename.endsWith(".mp4")) {
    filename = `${filename}.mp4`;
  }

  return `${cloudinaryBase}${transformStr}/${version}/${folder}/${filename}`;
};
export const ShowNotificationSign = ({
  order_group_id = null,
  order_id = null,
}) => {
  const { showNotificaionCircle } = useAppStore.getState();
  if (
    showNotificaionCircle?.find(
      (e) => e.order_id === order_id || e.order_group_id === order_group_id
    )
  ) {
    return true;
  }
  return false;
};
export const formatPhone = (phone) => {
  let valid = false;
  let country = getCountry(phone);
  let data;
  switch (country?.iso2?.toLowerCase()) {
    case "sy":
      data = phone.replace(/\D/g, "")?.slice(0, 12);
      if (country && data.length === 12) {
        valid = true;
      } else {
        valid = false;
      }
    case "lb":
      data = phone.replace(/\D/g, "")?.slice(0, 12);
      if (country && data.length > 10 && data.length <= 12) {
        valid = true;
      } else {
        valid = false;
      }
    case "iq":
      data = phone.replace(/\D/g, "")?.slice(0, 13);

      if (country && data.length === 13) {
        valid = true;
      } else {
        valid = false;
      }
    case "tr":
      data = phone.replace(/\D/g, "")?.slice(0, 12);

      if (country && data.length === 12) {
        valid = true;
      } else {
        valid = false;
      }
    default:
      data = phone.replace(/\D/g, "")?.slice(0, 13);

      if (country && data.length > 9 && data.length <= 13) {
        valid = true;
      } else {
        valid = false;
      }
  }

  return { data, valid };
};
const getCountry = (text?: string) => {
  return allCountries.filter((countryItem) =>
    text?.startsWith(countryItem.dialCode)
  ).length === 1
    ? allCountries?.filter((countryItem) =>
        text?.startsWith(countryItem.dialCode)
      )[0]
    : allCountries.filter((countryItem) =>
        text?.startsWith(countryItem.dialCode)
      )[0];
};
type parsedFilters = {
  boutiques?: string[];
  brands?: string[];
  categories?: string[];
  colors?: string[];
  tags_names?: string[];
  sizes?: string[];
  search_text?: string[];
  prices?: any[];
};
/**
 * Parse filters from URL path parameters
 * Expected order: boutiques > categories > brands > colors > sizes > prices > search
 * @param params - Array of URL path segments
 * @returns Object with filter arrays
 */
export const parseFiltersFromParams = (
  params: string[] = []
): parsedFilters => {
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

export const DetectScreen = () => {
  let pathname = window.location.pathname;
  let searchParams = new URLSearchParams(window.location.search);
  if (pathname.includes("/setting")) {
    return GA_GLOBAL_SCREEN.SETTINGS_SCREEN;
  }
  if (searchParams.get("cart") === "true") {
    return GA_GLOBAL_SCREEN.CART_SCREEN;
  }
  if (pathname?.includes("/products")) {
    return GA_GLOBAL_SCREEN.PRODUCT_SCREEN;
  } else if (pathname.includes("tags_names")) {
    return GA_GLOBAL_SCREEN.TAGS_SCREEN;
  } else if (pathname.includes("/filters/boutique")) {
    return GA_GLOBAL_SCREEN.BOUTIQUE_SCREEN;
  } else if (pathname?.includes("/filters")) {
    return GA_GLOBAL_SCREEN.FILTERS_SCREEN;
  } else {
    return GA_GLOBAL_SCREEN.HOME_SCREEN;
  }
};
export function generateCloudinaryUrl({
  width,
  height,
  publicIds,
  overlayText,
}: {
  width: number;
  height: number;
  publicIds: string[];
  overlayText?: string;
}) {
  const baseUrl = `https://res.cloudinary.com/dtcmozf4d/image`;

  // Keep full path including extension
  const cleanPublicIds = publicIds.map((id) => id.replace(/^\//, ""));

  // Base image (used directly in URL)
  const baseImage = cleanPublicIds[0]; // must include .png

  // Overlays (all except the first)
  const overlayIds = cleanPublicIds;

  const layerWidth = Math.floor(width / publicIds.length);

  const layers = overlayIds.map((id, i) => {
    const safeId = id.split(".")[0].replace(/\//g, ":"); // remove .png for overlay syntax
    const x = i * layerWidth; // (i + 1) because base is at x=0
    return `l_${safeId},w_${layerWidth},h_${height},c_fill,g_north_west,x_${x},y_0`;
  });

  const transform = [
    `w_${width},h_${height}`,
    `f_auto/q_auto:good/fl_lossy/so_0`,
    ...layers,
  ].join("/");

  return `${baseUrl}/upload/${transform}/${baseImage}`;
}

export const totalAmount = (arr) => {
  let total = 0;
  arr?.map((s) => {
    total += s.order_amount;
  });
  return total;
};

/**
 * Removes special characters and limits input to 90 characters.
 * Used for input sanitization (pollination).
 */
export const pollinateInput = (value: string): string => {
  if (typeof value !== "string") return "";
  let input = value.replace(/[<>,!#$%^&*()]/g, "");
  if (input.length > 90) {
    input = input.slice(0, 90);
  }
  return input;
};
export const DisableScroll = () => {
  document.documentElement.style.overflow = "hidden";
  // document.documentElement.scrollTop = 0;
};
export const EnableScroll = () => {
  document.documentElement.style.overflow = "initial";
};
export function getReferralSource(referer: string | null): string {
  if (!referer) return "direct";

  const url = referer.toLowerCase();

  if (url.includes("facebook")) return "facebook";
  if (url.includes("instagram")) return "instagram";
  if (url.includes("twitter") || url.includes("x")) return "twitter/X";
  if (url.includes("t.co")) return "twitter-shortlink";
  if (url.includes("whatsapp")) return "whatsapp";
  if (url.includes("linkedin")) return "linkedin";
  if (url.includes("tiktok")) return "tiktok";
  if (url.includes("snapchat")) return "snapchat";

  return "other";
}
export function findVariation(
  variations,
  colors,
  sizes,
  selectedColor,
  selectedSize
) {
  // Normalize comparison for flexibility
  const normalize = (str) => (str ? str.toLowerCase().trim() : "");

  // Find matching color option (can match color_name OR color_option)
  let color = null;
  if (selectedColor) {
    color = colors.find(
      (c) =>
        normalize(c?.color_name) === normalize(selectedColor) ||
        normalize(c?.color_option) === normalize(selectedColor)
    );
  }

  // Find matching size option (can match name OR option)
  let size = null;
  if (selectedSize) {
    size = sizes.find(
      (s) =>
        normalize(s.name) === normalize(selectedSize) ||
        normalize(s.option) === normalize(selectedSize)
    );
  }

  // Build variation type based on rules
  let variationType = null;
  if (color && size) {
    variationType = `${color?.color_option}-${size.option}`;
  } else if (color) {
    variationType = color?.color_option;
  } else if (size) {
    variationType = size?.option;
  }

  if (!variationType) return null;

  // Find matching variation in the variations array
  return (
    variations.find((v) => normalize(v.type) === normalize(variationType)) ||
    null
  );
}
export function isSameColor(colorA, colorB) {
  const normalize = (str) => (str ? str.toLowerCase().trim() : "");

  // Convert string into an object-like form
  const toColorObj = (color) => {
    if (!color) return null;
    if (typeof color === "string") {
      return { color_name: color, color_option: color };
    }
    return color;
  };

  const a = toColorObj(colorA);
  const b = toColorObj(colorB);

  if (!a || !b) return false;

  return (
    normalize(a?.color_name) === normalize(b.color_name) ||
    normalize(a?.color_name) === normalize(b.color_option) ||
    normalize(a?.color_option) === normalize(b.color_name) ||
    normalize(a?.color_option) === normalize(b.color_option)
  );
}
interface CountriesResponse {
  countries: Country[];
}
interface Country {
  [key: string]: any;
}

export async function fetchCountries(
  country = "tr",
  language = "en"
): Promise<CountriesResponse> {
  try {
    return {
      countries: [
        {
          id: 103,
          phonecode: 964,
          iso: "IQ",
          name: "Iraq",
          longitude: "43.6848",
          latitude: "33.2209",
        },
        {
          id: 119,
          phonecode: 961,
          iso: "LB",
          name: "Lebanon",
          longitude: "35.4954",
          latitude: "33.8886",
        },
        {
          id: 208,
          phonecode: 963,
          iso: "SY",
          name: "Syria",
          longitude: "36.2783",
          latitude: "33.5104",
        },
        {
          id: 219,
          phonecode: 90,
          iso: "TR",
          name: "Turkey",
          longitude: "35.6667",
          latitude: "39.1667",
        },
      ],
    };
  } catch (error) {
    console.error("Error fetching countries:", error);
    return {
      countries: [
        {
          id: 103,
          phonecode: 964,
          iso: "IQ",
          name: "Iraq",
          longitude: "43.6848",
          latitude: "33.2209",
        },
        {
          id: 119,
          phonecode: 961,
          iso: "LB",
          name: "lebanon",
          longitude: "35.4954",
          latitude: "33.8886",
        },
        {
          id: 208,
          phonecode: 963,
          iso: "SY",
          name: "syria",
          longitude: "36.2783",
          latitude: "33.5104",
        },
        {
          id: 219,
          phonecode: 90,
          iso: "TR",
          name: "Turkey",
          longitude: "35.6667",
          latitude: "39.1667",
        },
      ],
    };
  }
}
export const ShowDayStr = (index, language) => {
  var days = [
    translateFunction("Sunday", language),
    translateFunction("Monday", language),
    translateFunction("Tuesday", language),
    translateFunction("Wednesday", language),
    translateFunction("Thursday", language),
    translateFunction("Friday", language),
    translateFunction("Saturday", language),
  ];
  return days[index];
};
