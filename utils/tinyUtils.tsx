import { useAppStore } from "store";
import { LogError, translateFunction } from "./functions";
import { posthogReset } from "./posthog";
import { GA_GLOBAL_SCREEN } from "./GAEvents";
import { fetchData, abortInFlightForLogout } from "./fetchData";
import Image from "next/image";
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
export const clearAllUserData = async () => {
  // Stop every in-flight authed request NOW so none of them can resolve a 401
  // mid-logout and trigger a re-register. Runs after FCM-token removal (done
  // earlier in handleLogout) and does not affect this bare logout fetch.
  abortInFlightForLogout();
  await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
  // Break the PostHog identity link so the next guest session isn't stitched
  // onto the user who just logged out (fresh anonymous distinct_id + session).
  posthogReset();
  sessionStorage.clear();
  localStorage.clear();
  document.cookie = "";
};
export const getCurrency = async ({ callback }) => {
  try {
    let response = await fetchData({
      url: "/home/currency",
      reqTitle: REQUESTS_DATA.CURRENCY_REQUEST,
      method: "GET",
      server: "market",
    });
    // @ts-ignore
    if (!response.success) {
      throw new Error(response.message);
    }
    callback({ currency: response.data, res: {} });
    return response.data;
  } catch (err) {
    LogError({
      scenario: "getCurrency in ProductPageData",
      error: err instanceof Error ? err.message : String(err),
    });
    callback({ currency: null, res: {} });
    return null;
  }
};

export const VALID_ISO=[
  "AF", "AL", "DZ", "AS", "AD", "AO", "AI", "AQ", "AG", "AR", 
  "AM", "AW", "AU", "AT", "AZ", "BS", "BH", "BD", "BB", "BY", 
  "BE", "BZ", "BJ", "BM", "BT", "BO", "BQ", "BA", "BW", "BV", 
  "BR", "IO", "BN", "BG", "BF", "BI", "CV", "KH", "CM", "CA", 
  "KY", "CF", "TD", "CL", "CN", "CX", "CC", "CO", "KM", "CD", 
  "CG", "CK", "CR", "HR", "CU", "CW", "CY", "CZ", "CI", "DK", 
  "DJ", "DM", "DO", "EC", "EG", "SV", "GQ", "ER", "EE", "SZ", 
  "ET", "FK", "FO", "FJ", "FI", "FR", "GF", "PF", "TF", "GA", 
  "GM", "GE", "DE", "GH", "GI", "GR", "GL", "GD", "GP", "GU", 
  "GT", "GG", "GN", "GW", "GY", "HT", "HM", "VA", "HN", "HK", 
  "HU", "IS", "IN", "ID", "IR", "IQ", "IE", "IM", "IL", "IT", 
  "JM", "JP", "JE", "JO", "KZ", "KE", "KI", "KP", "KR", "KW", 
  "KG", "LA", "LV", "LB", "LS", "LR", "LY", "LI", "LT", "LU", 
  "MO", "MG", "MW", "MY", "MV", "ML", "MT", "MH", "MQ", "MR", 
  "MU", "YT", "MX", "FM", "MD", "MC", "MN", "ME", "MS", "MA", 
  "MZ", "MM", "NA", "NR", "NP", "NL", "NC", "NZ", "NI", "NE", 
  "NG", "NU", "NF", "MP", "NO", "OM", "PK", "PW", "PS", "PA", 
  "PG", "PY", "PE", "PH", "PN", "PL", "PT", "PR", "QA", "MK", 
  "RO", "RU", "RW", "RE", "BL", "SH", "KN", "LC", "MF", "PM", 
  "VC", "WS", "SM", "ST", "SA", "SN", "RS", "SC", "SL", "SG", 
  "SX", "SK", "SI", "SB", "SO", "ZA", "GS", "SS", "ES", "LK", 
  "SD", "SR", "SJ", "SE", "CH", "SY", "TW", "TJ", "TZ", "TH", 
  "TL", "TG", "TK", "TO", "TT", "TN", "TR", "TM", "TC", "TV", 
  "UG", "UA", "AE", "GB", "UM", "US", "UY", "UZ", "VU", "VE", 
  "VN", "VG", "VI", "WF", "EH", "YE", "ZM", "ZW", "AX"
]
export const FlagIcon = ({ iso ,isFromProductPage=false}) => {
  if(!VALID_ISO.includes(iso?.toUpperCase())) return <></>
  if (iso.toLowerCase() === "sy")
    return (
      <Image
        style={isFromProductPage?{
          maxHeight:'14px'
        }:{}}
        src="/icons/flag/sy.svg"
        alt={translateFunction("sy") || "sy"}
        width={25}
        height={16}
      />
    );

  return (
    <Image
       style={isFromProductPage?{
          maxHeight:'14px'
        }:{}}
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
  languageVar = null,
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
      languageVar || language,
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
    if (url?.file_path?.includes("media_server")) {
      return url?.file_path;
    } else {
      return process.env.NEXT_PUBLIC_BASE_MEDIA_URL + url?.file_path;
    }
  }
  if (!url || typeof url !== "string") return url;
  if (url && url?.includes("http")) return url;
  return process.env.NEXT_PUBLIC_BASE_MEDIA_URL + url;
};

