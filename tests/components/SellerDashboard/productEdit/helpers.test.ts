import { describe, expect, it } from "vitest";
import type { Lookups, ProductForm } from "components/SellerDashboard/productEdit/helpers";
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
  renderableDescriptorGroups,
  isSellerProductIdTaken,
  parseSimilarWords,
  buildSyncColorImages,
  buildFormFromEdit,
  dedupeTranslations,
  cleanNumberString,
  validate,
  buildUpdateFormData,
  buildDiff,
  emptyVariantRow,
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

/* ------------------------------------------------------------------------ */
/* Coverage of the rest of the pure data layer.                             */
/* ------------------------------------------------------------------------ */

const lookupsWith = (over: Partial<Lookups> = {}): Lookups => ({
  parent_categories: [],
  sub_categories: [],
  sub_sub_categories: [],
  boutiques: [],
  brands: [],
  colors: [],
  sizes: [],
  countries: [],
  labels: [],
  tags: [],
  locations: [],
  descriptor_groups: [],
  units: [],
  seller_product_ids: [],
  ...over,
});

/** A form validate() fully accepts on edit; each case bends one thing. */
const validForm = (over: Partial<ProductForm> = {}): ProductForm => ({
  ...emptyProductForm(),
  name: "Shirt",
  brand_id: "1",
  seller_product_id: "SP-1",
  location_id: "3",
  origin_country_iso: "sy",
  count_of_pieces: "1",
  current_stock: "5",
  unit_price: "100",
  purchase_price: "50",
  weight: "1",
  images: [{ name: "a.jpg", url: "https://example.com/a.jpg" }],
  category_id: [1],
  boutique_id: "2",
  description: "<p>desc</p>",
  translations: [
    { language_code: "en", name: "Shirt", description: "<p>Nice</p>", similar_words: [] },
  ],
  ...over,
});

const red = { code: "#F00", name: "Red" };
const blue = { code: "#00F", name: "Blue" };
const fullRow = (over: Record<string, string> = {}) => ({
  ...emptyVariantRow(),
  qty: "2",
  location_id: "3",
  sku: "SKU-1",
  ...over,
});

