// import translations from "public/translations/translations.js";
import { useAppStore } from "store";
import LocalizationServiceClass from "services/localization";

import { fetchData } from "./fetchData";
import {
  getCookie,
  setCookie,
  deleteCookie,
  COOKIE_NAMES,
} from "./cookies/cookie-manager";
import { REQUESTS_DATA } from "./Requests";
import { readStoredLastPaths } from "./history";
import { getLastRequest } from "./requestLoggerClient";
import { ReportError } from "./errorReported";
import { posthogCaptureException } from "./posthog";
import {
  extractPrimaryErrorMessage,
  serializeUnknownForErrorLog,
} from "./errorSerialization";
import { CartApiInterface } from "./types/cart";
export const SSRDetect = () => {
  return typeof window !== "undefined";
};

// Cached translations per language — loaded once, reused forever
const translationCache: Record<string, Record<string, string>> = {};

async function loadTranslations(lang: string): Promise<Record<string, string>> {
  if (translationCache[lang]) return translationCache[lang];

  let mod: { default: Record<string, string> };
  if (lang === "ar")
    mod = await import("public/translations/translations.ar.js");
  else if (lang === "ku")
    mod = await import("public/translations/translations.ku.js");
  else if (lang === "tr")
    mod = await import("public/translations/translations.tr.js");
  else return {};

  translationCache[lang] = mod.default;
  return mod.default;
}

// Eagerly kick off loading for the current language so it's ready fast
if (typeof window !== "undefined") {
  const pathLang = window.location.pathname.split("/")[1]?.split("-")[1];
  if (pathLang && pathLang !== "en") loadTranslations(pathLang);
}

export function translateFunction(key: string, language?: string | string[]) {
  let languageUrl: string | undefined;

  if (typeof window !== "undefined") {
    languageUrl = window.location.pathname.split("/")[1].split("-")[1];
  } else {
    languageUrl =
      (language as string) || LocalizationServiceClass.GetAppLanguage();
  }
  if (!languageUrl || languageUrl === "en") return key;

  // Return from cache if already loaded (synchronous fast path)
  const cached = translationCache[languageUrl];
  if (cached) return cached[key] || key;

  // Kick off async load — on next call it will be cached
  loadTranslations(languageUrl);
  return key;
}

export const getUserChat = (): any => {
  const userChat = useAppStore.getState().userChat;
  if (userChat) return userChat;
  else return {};
};
export const getUserStories = (): any => {
  let userCookie = getCookie<any>(COOKIE_NAMES.USER_DATA);
  console.log(useAppStore.getState().userStories, userCookie);
  if (useAppStore.getState().userStories)
    return useAppStore.getState().userStories;
  else {
    return { id: userCookie?.story_user_id };
  }
};

export const _isStoreLastJson = () => {
  return !!process.env.NEXT_PUBLIC_IS_STORE_LAST_JSON;
};

export const getConfiguredImage = ({ src, width, height, q, c_pad }: any) => {
  if (typeof src === "string") {
    return src.replace(
      "/upload",
      `/upload/h_${height}${width ? `,w_${width}` : ""},${
        c_pad ? "w_800,c_pad" : "c_pad,b_auto"
      }/f_auto/q_auto:good/fl_lossy/so_0`,
    );
  }
  if (src?.file_path?.includes("media_server")) {
    return src.file_path.replace(
      "/upload/",
      `/upload/h_${height}${width ? `,w_${width}` : ""},${
        c_pad ? "w_800,c_pad" : "c_pad,b_auto"
      }/f_auto/q_auto:good/fl_lossy/so_0`,
    );
  } else return src?.file_path || src || "";
};

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

  // 1. الضرب بالمعامل (مثلاً 100)
  let multiplied = Number(number) * factor;

  // 2. إصلاح خطأ الفواصل العشرية في لغة البرمجة
  // نقوم بتقريب الرقم لأقرب 12 خانة عشرية للتخلص من أي كسور وهمية
  // مثل 830.0000000000001 ستعود لتصبح 830
  multiplied = Number(multiplied.toFixed(12));

  // 3. الآن نطبق التقريب للأعلى (Ceil)
  const ceiled = Math.ceil(multiplied);

  // 4. القسمة وإرجاع النص
  return (ceiled / factor).toFixed(decimalDigits);
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
  const {
    currency,
    settings,
    language: languageVariable,
  } = useAppStore.getState();

  // Currency conversion at the start
  let rateVariable = rate || currency?.exchange_rate || 1;
  let deciaml_points = points || currency?.decimal_digits || 0;
  price_num = Number(toFixedUp(deciaml_points, price_num));
  let number = preciseMultiply(price_num, rateVariable);

  if (returnNumber) {
    return number;
  }

  // Return raw converted number if requested
  let languageCode = language ?? languageVariable ?? "en";

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

