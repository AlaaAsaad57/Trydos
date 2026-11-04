import { describe, expect, it } from "vitest";
import {
  isHomePath,
  isSearchPath,
  litTab,
  shellStepsAside,
  tabHref,
} from "components/DemoApp1/appRoutes";

const none = { chat: false, search: false };

describe("tabHref", () => {
  it("builds the cart path with the locale", () => {
    expect(tabHref("sy-ar", "cart"), "cart tab path is wrong").toBe(
      "/sy-ar/cart",
    );
  });
  it("builds the home path with no suffix", () => {
    expect(tabHref("sy-en", "home"), "home tab path is wrong").toBe("/sy-en");
  });
  it("builds the search path (Stage 7, S7-2)", () => {
    expect(tabHref("sy-ar", "search"), "search tab path is wrong").toBe(
      "/sy-ar/search",
    );
  });
  it("builds the settings path", () => {
    expect(tabHref("sy-en", "settings"), "settings tab path is wrong").toBe(
      "/sy-en/settings",
    );
  });
});

describe("litTab", () => {
  it("lights home on the locale root", () => {
    expect(litTab("/sy-en", none), "locale root should light home").toBe(
      "home",
    );
  });
  it("lights cart on the cart page", () => {
    expect(litTab("/sy-en/cart", none), "cart page should light cart").toBe(
      "cart",
    );
  });
  it("lights settings on a page below settings", () => {
    expect(
      litTab("/sy-en/settings/orders/12", none),
      "a page below settings should light settings",
    ).toBe("settings");
  });
  it("lights search on the search page", () => {
    expect(litTab("/sy-en/search", none), "the search page should light search").toBe(
      "search",
    );
  });
  it("lights nothing on a product page", () => {
    expect(
      litTab("/sy-en/products/abc", none),
      "a product page should light no tab",
    ).toBeNull();
  });
  it("lights nothing on the filters page", () => {
    expect(
      litTab("/sy-en/filters", none),
      "the filters page should light no tab",
    ).toBeNull();
  });
  it("lights chat on the new chat screens (Stage 6)", () => {
    expect(litTab("/sy-en/chat", none), "the chat list should light chat").toBe("chat");
    expect(
      litTab("/sy-en/chat/conversation", none),
      "a conversation should light chat",
    ).toBe("chat");
  });
  it("lights chat when chat is open, whatever the path", () => {
    expect(
      litTab("/sy-en/products/abc", { chat: true, search: false }),
      "open chat should light chat",
    ).toBe("chat");
  });
  it("lights search when search is open", () => {
    expect(
      litTab("/sy-en", { chat: false, search: true }),
      "open search should light search",
    ).toBe("search");
  });
});

describe("isSearchPath", () => {
  it("is true for the search page", () => {
    expect(isSearchPath("/sy-en/search"), "/sy-en/search is the search page").toBe(true);
  });
  it("is false for a page below search", () => {
    expect(isSearchPath("/sy-en/search/x"), "/sy-en/search/x is not the search page").toBe(false);
  });
  it("is false for a path that only starts with search", () => {
    expect(isSearchPath("/sy-en/searches"), "/sy-en/searches is not the search page").toBe(false);
  });
  it("is false for the home page", () => {
    expect(isSearchPath("/sy-en"), "the home page is not the search page").toBe(false);
  });
});

describe("shellStepsAside", () => {
  it.each(["/sy-en/demo", "/sy-en/demo/settings/wallet", "/sy-en/loginDemo", "/sy-en/login"])(
    "steps aside on %s",
    (path) => {
      expect(shellStepsAside(path), `the shell should step aside on ${path}`).toBe(
        true,
      );
    },
  );
  it.each(["/sy-en", "/sy-en/settings", "/sy-en/loginx"])(
    "stays on %s",
    (path) => {
      expect(shellStepsAside(path), `the shell should stay on ${path}`).toBe(
        false,
      );
    },
  );
});

describe("isHomePath", () => {
  it.each(["/sy-en", "/sy-ar/"])("%s is the home page", (path) => {
    expect(isHomePath(path), `${path} has only the locale part, so it is the home page`).toBe(true);
  });
  it.each(["/sy-en/cart", "/sy-en/categories/x", "/sy-en/products/x"])(
    "%s is not the home page",
    (path) => {
      expect(isHomePath(path), `${path} has more than the locale part, so it is not the home page`).toBe(false);
    },
  );
});
