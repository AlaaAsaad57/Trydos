import { describe, expect, it } from "vitest";
import {
  getSourceFields,
  buildSortClause,
  LISTING_SORT_KEYS,
} from "services/elastic/helpers";

describe("elastic helpers pure functions", () => {
  describe("getSourceFields", () => {
    it("returns base fields when full is false", () => {
      const fields = getSourceFields(false);
      expect(fields.includes("id"), "should include id").toBe(true);
      expect(fields.includes("custom_products.details"), "should not include mobile-only field in base set").toBe(false);
    });

    it("includes mobile-only source fields when full is true", () => {
      const fields = getSourceFields(true);
      expect(fields.includes("custom_products.details"), "should include mobile-only fields when full is true").toBe(true);
    });
  });

  describe("buildSortClause", () => {
    it("builds correct ES sort clauses for all listing sort keys", () => {
      LISTING_SORT_KEYS.forEach((key) => {
        const clause = buildSortClause(key, "en");
        expect(Array.isArray(clause), `sort key ${key} should produce an array clause`).toBe(true);
        expect(clause.length > 0, `sort key ${key} clause should not be empty`).toBe(true);
        expect(clause[clause.length - 1], `clause should end with id tie-breaker`).toEqual({ id: { order: "asc" } });
      });
    });

    it("falls back to relevance sort for unknown or empty sort keys", () => {
      const fallback = buildSortClause(null, "en");
      expect(fallback, "fallback sort should be score + id tie breaker").toEqual([
        { _score: { order: "desc" } },
        { id: { order: "asc" } },
      ]);
    });
  });
});
