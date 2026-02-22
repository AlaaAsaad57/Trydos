import ar from "public/translations/translations.ar.js";
import ku from "public/translations/translations.ku.js";
import tr from "public/translations/translations.tr.js";
const translations = { ar, ku, tr };
export const getConfiguredImage = ({
  src,
  width = null,
  height,
  c_pad = false,
}) => {
  if (typeof src === "string") {
    return src.replace(
      "/upload",
      `/upload/h_${height}${width ? `,w_${width}` : ""},${
        c_pad ? "w_800,c_pad" : "c_pad,b_auto"
      }/f_auto/q_auto:good/fl_lossy/so_0`
    );
  }
  if (src?.file_path?.includes("cloudinary")) {
    return src.file_path.replace(
      "/upload/v1",
      `/upload/v1/h_${height}${width ? `,w_${width}` : ""},${
        c_pad ? "w_800,c_pad" : "c_pad,b_auto"
      }/f_auto/q_auto:good/fl_lossy/so_0`
    );
  } else return src?.file_path || src || "";
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

export const configureImageForBoutique = (src) => {
  return src.replace(
    "/upload",
    `/upload/w_1356,c_pad,b_auto/f_auto/q_auto:best/fl_lossy/so_0`
  );
};

export function translateFunction(key: string, language: string) {
  return translations[language]?.[key] || key;
}

function preciseMultiply(a, b) {
  const aStr = a.toString();
  const bStr = b.toString();

  // عدد الأرقام بعد الفاصلة في كل رقم
  const aDecimals = (aStr.split(".")[1] || "").length;
  const bDecimals = (bStr.split(".")[1] || "").length;

  // نحذف الفواصل ونحول الأرقام لأعداد صحيحة
  const intA = Number(aStr.replace(".", ""));
  const intB = Number(bStr.replace(".", ""));

  // نضرب الأعداد الصحيحة
  const resultInt = intA * intB;

  // نعيد الفاصلة لمكانها الصحيح
  const decimals = aDecimals + bDecimals;
  return resultInt / Math.pow(10, decimals);
}
function toFixedUp(decimalDigits, number) {
  const factor = 10 ** decimalDigits;
  return (Math.ceil(Number(number) * factor) / factor).toFixed(decimalDigits);
}

export const RoundPrice = ({
  num,
  rate,
  returnNumber,
  language = "en",
  points,
}: {
  num?: number | string;
  rate?: number;
  returnNumber?: boolean;
  language?: string;
  points?: any;
}): number | string => {
  let price_num = Number(num);

  // Currency conversion at the start
  let rateVariable = rate;
  let deciaml_points = points;
  price_num = Number(toFixedUp(deciaml_points, price_num));
  let number = preciseMultiply(price_num, rateVariable);

  if (returnNumber) {
    return number;
  }

  // Return raw converted number if requested
  let languageCode = language ?? "en";

  // Dart's formatNumber logic
  const thousand = languageCode !== "ar" ? "K" : "أ";
  const million = languageCode !== "ar" ? "M" : "م";

  if (number >= 1e5 && number < 1e6) {
    const result = Math.floor((number + 999) / 1000);
    return `${result}${thousand}`;
  } else if (number === 0) {
    return "0";
  } else if (number < 1e5) {
    return number;
  } else {
    let result = Math.floor((number + 999) / 1000) / 1000;

    return `${result}${million}`;
  }
};

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
  if (end !== -1) {
    transformations.push(`so_${start}`);
    transformations.push(`eo_${end}`);
  }

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

export const getUrlofProduct = (
  color_name?: string,
  language?: string,
  country?: string,
  slug?: string
) => {
  if (color_name)
    return `/${country}-${language}/products/${slug}?color=${encodeURIComponent(
      color_name
    )}`;
  if (!color_name) {
    return `/${country}-${language}/products/${slug}`;
  }
};
type parsedFilters = {
  boutiques?: string[];
  brands?: string[];
  categories?: string[];
  colors?: string[];
  tags_names?: string[];
  sizes?: string[];
  search_text?: string[];
  search?: string[];
  prices?: any[];
};
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

function decodeValue(value: string | null): string {
  if (!value) return "";
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function parseArrayParam(value: string | null): string[] {
  const decoded = decodeValue(value);
  if (!decoded) return [];
  return decoded
    .replace(/^\[|\]$/g, "")
    .split(",")
    .map((s) => s.replace(/(^"|"$)/g, "").trim())
    .filter(Boolean);
}
function parseNumberArrayOfPrices(value: string | null): number[] {
  const decoded = decodeValue(value);

  if (!decoded) return [];
  return decoded
    .replace(/^\[|\]$/g, "")
    .replaceAll('"', "")
    .split("-")
    .map((n) => Number(n.trim()));
}
export function parseNumberArray(value: string | null): number[] {
  const decoded = decodeValue(value);

  if (!decoded) return [];
  return decoded
    .replace(/^\[|\]$/g, "")
    .split(",")
    .map((n) => Number(n.trim()))
    .filter((n) => !isNaN(n));
}

function stripQuotes(value: string | null): string | undefined {
  const decoded = decodeValue(value);
  if (!decoded) return undefined;
  return decoded.replace(/^"|"$/g, "");
}

function stripExtraQuotes(value: string): string {
  return value.replace(/^['"]+|['"]+$/g, "");
}

export function NormalizeSearchParamsForSearchRequest({
  searchParams,
  isFeatured,
  isFlashDeal,
}) {
  let filters: any = {};
  if (searchParams.category_slugs) {
    filters.categories = parseArrayParam(searchParams.category_slugs);
  }
  if (searchParams.boutique_slugs) {
    filters.boutiques = parseArrayParam(searchParams.boutique_slugs);
  }
  if (searchParams.brand_slugs) {
    filters.brands = parseArrayParam(searchParams.brand_slugs);
  }
  if (searchParams.colors) {
    filters.colors = parseArrayParam(searchParams.colors);
  }
  if (searchParams.tags_names) {
    filters.tags_names = parseArrayParam(searchParams.tags_names);
  }
  if (searchParams.price) {
    filters.priceRange = parseNumberArrayOfPrices(searchParams.price);
    filters.prices = parseNumberArrayOfPrices(searchParams.price);
  }
  if (searchParams.flash_deal || isFlashDeal) {
    filters.flashdeal = searchParams.flash_deal === "true" || isFlashDeal;
  }
  if (searchParams.search_text) {
    filters.search_text = stripQuotes(searchParams.search_text);
  }
  if (searchParams.attributes) {
    const decoded = decodeValue(searchParams.attributes);

    const clean = stripExtraQuotes(decoded);

    filters.sizes = JSON.parse(clean)?.[0]?.options;
  }
  if (isFeatured) filters.featured = true;
  return filters;
}

export function getRobotsConfig(productionRobots) {
  if (process.env.NODE_ENV !== "production") {
    return {
      index: false,
      follow: false,
      nocache: true,
      googleBot: {
        index: false,
        follow: false,
      },
    };
  }
  return productionRobots;
}

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

export const HandleIsActive = ({ values, item }) => {
  return values?.includes(item);
};
export interface FilterParams {
  boutiques?: string[];
  categories?: string[];
  brands?: string[];
  colors?: string[];
  sizes?: string[];
  prices?: string[];
  search_text?: string[];
}

export const pollinateInput = (value: string): string => {
  if (typeof value !== "string") return "";
  let input = value.replace(/[<>,#$%^&*()]/g, "");
  if (input.length > 90) {
    input = input.slice(0, 90);
  }
  return input;
};
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

export interface FilterItemProps {
  term: string;
  item: any;
  filterParams: FilterParams | any;
  isUsingParsedFilters: boolean;
  currency: any;
  params: any;
  isRtl?: boolean;
  baseUrlOfFiltersPage: string;
}

export interface FilterState {
  isFiltered: boolean;
  href: string;
}

export function stripHtml(html: string) {
  if (html) {
    return html.replace(/<[^>]*>/g, "").trim();
  }
  return "";
}

export const formatTime = (timeString: string, language) => {
  const MONTH_NAMES = [
    translateFunction("January", language),
    translateFunction("February", language),
    translateFunction("March", language),
    translateFunction("April", language),
    translateFunction("May", language),
    translateFunction("June", language),
    translateFunction("July", language),
    translateFunction("August", language),
    translateFunction("September", language),
    translateFunction("October", language),
    translateFunction("November", language),
    translateFunction("December", language),
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
export function getThumb(url, isVideo) {
  if (url) {
    if (isVideo) {
      return url.replace("/upload", "/upload/h_194/f_webp/q_100");
    } else return url.replace("/upload", "/upload/h_194/f_webp/q_100");
  }
}

export function convertTextToXFormat(input) {
  if (!input) return "";
  // Split the input text into words
  const words = input.split(" ");

  // Transform each word
  const transformedWords = words.map((word) => {
    // If the word is empty, return it as is
    if (word.length === 0) return word;

    // Get the first letter and replace the rest with 'x'
    return word.charAt(0) + "x".repeat(word.length - 1);
  });

  // Join the transformed words back into a string and return
  return transformedWords.join(" ");
}
