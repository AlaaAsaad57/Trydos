// Checks the builders themselves (AC-2, AC-3).
//
// Three things have to be true of every builder, and they are the reason 118
// later phases can trust the kit:
//   1. Called with nothing, it returns a complete, valid object.
//   2. Called with a partial object, the fields you name change and nothing
//      else does.
//   3. Two calls return independent objects — changing one never changes the
//      other, so no state leaks from one test into the next.
import { describe, expect, it } from "vitest";

import { buildAddress } from "./address";
import { buildCart, buildCartItem } from "./cart";
import { buildChatMessage, buildChatUser } from "./chat";
import {
  buildSearchEngineHit,
  buildSearchEngineResponse,
} from "./elastic";
import { buildOrder, buildOrderLine } from "./order";
import {
  buildGlobalProduct,
  buildListingProduct,
  buildQtyPriceProduct,
  buildSearchEngineProduct,
} from "./product";
import { buildStory, buildStoryItem } from "./story";
import { buildUser } from "./user";

// Every builder, with the field each one is checked against.
const BUILDERS = [
  { name: "listing product", build: buildListingProduct, key: "product_id" },
  { name: "global product", build: buildGlobalProduct, key: "id" },
  { name: "qty/price product", build: buildQtyPriceProduct, key: "id" },
  {
    name: "search-engine product",
    build: buildSearchEngineProduct,
    key: "id",
  },
  { name: "search-engine hit", build: buildSearchEngineHit, key: "_source" },
  {
    name: "search-engine response",
    build: buildSearchEngineResponse,
    key: "hits",
  },
  { name: "user", build: buildUser, key: "id" },
  { name: "cart item", build: buildCartItem, key: "id" },
  { name: "cart", build: buildCart, key: "cart" },
  { name: "order", build: buildOrder, key: "id" },
  { name: "order line", build: buildOrderLine, key: "id" },
  { name: "address", build: buildAddress, key: "id" },
  { name: "story", build: buildStory, key: "stories" },
  { name: "story item", build: buildStoryItem, key: "id" },
  { name: "chat message", build: buildChatMessage, key: "id" },
  { name: "chat user", build: buildChatUser, key: "id" },
] as const;

describe("test fixtures — every builder", () => {
  it.each(BUILDERS)(
    "$name: returns a complete object when called with nothing",
    ({ build, key }) => {
      const value: any = (build as any)();

      expect(value).toBeTypeOf("object");
      expect(value).not.toBeNull();
      expect(value[key]).toBeDefined();
    },
  );

  it.each(BUILDERS)(
    "$name: two calls return independent objects",
    ({ build }) => {
      const first: any = (build as any)();
      const second: any = (build as any)();

      expect(first).not.toBe(second);
      expect(first).toEqual(second);

      first.__touched = "changed by the first test";
      expect(second.__touched).toBeUndefined();
    },
  );
});

describe("test fixtures — overrides", () => {
  it("changes only the fields it is given", () => {
    const base = buildListingProduct();
    const changed = buildListingProduct({ name: "Another Product", price: 5 });

    expect(changed.name).toBe("Another Product");
    expect(changed.price).toBe(5);
    // Everything else stays at its default.
    expect(changed.slug).toBe(base.slug);
    expect(changed.offer_price).toBe(base.offer_price);
    expect(changed.product_id).toBe(base.product_id);
  });

  it("does not change the object a later call returns", () => {
    buildListingProduct({ name: "Only for this call" });

    expect(buildListingProduct().name).toBe("Test Product");
  });

  it("applies an override that is an empty value, null, or zero", () => {
    const product = buildListingProduct({
      name: "",
      price: 0,
      flash_deal_price: null,
      images: [],
    });

    // The point: none of these are quietly replaced by the default.
    expect(product.name).toBe("");
    expect(product.price).toBe(0);
    expect(product.flash_deal_price).toBeNull();
    expect(product.images).toEqual([]);
  });

  it("keeps a nested override whole rather than merging it", () => {
    const product = buildListingProduct({ brand: { id: 99 } });

    expect(product.brand).toEqual({ id: 99 });
  });

  it("keeps the search-engine response's total in step with its hits", () => {
    const response = buildSearchEngineResponse({
      hits: { total: { value: 0, relation: "eq" }, hits: [] },
    });

    expect(response.hits.hits).toHaveLength(0);
    expect(response.hits.total.value).toBe(0);
  });

  it("lets a caller replace the product inside a search-engine hit", () => {
    const hit = buildSearchEngineHit({
      _source: buildSearchEngineProduct({ id: "2002", name: "Other" }),
    });

    expect(hit._source.id).toBe("2002");
    expect(hit._source.name).toBe("Other");
    // The rest of the raw row is still there.
    expect(hit._source.slug).toBe("test-product");
  });

  it("builds an order whose address and lines are real fixtures", () => {
    const order = buildOrder();

    expect(order.details).toHaveLength(1);
    expect(order.details[0].product_id).toBe(1001);
    expect(order.shipping_address_data.country_iso).toBe("gb");
  });
});
