import { describe, expect, it } from "vitest";
import { getLocalizedCountryName } from "utils/countryData";

describe("countryData utility", () => {
  it("returns empty string when iso2 code is undefined or empty", () => {
    expect(getLocalizedCountryName(undefined), "undefined iso2 code should return empty string").toBe("");
    expect(getLocalizedCountryName(""), "empty iso2 code should return empty string").toBe("");
  });

  it("returns localized country name for valid ISO2 codes in English", () => {
    const usName = getLocalizedCountryName("us", "en");
    expect(usName, "US iso2 should localize to United States").toBe("United States");

    const trName = getLocalizedCountryName("tr", "en");
    expect(trName, "TR iso2 should localize to Turkey or Türkiye").toBeTruthy();
  });

  it("returns localized country name in target language", () => {
    const arName = getLocalizedCountryName("sy", "ar");
    expect(arName, "SY iso2 in Arabic should return Syrian name").toBe("سوريا");
  });

  it("falls back gracefully when given invalid country code", () => {
    const invalidName = getLocalizedCountryName("XX", "en");
    expect(invalidName, "invalid country code should return raw code uppercase").toBe("XX");
  });
});