describe("small helpers — remaining branches", () => {
  it("getColorFromLookup prefers the fallback over the raw code, and survives missing lookups", () => {
    const fallback = { code: "#ABC", name: "Custom" };
    expect(getColorFromLookup("#abc", lookupsWith(), fallback), "a color missing from lookups did not use the fallback").toBe(fallback);
    expect(getColorFromLookup("", undefined as any), "a missing lookups object broke the color lookup").toEqual({ code: "", name: "" });
  });

  it("parseDescriptorOptions returns [] for a JSON value that is not an array, or a blank string", () => {
    expect(parseDescriptorOptions('{"a":1}'), "a JSON object was read as options").toEqual([]);
    expect(parseDescriptorOptions("   "), "a blank string was read as options").toEqual([]);
  });

  it("descriptorIconUrl puts a bare filename under the folder for its kind", () => {
    expect(descriptorIconUrl("g.svg", "group"), "a group icon went to the wrong media folder").toBe(
      "https://example.com/descriptors/descriptor_groups/g.svg",
    );
    expect(descriptorIconUrl("d.svg", "descriptor"), "a descriptor icon went to the wrong media folder").toBe(
      "https://example.com/descriptors/descriptors/d.svg",
    );
  });

  it("renderableDescriptorGroups drops descriptors with no input and groups left empty", () => {
    const groups = renderableDescriptorGroups([
      {
        id: 1,
        name: "Specs",
        descriptors: [
          { id: 1, name: "Weight", descriptor_group_id: 1, type: "numeric" },
          { id: 2, name: "Finish", descriptor_group_id: 1, type: "string_choice", options: "[]" },
        ],
      },
      { id: 2, name: "Empty", descriptors: [{ id: 3, name: "X", descriptor_group_id: 2, type: "string_choice" }] },
      { id: 3, name: "No list" } as any,
    ]);
    expect(groups.map((g) => g.name), "a group with nothing to fill in was still shown").toEqual(["Specs"]);
    expect(groups[0].descriptors.map((d) => d.name), "a choice descriptor with no options was still shown").toEqual(["Weight"]);
    expect(renderableDescriptorGroups(undefined as any), "missing groups did not give an empty list").toEqual([]);
  });

  it("flattenDescriptorValues skips bad ids and the wire forms of 'no value'", () => {
    const flat = flattenDescriptorValues([
      { descriptor_id: "x", value: "a" },
      { descriptor_id: 0, value: "a" },
      { descriptor_id: 1, value: null },
      { descriptor_id: 2, value: "" },
      { descriptor_id: 3, value: "null" },
      { descriptor_id: 4 },
      { descriptor_id: 5, value: 12 },
      null,
    ]);
    expect(flat, "only descriptor 5 carries a real value").toEqual({ 5: "12" });
    expect(flattenDescriptorValues(undefined), "missing rows did not give an empty map").toEqual({});
  });

  it("buildDescriptorSyncPayload omits blank values and tolerates missing groups", () => {
    const groups = [
      { id: 1, name: "G", descriptors: [{ id: 10, name: "A", descriptor_group_id: 1, type: "numeric" }, { id: 11, name: "B", descriptor_group_id: 1, type: "numeric" }] },
      { id: 2, name: "H" } as any,
    ];
    expect(buildDescriptorSyncPayload({ 10: "  ", 11: "4" }, groups), "a blank value was sent to the sync endpoint").toEqual({ "1": { "11": "4" } });
    expect(buildDescriptorSyncPayload(undefined as any, undefined as any), "missing input did not give an empty payload").toEqual({});
  });

  it("sameDescriptorValues treats a missing map as empty", () => {
    expect(sameDescriptorValues(undefined as any, { 1: "" }), "a missing map and an all-blank map were seen as different").toBe(true);
    expect(sameDescriptorValues({ 1: "a" }, { 1: "b" }), "two different values were seen as equal").toBe(false);
  });

  it("normalizeSellerProductIds returns [] for anything that is not an array", () => {
    expect(normalizeSellerProductIds("SP-1"), "a string was read as a list of ids").toEqual([]);
  });

  it("isSellerProductIdTaken ignores empty input and trims before comparing", () => {
    expect(isSellerProductIdTaken("  ", ["A"]), "an empty id was reported as taken").toBe(false);
    expect(isSellerProductIdTaken(" A ", ["A"]), "a taken id with spaces around it was not caught").toBe(true);
    expect(isSellerProductIdTaken("B", ["A"]), "a free id was reported as taken").toBe(false);
    expect(isSellerProductIdTaken(undefined as any, ["A"]), "a missing id was reported as taken").toBe(false);
  });

  it("parseSimilarWords reads arrays, JSON strings and comma lists", () => {
    expect(parseSimilarWords(["a", "", 3]), "an array was not kept").toEqual(["a", "3"]);
    expect(parseSimilarWords('["x","y"]'), "a JSON array string was not parsed").toEqual(["x", "y"]);
    expect(parseSimilarWords("red, blue ,"), "a comma list was not split").toEqual(["red", "blue"]);
    expect(parseSimilarWords("5"), "a JSON number was read as words").toEqual([]);
    expect(parseSimilarWords(""), "an empty string was read as words").toEqual([]);
    expect(parseSimilarWords(null), "null was read as words").toEqual([]);
  });

  it("fileName reads file_path / image objects and returns '' for nothing", () => {
    expect(fileName({ file_path: "https://x/y/p.png#frag" }), "file_path was not read").toBe("p.png");
    expect(fileName({ image: "a/b/c.jpg" }), "image was not read").toBe("c.jpg");
    expect(fileName({}), "an empty object did not give an empty name").toBe("");
    expect(fileName(null), "null did not give an empty name").toBe("");
  });

  it("combos builds colour-only and size-only rows, and nothing without either", () => {
    const base = emptyProductForm();
    expect(combos({ ...base, colors: [red] }).map((c) => c.key), "colour-only combos are wrong").toEqual(["Red"]);
    expect(combos({ ...base, sizes: [{ id: 1, name: "42 EU" }] }), "size-only combos are wrong").toEqual([
      { key: "42EU", sizeId: 1, sizeName: "42 EU" },
    ]);
    expect(combos(base), "a form with no colours or sizes produced combos").toEqual([]);
    expect(variantKey(undefined, "M"), "a size-only key is wrong").toBe("M");
    expect(cleanKey(), "cleanKey of nothing is not empty").toBe("");
  });

  it("seedVariantDefaults keeps the same object when nothing changes", () => {
    const form = { ...emptyProductForm(), colors: [red], variations: { Red: fullRow({ price: "1", discount: "1", luck: "1" }) } };
    expect(seedVariantDefaults(form), "an unchanged matrix returned a new object").toBe(form.variations);
  });

  it("seedVariantDefaults fills a new combo's SKU on edit but not a loaded row's empty SKU", () => {
    const form = {
      ...emptyProductForm(),
      unit_price: "10",
      colors: [red, blue],
      variations: { Red: { ...emptyVariantRow(), price: "5" } },
    };
    const next = seedVariantDefaults(form);
    expect(next.Red.sku, "a loaded variant's empty SKU was filled in on edit").toBe("");
    expect(next.Blue.sku, "a newly added colour did not get its key as SKU").toBe("Blue");
    expect(next.Blue.price, "a new combo did not get the product price").toBe("10");
  });

  it("buildSyncColorImages groups images per colour, or in one group without colours", () => {
    const withColors = buildSyncColorImages({
      ...emptyProductForm(),
      colors: [red, blue],
      colorImages: { "#F00": ["a.jpg", "b.jpg"] },
    });
    expect(withColors, "the per-colour image groups are wrong").toEqual([
      { color_code: "#F00", color_name: "Red", images: [{ image: "a.jpg", position: 0 }, { image: "b.jpg", position: 1 }], position: 0 },
      { color_code: "#00F", color_name: "Blue", images: [], position: 1 },
    ]);
    const noColors = buildSyncColorImages({ ...emptyProductForm(), images: [{ name: "x.jpg", url: "" }] });
    expect(noColors, "images without colours were not sent as one ordered group").toEqual([
      { images: [{ image: "x.jpg", position: 0 }], position: 0 },
    ]);
  });

  it("dedupeTranslations keeps the first row per language and drops blank codes", () => {
    const out = dedupeTranslations([
      { language_code: "en", name: "a", description: "", similar_words: [] },
      { language_code: " EN ", name: "b", description: "", similar_words: [] },
      { language_code: "", name: "c", description: "", similar_words: [] },
      { name: "d" } as any,
    ]);
    expect(out.map((t) => t.name), "a duplicate or blank language survived").toEqual(["a"]);
    expect(dedupeTranslations(undefined as any), "missing translations did not give []").toEqual([]);
  });

  it("cleanNumberString strips formatting and returns '' for no number", () => {
    expect(cleanNumberString("1,000 SP"), "a thousands separator was not stripped").toBe("1000");
    expect(cleanNumberString(12.5), "a decimal number was changed").toBe("12.5");
    expect(cleanNumberString("abc"), "text with no digits gave a number").toBe("");
    expect(cleanNumberString(null), "null gave a number").toBe("");
    expect(cleanNumberString(""), "empty gave a number").toBe("");
  });
});

