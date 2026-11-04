import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * Guards the five Quicksand faces in app/(client)/[lang]/layout.tsx.
 *
 * The bug this file was written for: all five faces loaded one variable font
 * file (quicksand-variable.ttf), each with its own `weight`. That file draws
 * Light (300) unless the browser applies the weight to it. Playwright's WebKit
 * did not: Regular, Medium and Bold all drew as Light, with the same strokes
 * (inked pixels 5256 / 5275 / 5242, against 7404 / 9914 / 14094 in Chromium).
 * The static files draw each weight in both engines.
 *
 * So each face must load the static file of its own weight.
 */
const FILE_OF_WEIGHT: Record<string, string> = {
  "300": "Quicksand-Light.woff2",
  "400": "Quicksand-Regular.woff2",
  "500": "Quicksand-Medium.woff2",
  "600": "Quicksand-SemiBold.woff2",
  "700": "Quicksand-Bold.woff2",
};

const source = readFileSync("app/(client)/[lang]/layout.tsx", "utf8");

/** Each `localFont({ ... })` call of the layout: its variable, src and weight. */
const faces = [...source.matchAll(/localFont\(\{([\s\S]*?)\}\);/g)].map(([, body]) => ({
  variable: body.match(/variable:\s*"([^"]+)"/)?.[1],
  src: body.match(/src:\s*"([^"]+)"/)?.[1],
  weight: body.match(/weight:\s*"([^"]+)"/)?.[1],
}));

describe("Quicksand faces of the [lang] layout", () => {
  for (const [weight, file] of Object.entries(FILE_OF_WEIGHT)) {
    it(`loads ${file} for weight ${weight}`, () => {
      const face = faces.find((f) => f.weight === weight);
      expect(face, `the layout declares no Quicksand face with weight "${weight}"`).toBeDefined();
      expect(
        face!.src,
        `the ${face!.variable} face (weight ${weight}) loads "${face!.src}", not the static ${file}; WebKit draws a variable file as Light`,
      ).toBe(`../../../public/fonts/${file}`);
    });
  }
});
