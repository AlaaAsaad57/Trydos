import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockStoreState = {
  userChat: { id: "chat-1" },
  userStories: { id: "story-1" },
  currency: {},
  language: "en",
};

vi.mock("store", () => ({
  useAppStore: {
    getState: () => mockStoreState,
  },
}));

vi.mock("services/localization", () => ({
  default: {
    GetAppLanguage: () => "en",
  },
}));

vi.mock("./fetchData", () => ({
  fetchData: vi.fn(),
}));

vi.mock("./cookies/cookie-manager", () => ({
  getCookie: vi.fn(),
  setCookie: vi.fn(),
  deleteCookie: vi.fn(),
  COOKIE_NAMES: { USER_DATA: "USER_DATA" },
}));

vi.mock("./Requests", () => ({
  REQUESTS_DATA: {},
}));

vi.mock("./history", () => ({
  readStoredLastPaths: vi.fn(async () => []),
}));

vi.mock("./errorReported", () => ({
  ReportError: vi.fn(),
}));

vi.mock("./posthog", () => ({
  posthogCaptureException: vi.fn(),
}));

vi.mock("./errorSerialization", () => ({
  extractPrimaryErrorMessage: (value: unknown) => String(value),
  serializeUnknownForErrorLog: (value: unknown) => value,
}));

vi.mock("./types/cart", () => ({}));

async function loadFunctionsModule() {
  vi.resetModules();
  return import("./functions");
}

describe("utils/functions", () => {
  beforeEach(() => {
    vi.stubGlobal("window", {
      location: { pathname: "/sy-en" },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("detects that the current environment is a browser", async () => {
    const { SSRDetect } = await loadFunctionsModule();
    expect(SSRDetect()).toBe(true);
  });

  it("returns the original key for English fallback", async () => {
    const { translateFunction } = await loadFunctionsModule();
    // An untranslated key is the point of this assertion.
    expect(translateFunction("welcome", "en")).toBe("welcome");
  });


  it("reads the current user chat from the store", async () => {
    const { getUserChat } = await loadFunctionsModule();
    expect(getUserChat()).toEqual({ id: "chat-1" });
  });
});