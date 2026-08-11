import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { makeCookieManagerMock } from "tests/mocks/cookieManager";
import { makeFetchDataMock } from "tests/mocks/fetchData";
import { makeLocalizationMock } from "tests/mocks/localization";
import { makeMockFetch, failureReply, jsonReply } from "tests/mocks/mockFetch";
import { makeStoreMock } from "tests/mocks/store";

// ---------------------------------------------------------------------------
// Seeds and stand-in instances.
//
// A `vi.mock` factory runs ONCE and its result is kept, even across
// `vi.resetModules()`. So the factories below never build a stand-in
// themselves — they hand every call on to the instance held here, and
// `beforeEach` builds a fresh instance from the seeds. Without that, the
// second test in the file would still be looking at the first test's state.
// ---------------------------------------------------------------------------

/** The state the shared-store stand-in starts each test with. */
let storeSeed: Record<string, any> = {};

/** The cookies the cookie stand-in starts each test with. */
let cookieSeed: Record<string, any> = {};

/** The language the localization stand-in reports (used on the server side). */
let localizationSeed: { language?: string; country?: string } = {};

/** What the client fetch helper replies with. A test overrides this. */
let fetchDataReply: (params: any, authAttempt: number) => any = () => ({
  success: true,
});

/** The live stand-ins, rebuilt for every test from the seeds above. */
let storeMock = makeStoreMock({});
let cookieMock = makeCookieManagerMock({});
let localizationMock = makeLocalizationMock({});
let fetchMock = makeFetchDataMock({});

/** Stable spies. These are not rebuilt, so a factory may hold them directly. */
const reportErrorSpy = vi.fn();
const posthogCaptureExceptionSpy = vi.fn();
const readStoredLastPathsSpy = vi.fn(async () => ["/a", "/b"]);

// ---------------------------------------------------------------------------
// Stand-ins. Four come from the shared kit (tests/mocks/). The rest are local
// to this file: `./errorReported`, `./posthog`, `./errorSerialization`,
// `./history` and `./Requests` are OUR OWN wrappers, not the third-party
// clients the kit stands in for.
//
// The three translation files are stood in for HERE, at the top of the file,
// so no reload of the module under test can ever reach the real ones. They are
// ~466KB together, and the module loads one of them the moment it is imported
// with a non-English page address.
// ---------------------------------------------------------------------------

vi.mock("store", () => {
  const useAppStore: any = (selector?: (state: any) => any) => {
    const state = storeMock.useAppStore.getState();
    return selector ? selector(state) : state;
  };
  useAppStore.getState = () => storeMock.useAppStore.getState();
  useAppStore.setState = (partial: any, replace?: boolean) =>
    (storeMock.useAppStore as any).setState(partial, replace);
  useAppStore.subscribe = (listener: any) =>
    (storeMock.useAppStore as any).subscribe(listener);
  useAppStore.getInitialState = () => (storeMock.useAppStore as any).getInitialState();
  useAppStore.destroy = () => (storeMock.useAppStore as any).destroy();
  return { useAppStore };
});

vi.mock("services/localization", () => ({
  default: {
    GetAppLanguage: () => localizationMock.default.GetAppLanguage(),
    GetAppCountry: () => localizationMock.default.GetAppCountry(),
  },
}));

vi.mock("./fetchData", () => ({
  // Forward exactly the arguments the caller passed, so a test can assert on
  // how the helper was called without a phantom second argument.
  fetchData: (...args: any[]) => (fetchMock.fetchData as any)(...args),
  abortInFlightForLogout: (...args: any[]) =>
    (fetchMock.abortInFlightForLogout as any)(...args),
}));

vi.mock("./cookies/cookie-manager", () => ({
  get COOKIE_NAMES() {
    return cookieMock.COOKIE_NAMES;
  },
  get HTTPONLY_COOKIE_NAMES() {
    return cookieMock.HTTPONLY_COOKIE_NAMES;
  },
  getCookie: (...args: any[]) => (cookieMock.getCookie as any)(...args),
  setCookie: (...args: any[]) => (cookieMock.setCookie as any)(...args),
  deleteCookie: (...args: any[]) => (cookieMock.deleteCookie as any)(...args),
  clearHashedUserId: (...args: any[]) => (cookieMock.clearHashedUserId as any)(...args),
  setLocaizationCookies: (...args: any[]) =>
    (cookieMock.setLocaizationCookies as any)(...args),
}));

vi.mock("public/translations/translations.ar.js", () => ({
  default: { welcome: "AR-welcome" },
}));

vi.mock("public/translations/translations.tr.js", () => ({
  default: { welcome: "TR-welcome" },
}));

vi.mock("public/translations/translations.ku.js", () => ({
  default: { welcome: "KU-welcome" },
}));

vi.mock("./Requests", () => ({
  REQUESTS_DATA: {},
}));

vi.mock("./history", () => ({
  readStoredLastPaths: readStoredLastPathsSpy,
}));

vi.mock("./errorReported", () => ({
  ReportError: (...args: any[]) => reportErrorSpy(...args),
}));

vi.mock("./posthog", () => ({
  posthogCaptureException: (...args: any[]) => posthogCaptureExceptionSpy(...args),
}));

vi.mock("./errorSerialization", () => ({
  extractPrimaryErrorMessage: (value: unknown) =>
    (value as any)?.message ?? String(value),
  serializeUnknownForErrorLog: (value: unknown) => value,
}));

vi.mock("./types/cart", () => ({}));

// ---------------------------------------------------------------------------
// Loading the module under test.
//
// utils/functions.tsx does work the moment it is imported: it reads the page
// address and may start loading a translation file. So the address, the
// stand-ins and the clock all have to be in place BEFORE it is loaded, and it
// has to be loaded fresh for each test.
// ---------------------------------------------------------------------------

/** Set the address the page thinks it is on, using the browser's own history. */
function setPath(path: string) {
  window.history.replaceState({}, "", path);
}

