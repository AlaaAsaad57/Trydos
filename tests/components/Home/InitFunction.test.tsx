import { waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "../../render";

const jar: Record<string, string | undefined> = {};
const setLocaizationCookies = vi.fn();
vi.mock("utils/cookies/cookie-manager", async () => {
  const { makeCookieManagerMock } = await import("../../mocks/cookieManager");
  return {
    ...makeCookieManagerMock(),
    getCookie: (name: string) => jar[name],
    setLocaizationCookies: (...a: any[]) => setLocaizationCookies(...a),
  };
});

import InitFunction from "components/Home/InitFunction";

describe("InitFunction", () => {
  beforeEach(() => {
    setLocaizationCookies.mockClear();
    delete jar.language;
    delete jar.country;
  });

  it("takes country and language from the route segment first", async () => {
    await renderWithProviders(<InitFunction init="sy-ar" />);
    await waitFor(() =>
      expect(setLocaizationCookies, "the route locale was not saved").toHaveBeenCalledWith("sy", "ar"),
    );
  });

  it("falls back to the cookies when the route gives no locale", async () => {
    jar.language = "tr";
    jar.country = "iq";
    await renderWithProviders(<InitFunction init={["x"]} />);
    await waitFor(() =>
      expect(setLocaizationCookies, "the cookie locale was not saved").toHaveBeenCalledWith("iq", "tr"),
    );
  });

  it("falls back to the store when there are no cookies either", async () => {
    await renderWithProviders(<InitFunction init="" />, { country: "jo", language: "ku" });
    await waitFor(() =>
      expect(setLocaizationCookies, "the store locale was not saved").toHaveBeenCalledWith("jo", "ku"),
    );
  });

  it("falls back to the default locale when nothing else is known", async () => {
    await renderWithProviders(<InitFunction init="" />, { store: { country: "", language: "" } });
    await waitFor(() =>
      expect(setLocaizationCookies, "the default locale was not saved").toHaveBeenCalledWith("gb", "en"),
    );
  });
});
