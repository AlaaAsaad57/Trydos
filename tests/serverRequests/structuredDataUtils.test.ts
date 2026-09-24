import { describe, expect, it } from "vitest";
import {
  mapLocaleToBCP47,
  mapCurrencyToSymbol,
  buildParamsFromFilters,
  getTitleAndTargetofListing,
} from "serverRequests/meta/StructuredData/utils";

describe("StructuredData utils", () => {
  describe("mapLocaleToBCP47", () => {
    it("maps locale pairs to BCP47 tags", () => {
      expect(mapLocaleToBCP47("sy-ar"), "sy-ar should map to ar-SY").toBe("ar-SY");
      expect(mapLocaleToBCP47("tr-en"), "tr-en should map to en-TR").toBe("en-TR");
      expect(mapLocaleToBCP47("gb-en"), "gb-en should map to en-GB").toBe("en-GB");
    });

    it("defaults to en-US for unmapped locales", () => {
      expect(mapLocaleToBCP47("unknown-locale"), "unmapped locale should return en-US").toBe("en-US");
    });
  });

  describe("mapCurrencyToSymbol", () => {
    it("maps country ISO codes to ISO 4217 currency codes", () => {
      expect(mapCurrencyToSymbol("sy"), "sy should return SYP").toBe("SYP");
      expect(mapCurrencyToSymbol("tr"), "tr should return TRY").toBe("TRY");
      expect(mapCurrencyToSymbol("iq"), "iq should return IQD").toBe("IQD");
      expect(mapCurrencyToSymbol("us"), "us should return USD").toBe("USD");
    });

    it("defaults to USD for unknown country ISO codes", () => {
      expect(mapCurrencyToSymbol("unknown"), "unknown country should default to USD").toBe("USD");
    });
  });

  describe("buildParamsFromFilters", () => {
    it("builds parameter array from category, boutique, and brand filter selections", () => {
      const filters = {
        categories: ["shoes"],
        brands: ["nike"],
      };

      const params = buildParamsFromFilters(filters);
      expect(params, "should contain category and brand params").toEqual([
        "categories",
        "shoes",
        "brands",
        "nike",
      ]);
    });

    it("writes colours without the # and joins several values with commas", () => {
      expect(
        buildParamsFromFilters({ colors: ["#ff0000", "00ff00"], sizes: ["M", "L"], tags_names: [] }),
        "colour or size params are wrong, or an empty filter was written",
      ).toEqual(["colors", "ff0000,00ff00", "sizes", "M,L"]);
    });
  });

  describe("getTitleAndTargetofListing", () => {
    const filtersData = {
      boutiques: [{ slug: "shop-a", name: "Shop A" }],
      categories: [{ slug: "dresses", name: "Dresses" }],
      brands: [{ slug: "acme", name: "Acme" }],
    };

    it("names the page after the chosen boutique, category and brand, and links to their filter page", () => {
      expect(
        getTitleAndTargetofListing({
          filters: { boutiques: ["shop-a"], categories: ["dresses"], brands: ["acme"] },
          filtersData,
          language: "en",
        }),
        "the listing title or link is wrong",
      ).toEqual({
        title: ["Trydos", "Shop A", "Dresses", "Acme"],
        path: "/filters/boutiques/shop-a/categories/dresses/brands/acme",
      });
    });

    it("uses the site name alone and the bare filter page when nothing was chosen, in any language", () => {
      expect(
        getTitleAndTargetofListing({ filters: undefined, filtersData: undefined, language: "xx" }),
        "a listing with no filters did not fall back to the site name and /filters",
      ).toEqual({ title: ["Trydos"], path: "/filters" });
    });
  });
});