/**
 * Build the stand-ins from the seeds as they are right now.
 *
 * This happens at load time, not in `beforeEach`, because a test sets its
 * seeds in its own body — which runs after `beforeEach` has finished.
 */
function buildStandIns() {
  storeMock = makeStoreMock(storeSeed);
  cookieMock = makeCookieManagerMock(cookieSeed);
  localizationMock = makeLocalizationMock(localizationSeed);
  fetchMock = makeFetchDataMock({
    reply: (params, attempt) => fetchDataReply(params, attempt),
  });
}

/** Load the module fresh, with the browser present. */
async function loadFunctions() {
  buildStandIns();
  vi.resetModules();
  return import("./functions");
}

/**
 * Load the module fresh with **no browser at all** — the server side.
 * `typeof window` reads as "undefined" once the global holds `undefined`.
 */
async function loadFunctionsWithoutBrowser() {
  buildStandIns();
  vi.stubGlobal("window", undefined);
  vi.resetModules();
  return import("./functions");
}

/** The live stand-ins this test is running against. */
function standIns() {
  return {
    jar: cookieMock.__jar as Record<string, any>,
    getCookie: cookieMock.getCookie,
    setCookie: cookieMock.setCookie,
    deleteCookie: cookieMock.deleteCookie,
    fetchData: fetchMock.fetchData,
    ReportError: reportErrorSpy,
    posthogCaptureException: posthogCaptureExceptionSpy,
    useAppStore: storeMock.useAppStore,
  };
}

/** A fetch that always succeeds and reaches no network. */
function alwaysOkFetch() {
  return vi.fn(async () => ({
    ok: true,
    status: 200,
    headers: { get: () => null },
    json: async () => ({}),
    text: async () => "",
  }));
}

const FIXED_NOW = new Date("2026-08-10T00:00:00.000Z");

beforeEach(() => {
  // Every seed is rebuilt, so nothing carries over from the previous test.
  storeSeed = {
    user: null,
    userProfile: null,
    userChat: null,
    userStories: null,
    LoggingOut: false,
    isRegisteringReady: true,
    currency: null,
    language: "en",
    // Actions the module calls. Each one exists on the real combined store
    // (store/Cart/reducer.ts), so standing them in proves nothing false.
    initCart: vi.fn(),
    storeOldCart: vi.fn(),
    setCartPreview: vi.fn(),
    setCartShippingSuccess: vi.fn(),
  };
  cookieSeed = {};
  localizationSeed = { language: "en" };
  fetchDataReply = () => ({ success: true });

  // These spies are not rebuilt per test, so both their calls AND anything a
  // test taught them have to be cleared by hand. `vi.clearAllMocks()` only
  // clears calls, so an implementation set by one test would leak into the
  // next.
  reportErrorSpy.mockReset();
  posthogCaptureExceptionSpy.mockReset();
  readStoredLastPathsSpy.mockReset();
  readStoredLastPathsSpy.mockImplementation(async () => ["/a", "/b"]);

  buildStandIns();

  // Browser storage is NOT emptied by resetting modules or clearing mocks, so
  // it has to be emptied by hand or one test leaves a list behind for the next.
  localStorage.clear();

  // Nothing may reach the network. Tests that assert on the request replace
  // this with a recording stand-in of their own.
  vi.stubGlobal("fetch", alwaysOkFetch());

  // Pin the clock so the timestamp the error logger writes is the same on
  // every machine. This module reads no time zone and no formatting locale —
  // its one date is an ISO string, which is always UTC, and its numbers are
  // built with plain string joins — so the clock, the language and the page
  // address are the whole of what "ambient" means here.
  vi.setSystemTime(FIXED_NOW);

  setPath("/sy-en");
});

afterEach(() => {
  // Drop any timer a test left behind, then give the real clock back. The
  // readiness helper never clears its own repeating check, so without this a
  // timer would outlive the test.
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.clearAllMocks();
  localStorage.clear();
});

// ===========================================================================

describe("SSRDetect", () => {
  it("reports true when a browser is present", async () => {
    const { SSRDetect } = await loadFunctions();
    expect(SSRDetect()).toBe(true);
  });

  it("reports false when there is no browser", async () => {
    const { SSRDetect } = await loadFunctionsWithoutBrowser();
    expect(SSRDetect()).toBe(false);
  });
});

describe("translateFunction", () => {
  it("gives the key back for English", async () => {
    setPath("/sy-en");
    const { translateFunction } = await loadFunctions();
    expect(translateFunction("welcome")).toBe("welcome");
  });

  it("gives the key back for an address with no language part", async () => {
    setPath("/");
    const { translateFunction } = await loadFunctions();
    expect(translateFunction("welcome")).toBe("welcome");
  });

  it("gives the key back at first, then the translation, and keeps giving unknown keys back", async () => {
    setPath("/sy-ar");
    const { translateFunction } = await loadFunctions();

    // Loading a language is asynchronous, so the first call cannot have it yet.
    expect(translateFunction("welcome")).toBe("welcome");

    await vi.waitFor(() => {
      expect(translateFunction("welcome")).toBe("AR-welcome");
    });

    // A key nobody translated still comes back as itself.
    expect(translateFunction("not-a-real-key")).toBe("not-a-real-key");
  });

  it("loads Turkish and Kurdish the same way", async () => {
    setPath("/sy-tr");
    const turkish = await loadFunctions();
    await vi.waitFor(() => {
      expect(turkish.translateFunction("welcome")).toBe("TR-welcome");
    });

    setPath("/sy-ku");
    const kurdish = await loadFunctions();
    await vi.waitFor(() => {
      expect(kurdish.translateFunction("welcome")).toBe("KU-welcome");
    });
  });

  it("gives the key back for a language nobody has translations for", async () => {
    setPath("/sy-de");
    const { translateFunction } = await loadFunctions();
    expect(translateFunction("welcome")).toBe("welcome");
  });

  it("asks the app for the language when there is no browser", async () => {
    localizationSeed = { language: "ar" };
    const { translateFunction } = await loadFunctionsWithoutBrowser();

    // There is no address bar to read, so the language comes from the app.
    // The key comes back while the translation is still on its way.
    expect(translateFunction("welcome")).toBe("welcome");
    expect(localizationMock.default.GetAppLanguage).toHaveBeenCalled();
  });

  it("gives the key back when the app language is English and there is no browser", async () => {
    localizationSeed = { language: "en" };
    const { translateFunction } = await loadFunctionsWithoutBrowser();

    expect(translateFunction("welcome")).toBe("welcome");
    expect(localizationMock.default.GetAppLanguage).toHaveBeenCalled();
  });

  it("prefers the language passed in over the app's, when there is no browser", async () => {
    localizationSeed = { language: "en" };
    const { translateFunction } = await loadFunctionsWithoutBrowser();

    translateFunction("welcome", "ar");

    // A language given by the caller short-circuits the question entirely, so
    // the app is never asked.
    expect(localizationMock.default.GetAppLanguage).not.toHaveBeenCalled();
  });

  it("ignores the language passed in when a browser is present", async () => {
    setPath("/sy-en");
    const { translateFunction } = await loadFunctions();
    // The address wins: the page says English, so Arabic is not used.
    expect(translateFunction("welcome", "ar")).toBe("welcome");
  });
});