export const onClickSearchHistory = (searchValue) => {
  if (localStorage.getItem("search-history")) {
    let arr = JSON.parse(localStorage.getItem("search-history"));
    if (arr.some((s) => s.toLowerCase() === searchValue.toLowerCase())) {
    } else {
      let arr = JSON.parse(localStorage.getItem("search-history"));
      localStorage.setItem(
        "search-history",
        JSON.stringify([searchValue, ...arr]),
      );
    }
    return [searchValue, ...arr];
  } else {
    localStorage.setItem("search-history", JSON.stringify([searchValue]));
    return [searchValue];
  }
};

export const getOldCart = async () => {
  const userId =
    useAppStore.getState().userProfile?.id || useAppStore.getState().user?.id;
  let waited = 0;
  while (!userId && waited < 300000) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    waited += 1000;
  }
  if (!userId) return [];
  try {
    let response: any = await fetchData({
      url: "/old-cart/get_old_cart",
      reqTitle: REQUESTS_DATA.OLD_CART_REQUEST,
      method: "GET",
      server: "market",
    });
    // @ts-ignore
    if (!response.success) {
      throw new Error(response.message);
    }
    const { storeOldCart } = useAppStore.getState();

  const originalData = response?.data?.original?.data ?? response?.data;
  const oldCart = originalData?.oldCart || []; // 1. Fallback to an empty array

  // 2. Create a shallow copy using [...] before sorting
  const sortedCart = [...oldCart].sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  // 3. Update the store safely
  if (originalData) {
    storeOldCart({
      ...originalData,
      oldCart: sortedCart
    });
  }
  } catch (error) {
    LogError({
      scenario: "Error in getOldCart in  functions",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
export const getCart = async ({ callback }): Promise<CartApiInterface> => {
  const { initCart, setCartShippingSuccess } = useAppStore.getState();
  let userId =
    useAppStore.getState().userProfile?.id || useAppStore.getState().user?.id;

  // wait until user id has value for 5 minutes
  let waited = 0;
  while (!userId && waited < 300000) {
    userId =
      useAppStore.getState().userProfile?.id || useAppStore.getState().user?.id;
    await new Promise((resolve) => setTimeout(resolve, 1000));
    waited += 1000;
  }
  if (!userId) return { cart: [] } as CartApiInterface;
  try {
    let response: any = await fetchData({
      // url: "/cart",
      url: "/cart/cart_shipping",
      reqTitle: REQUESTS_DATA.CART_REQUEST,
      method: "GET",
      server: "market",
    });
    // @ts-ignore
    if (!response.success) {
      // @ts-ignore
      setCartShippingSuccess(response.message);
      throw new Error(response.message);
    }
    initCart(response.data);
    return response.data;
  } catch (err) {
    LogError({
      scenario: "Error in getCart in  functions",
      error: err instanceof Error ? err.message : String(err),
    });
    if (callback) callback([{ cart: [] }]);
    return { cart: [] } as CartApiInterface;
  }
};
export const GetCartOreview = async () => {
  const { setCartPreview } = useAppStore.getState();
  try {
    let response = await fetchData({
      url: "/cart/cart_overview",
      reqTitle: REQUESTS_DATA.CART_OVERVIEW,
      method: "GET",
      server: "market",
    });
    // @ts-ignore
    if (!response.success) {
      throw new Error(response.message);
    }
    setCartPreview(response.data);
  } catch (error) {
    LogError({
      scenario: "Error in GetCartOreview in  functions",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
export const LogError = async (error) => {
  // LogError is frequently called un-awaited (fire-and-forget). Guard the whole
  // body so a failure inside enrichment/reporting can never surface as an
  // unhandled rejection (which the global listeners would then try to log).
  try {
  if (typeof window !== "undefined") {
    let { LoggingOut } = useAppStore.getState();
    if (LoggingOut) return;
  }
  let last_request;
  const userData = useAppStore.getState().userProfile;
  const userChat = useAppStore.getState().userChat;
  const userStories = useAppStore.getState().userStories;
  const last_paths = await readStoredLastPaths();
  if (typeof window !== "undefined") {
    last_request = await getLastRequest();
  } else {
    last_request = "server...cannot access localstorage";
  }
  const language = getCookie("language");
  const country = getCookie("country");
  const userIP = getCookie("userIP");
  let serializedError = error;
  if (error instanceof Error) {
    serializedError = {
      message: error.message,
      stack: error.stack,
      name: error.name,
    };
  }
  const message = extractPrimaryErrorMessage(
    typeof serializedError === "object" && serializedError !== null
      ? serializedError
      : { message: String(serializedError ?? "") },
  );
  const baseError: Record<string, any> =
    typeof serializedError === "object" && serializedError !== null
      ? (serializedError as Record<string, any>)
      : serializedError !== undefined
        ? { message: String(serializedError) }
        : {};
  const Error_Object = {
    ...(baseError ?? {}),
    message,
    userChat,
    userData,
    userStories,
    last_paths,
    last_request,
    language,
    country,
    userIP,
    timestamp: new Date().toISOString(),
    url: typeof window !== "undefined" ? window.location.href : undefined,
    user_agent:
      typeof navigator !== "undefined" ? navigator.userAgent : undefined,
  };
  ReportError(Error_Object);
  // Mirror to PostHog error tracking so each exception links to its session
  // replay. No-op until PostHog has initialised; never throws (best-effort).
  posthogCaptureException(error, {
    scenario: baseError?.scenario,
    message,
    url: Error_Object.url,
    country,
    language,
  });
  await storeError(Error_Object);
  } catch {
    // ignore — error logging is best-effort and must never throw
  }
};
export async function storeError(error) {
  // The logging path must never throw or reject. A failed log POST that bubbled
  // up would become an unhandled rejection — which the global error listeners
  // would then try to log, risking a loop. Swallow every failure here.
  try {
    const safeError = serializeUnknownForErrorLog(error ?? {});
    if (typeof window !== "undefined") {
      await fetch("/api/internal/mobile-error-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: safeError }),
        credentials: "include",
      }).catch(() => {});
    } else {
      await fetch(
        process.env.NEXT_PUBLIC_GO_BACKEND_URL + "/mobile_error_log/store",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: JSON.stringify({
            error_description: JSON.stringify({
              platform: "\u{1F6D1}WEB\u{1F6D1}",
              ...(typeof safeError === "object" &&
              safeError !== null &&
              !Array.isArray(safeError)
                ? (safeError as Record<string, unknown>)
                : { payload: safeError }),
            }),
          }),
        },
      ).catch(() => {});
    }
  } catch {
    // ignore — logging must be best-effort
  }
}
export const WaitForCondition = async () => {
  const { isRegisteringReady } = useAppStore.getState();
  return new Promise((resolve, reject) => {
    const interval = setInterval(() => {
      const isReady = isRegisteringReady;
      if (isReady) {
        clearInterval(interval);
        resolve("Ready, now performing the request!");
      }
    }, 1000); // Check every second

    // Optional: timeout in case it's taking too long
    // Wait for 10 seconds
  });
};

// Compare membership lives in cookies (`f_p` / `s_p`), which don't emit change
// events. Firing this lets interested components sync event-driven instead of
// polling on a timer.
export const COMPARE_CHANGED_EVENT = "compare-changed";
const notifyCompareChanged = () => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(COMPARE_CHANGED_EVENT));
  }
};

export const addToCompare = (slug: string) => {
  const f_p = getCookie<string>("f_p");
  const s_p = getCookie<string>("s_p");

  let result: string;
  if (!f_p) {
    setCookie("f_p", slug);
    result = `?f_p=${slug}`;
  } else if (!s_p) {
    setCookie("s_p", slug);
    result = `?f_p=${f_p}&s_p=${slug}`;
  } else {
    // If both exist, replace the first one
    setCookie("f_p", slug);
    result = `?f_p=${slug}&s_p=${s_p}`;
  }
  notifyCompareChanged();
  return result;
};

export const removeFromCompare = (slug: string) => {
  const f_p = getCookie<string>("f_p");
  const s_p = getCookie<string>("s_p");

  let result: string | null;
  if (f_p === slug) {
    deleteCookie("f_p");
    if (s_p) {
      // Move s_p to f_p
      setCookie("f_p", s_p);
      deleteCookie("s_p");
      result = `?f_p=${s_p}`;
    } else {
      result = "";
    }
  } else if (s_p === slug) {
    deleteCookie("s_p");
    result = f_p ? `?f_p=${f_p}` : "";
  } else {
    result = null;
  }
  notifyCompareChanged();
  return result;
};

/**
 * Compare two cart products by product_id and variations (Size, color, color_options)
 * Returns true if they are the same product with the same variation
 */
export const areProductsEqual = (prodA: any, prodB: any): boolean => {
  if (!prodA || !prodB) return false;
  const varA = prodA.variations && prodA.variations ? prodA.variations : {};
  const varB = prodB.variations && prodB.variations ? prodB.variations : {};
  return (
    prodA.product_id === prodB.product_id &&
    (varA.Size || "") === (varB.Size || "") &&
    (varA.color || "") === (varB.color || "") &&
    (varA.color_options || "") === (varB.color_options || "")
  );
};