describe("buildFormFromEdit", () => {
  it("rebuilds colours, sizes, variations, images and translations from the edit response", () => {
    const lookups = lookupsWith({
      colors: [{ id: 2, code: "#00F", name: "Blue", translated_name: "Mavi" }],
      sizes: [{ id: 10, name: "M" }],
    });
    const product = {
      name: "Shirt",
      unit: "kg",
      brand_id: 4,
      boutique_id: null,
      location_id: 7,
      unit_price: "1,000 SP",
      multiply_qty: true,
      packed_after_ordering: 0,
      status: "1",
      meta_image: "https://example.com/m/meta.jpg",
      color_image_mappings: [
        {
          color_code: "#f00",
          color_name: "Red",
          color_id: 1,
          translated_color_name: "Kırmızı",
          images: [
            { image: "https://example.com/b.jpg", position: 1 },
            { image: "https://example.com/a.jpg", position: 0 },
            { image: "https://example.com/c.jpg" },
          ],
        },
        { color_code: null },
        { color_code: "#0F0", color_name: "Green", translated_name: "Yeşil" },
      ],
      selected_colors: ["#F00", "#00F", "#ABC", ""],
      selected_size_ids: [10],
      variations: [
        { color_id: 1, size_id: 10, unit_price: "5", discount_price: null, luck_price: 1, quantity: 3, sku: "S", barcode: "B", location_id: 7 },
        { color_id: 99, size_id: 99, type: "Odd Type.1" },
        {},
      ],
      images: ["https://example.com/p.jpg?v=2", { file_path: "https://example.com/q.jpg" }, {}],
      translations: [
        { id: 5, language_code: "en", name: "N", details: "D", similar_words: '["a","b"]' },
        { language_code: "EN", name: "dup" },
        { language_code: "ar", description: "desc" },
      ],
      selected_categories: { main: [1], sub: [2], sub_sub: [3] },
      labels: [8],
      tags_ids: [9],
      restricted_countries_iso: ["iq"],
      extra_price_for_country: [{ country_iso: "tr", extra_price: "5" }],
      cloud_videos: ["v.mp4", { file_path: "f.mp4" }, { url: "u.mp4" }, {}],
    };

    const form = buildFormFromEdit(product, lookups, [{ descriptor_id: 5, value: "Cotton" }]);

    expect(form.colors, "the colour axis was not rebuilt from mappings plus selection").toEqual([
      { code: "#f00", name: "Red", translated_name: "Kırmızı", id: 1 },
      { code: "#0F0", name: "Green", translated_name: "Yeşil", id: undefined },
      { code: "#00F", name: "Blue", translated_name: "Mavi", id: 2 },
      { code: "#ABC", name: "#ABC", translated_name: undefined, id: undefined },
    ]);
    expect(form.sizes, "an unresolved size id was not dropped").toEqual([{ id: 10, name: "M" }]);
    expect(form.variations, "the variation map is wrong").toEqual({
      "Red-M": { price: "5", discount: "", luck: "1", qty: "3", sku: "S", barcode: "B", location_id: "7" },
      OddType_1: { price: "", discount: "", luck: "", qty: "", sku: "", barcode: "", location_id: "" },
    });
    expect(form.colorImages, "colour images were not ordered by position").toEqual({
      "#f00": ["a.jpg", "c.jpg", "b.jpg"],
      "#0F0": [],
    });
    expect(form.images, "product images were not mapped").toEqual([
      { name: "p.jpg", url: "https://example.com/p.jpg?v=2" },
      { name: "q.jpg", url: "https://example.com/q.jpg" },
      { name: "", url: "" },
    ]);
    expect(form.translations, "translations were not mapped and deduped").toEqual([
      { id: 5, language_code: "en", name: "N", description: "D", similar_words: ["a", "b"] },
      { id: undefined, language_code: "ar", name: "", description: "desc", similar_words: [] },
    ]);
    expect(form.unit_price, "a formatted price was not cleaned").toBe("1000");
    expect(form.brand_id, "brand id was not a string").toBe("4");
    expect(form.boutique_id, "a null boutique did not become ''").toBe("");
    expect(form.multiply_qty, "multiply_qty true did not become 1").toBe(1);
    expect(form.packed_after_ordering, "packed_after_ordering 0 did not stay 0").toBe(0);
    expect(form.status, "status was not a number").toBe(1);
    expect(form.meta_image, "meta image filename is wrong").toBe("meta.jpg");
    expect(form.category_id, "main categories are wrong").toEqual([1]);
    expect(form.sub_category_id, "sub categories are wrong").toEqual([2]);
    expect(form.sub_sub_category_id, "sub-sub categories are wrong").toEqual([3]);
    expect(form.descriptor_values, "saved descriptor values were not flattened").toEqual({ 5: "Cotton" });
    expect(form.extra_price_for_country, "extra prices are wrong").toEqual([{ country_iso: "tr", extra_price: "5" }]);
    expect(form.existing_videos, "cloud video entries were not read").toEqual(["v.mp4", "f.mp4", "u.mp4", ""]);
  });

  it("fills every field with its default for an empty response", () => {
    const form = buildFormFromEdit({ videos: ["x.mp4"] }, {} as any);
    expect(form.name, "name default is wrong").toBe("");
    expect(form.unit, "unit default is wrong").toBe("pc");
    expect(form.tax_type, "tax type default is wrong").toBe("percent");
    expect(form.status, "status default is wrong").toBe(0);
    expect(form.colors, "colours default is wrong").toEqual([]);
    expect(form.variations, "variations default is wrong").toEqual({});
    expect(form.existing_videos, "videos were not read").toEqual(["x.mp4"]);
    expect(form.category_id, "categories default is wrong").toEqual([]);
  });
});

