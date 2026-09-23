// The photo groups the product slider and the zoom slider share, one group per
// colour that has photos.
import { describe, expect, it } from "vitest";

import { getColorImageGroups } from "components/Server/product/colorImageGroups";

describe("the colour photo groups", () => {
  it("makes one group per colour with photos, keyed by its option and name", () => {
    expect(
      getColorImageGroups({
        sync_color_images: [
          { color_option: "red", color_name: "Red", images: ["a"] },
          { color_option: "blue", images: [] },
          { color_name: "Green", images: ["g"] },
        ],
        images: ["raw"],
      }),
      "colours without photos must be left out, and missing keys dropped",
    ).toEqual([
      { keys: ["red", "Red"], images: ["a"] },
      { keys: ["Green"], images: ["g"] },
    ]);
  });

  it("falls back to one group of the plain photos when no colour has photos", () => {
    expect(
      getColorImageGroups({ sync_color_images: [{ images: [] }], images: ["raw"] }),
      "the plain photos should form the only group",
    ).toEqual([{ keys: [], images: ["raw"] }]);
    expect(getColorImageGroups(null), "no product should give one empty group").toEqual([
      { keys: [], images: [] },
    ]);
  });
});
