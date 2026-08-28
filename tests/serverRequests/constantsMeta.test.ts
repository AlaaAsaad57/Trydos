import { describe, expect, it } from "vitest";
import { trydosTranslations } from "serverRequests/meta/constants-meta";

describe("trydosTranslations metadata constants", () => {
  it("contains translations for en, ar, tr, and ku languages", () => {
    expect(trydosTranslations.en.siteName, "en siteName should be Trydos").toBe("Trydos");
    expect(trydosTranslations.ar.siteName, "ar siteName should be ترايدوس").toBe("ترايدوس");
    expect(trydosTranslations.tr.siteName, "tr siteName should be Trydos").toBe("Trydos");
    expect(trydosTranslations.ku.siteName, "ku siteName should be Trydos").toBe("Trydos");
  });

  it("formats listing descriptions dynamically", () => {
    const enDesc = trydosTranslations.en.listingDesc("Shoes");
    expect(enDesc, "en listingDesc should include target title").toContain("Shoes");

    const arDesc = trydosTranslations.ar.listingDesc("أحذية");
    expect(arDesc, "ar listingDesc should include target title").toContain("أحذية");
  });
});