describe("getUserChat", () => {
  it("returns the chat user from the shared state", async () => {
    storeSeed.userChat = { id: "chat-1" };
    const { getUserChat } = await loadFunctions();
    expect(getUserChat()).toEqual({ id: "chat-1" });
  });

  it("returns an empty object when there is no chat user", async () => {
    storeSeed.userChat = null;
    const { getUserChat } = await loadFunctions();
    expect(getUserChat()).toEqual({});
  });
});

describe("getUserStories", () => {
  let logSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // This helper used to print the story state AND the whole User-Data cookie
    // to the console on every call, so profile data reached every shopper's
    // browser console in production. Watched here so it cannot come back.
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  });

  it("returns the story user from the shared state", async () => {
    storeSeed.userStories = { id: "story-1" };
    const { getUserStories } = await loadFunctions();
    expect(getUserStories()).toEqual({ id: "story-1" });
  });

  it("falls back to the id held in the profile cookie", async () => {
    storeSeed.userStories = null;
    cookieSeed = { "User-Data": { story_user_id: 42 } };
    const { getUserStories } = await loadFunctions();
    expect(getUserStories()).toEqual({ id: 42 });
  });

  it("returns an undefined id when there is no state and no cookie", async () => {
    storeSeed.userStories = null;
    cookieSeed = {};
    const { getUserStories } = await loadFunctions();
    expect(getUserStories()).toEqual({ id: undefined });
  });

  it("writes nothing to the console", async () => {
    storeSeed.userStories = { id: "story-1" };
    cookieSeed = { "User-Data": { story_user_id: 42 } };
    const { getUserStories } = await loadFunctions();

    getUserStories();

    expect(logSpy).not.toHaveBeenCalled();
  });
});

describe("_isStoreLastJson", () => {
  it("is false when the setting is empty", async () => {
    vi.stubEnv("NEXT_PUBLIC_IS_STORE_LAST_JSON", "");
    const { _isStoreLastJson } = await loadFunctions();
    expect(_isStoreLastJson()).toBe(false);
  });

  it("is true when the setting has any value", async () => {
    vi.stubEnv("NEXT_PUBLIC_IS_STORE_LAST_JSON", "1");
    const { _isStoreLastJson } = await loadFunctions();
    expect(_isStoreLastJson()).toBe(true);
  });
});

describe("getConfiguredImage", () => {
  const CLOUD = "https://res.cloudinary.com/demo/image/upload/v1/sample.jpg";

  it("builds the address from a plain text source", async () => {
    const { getConfiguredImage } = await loadFunctions();
    expect(getConfiguredImage({ src: CLOUD, height: 100 })).toBe(
      "https://res.cloudinary.com/demo/image/upload/h_100,c_pad,b_auto/f_auto/q_auto:good/fl_lossy/so_0/v1/sample.jpg",
    );
  });

  it("includes the width when one is given", async () => {
    const { getConfiguredImage } = await loadFunctions();
    expect(getConfiguredImage({ src: CLOUD, height: 100, width: 200 })).toContain(
      "/upload/h_100,w_200,c_pad,b_auto/",
    );
  });

  it("switches to the padded form when asked", async () => {
    const { getConfiguredImage } = await loadFunctions();
    expect(
      getConfiguredImage({ src: CLOUD, height: 100, width: 200, c_pad: true }),
    ).toContain("/upload/h_100,w_200,w_800,c_pad/");
  });

  it("builds the same address from an object source as from text", async () => {
    const { getConfiguredImage } = await loadFunctions();
    // Both branches replace "/upload" and keep the slash that follows it, so
    // the rest of the path is not glued to the settings.
    expect(
      getConfiguredImage({
        src: { file_path: "https://media_server.example/upload/v1/b.jpg" },
        height: 100,
      }),
    ).toBe(
      "https://media_server.example/upload/h_100,c_pad,b_auto/f_auto/q_auto:good/fl_lossy/so_0/v1/b.jpg",
    );
  });

  it("includes the width and the padded form for an object source too", async () => {
    const { getConfiguredImage } = await loadFunctions();
    // The object branch takes the same two settings as the text one, so it has
    // to build the same address from them.
    expect(
      getConfiguredImage({
        src: { file_path: "https://media_server.example/upload/v1/b.jpg" },
        height: 100,
        width: 200,
        c_pad: true,
      }),
    ).toBe(
      "https://media_server.example/upload/h_100,w_200,w_800,c_pad/f_auto/q_auto:good/fl_lossy/so_0/v1/b.jpg",
    );
  });

  it("returns the path unchanged for an object that is not on the media host", async () => {
    const { getConfiguredImage } = await loadFunctions();
    expect(
      getConfiguredImage({
        src: { file_path: "https://example.com/other/c.jpg" },
        height: 100,
      }),
    ).toBe("https://example.com/other/c.jpg");
  });

  it("returns an empty string when there is no source at all", async () => {
    const { getConfiguredImage } = await loadFunctions();
    expect(getConfiguredImage({ src: undefined, height: 100 })).toBe("");
    expect(getConfiguredImage({ src: null, height: 100 })).toBe("");
  });

  it("returns an empty string for an object with no path", async () => {
    const { getConfiguredImage } = await loadFunctions();
    // It used to fall through to the object itself, and every caller here
    // expects an address.
    expect(getConfiguredImage({ src: {}, height: 100 })).toBe("");
  });
});

