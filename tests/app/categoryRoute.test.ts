import { describe, it, expect } from "vitest";
import { isValidCategorySlug } from "serverRequests/meta/home";

describe("the category route's slug gate", () => {
  it("accepts a slug the backend could really return", () => {
    expect(
      isValidCategorySlug("womens-shoes"),
      "an ordinary category slug was refused, so a real category page would 404",
    ).toBe(true);
  });

  it("accepts a slug that is not in the cached category list", () => {
    // Amendment 2 / finding 2: the gate checks the SHAPE, never a list. A
    // category the backend added a second ago must open at once (AC-15).
    expect(
      isValidCategorySlug("a-category-added-one-second-ago"),
      "a slug the cached list has not caught up with was refused; AC-15 requires a brand new category to open immediately",
    ).toBe(true);
  });

  it("refuses a slug carrying a path", () => {
    expect(
      isValidCategorySlug("../../etc/passwd"),
      "a slug containing path characters was accepted, and it reaches the Redis metadata key and the OpenGraph url",
    ).toBe(false);
  });

  it("refuses a slug longer than the cache key should ever carry", () => {
    expect(
      isValidCategorySlug("x".repeat(65)),
      "an over-long slug was accepted; the slug is part of the cache key, so an unbounded length is an unbounded number of entries a stranger can create",
    ).toBe(false);
  });

  it("accepts a slug written in Arabic", () => {
    expect(
      isValidCategorySlug("أحذية"),
      "an Arabic slug was refused; three of the four languages this app serves are not written in Latin letters",
    ).toBe(true);
  });
});
