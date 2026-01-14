import { useAppStore } from "store";
import { translateFunction } from "./functions";
import { allCountries } from "country-telephone-data";
import { GA_GLOBAL_SCREEN } from "./GAEvents";
import { fetchData } from "./fetchData";
import Image from "node_modules/next/image";
import { REQUESTS_DATA } from "./Requests";

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
        src="/icons/flag/sy.svg"
        alt={translateFunction("sy") || "sy"}
        width={25}
        height={16}
      />
    );

  return (
    <Image
      src={`/icons/flag/${iso?.toLowerCase()}.svg`}
      alt={translateFunction(iso) || "iso"}
      width={25}
      height={16}
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
    location?.country &&
    location?.country.length > 0 &&
    location?.country !== "null"
  ) {
    str += `${location?.country} | `;
  }
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
export const pollinateInput = (value: string): string => {
  if (typeof value !== "string") return "";
  let input = value.replace(/[<>,#$%^&*()]/g, "");
  if (input.length > 90) {
    input = input.slice(0, 90);
  }
  return input;
};
export const DisableScroll = (noScrolling = false) => {
  document.documentElement.style.overflow = "hidden";
  if (!noScrolling) document.documentElement.scrollTop = 0;
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

export function getFirstLetterLang(text: string): "right" | "left" {
  if (!text) return "left"; // default direction
  const firstChar = text.trim().charAt(0);

  // Arabic and Sorani letters fall in these Unicode ranges
  const rtlPattern = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/;

  return rtlPattern.test(firstChar) ? "right" : "left";
}

export async function requestPermissions({ camera = false, mic = false } = {}) {
  // Extend Navigator type for legacy browsers
  const legacyNavigator = navigator as Navigator & {
    webkitGetUserMedia?: typeof navigator.mediaDevices.getUserMedia;
    mozGetUserMedia?: typeof navigator.mediaDevices.getUserMedia;
    msGetUserMedia?: typeof navigator.mediaDevices.getUserMedia;
    getUserMedia?: typeof navigator.mediaDevices.getUserMedia;
  };

  // Nothing requested
  if (!camera && !mic) return true;

  const constraints = {
    video: camera || false,
    audio: mic || false,
  };

  const getUserMedia = (c: MediaStreamConstraints) => {
    if (navigator.mediaDevices?.getUserMedia) {
      return navigator.mediaDevices.getUserMedia(c);
    }
    const g =
      legacyNavigator.getUserMedia ||
      legacyNavigator.webkitGetUserMedia ||
      legacyNavigator.mozGetUserMedia ||
      legacyNavigator.msGetUserMedia;

    if (!g) return Promise.reject(new Error("getUserMedia unsupported"));

    return new Promise<MediaStream>((resolve, reject) =>
      g.call(legacyNavigator, c, resolve, reject)
    );
  };

  const stopStream = (stream?: MediaStream) => {
    stream?.getTracks().forEach((t) => {
      try {
        t.stop();
      } catch (_) {}
    });
  };

  // Permissions API pre-check
  try {
    if (navigator.permissions?.query) {
      const queries: Promise<PermissionStatus>[] = [];

      if (camera) {
        try {
          queries.push(
            navigator.permissions.query({ name: "camera" as PermissionName })
          );
        } catch {}
      }
      if (mic) {
        try {
          queries.push(
            navigator.permissions.query({
              name: "microphone" as PermissionName,
            })
          );
        } catch {}
      }

      if (queries.length) {
        const results = await Promise.allSettled(queries);

        if (
          results.some(
            (r) => r.status === "fulfilled" && r.value.state === "denied"
          )
        ) {
          return false;
        }

        if (
          results.every(
            (r) => r.status === "fulfilled" && r.value.state === "granted"
          )
        ) {
          return true;
        }
      }
    }
  } catch {}

  // Request together
  try {
    const stream = await getUserMedia(constraints);
    stopStream(stream);
    return true;
  } catch {
    let cameraOk = !camera;
    let micOk = !mic;

    if (mic) {
      try {
        const sA = await getUserMedia({ audio: true });
        stopStream(sA);
        micOk = true;
      } catch {
        micOk = false;
      }
    }

    if (camera) {
      try {
        const sV = await getUserMedia({ video: true });
        stopStream(sV);
        cameraOk = true;
      } catch {
        cameraOk = false;
      }
    }

    return cameraOk && micOk;
  }
}

export const sanitizePhone = (value: string) => {
  // Remove everything except digits and +
  let cleaned = value.replace(/[^+\d]/g, "");

  // Keep only the first + (if present)
  const hasPlus = cleaned.startsWith("+");

  // Strip all + signs
  cleaned = cleaned.replace(/\+/g, "");

  // Re-add a single + if the input originally started with one
  return hasPlus ? "+" + cleaned : cleaned;
};
