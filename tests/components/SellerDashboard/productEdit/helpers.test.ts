import { describe, expect, it } from "vitest";
import {
  locationLabel,
  getColorFromLookup,
  parseDescriptorOptions,
  descriptorIconUrl,
  descriptorHasInput,
  flattenDescriptorValues,
  buildDescriptorSyncPayload,
  sameDescriptorValues,
  normalizeSellerProductIds,
  emptyProductForm,
  seedVariantDefaults,
  variantKey,
  cleanKey,
  fileName,
  combos,
} from "components/SellerDashboard/productEdit/helpers";

describe("SellerDashboard ProductEdit helpers", () => {
  describe("locationLabel", () => {
    it("formats location name and address cleanly", () => {
      const label = locationLabel({ id: 1, name: "Warehouse A", address: "123 Main St" });
      expect(label, "should format as 'name - address'").toBe("Warehouse A - 123 Main St");
    });
  });

  describe("getColorFromLookup", () => {
    it("finds color in lookups by code case-insensitively", () => {
      const lookups = {
        colors: [{ id: 1, code: "#FF0000", name: "Red" }],
      } as any;

      const found = getColorFromLookup("#ff0000", lookups);
      expect(found.name, "should find matching color name").toBe("Red");
    });

    it("falls back to raw code when not in lookups", () => {
      const color = getColorFromLookup("#00FF00", { colors: [] } as any);
      expect(color.name, "should fallback to raw code").toBe("#00FF00");
    });
  });

  describe("parseDescriptorOptions", () => {
    it("parses JSON-encoded descriptor option arrays", () => {
      const parsed = parseDescriptorOptions('["Cotton","Polyester"]');
      expect(parsed, "should parse JSON string array").toEqual(["Cotton", "Polyester"]);
    });

    it("returns array unchanged if already array", () => {
      const parsed = parseDescriptorOptions(["Red", "Blue"]);
      expect(parsed, "should return array").toEqual(["Red", "Blue"]);
    });

    it("returns empty array for invalid input", () => {
      expect(parseDescriptorOptions("invalid json"), "invalid json should return []").toEqual([]);
      expect(parseDescriptorOptions(null), "null input should return []").toEqual([]);
    });
  });

  describe("descriptorIconUrl", () => {
    it("returns empty string when icon is absent", () => {
      expect(descriptorIconUrl(null, "descriptor"), "null icon should return empty string").toBe("");
    });

    it("preserves absolute http/https URLs", () => {
      const url = "https://media.example.com/icon.svg";
      expect(descriptorIconUrl(url, "descriptor"), "absolute URL should remain untouched").toBe(url);
    });
  });

  describe("descriptorHasInput", () => {
    it("returns true for numeric descriptors", () => {
      const result = descriptorHasInput({ id: 1, name: "Weight", descriptor_group_id: 1, type: "numeric" });
      expect(result, "numeric type should have input").toBe(true);
    });

    it("returns true for string_choice descriptors with valid options", () => {
      const result = descriptorHasInput({
        id: 2,
        name: "Material",
        descriptor_group_id: 1,
        type: "string_choice",
        options: '["Cotton"]',
      });
      expect(result, "string_choice with options should have input").toBe(true);
    });
  });

  describe("flattenDescriptorValues & buildDescriptorSyncPayload", () => {
    it("flattens edit rows into key-value map and builds sync payload", () => {
      const rows = [{ descriptor_id: 10, value: "Cotton" }];
      const flat = flattenDescriptorValues(rows);
      expect(flat, "flat map should map id to value").toEqual({ 10: "Cotton" });

      const groups = [
        {
          id: 1,
          name: "Specs",
          descriptors: [{ id: 10, name: "Material", descriptor_group_id: 1, type: "string_choice" }],
        },
      ];
      const syncPayload = buildDescriptorSyncPayload(flat, groups);
      expect(syncPayload, "sync payload should map group id to descriptor id").toEqual({
        "1": { "10": "Cotton" },
      });
    });

    it("sameDescriptorValues evaluates equality between blank and absent entries", () => {
      expect(sameDescriptorValues({ 10: "Cotton" }, { 10: "Cotton" }), "identical maps should return true").toBe(true);
      expect(sameDescriptorValues({ 10: "Cotton" }, { 10: "" }), "blank vs value should return false").toBe(false);
    });
  });

  describe("normalizeSellerProductIds", () => {
    it("dedupes and filters raw seller product ID array", () => {
      const normalized = normalizeSellerProductIds([null, " SP-001 ", "SP-001", "SP-002", ""]);
      expect(normalized, "should trim and dedupe product IDs").toEqual(["SP-001", "SP-002"]);
    });
  });

  describe("emptyProductForm, variantKey, fileName, combos, seedVariantDefaults", () => {
    it("emptyProductForm initializes clean product form with default unit pc", () => {
      const form = emptyProductForm();
      expect(form.unit, "unit should be pc").toBe("pc");
      expect(form.status, "status should be 0").toBe(0);
    });

    it("cleanKey and variantKey sanitize color and size names", () => {
      expect(cleanKey("Red Dark.1"), "cleanKey should remove spaces and replace dot").toBe("RedDark_1");
      expect(variantKey("Red Dark", "XL.1"), "variantKey should combine color and size").toBe("RedDark-XL_1");
    });

    it("fileName extracts last path segment of image URL", () => {
      expect(fileName("https://cdn.example.com/images/shirt.jpg?v=1"), "should extract shirt.jpg").toBe("shirt.jpg");
    });

    it("combos generates Cartesian product of colors and sizes", () => {
      const form = {
        ...emptyProductForm(),
        colors: [{ code: "#FF", name: "Red" }],
        sizes: [{ id: 1, name: "M" }],
      };
      const result = combos(form);
      expect(result, "should generate 1 combo for Red-M").toEqual([
        { key: "Red-M", colorCode: "#FF", colorName: "Red", sizeId: 1, sizeName: "M" },
      ]);
    });

    it("seedVariantDefaults populates default price/discount/luck on variant rows", () => {
      const form = {
        ...emptyProductForm(),
        unit_price: "100",
        discount_price: "80",
        colors: [{ code: "#FF", name: "Red" }],
        sizes: [{ id: 1, name: "M" }],
        variations: {},
      };
      const nextVariations = seedVariantDefaults(form, true);
      expect(nextVariations["Red-M"].price, "price should default to unit_price").toBe("100");
      expect(nextVariations["Red-M"].discount, "discount should default to discount_price").toBe("80");
    });
  });
});
