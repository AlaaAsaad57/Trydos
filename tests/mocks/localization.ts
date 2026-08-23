// Stand-in for the language and country helper (services/localization.ts).
//
// Use it like this, at the top of a test file:
//
//   vi.mock("services/localization", () => makeLocalizationMock({ country: "gb" }));
//
// The real module exports a class INSTANCE on its `default` key, so the fake
// one sits on `default` too. A flat stand-in would hand back nothing to
// utils/functions.tsx, which reads `LocalizationService.GetAppLanguage()` off
// the default export.
//
// It is hand-written: nothing here imports the real module, which would
// otherwise drag the shared store in behind it.

/**
 * Build a fresh stand-in for the localization helper.
 *
 * The defaults match the real store's own defaults for these two fields
 * (`language: "en"`, `country: ""` in store/homepage/reducer.ts).
 */
export function makeLocalizationMock(
  initial: { language?: string; country?: string } = {},
) {
  const language = initial.language ?? "en";
  const country = initial.country ?? "";

  return {
    default: {
      GetAppLanguage: vi.fn(() => language),
      GetAppCountry: vi.fn(() => country),
    },
  };
}
