import { describe, expect, it } from "vitest";
import {
  APP_SCREENS,
  appHrefFor,
  appScreenFromPath,
  isAppScreenOn,
  type AppScreenRow,
} from "components/DemoApp1/appScreenPaths";
import { APP_SCREEN_VIEWS } from "components/DemoApp1/AppScreenView";

// A table like the one a stage writes: two profile rows, one on a path that
// differs from the screen's name (S4-1).
const ROWS: AppScreenRow[] = [
  { path: "settings", screen: "settings" },
  { path: "settings/profile/info", screen: "settings/profile/personal-info" },
];

describe("the path table of the screen mount", () => {
  it("gives the screen of a path that has a row, in any locale", () => {
    expect(
      appScreenFromPath("/sy-en/settings", ROWS),
      "/sy-en/settings should draw the profile tab",
    ).toBe("settings");
    expect(
      appScreenFromPath("/iq-ar/settings/profile/info/", ROWS),
      "an Arabic path with an end slash should still draw personal info",
    ).toBe("settings/profile/personal-info");
  });

  it("gives no screen for a path with no row, so its old page shows", () => {
    expect(
      appScreenFromPath("/sy-en/settings/wallet", ROWS),
      "the wallet has no row yet, so its old page should show",
    ).toBeNull();
    expect(
      appScreenFromPath("/sy-en/settings/profile/personal-info", ROWS),
      "the demo name of a screen is not its app path (S4-1)",
    ).toBeNull();
    expect(
      appScreenFromPath("/sy-en", ROWS),
      "the home page has no row, so the old home shows",
    ).toBeNull();
  });

  it("gives the row's path for a screen that is on, and the old path for one that is off", () => {
    expect(
      appHrefFor("sy-en", "settings/profile/personal-info", ROWS),
      "personal info should open on its old path (S4-1)",
    ).toBe("/sy-en/settings/profile/info");
    expect(
      appHrefFor("sy-ar", "settings/wallet", ROWS),
      "the wallet, still off, should open its old page",
    ).toBe("/sy-ar/settings/wallet");
    expect(
      appHrefFor("sy-en", "home", ROWS),
      "Home should open the home page, not /home",
    ).toBe("/sy-en");
  });

  it("knows which screens are on", () => {
    expect(isAppScreenOn("settings", ROWS), "the profile tab has a row").toBe(true);
    expect(isAppScreenOn("settings/wallet", ROWS), "the wallet has no row").toBe(false);
  });

  it("has a lazy view for every screen in the table, so no turned-on path draws nothing", () => {
    expect(
      APP_SCREENS.map((row) => row.screen).filter((key) => !APP_SCREEN_VIEWS[key]),
      "these screens have a row in appScreenPaths.ts but no entry in AppScreenView.tsx",
    ).toEqual([]);
  });

  it("has each path and each screen in one row only", () => {
    const twice = (values: string[]) =>
      values.filter((value, i) => values.indexOf(value) !== i);
    expect(
      twice(APP_SCREENS.map((row) => row.path)),
      "a path with two rows would draw whichever comes first",
    ).toEqual([]);
    expect(
      twice(APP_SCREENS.map((row) => row.screen)),
      "a screen with two paths would get a URL from the first row only",
    ).toEqual([]);
  });
});
