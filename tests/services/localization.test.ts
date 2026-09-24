// services/localization.ts — reads the app language from the store (used by
// the order button). GetAppCountry has no caller, so it is not tested here.
import { describe, expect, it } from "vitest";

import LocalizationServiceClass from "services/localization";
import { useAppStore } from "store";

describe("LocalizationService", () => {
  it("reads the language the store holds", () => {
    useAppStore.setState({ language: "ar" } as any);
    expect(LocalizationServiceClass.GetAppLanguage(), "the language was not read from the store").toBe("ar");
  });
});
