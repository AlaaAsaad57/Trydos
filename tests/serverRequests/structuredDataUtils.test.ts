import { describe, expect, it } from "vitest";
import {
  mapLocaleToBCP47,
  mapCurrencyToSymbol,
  buildParamsFromFilters,
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
  });
});
