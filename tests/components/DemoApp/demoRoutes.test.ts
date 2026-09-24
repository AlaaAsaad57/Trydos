import { describe, expect, it } from "vitest";
import {
  direction,
  hrefFor,
  isTabRoot,
  parentOf,
  sameRoute,
  screenFromUrl,
  tabOf,
} from "components/DemoApp/demoRoutes";

describe("demo routes — which screen a URL shows", () => {
  it("reads the home route and its search-param screens", () => {
    expect(
      screenFromUrl("/sy-en/demo", ""),
      "/demo with no params is not the home screen",
    ).toBe("home");
    expect(
      screenFromUrl("/sy-en/demo", "search"),
      "/demo?search did not open search",
    ).toBe("search");
    expect(
      screenFromUrl("/sy-ar/demo", "cart="),
      "/demo?cart= did not open the cart",
    ).toBe("cart");
    expect(
      screenFromUrl("/sy-en/demo", new URLSearchParams("chat")),
      "/demo?chat did not open chat",
    ).toBe("chat");
    expect(
      screenFromUrl("/sy-en/demo", "utm=1"),
      "an unrelated param moved /demo off home",
    ).toBe("home");
  });

  it("reads the settings paths, and hands an unknown path back to the route's own page", () => {
    expect(
      screenFromUrl("/sy-en/demo/settings", ""),
      "/demo/settings is not the profile tab",
    ).toBe("settings");
    expect(
      screenFromUrl("/sy-en/demo/settings/profile/address/new", ""),
      "the new-address path is not the address form",
    ).toBe("settings/profile/address/new");
    expect(
      screenFromUrl("/sy-en/demo/settings/nope", ""),
      "an unknown /demo path was taken for a demo screen",
    ).toBeNull();
    expect(
      screenFromUrl("/sy-en/products", ""),
      "a path outside /demo was taken for a demo screen",
    ).toBeNull();
  });

  it("writes each screen back as the URL it was read from", () => {
    expect(hrefFor("sy-en", "home"), "home URL is wrong").toBe("/sy-en/demo");
    expect(
      hrefFor("sy-en", "search"),
      "search must be a search param, not a path",
    ).toBe("/sy-en/demo?search");
    expect(
      hrefFor("tr-tr", "settings/photo"),
      "settings screens must be real paths",
    ).toBe("/tr-tr/demo/settings/photo");
    for (const key of ["home", "chat", "settings/profile/body"] as const) {
      const href = hrefFor("sy-en", key);
      const [path, query = ""] = href.split("?");
      expect(
        screenFromUrl(path, query),
        `${href} does not lead back to ${key}`,
      ).toBe(key);
    }
  });
});

describe("demo routes — how screens relate", () => {
  it("knows which moves change only the search params", () => {
    expect(
      sameRoute("home", "search"),
      "home → search should need no server call",
    ).toBe(true);
    expect(
      sameRoute("cart", "chat"),
      "cart → chat should need no server call",
    ).toBe(true);
    expect(
      sameRoute("search", "settings"),
      "search → settings changes the path",
    ).toBe(false);
  });

  it("names the tab of every screen and shows the bar only on tab roots", () => {
    expect(
      tabOf("settings/profile/address"),
      "an address screen is not under the profile tab",
    ).toBe("settings");
    expect(isTabRoot("cart"), "the cart tab should show the tab bar").toBe(
      true,
    );
    expect(
      isTabRoot("settings/profile"),
      "an inner profile screen should hide the tab bar",
    ).toBe(false);
  });

  it("goes up one level from a screen with no history", () => {
    expect(
      parentOf("settings/profile/address/new"),
      "the form's parent is not the address list",
    ).toBe("settings/profile/address");
    expect(
      parentOf("settings/client-id"),
      "client ID should go up to the profile tab",
    ).toBe("settings");
    expect(parentOf("search"), "a tab root should go up to home").toBe("home");
  });

  it("slides forward into deeper screens and tabs further right, back otherwise", () => {
    expect(
      direction("settings", "settings/profile"),
      "going deeper did not slide forward",
    ).toBe(1);
    expect(
      direction("settings/profile/body", "settings/profile"),
      "going up did not slide back",
    ).toBe(-1);
    expect(
      direction("home", "cart"),
      "a tab to the right did not slide forward",
    ).toBe(1);
    expect(
      direction("settings", "search"),
      "a tab to the left did not slide back",
    ).toBe(-1);
    expect(
      direction("settings/profile/client-info", "settings/client-id"),
      "a tap across the profile tab (client info → client ID) slid back instead of forward",
    ).toBe(1);
  });
});