describe("validate — every rule", () => {
  it("accepts a complete form", () => {
    expect(validate(validForm()), "a complete form was refused").toEqual({});
    expect(validate(validForm(), true), "a complete form was refused on create").toEqual({});
  });

  it("names every missing required field on an empty form", () => {
    const e = validate(emptyProductForm());
    expect(e.name, "missing name").toBe("Product name is required");
    expect(e.brand_id, "missing brand").toBe("Brand is required");
    expect(e.seller_product_id, "missing seller product id").toBe("Seller Product ID is required");
    expect(e.location_id, "missing location").toBe("Location is required");
    expect(e.origin_country_iso, "missing origin").toBe("Select a valid origin country");
    expect(e.count_of_pieces, "missing count of pieces").toBe("Enter a valid Count of pieces");
    expect(e.current_stock, "missing stock").toBe("Enter a Valid Value for Quantity");
    expect(e.unit_price, "missing unit price").toBe("Enter a valid unit price");
    expect(e.purchase_price, "missing purchase price").toBe("Enter a valid purchase price");
    expect(e.images, "missing images").toBe("At least one product image is required");
    expect(e.translations, "missing English name").toBe("An English (en) name is required");
    expect(e.category_id, "missing category").toBe("Select at least one category");
  });

  it("refuses a unit outside the list", () => {
    expect(validate(validForm({ unit: "box" })).unit, "an unknown unit was accepted").toBe("Select a valid unit");
  });

  it("points at the variants table when stock is missing and variants exist", () => {
    const e = validate(validForm({ current_stock: "", variations: { X: fullRow() } }));
    expect(e.current_stock, "the stock message did not point at the variants table").toBe(
      "Enter a Valid Value for Quantity In Variants Table",
    );
  });

  it("refuses a negative stock with the stock message", () => {
    expect(validate(validForm({ current_stock: "-3" })).current_stock, "a negative stock was accepted").toBe("Enter a valid stock");
  });

  it("refuses a bad discount price and one not below the unit price", () => {
    expect(validate(validForm({ discount_price: "-1" })).discount_price, "a negative discount was accepted").toBe("Enter a valid discount price");
    expect(validate(validForm({ discount_price: "100", purchase_price: "10" })).discount_price, "a discount equal to the unit price was accepted").toBe(
      "Unit price must be greater than discount price",
    );
  });

  it("refuses a count of pieces that is not a whole number from 1 to 100", () => {
    expect(validate(validForm({ count_of_pieces: "0.5" })).count_of_pieces, "0.5 pieces was accepted").toBe("Must be a whole number between 1 and 100");
    expect(validate(validForm({ count_of_pieces: "101" })).count_of_pieces, "101 pieces was accepted").toBe("Must be a whole number between 1 and 100");
  });

  it("refuses more than three labels", () => {
    expect(validate(validForm({ labels: [1, 2, 3, 4] })).labels, "four labels were accepted").toBe("At most 3 labels allowed");
  });

  it("with prices locked checks only the purchase price", () => {
    const locked = validate(validForm({ unit_price: "", purchase_price: "" }), false, true);
    expect(locked.unit_price, "a locked unit price was still required").toBeUndefined();
    expect(locked.purchase_price, "a missing purchase price was accepted while prices are locked").toBe("Enter a valid purchase price");
    expect(validate(validForm({ unit_price: "" }), false, true), "a locked form with a purchase price was refused").toEqual({});
  });

  it.fails("BUG-seller-100: refuses a purchase price above the unit price", () => {
    // helpers.ts:936 only runs the purchase checks when purchase_price is EMPTY,
    // where it is always NaN — so a filled purchase price is never checked.
    const e = validate(validForm({ unit_price: "100", purchase_price: "150" }));
    expect(e.purchase_price, "a purchase price above the unit price was accepted").toBe(
      "Unit price must be greater than purchase price",
    );
  });

  it("asks for an image on every colour, then for every image to have a colour", () => {
    const missing = validate(validForm({ colors: [red], colorImages: {} }));
    expect(missing.colorImages, "a colour with no image was accepted").toBe("Every color needs at least one image (missing: Red)");
    const unassigned = validate(
      validForm({
        colors: [red],
        colorImages: { "#F00": ["a.jpg"] },
        images: [{ name: "a.jpg", url: "" }, { name: "b.jpg", url: "" }],
        variations: { Red: fullRow() },
      }),
    );
    expect(unassigned.colorImages, "an image with no colour was accepted").toBe("Every image must be assigned to a color (1 unassigned)");
  });

  describe("variant rows", () => {
    const withRow = (row?: any) =>
      validate(
        validForm({
          colors: [red],
          colorImages: { "#F00": ["a.jpg"] },
          variations: row ? { Red: row } : {},
        }),
      ).variations;

    it.each([
      ["a missing row", undefined, "Every variant needs a quantity"],
      ["a negative quantity", fullRow({ qty: "-1" }), "Variant quantity cannot be negative"],
      ["a negative price", fullRow({ price: "-1" }), "Variant price cannot be negative"],
      ["a negative discount", fullRow({ discount: "-1" }), "Variant discount price cannot be negative"],
      ["a discount not below the price", fullRow({ price: "10", discount: "10" }), "Unit price must be greater than discount price"],
      ["a negative luck price", fullRow({ luck: "-1" }), "Variant luck price cannot be negative"],
      ["a luck price above the discount", fullRow({ price: "10", discount: "8", luck: "9" }), "Variant luck price cannot be greater than discount price"],
      ["a luck price above the product price", fullRow({ luck: "200" }), "Variant luck price cannot be greater than unit price"],
      ["no location", fullRow({ location_id: "" }), "Every variant needs a location"],
      ["no SKU", fullRow({ sku: "  " }), "Every variant needs an SKU"],
    ])("refuses %s", (_label, row, message) => {
      expect(withRow(row), "the variant row was accepted").toBe(message);
    });

    it("accepts a complete row", () => {
      expect(withRow(fullRow({ price: "10", discount: "5", luck: "4" })), "a valid variant row was refused").toBeUndefined();
    });

    it("marks every row sharing an SKU, case-insensitively", () => {
      const e = validate(
        validForm({
          colors: [red, blue],
          colorImages: { "#F00": ["a.jpg"], "#00F": ["a.jpg"] },
          variations: { Red: fullRow({ sku: "dup" }), Blue: fullRow({ sku: "DUP" }) },
        }),
      );
      expect(e.variation_sku_Red, "the first duplicate SKU row was not marked").toBe("SKU must be unique within the product");
      expect(e.variation_sku_Blue, "the second duplicate SKU row was not marked").toBe("SKU must be unique within the product");
      expect(e.variations, "the table-level duplicate message is missing").toBe("Variation SKUs must be unique within the product");
    });
  });

  it("on create requires a name in the default language, a boutique and a description", () => {
    const e = validate(
      validForm({ name: "", default_language_code: "tr", translations: [], boutique_id: "", description: "<p>&nbsp;</p>" }),
      true,
    );
    expect(e.translations, "a create with no default-language name was accepted").toBe("Product name is required for TR");
    expect(e.boutique_id, "a create with no boutique was accepted").toBe("Boutique is required");
    expect(e.description, "an empty rich-text description was accepted").toBe("Description is required");
    const noDefault = validate(validForm({ name: "", default_language_code: undefined, translations: [] }), true);
    expect(noDefault.translations, "the fallback default language was not English").toBe("Product name is required for EN");
  });

  it("on edit refuses a half-written translation", () => {
    const nameOnly = validate(
      validForm({ translations: [{ language_code: "en", name: "Shirt", description: "<p> </p>", similar_words: [] }] }),
    );
    expect(nameOnly.translations, "a name without a description was accepted").toBe("Description is required for EN");
    const descOnly = validate(
      validForm({
        translations: [
          { language_code: "en", name: "Shirt", description: "d", similar_words: [] },
          { language_code: "tr", name: undefined as any, description: undefined as any, similar_words: [] },
          { language_code: "ar", name: "", description: "وصف", similar_words: [] },
        ],
      }),
    );
    expect(descOnly.translations, "a description without a name was accepted").toBe("Product name is required for AR");
  });
});

