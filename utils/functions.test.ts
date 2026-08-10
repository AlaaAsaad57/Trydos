import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { makeCookieManagerMock } from "tests/mocks/cookieManager";
import { makeFetchDataMock } from "tests/mocks/fetchData";
import { makeLocalizationMock } from "tests/mocks/localization";
import { makeStoreMock } from "tests/mocks/store";

// Four of this file's ten replacements now come from the shared kit
// (tests/mocks/). The other six below are local to this file and stay exactly
// as they were: two of them look like they belong to the kit but do not —
// `./errorReported` and `./posthog` are OUR OWN wrappers, not the third-party
// clients the kit stands in for.
const mockStoreState = {
  userChat: { id: "chat-1" },
  userStories: { id: "story-1" },
  currency: {},
  language: "en",
};

vi.mock("store", () => makeStoreMock(mockStoreState));

vi.mock("services/localization", () => makeLocalizationMock({ language: "en" }));

vi.mock("./fetchData", () => makeFetchDataMock());

vi.mock("./cookies/cookie-manager", () => makeCookieManagerMock());

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