describe("RoundPrice", () => {
  it("returns the string zero for a price of zero", async () => {
    const { RoundPrice } = await loadFunctions();
    expect(RoundPrice({ num: 0 })).toBe("0");
  });

  it("returns a plain number below the thousands boundary", async () => {
    const { RoundPrice } = await loadFunctions();
    expect(RoundPrice({ num: 99999 })).toBe(99999);
  });

  it("uses the short thousands form from the boundary up", async () => {
    const { RoundPrice } = await loadFunctions();
    expect(RoundPrice({ num: 100000 })).toBe("100K");
    expect(RoundPrice({ num: 500000 })).toBe("500K");
  });

  it("pins today's behaviour: just under a million still reads as 1000K", async () => {
    const { RoundPrice } = await loadFunctions();
    expect(RoundPrice({ num: 999999 })).toBe("1000K");
  });

  it("uses the short millions form at a million and above", async () => {
    const { RoundPrice } = await loadFunctions();
    expect(RoundPrice({ num: 1000000 })).toBe("1M");
    expect(RoundPrice({ num: 2500000 })).toBe("2.5M");
  });

  it("uses the Arabic short forms when Arabic is passed in", async () => {
    const { RoundPrice } = await loadFunctions();
    expect(RoundPrice({ num: 100000, language: "ar" })).toBe("100أ");
    expect(RoundPrice({ num: 1000000, language: "ar" })).toBe("1م");
  });

  it("falls back to the shared state's language when the caller passes none", async () => {
    // The argument used to default to "en", so this fallback could never run
    // and an Arabic shopper saw "K" from the 24 call sites that pass no
    // language.
    storeSeed.language = "ar";
    const { RoundPrice } = await loadFunctions();
    expect(RoundPrice({ num: 100000 })).toBe("100أ");
  });

  it("falls back to English when nobody has a language at all", async () => {
    // The shared state can be read before the language has been set, and the
    // short forms still have to say something.
    storeSeed.language = undefined;
    const { RoundPrice } = await loadFunctions();
    expect(RoundPrice({ num: 100000 })).toBe("100K");
  });

  it("lets the language passed in win over the shared state's", async () => {
    storeSeed.language = "ar";
    const { RoundPrice } = await loadFunctions();
    expect(RoundPrice({ num: 100000, language: "en" })).toBe("100K");
  });

  it("returns the converted number untouched when asked for a number", async () => {
    const { RoundPrice } = await loadFunctions();
    expect(RoundPrice({ num: 10, rate: 2.5, returnNumber: true })).toBe(25);
  });

  it("takes the rate and the decimal places from the currency in the shared state", async () => {
    storeSeed.currency = { exchange_rate: 3, decimal_digits: 2 };
    const { RoundPrice } = await loadFunctions();
    expect(RoundPrice({ num: 10, returnNumber: true })).toBe(30);
  });

  it("lets an explicit rate win over the currency in the shared state", async () => {
    storeSeed.currency = { exchange_rate: 3, decimal_digits: 2 };
    const { RoundPrice } = await loadFunctions();
    expect(RoundPrice({ num: 10, rate: 2, returnNumber: true })).toBe(20);
  });

  it("multiplies without the usual decimal drift", async () => {
    storeSeed.currency = { exchange_rate: 3, decimal_digits: 2 };
    const { RoundPrice } = await loadFunctions();

    const result = RoundPrice({ num: 0.1, returnNumber: true });
    expect(result).toBe(0.3);
    // Plain multiplication does not give this answer.
    expect(0.1 * 3).not.toBe(result);
  });

  it("rounds a price up, never to the nearest", async () => {
    const { RoundPrice } = await loadFunctions();
    expect(RoundPrice({ num: 10.001, points: 2, returnNumber: true })).toBe(10.01);
    expect(RoundPrice({ num: 1234.5, returnNumber: true })).toBe(1235);
  });

  it("treats a missing or unreadable price as nothing", async () => {
    // It used to become NaN, fail every band test above, land in the millions
    // branch, and be shown to the shopper as "NaNM".
    const { RoundPrice } = await loadFunctions();
    expect(RoundPrice({ num: undefined })).toBe("0");
    expect(RoundPrice({ num: "not a price" })).toBe("0");
    expect(RoundPrice({ num: undefined, returnNumber: true })).toBe(0);
  });

  it("accepts a price given as text", async () => {
    const { RoundPrice } = await loadFunctions();
    expect(RoundPrice({ num: "100000" })).toBe("100K");
  });
});

