import { describe, expect, it } from "vitest";
import { buildAlternates } from "serverRequests/meta/buildAlternates";

describe("buildAlternates utility", () => {
  it("builds canonical and language hreflang cluster for home path", () => {
    const alternates = buildAlternates("sy-ar", "");

    expect(alternates.canonical, "canonical should point to current locale path").toContain("/sy-ar");
    expect(alternates.languages.en, "en hreflang should point to /sy-en").toContain("/sy-en");
    expect(alternates.languages.ar, "ar hreflang should point to /sy-ar").toContain("/sy-ar");
    expect(alternates.languages.tr, "tr hreflang should point to /sy-tr").toContain("/sy-tr");
    expect(alternates.languages.ku, "ku hreflang should point to /sy-ku").toContain("/sy-ku");
    expect(alternates.languages["x-default"], "x-default should point to English variant").toContain("/sy-en");
  });

  it("appends path suffix across all language alternate URLs", () => {
    const alternates = buildAlternates("tr-en", "/filters/category/shoes");

    expect(alternates.canonical, "canonical should include path suffix").toContain("/tr-en/filters/category/shoes");
    expect(alternates.languages.ar, "ar hreflang should include path suffix").toContain("/tr-ar/filters/category/shoes");
  });
});
