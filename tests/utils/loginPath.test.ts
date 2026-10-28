import { describe, expect, it } from "vitest";
import { LOGIN_RETURN_PARAM, loginHref, safeReturnPath } from "utils/loginPath";

describe("the way to the login page (D-11 in UI-MIGRATION-PLAN.md)", () => {
  it("names the page to go back to in ?next=", () => {
    expect(LOGIN_RETURN_PARAM, "the return key changed; every opener and the login page must agree on it").toBe("next");
    expect(
      loginHref("sy-en", "/sy-en/products/12?color=red"),
      "the login link does not carry the page the shopper left",
    ).toBe("/sy-en/login?next=%2Fsy-en%2Fproducts%2F12%3Fcolor%3Dred");
    expect(loginHref("sy-ar"), "a login link with no page to go back to is not the bare login page").toBe("/sy-ar/login");
  });
});

describe("the way back from the login page (A-20) — never an open redirect", () => {
  it.each([
    ["/sy-en/products/12", "/sy-en/products/12"],
    ["/sy-en/products/12?color=red#reviews", "/sy-en/products/12?color=red#reviews"],
    ["/sy-ar/settings/profile", "/sy-ar/settings/profile"],
  ])("goes back to the path on this site %s", (raw, expected) => {
    expect(safeReturnPath(raw, "sy-en"), `the path on this site "${raw}" was not followed`).toBe(expected);
  });

  it.each([
    ["no return path", undefined],
    ["an empty return path", ""],
    ["a full URL to another host", "https://evil.example/steal"],
    ["a protocol-relative host", "//evil.example/steal"],
    ["a backslash host", "/\\evil.example/steal"],
    ["a backslash inside the path", "/sy-en\\..\\evil"],
    ["a javascript: link", "javascript:alert(1)"],
    ["a relative path", "products/12"],
    ["a tab inside the path", "/\t/evil.example"],
    ["the login page itself", "/sy-en/login"],
    ["the login page of another locale", "/iq-ar/login/"],
  ])("goes to the home page for %s", (_case, raw) => {
    expect(safeReturnPath(raw, "sy-en"), `"${String(raw)}" was followed instead of the home page`).toBe("/sy-en");
  });
});
