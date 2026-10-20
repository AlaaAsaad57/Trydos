// The Turkish file must hold Turkish text only.
//
// Why this matters: some blocks of `translations.tr.js` were filled with
// Kurdish (Kurmanji) text, so Turkish users saw "Çalakî" instead of "İşlemler"
// and "Jê bibe" instead of "Sil". The parity check cannot see this: the key is
// there, only its value is in the wrong language. A key written twice in the
// file also hides the problem, because the last copy wins.
//
// What a failure here means: a value under the named key is not Turkish (or is
// broken text). Fix the value in `public/translations/translations.tr.js`.
import { describe, expect, it } from "vitest";

import translations from "../../public/translations/translations.tr.js";

const tr = translations as Record<string, string>;

// "ê" is not in the Turkish alphabet, and these words are Kurdish, not Turkish.
const KURDISH_WORDS =
  /ê|(^|[\s(])(bike|tên|nehat|dîtin|firoşkar|digere|bigere|Çalakî|Destûr|Dikan|Rewş|Nav|qebarey|nû)(?=$|[\s.,:?!)])/u;

describe("translations.tr.js", () => {
  it("has no Kurdish text in its values", () => {
    const kurdish = Object.entries(tr)
      .filter(([, value]) => KURDISH_WORDS.test(value))
      .map(([key, value]) => `${JSON.stringify(key)} => ${JSON.stringify(value)}`);
    expect(kurdish, `these Turkish values are in Kurdish:\n${kurdish.join("\n")}`).toEqual([]);
  });

  it("has no value with stray quotes or a trailing comma left from a copy-paste", () => {
    const broken = Object.entries(tr)
      .filter(([, value]) => /^\s*"|",\s*$/.test(value))
      .map(([key, value]) => `${JSON.stringify(key)} => ${JSON.stringify(value)}`);
    expect(broken, `these Turkish values are broken text:\n${broken.join("\n")}`).toEqual([]);
  });
});
