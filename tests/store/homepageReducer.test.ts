import { describe, expect, it, beforeEach } from "vitest";
import { useAppStore } from "store";

describe("Homepage store reducer actions", () => {
  beforeEach(() => {
    useAppStore.setState({
      language: "en",
      country: "",
      countries: [],
      currency: null,
      activeRoute: null,
      loading: false,
    });
  });

  it("setAppLanguage updates application active language", () => {
    useAppStore.getState().setAppLanguage("ar");
    expect(useAppStore.getState().language, "language state should be updated to ar").toBe("ar");
  });

  it("setAppCountry updates application active country", () => {
    useAppStore.getState().setAppCountry("tr");
    expect(useAppStore.getState().country, "country state should be updated to tr").toBe("tr");
  });

  it("setCurrency sets active display currency", () => {
    const currency = { code: "USD", symbol: "$" };

    useAppStore.getState().setCurrency(currency);
    expect(useAppStore.getState().currency, "currency state should match").toEqual(currency);
  });

  it("setActiveRoute updates current active route string", () => {
    useAppStore.getState().setActiveRoute("/en/catalog");
    expect(useAppStore.getState().activeRoute, "activeRoute should be /en/catalog").toBe("/en/catalog");
  });

  it("setCountries populates country selection list", () => {
    const countries = [{ code: "US", name: "United States" }];
    useAppStore.getState().setCountries(countries);
    expect(useAppStore.getState().countries, "countries should be set").toEqual(countries);
  });
});