describe("onClickSearchHistory", () => {
  it("starts a new list when nothing is stored", async () => {
    const { onClickSearchHistory } = await loadFunctions();

    expect(onClickSearchHistory("shoes")).toEqual(["shoes"]);
    expect(JSON.parse(localStorage.getItem("search-history") as string)).toEqual([
      "shoes",
    ]);
  });

  it("puts a new word at the front of the list", async () => {
    localStorage.setItem("search-history", JSON.stringify(["shoes"]));
    const { onClickSearchHistory } = await loadFunctions();

    expect(onClickSearchHistory("bags")).toEqual(["bags", "shoes"]);
    expect(JSON.parse(localStorage.getItem("search-history") as string)).toEqual([
      "bags",
      "shoes",
    ]);
  });

  it("hands back the stored list unchanged on a repeat", async () => {
    localStorage.setItem("search-history", JSON.stringify(["Shoes"]));
    const { onClickSearchHistory } = await loadFunctions();

    // The caller used to be handed a list with the word in it twice, which is
    // what the search box then showed.
    expect(onClickSearchHistory("shoes")).toEqual(["Shoes"]);
    expect(JSON.parse(localStorage.getItem("search-history") as string)).toEqual([
      "Shoes",
    ]);
  });

  it("starts again when the stored history is not valid data", async () => {
    localStorage.setItem("search-history", "not-valid-data");
    const { onClickSearchHistory } = await loadFunctions();

    // It used to throw out of a click handler.
    expect(onClickSearchHistory("shoes")).toEqual(["shoes"]);
    expect(JSON.parse(localStorage.getItem("search-history") as string)).toEqual([
      "shoes",
    ]);
  });

  it("starts again when the stored history is not a list", async () => {
    localStorage.setItem("search-history", JSON.stringify({ not: "a list" }));
    const { onClickSearchHistory } = await loadFunctions();

    expect(onClickSearchHistory("shoes")).toEqual(["shoes"]);
  });
});

describe("COMPARE_CHANGED_EVENT", () => {
  it("is the name the compare helpers announce", async () => {
    const { COMPARE_CHANGED_EVENT } = await loadFunctions();
    expect(COMPARE_CHANGED_EVENT).toBe("compare-changed");
  });
});

describe("addToCompare", () => {
  it("fills the first slot when nothing is being compared", async () => {
    const { addToCompare } = await loadFunctions();
    const { setCookie } = standIns();

    expect(addToCompare("alpha")).toBe("?f_p=alpha");
    expect(setCookie).toHaveBeenCalledWith("f_p", "alpha");
  });

  it("fills the second slot when the first is taken", async () => {
    cookieSeed = { f_p: "alpha" };
    const { addToCompare } = await loadFunctions();
    const { setCookie } = standIns();

    expect(addToCompare("beta")).toBe("?f_p=alpha&s_p=beta");
    expect(setCookie).toHaveBeenCalledWith("s_p", "beta");
  });

  it("replaces the first slot when both are taken", async () => {
    cookieSeed = { f_p: "alpha", s_p: "beta" };
    const { addToCompare } = await loadFunctions();
    const { setCookie, jar } = standIns();

    expect(addToCompare("gamma")).toBe("?f_p=gamma&s_p=beta");
    expect(setCookie).toHaveBeenCalledWith("f_p", "gamma");
    expect(jar.s_p).toBe("beta");
  });

  it("still fills the slot when there is no browser to tell", async () => {
    const { addToCompare } = await loadFunctionsWithoutBrowser();
    const { setCookie } = standIns();

    // Nothing to announce to, but the cookie still has to be written.
    expect(addToCompare("alpha")).toBe("?f_p=alpha");
    expect(setCookie).toHaveBeenCalledWith("f_p", "alpha");
  });

  it("tells the browser the comparison changed", async () => {
    const { addToCompare, COMPARE_CHANGED_EVENT } = await loadFunctions();
    const heard = vi.fn();
    window.addEventListener(COMPARE_CHANGED_EVENT, heard);

    addToCompare("alpha");

    expect(heard).toHaveBeenCalledTimes(1);
    window.removeEventListener(COMPARE_CHANGED_EVENT, heard);
  });
});

describe("removeFromCompare", () => {
  it("moves the second slot up when the first is removed", async () => {
    cookieSeed = { f_p: "alpha", s_p: "beta" };
    const { removeFromCompare } = await loadFunctions();
    const { jar } = standIns();

    expect(removeFromCompare("alpha")).toBe("?f_p=beta");
    expect(jar.f_p).toBe("beta");
    expect(jar.s_p).toBeUndefined();
  });

  it("empties the comparison when the only entry is removed", async () => {
    cookieSeed = { f_p: "alpha" };
    const { removeFromCompare } = await loadFunctions();
    const { jar } = standIns();

    expect(removeFromCompare("alpha")).toBe("");
    expect(jar.f_p).toBeUndefined();
  });

  it("keeps the first slot when the second is removed", async () => {
    cookieSeed = { f_p: "alpha", s_p: "beta" };
    const { removeFromCompare } = await loadFunctions();
    const { jar } = standIns();

    expect(removeFromCompare("beta")).toBe("?f_p=alpha");
    expect(jar.f_p).toBe("alpha");
    expect(jar.s_p).toBeUndefined();
  });

  it("empties the comparison when the second slot was the only one filled", async () => {
    cookieSeed = { s_p: "beta" };
    const { removeFromCompare } = await loadFunctions();
    const { jar } = standIns();

    expect(removeFromCompare("beta")).toBe("");
    expect(jar.s_p).toBeUndefined();
  });

  it("returns nothing at all for a slug that is in neither slot", async () => {
    cookieSeed = { f_p: "alpha", s_p: "beta" };
    const { removeFromCompare } = await loadFunctions();

    expect(removeFromCompare("zulu")).toBeNull();
  });

  it("announces nothing when nothing changed", async () => {
    cookieSeed = { f_p: "alpha", s_p: "beta" };
    const { removeFromCompare, COMPARE_CHANGED_EVENT } = await loadFunctions();
    const heard = vi.fn();
    window.addEventListener(COMPARE_CHANGED_EVENT, heard);

    // Nothing was removed, so nobody listening has anything to re-read.
    expect(removeFromCompare("zulu")).toBeNull();
    expect(heard).not.toHaveBeenCalled();

    window.removeEventListener(COMPARE_CHANGED_EVENT, heard);
  });

  it("still announces a change when a slug was removed", async () => {
    cookieSeed = { f_p: "alpha", s_p: "beta" };
    const { removeFromCompare, COMPARE_CHANGED_EVENT } = await loadFunctions();
    const heard = vi.fn();
    window.addEventListener(COMPARE_CHANGED_EVENT, heard);

    removeFromCompare("beta");
    expect(heard).toHaveBeenCalledTimes(1);

    window.removeEventListener(COMPARE_CHANGED_EVENT, heard);
  });
});

