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
    return `/${country}-${language}/product/${slug}?color=${encodeURIComponent(
      color_name
    )}`;
  if (!color_name) {
    return `/${country}-${language}/product/${slug}`;
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
