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

// Loads already on their way, one per language. Without this, every call made
// before the first load finishes starts another import of the same file
// (158KB for Arabic) — a component rendering in a loop pays for it repeatedly.
const translationLoads: Record<string, Promise<Record<string, string>>> = {};

async function importTranslations(
  lang: string,
): Promise<Record<string, string>> {
  let mod: { default: Record<string, string> };
  if (lang === "ar")
    mod = await import("public/translations/translations.ar.js");
  else if (lang === "ku")
    mod = await import("public/translations/translations.ku.js");
  else if (lang === "tr")
    mod = await import("public/translations/translations.tr.js");
  else return {};

  return mod.default;
}

function loadTranslations(lang: string): Promise<Record<string, string>> {
  if (translationLoads[lang]) return translationLoads[lang];

  const pending = importTranslations(lang)
    .then((dictionary) => {
      translationCache[lang] = dictionary;
      return dictionary;
    })
    .finally(() => {
      delete translationLoads[lang];
    });

  translationLoads[lang] = pending;
  return pending;
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
    // Replace "/upload" and keep the slash that follows it, exactly as the
    // text branch above does — otherwise the rest of the path is glued to the
    // settings ("…/so_0v1/b.jpg").
    return src.file_path.replace(
      "/upload",
      `/upload/h_${height}${width ? `,w_${width}` : ""},${
        c_pad ? "w_800,c_pad" : "c_pad,b_auto"
      }/f_auto/q_auto:good/fl_lossy/so_0`,
    );
  }
  // Always text. An object with no path used to fall through to the object
  // itself, and every caller here expects an address.
  return src?.file_path || "";
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
  language,
  points,
}: {
  num?: number | string;
  rate?: number;
  returnNumber?: boolean;
  language?: string;
  points?: any;
}): number | string => {
  let price_num = Number(num);
  // A missing or unreadable price used to become NaN, which fails every band
  // test below and lands in the millions branch — the shopper was shown
  // "NaNM". Treat it as nothing instead.
  if (!Number.isFinite(price_num)) price_num = 0;
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
  let stored: string[] = [];
  const raw = localStorage.getItem("search-history");
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      // Stored history can be anything a browser has kept for months. Bad data
      // must not throw out of a click handler.
      if (Array.isArray(parsed)) stored = parsed;
    } catch {
      stored = [];
    }
  }

  const alreadyThere = stored.some(
    (s) => String(s).toLowerCase() === searchValue.toLowerCase(),
  );
  // On a repeat, hand back what is actually stored. Returning
  // [searchValue, ...stored] showed the shopper the same word twice.
  const history = alreadyThere ? stored : [searchValue, ...stored];

  localStorage.setItem("search-history", JSON.stringify(history));
  return history;
};

export const getOldCart = async () => {
  let userId =
    useAppStore.getState().userProfile?.id || useAppStore.getState().user?.id;

  // Re-read inside the loop, the same way getCart does. Reading it once meant
  // a user who signed in while we waited was never noticed.
  let waited = 0;
  while (!userId && waited < 300000) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    waited += 1000;
    userId =
      useAppStore.getState().userProfile?.id || useAppStore.getState().user?.id;
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
  const userData = useAppStore.getState().userProfile;
  const userChat = useAppStore.getState().userChat;
  const userStories = useAppStore.getState().userStories;
  const last_paths = await readStoredLastPaths();
  const language = getCookie("language");
  const country = getCookie("country");
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
    ...baseError,
    message,
    userChat,
    userData,
    userStories,
    last_paths,
    language,
    country,
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
    // Browser-only. The server-side path lives in utils/serverErrorReporter.ts
    // (storeErrorServer) so the Go gateway address is never inlined into the
    // client bundle — this module is imported by many client components.
    if (typeof window === "undefined") return;
    const safeError = serializeUnknownForErrorLog(error ?? {});
    await fetch("/api/internal/mobile-error-log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: safeError }),
      credentials: "include",
    }).catch(() => {});
  } catch {
    // ignore — logging must be best-effort
  }
}
// How long to wait for registration before going ahead anyway.
const WAIT_FOR_CONDITION_LIMIT = 10000;

export const WaitForCondition = async () => {
  return new Promise((resolve) => {
    // Read the flag from the shared state on every check. Reading it once, up
    // front, froze a copy — so the check could never see the flag being set,
    // and the caller waited for ever while a timer ran for the life of the page.
    if (useAppStore.getState().isRegisteringReady) {
      resolve("Ready, now performing the request!");
      return;
    }

    const interval = setInterval(() => {
      if (useAppStore.getState().isRegisteringReady) {
        clearInterval(interval);
        clearTimeout(limit);
        resolve("Ready, now performing the request!");
      }
    }, 1000); // Check every second

    // Give up after the limit so the caller is never stuck for ever.
    const limit = setTimeout(() => {
      clearInterval(interval);
      resolve("Gave up waiting, performing the request anyway!");
    }, WAIT_FOR_CONDITION_LIMIT);
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
    // Nothing was being compared under that slug, so nothing changed. Telling
    // everyone to re-read here made every listener work for nothing.
    return null;
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