describe("areProductsEqual", () => {
  const base = {
    product_id: 1,
    variations: { Size: "M", color: "red", color_options: "a" },
  };

  it("says no when either product is missing", async () => {
    const { areProductsEqual } = await loadFunctions();
    expect(areProductsEqual(null, base)).toBe(false);
    expect(areProductsEqual(base, undefined)).toBe(false);
    expect(areProductsEqual(null, null)).toBe(false);
  });

  it("says yes for the same product with the same choices", async () => {
    const { areProductsEqual } = await loadFunctions();
    expect(areProductsEqual(base, { ...base, variations: { ...base.variations } })).toBe(
      true,
    );
  });

  it("says no for a different product id", async () => {
    const { areProductsEqual } = await loadFunctions();
    expect(areProductsEqual(base, { ...base, product_id: 2 })).toBe(false);
  });

  it("says no when any one choice differs", async () => {
    const { areProductsEqual } = await loadFunctions();
    expect(
      areProductsEqual(base, { ...base, variations: { ...base.variations, Size: "L" } }),
    ).toBe(false);
    expect(
      areProductsEqual(base, {
        ...base,
        variations: { ...base.variations, color: "blue" },
      }),
    ).toBe(false);
    expect(
      areProductsEqual(base, {
        ...base,
        variations: { ...base.variations, color_options: "b" },
      }),
    ).toBe(false);
  });

  it("treats a missing choice and an empty one as the same", async () => {
    const { areProductsEqual } = await loadFunctions();
    expect(areProductsEqual({ product_id: 1 }, { product_id: 1, variations: {} })).toBe(
      true,
    );
    expect(
      areProductsEqual({ product_id: 1 }, { product_id: 1, variations: { Size: "" } }),
    ).toBe(true);
    // The same answer whichever side the choices are missing from.
    expect(areProductsEqual({ product_id: 1, variations: {} }, { product_id: 1 })).toBe(
      true,
    );
    expect(
      areProductsEqual({ product_id: 1, variations: { Size: "M" } }, { product_id: 1 }),
    ).toBe(false);
  });
});

describe("getCart", () => {
  it("loads the cart and puts it into the shared state", async () => {
    storeSeed.userProfile = { id: 7 };
    fetchDataReply = () => ({ success: true, data: { cart: [{ id: 1 }] } });

    const { getCart } = await loadFunctions();
    const { fetchData, useAppStore } = standIns();

    const result = await getCart({ callback: undefined });

    expect(fetchData).toHaveBeenCalledTimes(1);
    expect((fetchData as any).mock.calls[0][0]).toEqual(
      expect.objectContaining({ url: "/cart/cart_shipping", method: "GET" }),
    );
    expect(useAppStore.getState().initCart).toHaveBeenCalledWith({
      cart: [{ id: 1 }],
    });
    expect(result).toEqual({ cart: [{ id: 1 }] });
  });

  it("records the reason and returns an empty cart when the request fails", async () => {
    storeSeed.userProfile = { id: 7 };
    fetchDataReply = () => ({ success: false, message: "cart is closed" });

    const { getCart } = await loadFunctions();
    const { useAppStore } = standIns();
    const callback = vi.fn();

    const result = await getCart({ callback });

    expect(useAppStore.getState().setCartShippingSuccess).toHaveBeenCalledWith(
      "cart is closed",
    );
    expect(callback).toHaveBeenCalledWith([{ cart: [] }]);
    expect(result).toEqual({ cart: [] });
  });

  it("records the reason when the failure is not a real Error", async () => {
    // Anything can be thrown, not just an Error. A bare piece of text used to
    // be recorded as nothing at all.
    storeSeed.userProfile = { id: 7 };
    fetchDataReply = () => {
      throw "the cart service fell over";
    };

    const { getCart } = await loadFunctions();
    const { ReportError } = standIns();
    const callback = vi.fn();

    await expect(getCart({ callback })).resolves.toEqual({ cart: [] });
    expect((ReportError as any).mock.calls[0][0].error).toBe(
      "the cart service fell over",
    );
  });

  it("returns an empty cart when the request fails and nobody passed a callback", async () => {
    storeSeed.userProfile = { id: 7 };
    fetchDataReply = () => ({ success: false, message: "cart is closed" });

    const { getCart } = await loadFunctions();

    await expect(getCart({ callback: undefined })).resolves.toEqual({ cart: [] });
  });

  it("gives up with an empty cart when no user ever arrives", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_NOW);

    const { getCart } = await loadFunctions();
    const { fetchData } = standIns();

    const pending = getCart({ callback: undefined });
    await vi.advanceTimersByTimeAsync(300_000);

    await expect(pending).resolves.toEqual({ cart: [] });
    expect(fetchData).not.toHaveBeenCalled();
  }, 4000);

  it("picks the user up when one arrives while it is waiting", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_NOW);
    fetchDataReply = () => ({ success: true, data: { cart: [] } });

    const { getCart } = await loadFunctions();
    const { fetchData, useAppStore } = standIns();

    const pending = getCart({ callback: undefined });
    await vi.advanceTimersByTimeAsync(3_000);
    useAppStore.setState({ userProfile: { id: 7 } });
    await vi.advanceTimersByTimeAsync(3_000);
    await pending;

    expect(fetchData).toHaveBeenCalledTimes(1);
  }, 4000);
});

