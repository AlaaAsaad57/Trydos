// The checkout's delivery sheet place (components/DemoApp1/checkoutData.ts):
// the flag the design draws (OQ-5 of Stage 7e, UI-MIGRATION-PLAN.md).
import { describe, expect, it } from "vitest";
import { deliveryPlace } from "components/DemoApp1/checkoutData";
import type { ProfileAddress } from "components/DemoApp1/useProfileData";

const address = (countryIso: string): ProfileAddress => ({
  id: 1,
  title: "Home",
  area: ["Main", "West", "Mazzeh", "Damascus"],
  countryIso,
  country: "",
  detail: "",
  isDefault: true,
  raw: {},
});

describe("deliveryPlace — the flag of the delivery sheet", () => {
  it("gives the design flag for tr/sy/iq/lb and the standard flag otherwise", () => {
    expect(deliveryPlace(address("sy"), "en").flag, "Syria should get the design's Syria row flag").toBe("flagSyRow");
    expect(deliveryPlace(address("tr"), "en").flag, "Turkiye should get the design's row flag").toBe("flagTr");
    expect(deliveryPlace(address("iq"), "en").flag, "Iraq should get the design's row flag").toBe("flagIq");
    expect(deliveryPlace(address("lb"), "en").flag, "Lebanon should get the design's row flag").toBe("flagLb");
    const jordan = deliveryPlace(address("jo"), "en");
    expect(jordan.flag, "Jordan has no design flag").toBeUndefined();
    expect(jordan.flagSrc, "Jordan should get its standard flag").toBe("/icons/flag/jo.svg");
  });

  it("gives no flag when the address has no country code", () => {
    const place = deliveryPlace(address(""), "en");
    expect(place.flag, "no code: no design flag").toBeUndefined();
    expect(place.flagSrc, "no code: no standard flag").toBeUndefined();
  });
});