export const getVideoUrl = (
  input: string,
  options?: {
    start?: number | string;
    end?: number | string;
    width?: number | string;
    height?: number | string;
  },
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

  if (input.startsWith("http") && input.includes("/video/upload/")) {
    return input.replace(
      /\/video\/upload\/(v\d+)?/,
      `/video/upload/${transformStr}/$1`,
    );
  }

  const mediaBase = process.env.NEXT_PUBLIC_BASE_VIDEO_MEDIA_URL;
  // const version = "v1";
  const folder = "product/videos";

  // Remove any leading slash and ensure .mp4 extension
  let filename = input.replace(/^\//, "");
  if (!filename.endsWith(".mp4")) {
    filename = `${filename}.mp4`;
  }


  return `${mediaBase}${transformStr}/${folder}/${filename}`;
};
export const ShowNotificationSign = ({
  order_group_id = null,
  order_id = null,
}) => {
  const { showNotificaionCircle } = useAppStore.getState();
  if (
    showNotificaionCircle?.find(
      (e) => e.order_id === order_id || e.order_group_id === order_group_id,
    )
  ) {
    return true;
  }
  return false;
};

export const buildParamsFromFilters = (
  filters: Record<string, string[]>,
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
          color.startsWith("#") ? color.substring(1) : color,
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
  selectedSize,
) {
  // Normalize comparison for flexibility
  const normalize = (str) => (str ? str.toLowerCase().trim() : "");

  // Find matching color option (can match color_name OR color_option)
  let color = null;
  if (selectedColor) {
    color = colors.find(
      (c) =>
        normalize(c?.color_name) === normalize(selectedColor) ||
        normalize(c?.color_option) === normalize(selectedColor),
    );
  }

  // Find matching size option (can match name OR option)
  let size = null;
  if (selectedSize) {
    size = sizes.find(
      (s) =>
        normalize(s) === normalize(selectedSize) ||
        normalize(s) === normalize(selectedSize),
    );
  }

  // Build variation type based on rules
  let variationType = null;
  if (color && size) {
    variationType = `${color?.color_option}-${size}`;
  } else if (color) {
    variationType = color?.color_option;
  } else if (size) {
    variationType = size;
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
  language = "en",
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
      g.call(legacyNavigator, c, resolve, reject),
    );
  };

  const stopStream = (stream?: MediaStream) => {
    stream?.getTracks().forEach((t) => {
      try {
        t.stop();
      } catch (e) {}
    });
  };

  // Permissions API pre-check
  try {
    if (navigator.permissions?.query) {
      const queries: Promise<PermissionStatus>[] = [];

      if (camera) {
        try {
          queries.push(
            navigator.permissions.query({ name: "camera" as PermissionName }),
          );
        } catch {}
      }
      if (mic) {
        try {
          queries.push(
            navigator.permissions.query({
              name: "microphone" as PermissionName,
            }),
          );
        } catch {}
      }

      if (queries.length) {
        const results = await Promise.allSettled(queries);

        if (
          results.some(
            (r) => r.status === "fulfilled" && r.value.state === "denied",
          )
        ) {
          return false;
        }

        if (
          results.every(
            (r) => r.status === "fulfilled" && r.value.state === "granted",
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

export const isGuestName = (name?: string): boolean => {
  if (!name) return false;
  const lower = name.toLowerCase().trim();
  return lower === "guest" || lower === "verified_guest" || lower === "verfied_guest";
};