describe("getOldCart", () => {
  it("loads the saved cart and sorts it newest first", async () => {
    storeSeed.userProfile = { id: 7 };
    fetchDataReply = () => ({
      success: true,
      data: {
        oldCart: [
          { id: "old", created_at: "2026-01-01T00:00:00.000Z" },
          { id: "new", created_at: "2026-06-01T00:00:00.000Z" },
        ],
      },
    });

    const { getOldCart } = await loadFunctions();
    const { fetchData, useAppStore } = standIns();

    await getOldCart();

    expect((fetchData as any).mock.calls[0][0]).toEqual(
      expect.objectContaining({ url: "/old-cart/get_old_cart", method: "GET" }),
    );
    const stored = (useAppStore.getState().storeOldCart as any).mock.calls[0][0];
    expect(stored.oldCart.map((item: any) => item.id)).toEqual(["new", "old"]);
  });

  it("reads the reply through the wrapper shape when there is one", async () => {
    storeSeed.userProfile = { id: 7 };
    fetchDataReply = () => ({
      success: true,
      data: { original: { data: { oldCart: [{ id: "x", created_at: "2026-01-01" }] } } },
    });

    const { getOldCart } = await loadFunctions();
    const { useAppStore } = standIns();

    await getOldCart();

    const stored = (useAppStore.getState().storeOldCart as any).mock.calls[0][0];
    expect(stored.oldCart).toHaveLength(1);
  });

  it("copes with a reply that carries no saved cart", async () => {
    storeSeed.userProfile = { id: 7 };
    fetchDataReply = () => ({ success: true, data: {} });

    const { getOldCart } = await loadFunctions();
    const { useAppStore } = standIns();

    await expect(getOldCart()).resolves.toBeUndefined();
    const stored = (useAppStore.getState().storeOldCart as any).mock.calls[0][0];
    expect(stored.oldCart).toEqual([]);
  });

  it("records the failure instead of throwing", async () => {
    storeSeed.userProfile = { id: 7 };
    fetchDataReply = () => ({ success: false, message: "gone" });

    const { getOldCart } = await loadFunctions();
    const { ReportError, useAppStore } = standIns();

    await expect(getOldCart()).resolves.toBeUndefined();
    expect(useAppStore.getState().storeOldCart).not.toHaveBeenCalled();
    expect(ReportError).toHaveBeenCalled();
  });

  it("records the reason when the failure is not a real Error", async () => {
    storeSeed.userProfile = { id: 7 };
    fetchDataReply = () => {
      throw "the saved-cart service fell over";
    };

    const { getOldCart } = await loadFunctions();
    const { ReportError } = standIns();

    await expect(getOldCart()).resolves.toBeUndefined();
    expect((ReportError as any).mock.calls[0][0].error).toBe(
      "the saved-cart service fell over",
    );
  });

  it("picks the user up when one arrives while it is waiting", async () => {
    // The id used to be read once, before the loop, so a user who signed in
    // halfway through was never noticed — unlike getCart.
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_NOW);
    fetchDataReply = () => ({ success: true, data: { oldCart: [] } });

    const { getOldCart } = await loadFunctions();
    const { fetchData, useAppStore } = standIns();

    const pending = getOldCart();
    await vi.advanceTimersByTimeAsync(3_000);
    useAppStore.setState({ userProfile: { id: 7 } });
    await vi.advanceTimersByTimeAsync(3_000);
    await pending;

    expect(fetchData).toHaveBeenCalledTimes(1);
  }, 4000);

  it("gives up without asking when no user ever arrives", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_NOW);

    const { getOldCart } = await loadFunctions();
    const { fetchData } = standIns();

    const pending = getOldCart();
    await vi.advanceTimersByTimeAsync(300_000);
    await pending;

    expect(fetchData).not.toHaveBeenCalled();
  }, 4000);
});

describe("GetCartOreview", () => {
  it("puts the overview into the shared state", async () => {
    fetchDataReply = () => ({ success: true, data: { total: 12 } });

    const { GetCartOreview } = await loadFunctions();
    const { fetchData, useAppStore } = standIns();

    await GetCartOreview();

    expect((fetchData as any).mock.calls[0][0]).toEqual(
      expect.objectContaining({ url: "/cart/cart_overview", method: "GET" }),
    );
    expect(useAppStore.getState().setCartPreview).toHaveBeenCalledWith({ total: 12 });
  });

  it("records the failure instead of throwing", async () => {
    fetchDataReply = () => ({ success: false, message: "no overview" });

    const { GetCartOreview } = await loadFunctions();
    const { ReportError, useAppStore } = standIns();

    await expect(GetCartOreview()).resolves.toBeUndefined();
    expect(useAppStore.getState().setCartPreview).not.toHaveBeenCalled();
    expect(ReportError).toHaveBeenCalled();
  });

  it("records the reason when the failure is not a real Error", async () => {
    fetchDataReply = () => {
      throw "the overview service fell over";
    };

    const { GetCartOreview } = await loadFunctions();
    const { ReportError } = standIns();

    await expect(GetCartOreview()).resolves.toBeUndefined();
    expect((ReportError as any).mock.calls[0][0].error).toBe(
      "the overview service fell over",
    );
  });
});

describe("WaitForCondition", () => {
  it("finishes straight away when the flag is already set", async () => {
    storeSeed.isRegisteringReady = true;

    const { WaitForCondition } = await loadFunctions();

    await expect(WaitForCondition()).resolves.toBe(
      "Ready, now performing the request!",
    );
  }, 4000);

  it("finishes when the flag is set while it waits", async () => {
    // The flag used to be read ONCE, before the repeating check started, so
    // the check re-read a frozen copy and never the shared state.
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_NOW);
    storeSeed.isRegisteringReady = false;

    const { WaitForCondition } = await loadFunctions();
    const { useAppStore } = standIns();

    const pending = WaitForCondition();
    await vi.advanceTimersByTimeAsync(2_000);
    useAppStore.setState({ isRegisteringReady: true });
    await vi.advanceTimersByTimeAsync(1_000);

    await expect(pending).resolves.toBe("Ready, now performing the request!");
  }, 4000);

  it("gives up after ten seconds instead of waiting for ever", async () => {
    // There used to be no time limit and the repeating check was never
    // stopped, so the caller waited for ever and a timer ran for the life of
    // the page.
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_NOW);
    storeSeed.isRegisteringReady = false;

    const { WaitForCondition } = await loadFunctions();

    const pending = WaitForCondition();
    await vi.advanceTimersByTimeAsync(10_000);

    await expect(pending).resolves.toBe(
      "Gave up waiting, performing the request anyway!",
    );
    // Nothing is left running afterwards.
    expect(vi.getTimerCount()).toBe(0);
  }, 4000);
});

