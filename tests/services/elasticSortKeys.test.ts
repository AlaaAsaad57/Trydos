import { describe, expect, it } from "vitest";
import { LISTING_SORT_KEYS } from "services/elastic/sortKeys";

describe("LISTING_SORT_KEYS vocabulary", () => {
  it("contains all canonical listing sort keys", () => {
    expect(LISTING_SORT_KEYS, "should contain standard sort keys").toEqual([
      "best_selling",
      "newest",
      "oldest",
      "price_asc",
      "price_desc",
      "name_asc",
      "name_desc",
    ]);
  });
});
