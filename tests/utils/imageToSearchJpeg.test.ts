// The size a photo search picture is drawn at before upload: longest side
// 1024 px, same shape. Drawing itself needs a real browser, so only the maths
// and the "send the original" fallback are checked here.
import { describe, expect, it } from "vitest";

import { fitWithin, imageToSearchJpeg } from "utils/imageToSearchJpeg";

describe("fitWithin", () => {
  it("shrinks the longest side to 1024 and keeps the shape", () => {
    expect(fitWithin(4032, 3024), "a landscape phone photo got the wrong size").toEqual({ width: 1024, height: 768 });
    expect(fitWithin(3024, 4032), "a portrait phone photo got the wrong size").toEqual({ width: 768, height: 1024 });
  });
  it("never makes a small picture bigger", () => {
    expect(fitWithin(500, 300), "a small picture was made bigger").toEqual({ width: 500, height: 300 });
  });
  it("never answers a zero side", () => {
    expect(fitWithin(10000, 1), "a very thin picture got a zero side").toEqual({ width: 1024, height: 1 });
  });
});

describe("imageToSearchJpeg", () => {
  it("sends the original file when the browser cannot draw it", async () => {
    const file = new File(["not a picture"], "x.heic", { type: "image/heic" });
    const original = URL.createObjectURL;
    // A browser with no object URLs.
    (URL as any).createObjectURL = undefined;
    try {
      expect(await imageToSearchJpeg(file), "a picture the browser cannot draw was lost").toBe(file);
    } finally {
      URL.createObjectURL = original;
    }
  });
});