describe("storeError", () => {
  it("posts the error to the internal log endpoint", async () => {
    const network = makeMockFetch([jsonReply({ ok: true })]);
    vi.stubGlobal("fetch", network.fetch);

    const { storeError } = await loadFunctions();
    await storeError({ message: "boom" });

    expect(network.callCount).toBe(1);
    expect(network.calls[0].url).toBe("/api/internal/mobile-error-log");
    expect(network.calls[0].method).toBe("POST");
    expect(network.calls[0].body).toEqual({ error: { message: "boom" } });
    expect(network.calls[0].headers["content-type"]).toBe("application/json");
  });

  it("does nothing at all when there is no browser", async () => {
    const network = makeMockFetch([]);
    vi.stubGlobal("fetch", network.fetch);

    const { storeError } = await loadFunctionsWithoutBrowser();
    await expect(storeError({ message: "boom" })).resolves.toBeUndefined();

    expect(network.callCount).toBe(0);
  });

  it("swallows a failed send rather than throwing", async () => {
    const network = makeMockFetch([failureReply("network down")]);
    vi.stubGlobal("fetch", network.fetch);

    const { storeError } = await loadFunctions();
    await expect(storeError({ message: "boom" })).resolves.toBeUndefined();
  });

  it("copes with being handed nothing", async () => {
    const network = makeMockFetch([jsonReply({ ok: true })]);
    vi.stubGlobal("fetch", network.fetch);

    const { storeError } = await loadFunctions();
    await expect(storeError(undefined)).resolves.toBeUndefined();
    expect(network.calls[0].body).toEqual({ error: {} });
  });
});

describe("LogError", () => {
  it("hands on the error with everything it knows about the session", async () => {
    storeSeed.userProfile = { id: 7, name: "Test Person" };
    storeSeed.userChat = { id: "chat-1" };
    storeSeed.userStories = { id: "story-1" };
    cookieSeed = { language: "ar", country: "sy" };

    const { LogError } = await loadFunctions();
    const { ReportError, posthogCaptureException } = standIns();

    await LogError({ scenario: "something broke", message: "boom" });

    expect(ReportError).toHaveBeenCalledTimes(1);
    const payload = (ReportError as any).mock.calls[0][0];
    expect(payload).toMatchObject({
      scenario: "something broke",
      message: "boom",
      userData: { id: 7, name: "Test Person" },
      userChat: { id: "chat-1" },
      userStories: { id: "story-1" },
      last_paths: ["/a", "/b"],
      language: "ar",
      country: "sy",
      timestamp: "2026-08-10T00:00:00.000Z",
    });
    expect(payload.url).toContain("/sy-en");
    expect(posthogCaptureException).toHaveBeenCalledTimes(1);
  });

  it("stops without reporting while the user is logging out", async () => {
    storeSeed.LoggingOut = true;

    const { LogError } = await loadFunctions();
    const { ReportError, posthogCaptureException } = standIns();

    await LogError({ message: "boom" });

    expect(ReportError).not.toHaveBeenCalled();
    expect(posthogCaptureException).not.toHaveBeenCalled();
  });

  it("flattens a real Error into its message, name and stack", async () => {
    const { LogError } = await loadFunctions();
    const { ReportError } = standIns();

    await LogError(new Error("it broke"));

    const payload = (ReportError as any).mock.calls[0][0];
    expect(payload.message).toBe("it broke");
    expect(payload.name).toBe("Error");
    expect(typeof payload.stack).toBe("string");
  });

  it("copes with a bare piece of text", async () => {
    const { LogError } = await loadFunctions();
    const { ReportError } = standIns();

    await LogError("just text");

    expect(ReportError).toHaveBeenCalledTimes(1);
    expect((ReportError as any).mock.calls[0][0].message).toBe("just text");
  });

  it("copes with being handed nothing", async () => {
    const { LogError } = await loadFunctions();
    const { ReportError } = standIns();

    await expect(LogError(undefined)).resolves.toBeUndefined();
    expect(ReportError).toHaveBeenCalledTimes(1);
  });

  it("never throws, even when reporting itself fails", async () => {
    const { LogError } = await loadFunctions();
    const { ReportError } = standIns();
    (ReportError as any).mockImplementation(() => {
      throw new Error("reporting is broken");
    });

    await expect(LogError({ message: "boom" })).resolves.toBeUndefined();
  });

  it("never throws when the send fails", async () => {
    vi.stubGlobal("fetch", makeMockFetch([failureReply("network down")]).fetch);

    const { LogError } = await loadFunctions();
    await expect(LogError({ message: "boom" })).resolves.toBeUndefined();
  });

  it("still reports when there is no browser", async () => {
    const { LogError } = await loadFunctionsWithoutBrowser();
    const { ReportError } = standIns();

    await LogError({ message: "boom" });

    const payload = (ReportError as any).mock.calls[0][0];
    expect(payload.url).toBeUndefined();
  });

  it("leaves out the browser name when there is no browser", async () => {
    vi.stubGlobal("navigator", undefined);

    const { LogError } = await loadFunctionsWithoutBrowser();
    const { ReportError } = standIns();

    await LogError({ message: "boom" });

    const payload = (ReportError as any).mock.calls[0][0];
    expect(payload.user_agent).toBeUndefined();
  });
});
