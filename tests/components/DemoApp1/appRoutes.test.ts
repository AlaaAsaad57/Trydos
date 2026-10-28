import { describe, expect, it } from "vitest";
import {
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
