import { describe, expect, it } from "vitest";
import ar from "public/translations/translations.ar.js";
import tr from "public/translations/translations.tr.js";
import ku from "public/translations/translations.ku.js";
import { DEMO_KEYS } from "components/DemoApp/demoKeys";

// `pnpm lint` checks a key only when it is written inside t("..."). Most demo
// keys reach t() through arrays and props (tab labels, menu rows, countries),
// where the lint cannot see them. This names each one that has no translation.
describe("demo keys", () => {
  for (const [language, table] of [
    ["ar", ar],
    ["tr", tr],
    ["ku", ku],
  ] as const) {
    it(`every demo string has a ${language} translation`, () => {
      const missing = DEMO_KEYS.filter((key) => !(table as Record<string, string>)[key]);
      expect(missing, `demo strings with no ${language} translation in public/translations`).toEqual([]);
    });
  }
});