describe("buildUpdateFormData", () => {
  it("sends every key the update reads, with neutral defaults for blanks", () => {
    const fd = buildUpdateFormData(
      validForm({
        purchase_price: "",
        unit_price: "",
        location_id: "",
        weight: "",
        tax_type: "weird",
        extra_price_for_country: [{ country_iso: "", extra_price: "9" }, { country_iso: "iq", extra_price: "x" }],
        translations: [
          { id: 7, language_code: "en", name: "N", description: "<p>D</p>", similar_words: [" a ", ""] },
          { language_code: "ar", name: "", description: "", similar_words: undefined as any },
          { id: "", language_code: "tr", name: "T", description: "d", similar_words: [] },
        ],
      }),
    );
    expect(fd.get("unit_price"), "an empty unit price was not sent as 0").toBe("0");
    expect(fd.get("purchase_price"), "an empty purchase price was not sent as 0").toBe("0");
    expect(fd.has("location_id"), "an empty location was sent").toBe(false);
    expect(fd.has("weight"), "an empty weight was sent").toBe(false);
    expect(fd.get("tax_type"), "an unknown tax type was not sent as percent").toBe("percent");
    expect(fd.get("multiplyQTY"), "multiply off was not sent as 0").toBe("0");
    expect(fd.get("packed_after_ordering"), "packed off was not sent as 'off'").toBe("off");
    expect(fd.get("count_of_pieces"), "count of pieces was changed").toBe("1");
    expect(fd.has("meta_image"), "an empty meta image was sent").toBe(false);
    expect(fd.has("default_language_code"), "an edit sent a default language").toBe(false);
    expect(JSON.parse(String(fd.get("extra_price_for_country"))), "extra prices were not filtered and numbered").toEqual([
      { country_iso: "iq", extra_price: 0 },
    ]);
    expect(fd.get("custom_data[0][id]"), "the English row id was not echoed").toBe("7");
    expect(fd.getAll("custom_data[0][similar_words][]"), "similar words were not trimmed").toEqual(["a"]);
    expect(fd.has("custom_data[1][id]"), "an id was invented for a row without one").toBe(false);
    expect(fd.get("custom_data[1][name]"), "an empty name was not sent as ''").toBe("");
    expect(fd.has("custom_data[2][id]"), "an empty id was sent").toBe(false);
    expect(fd.get("custom_data[2][language_code]"), "the third row language is wrong").toBe("tr");
    expect(fd.has("cloud_video"), "a missing video was sent").toBe(false);
  });

  it("sends the optional keys, lists and variant fields when they are set", () => {
    const fd = buildUpdateFormData(
      validForm({
        weight: "2",
        max_allowed_qty: "3",
        shipping_cost: "4",
        shipping_days: "5",
        tax: "6",
        tax_type: "flat",
        discount_price: "80",
        luck_price: "70",
        current_stock: "",
        count_of_pieces: "",
        multiply_qty: 1,
        packed_after_ordering: 1,
        meta_image: "m.jpg",
        category_id: [1],
        sub_category_id: [2],
        sub_sub_category_id: [3],
        labels: [4],
        tags_ids: [5],
        countries_iso: ["iq"],
        colors: [red],
        sizes: [{ id: 1, name: "M" }, { id: 2, name: "L" }],
        variations: { "Red-M": fullRow({ price: "9", discount: "8", luck: "7", barcode: "BC", location_id: "3" }) },
        cloud_video: "v.mp4",
        remove_videos: ["old.mp4"],
      }),
    );
    expect(fd.get("weight"), "weight was not sent").toBe("2");
    expect(fd.get("tax_type"), "flat tax type was not kept").toBe("flat");
    expect(fd.get("multiplyQTY"), "multiply on was not sent as 1").toBe("1");
    expect(fd.get("packed_after_ordering"), "packed on was not sent as 'on'").toBe("on");
    expect(fd.get("current_stock"), "empty stock was not sent as 0").toBe("0");
    expect(fd.get("count_of_pieces"), "empty count was not sent as 1").toBe("1");
    expect(fd.get("meta_image"), "meta image was not sent").toBe("m.jpg");
    expect(fd.getAll("category_id[]"), "categories were not sent").toEqual(["1"]);
    expect(fd.getAll("sub_category_id[]"), "sub categories were not sent").toEqual(["2"]);
    expect(fd.getAll("sub_sub_category_id[]"), "sub-sub categories were not sent").toEqual(["3"]);
    expect(fd.getAll("labels[]"), "labels were not sent").toEqual(["4"]);
    expect(fd.getAll("tags_ids[]"), "tags were not sent").toEqual(["5"]);
    expect(fd.getAll("countries_iso[]"), "restricted countries were not sent").toEqual(["iq"]);
    expect(fd.getAll("colors[]"), "colours were not sent").toEqual(["#F00"]);
    expect(fd.getAll("sizes[]"), "sizes were not sent").toEqual(["M", "L"]);
    expect(fd.get("price_Red-M"), "the row price was not sent").toBe("9");
    expect(fd.get("location_id_Red-M"), "the row location was not sent").toBe("3");
    expect(fd.get("barcode_Red-M"), "the row barcode was not sent").toBe("BC");
    expect(fd.get("price_Red-L"), "a missing row did not fall back to the product price").toBe("100");
    expect(fd.get("price_Red-L_discount"), "a missing row discount was not 0").toBe("0");
    expect(fd.get("qty_Red-L"), "a missing row quantity was not 0").toBe("0");
    expect(fd.get("sku_Red-L"), "a missing row SKU was not ''").toBe("");
    expect(fd.has("location_id_Red-L"), "a missing row location was sent").toBe(false);
    expect(fd.get("cloud_video"), "the new video was not sent").toBe("v.mp4");
    expect(fd.getAll("remove_videos[]"), "removed videos were not sent").toEqual(["old.mp4"]);
  });

  it("falls back to 0 for a variant price when the product price is also empty", () => {
    const fd = buildUpdateFormData(validForm({ unit_price: "", colors: [red] }));
    expect(fd.get("price_Red"), "an empty variant and product price was not sent as 0").toBe("0");
  });

  it("on create sends the default-language row, falling back to the form's own name", () => {
    const withRow = buildUpdateFormData(
      validForm({
        default_language_code: "ar",
        translations: [{ language_code: "ar", name: "", description: "", similar_words: [" w ", " "] }],
      }),
      true,
    );
    expect(withRow.get("default_language_code"), "the default language was not sent").toBe("ar");
    expect(withRow.get("custom_data[0][language_code]"), "the default-language row was not used").toBe("ar");
    expect(withRow.get("custom_data[0][name]"), "an empty row name did not fall back to the form name").toBe("Shirt");
    expect(withRow.getAll("custom_data[0][similar_words][]"), "similar words were not trimmed").toEqual(["w"]);

    const noRow = buildUpdateFormData(
      validForm({ default_language_code: undefined, translations: [], name: "", description: "" }),
      true,
    );
    expect(noRow.get("default_language_code"), "the fallback default language was not en").toBe("en");
    expect(noRow.get("custom_data[0][language_code]"), "the fallback row language is wrong").toBe("en");
    expect(noRow.get("custom_data[0][name]"), "the fallback row name is wrong").toBe("");
    expect(noRow.get("custom_data[0][description]"), "the fallback row description is wrong").toBe("");
  });
});

describe("buildDiff", () => {
  const lookups = lookupsWith({
    brands: [{ id: 1, name: "B1", translated_name: "TB1" }, { id: 2, name: "B2" }],
    boutiques: [{ id: 1, name: "Bo1" }],
    locations: [{ id: 1, name: "L1", address: "A1" }],
    countries: [{ id: 1, iso: "SY", nicename: "Syria" }],
    parent_categories: [{ id: 1, name: "Main1", translated_name: "M1" }],
    sub_categories: [{ id: 2, name: "Sub2" }],
    labels: [{ id: 1, label: "New", translated_label: "Yeni" }],
    tags: [{ id: 1, name: "T1" }],
    descriptor_groups: [
      { id: 1, name: "G", descriptors: [{ id: 5, name: "Material", descriptor_group_id: 1, type: "numeric" }] },
      { id: 2, name: "H" } as any,
    ],
  });
  const row = (over: Record<string, string> = {}) => ({ ...emptyVariantRow(), ...over });

  it("returns nothing when nothing changed", () => {
    expect(buildDiff(validForm(), validForm(), lookups), "an unchanged form produced a diff").toEqual([]);
  });

  it("describes every kind of change", () => {
    const initial = validForm({
      name: "Old",
      brand_id: "1",
      boutique_id: "1",
      location_id: "1",
      origin_country_iso: "sy",
      countries_iso: ["sy", "iq"],
      extra_price_for_country: [
        { country_iso: "sy", extra_price: "1" },
        { country_iso: "iq", extra_price: "2" },
        { country_iso: "tr", extra_price: "3" },
      ],
      images: [{ name: "a", url: "ua" }, { name: "b", url: "ub" }],
      meta_image: "m1",
      colors: [{ ...red, translated_name: "Kırmızı" }],
      sizes: [{ id: 1, name: "M" }],
      category_id: [1],
      sub_category_id: [2],
      sub_sub_category_id: [3],
      labels: [1],
      tags_ids: [1],
      descriptor_values: { 5: "Cotton", 6: "x" },
      variations: {
        "Red-M": row({ price: "1", qty: "2" }),
        Keep: row({ price: "1", discount: "1", luck: "1", qty: "1", sku: "s", barcode: "b", location_id: "1" }),
        Same: row({ price: "1" }),
      },
      colorImages: { "#F00": ["a"] },
      translations: [
        { language_code: "en", name: "A", description: "d", similar_words: ["x"] },
        { language_code: "ar", name: "B", description: "", similar_words: [] },
        { language_code: "tr", name: "T", description: "", similar_words: [] },
      ],
      default_language_code: "en",
    });
    const current = validForm({
      ...initial,
      name: "A new name that is much longer than forty characters in total",
      tax_type: "flat",
      brand_id: "2",
      boutique_id: "9",
      location_id: "",
      multiply_qty: 1,
      packed_after_ordering: 1,
      origin_country_iso: "zz",
      countries_iso: ["sy", "tr"],
      extra_price_for_country: [
        { country_iso: "sy", extra_price: "1" },
        { country_iso: "iq", extra_price: "5" },
        { country_iso: "de", extra_price: "4" },
      ],
      images: [{ name: "b", url: "ub" }, { name: "c", url: "uc" }],
      meta_image: "m2",
      colors: [blue],
      sizes: [{ id: 2, name: "L" }],
      category_id: [9],
      sub_category_id: [],
      labels: [2],
      tags_ids: [],
      descriptor_values: { 5: "Wool", 7: "new" },
      variations: {
        "Blue-L": row({ price: "3", qty: "4", discount: "2", luck: "1", sku: "S2", barcode: "B2" }),
        Keep: row({ price: "2", discount: "", luck: "2", qty: "", sku: "t", barcode: "", location_id: "1x" }),
        Same: row({ price: "1" }),
      },
      colorImages: { "#00F": ["b"] },
      translations: [
        { language_code: "en", name: "A2", description: "", similar_words: [] },
        { language_code: "ku", name: "K", description: "kd", similar_words: ["k"] },
        { language_code: "xx", name: "", description: "", similar_words: [] },
        { language_code: "tr", name: "T", description: "", similar_words: [] },
      ],
      default_language_code: "ar",
      cloud_video: "v.mp4",
      remove_videos: ["old.mp4"],
    });

    const diff = buildDiff(initial, current, lookups);
    const byKey = (k: string) => diff.find((d) => d.key === k)!;

    expect(byKey("name").to, "a long name was not shortened").toBe("A new name that is much longer than fort…");
    expect(byKey("tax_type"), "the tax type change is wrong").toMatchObject({ from: "Percent", to: "Flat" });
    expect(byKey("brand_id"), "the brand change is wrong").toMatchObject({ from: "TB1", to: "B2" });
    expect(byKey("boutique_id"), "the boutique change is wrong").toMatchObject({ from: "Bo1", to: "9" });
    expect(byKey("location_id"), "the location change is wrong").toMatchObject({ from: "L1 - A1", to: "—" });
    expect(byKey("multiply_qty"), "the multiply switch change is wrong").toMatchObject({ from: "Off", to: "On" });
    expect(byKey("packed_after_ordering"), "the packed switch change is wrong").toMatchObject({ from: "Off", to: "On" });
    expect(byKey("origin_country_iso").countryDetails, "the origin change is wrong").toEqual([
      { iso: "sy", name: "Syria", status: "removed" },
      { iso: "zz", name: "ZZ", status: "added" },
    ]);
    expect(byKey("countries_iso").countryDetails, "the restricted countries change is wrong").toEqual([
      { iso: "tr", name: "TR", status: "added" },
      { iso: "iq", name: "IQ", status: "removed" },
    ]);
    expect(byKey("extra_price_for_country").countryDetails, "the extra price change is wrong").toEqual([
      { iso: "IQ", name: "IQ", oldExtraPrice: "2", extraPrice: "5", status: "changed" },
      { iso: "TR", name: "TR", oldExtraPrice: "3", status: "removed" },
      { iso: "DE", name: "DE", extraPrice: "4", status: "added" },
    ]);
    expect(byKey("images").imageDetails, "the image change is wrong").toMatchObject({
      added: [{ name: "c", url: "uc", status: "added" }],
      removed: [{ name: "a", url: "ua", status: "removed" }],
    });
    expect(byKey("images").to, "the image count text is wrong").toBe("2 image(s)");
    expect(byKey("meta_image"), "the meta image change is wrong").toMatchObject({ from: "m1", to: "m2" });
    expect(byKey("colors"), "the colour change is wrong").toMatchObject({ from: "Kırmızı", to: "Blue" });
    expect(byKey("colors").colorDetails?.removed[0].status, "the removed colour is not marked").toBe("removed");
    expect(byKey("colors").colorDetails?.added[0].code, "the added colour is not listed").toBe("#00F");
    expect(byKey("sizes"), "the size change is wrong").toMatchObject({ from: "M", to: "L" });
    expect(byKey("categories").categoryDetails, "the category change is wrong").toEqual([
      { groupLabel: "Main Categories", added: ["#9"], removed: ["M1"] },
      { groupLabel: "Sub Categories", added: [], removed: ["Sub2"] },
    ]);
    expect(byKey("labels").listDetails, "the label change is wrong").toEqual({ added: ["#2"], removed: ["Yeni"] });
    expect(byKey("tags_ids").listDetails, "the tag change is wrong").toEqual({ added: [], removed: ["T1"] });
    expect(byKey("descriptors").descriptorDetails, "the descriptor change is wrong").toEqual([
      { descriptorId: 5, name: "Material", from: "Cotton", to: "Wool" },
      { descriptorId: 6, name: "#6", from: "x", to: "—" },
      { descriptorId: 7, name: "#7", from: "—", to: "new" },
    ]);
    const variants = byKey("variations").variantsDetails!;
    const v = (k: string) => variants.find((x) => x.key === k)!;
    expect(v("Red-M"), "the removed variant is wrong").toMatchObject({ title: "Red / M", status: "removed" });
    expect(v("Blue-L").status, "the added variant is not marked added").toBe("added");
    expect(v("Blue-L").changes.map((c) => c.fieldLabel), "the added variant does not list its filled fields").toEqual([
      "Price", "Stock", "Discount Price", "Luck Price", "SKU", "Barcode",
    ]);
    expect(v("Keep").title, "a variant with no combo is not titled by its key").toBe("Keep");
    expect(v("Keep").changes, "the modified variant changes are wrong").toEqual([
      { fieldLabel: "Price", from: "1", to: "2" },
      { fieldLabel: "Discount Price", from: "1", to: "—" },
      { fieldLabel: "Luck Price", from: "1", to: "2" },
      { fieldLabel: "Stock Qty", from: "1", to: "—" },
      { fieldLabel: "SKU", from: "s", to: "t" },
      { fieldLabel: "Barcode", from: "b", to: "—" },
      { fieldLabel: "Location", from: "L1 - A1", to: "1x" },
    ]);
    expect(variants.some((x) => x.key === "Same"), "an unchanged variant was listed").toBe(false);
    expect(byKey("colorImages"), "the colour-image change is wrong").toMatchObject({ from: "edited", to: "updated" });
    const tr = byKey("translations").translationsDetails!;
    const lang = (c: string) => tr.find((x) => x.langCode === c)!;
    expect(lang("en"), "the modified English row is wrong").toMatchObject({
      langName: "English (en)",
      status: "modified",
      changes: [
        { fieldLabel: "Product Name", from: "A", to: "A2" },
        { fieldLabel: "Description", from: "d", to: "—" },
        { fieldLabel: "Keywords / Search Terms", from: "x", to: "—" },
      ],
    });
    expect(lang("ar"), "the removed Arabic row is wrong").toMatchObject({ status: "removed", changes: [{ from: "B", to: "—" }] });
    expect(lang("ku").changes.map((c) => c.fieldLabel), "the added Kurdish row does not list its fields").toEqual([
      "Product Name", "Description", "Keywords",
    ]);
    expect(lang("xx"), "an added row with no name is wrong").toMatchObject({ langName: "XX", changes: [{ to: "—" }] });
    expect(tr.some((x) => x.langCode === "tr"), "an unchanged language was listed").toBe(false);
    expect(tr.find((x) => x.langName === "Default Language")?.changes, "the default language change is wrong").toEqual([
      { fieldLabel: "Default Language Code", from: "en", to: "ar" },
    ]);
    expect(byKey("cloud_video").to, "the new video is not mentioned").toBe("New video file uploaded");
    expect(byKey("remove_videos").from, "the removed video count is wrong").toBe("1 video(s)");
  });

  it("handles empty sides and changes that net to nothing", () => {
    const initial = validForm({
      brand_id: "",
      boutique_id: "1",
      location_id: "",
      origin_country_iso: "",
      countries_iso: ["a", "a"],
      extra_price_for_country: [{ country_iso: "sy", extra_price: "1" }],
      colors: [],
      sizes: [{ id: 1, name: "M" }],
      variations: { M: row({ price: "", qty: "" }), Z: row({ price: "1" }) },
      translations: [
        { language_code: "ar", name: "", description: "", similar_words: [] },
        { language_code: "en", name: "", description: "x", similar_words: undefined as any },
      ],
      default_language_code: undefined,
    });
    const current = validForm({
      brand_id: "7",
      boutique_id: "",
      location_id: "5",
      origin_country_iso: undefined as any,
      countries_iso: ["a", ""],
      extra_price_for_country: [{ country_iso: "SY", extra_price: "1" }],
      colors: [red],
      sizes: [],
      variations: { Red: row(), Z: row({ price: "" }) },
      translations: [
        { language_code: "en", name: "", description: "", similar_words: undefined as any },
        { language_code: "tr", name: "", description: "", similar_words: [] },
      ],
      default_language_code: "ku",
    });
    const diff = buildDiff(initial, current, lookupsWith({ boutiques: [{ id: 1, name: "Bo1", translated_name: "TBo1" }] }));
    const byKey = (k: string) => diff.find((d) => d.key === k);

    expect(byKey("brand_id"), "an empty brand was not shown as a dash").toMatchObject({ from: "—", to: "7" });
    expect(byKey("boutique_id"), "an empty boutique was not shown as a dash").toMatchObject({ from: "TBo1", to: "—" });
    expect(byKey("location_id"), "an unknown location did not show its id").toMatchObject({ from: "—", to: "5" });
    expect(byKey("origin_country_iso"), "two empty origins produced an entry").toBeUndefined();
    expect(byKey("countries_iso")?.countryDetails, "an empty restricted country was not shown as a dash").toEqual([
      { iso: "", name: "—", status: "added" },
    ]);
    expect(byKey("extra_price_for_country"), "a case-only extra price change produced an entry").toBeUndefined();
    expect(byKey("colors"), "an empty colour list was not shown as a dash").toMatchObject({ from: "—", to: "Red" });
    expect(byKey("sizes"), "an empty size list was not shown as a dash").toMatchObject({ from: "M", to: "—" });
    const variants = byKey("variations")!.variantsDetails!;
    expect(variants.find((x) => x.key === "M")?.changes, "a removed empty variant did not show zeros").toEqual([
      { fieldLabel: "Price", from: "0", to: "—" },
      { fieldLabel: "Stock", from: "0", to: "—" },
    ]);
    expect(variants.find((x) => x.key === "Red")?.changes, "an added empty variant did not show zeros").toEqual([
      { fieldLabel: "Price", from: "—", to: "0" },
      { fieldLabel: "Stock", from: "—", to: "0" },
    ]);
    expect(variants.find((x) => x.key === "Z")?.changes, "a cleared variant price did not show a dash").toEqual([
      { fieldLabel: "Price", from: "1", to: "—" },
    ]);
    const tr = byKey("translations")!.translationsDetails!;
    expect(tr.find((x) => x.langCode === "ar")?.changes, "a removed nameless row did not show a dash").toEqual([
      { fieldLabel: "Product Name", from: "—", to: "—" },
    ]);
    expect(tr.find((x) => x.langCode === "en")?.changes, "a cleared description did not show a dash").toEqual([
      { fieldLabel: "Description", from: "x", to: "—" },
    ]);
    expect(tr.find((x) => x.langCode === "tr")?.changes, "an added empty row listed more than its name").toEqual([
      { fieldLabel: "Product Name", from: "—", to: "—" },
    ]);
    expect(tr.find((x) => x.langName === "Default Language"), "a default language set from nothing is wrong").toMatchObject({
      langCode: "ku",
      changes: [{ from: "—", to: "ku" }],
    });

    const cleared = buildDiff(validForm({ default_language_code: "en" }), validForm({ default_language_code: undefined }), lookupsWith());
    expect(cleared.find((d) => d.key === "translations")?.translationsDetails?.[0], "a cleared default language is wrong").toMatchObject({
      langCode: "default",
      changes: [{ from: "en", to: "—" }],
    });
  });

  it("reads missing lookup lists as empty", () => {
    const diff = buildDiff(
      validForm({ brand_id: "1", boutique_id: "1", location_id: "1", origin_country_iso: "sy", category_id: [1], sub_sub_category_id: [], labels: [1], tags_ids: [1] }),
      validForm({ brand_id: "2", boutique_id: "2", location_id: "2", origin_country_iso: "iq", category_id: [2], sub_sub_category_id: [4], labels: [], tags_ids: [2] }),
      {} as any,
    );
    expect(diff.find((d) => d.key === "brand_id"), "a brand with no lookups did not show its id").toMatchObject({ from: "1", to: "2" });
    expect(diff.find((d) => d.key === "categories")?.categoryDetails, "categories with no lookups did not show ids").toEqual([
      { groupLabel: "Main Categories", added: ["#2"], removed: ["#1"] },
      { groupLabel: "Sub-sub Categories", added: ["#4"], removed: [] },
    ]);
    expect(diff.find((d) => d.key === "tags_ids")?.listDetails, "tags with no lookups did not show ids").toEqual({ added: ["#2"], removed: ["#1"] });
  });
});
