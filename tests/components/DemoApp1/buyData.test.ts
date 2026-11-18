import { describe, expect, it } from "vitest";
import { colorRowOf, sizesOf, toBuyView, variantOf } from "components/DemoApp1/buyData";
import type { ProductColorView } from "components/DemoApp1/productData";

// A colour as the product page draws it (components/Product/productView.ts).
const color = (name: string): ProductColorView => ({
  name,
  key: name,
  keys: [name],
  tile: `/tile-${name}.webp`,
  photos: [{ src: `/photo-${name}.webp` }],
  trend: false,
});

// A product as the old add sheet keeps it: two colours, three sizes, the
// stock on each variant (`qtyPriceDetails`).
const product = (extra: Record<string, unknown> = {}) => ({
  id: 7,
  price: 200,
  offer_price: 160,
  sizes: ["S", "M", "L"],
  sync_color_images: [
    { color_name: "Blue", color_option: "Blue" },
    { color_name: "Red", color_option: "Red" },
  ],
  variation: [
    { id: "b-s", size: "S", color: { name: "Blue" }, qty: 0, price: 200, offer_price: 160 },
    { id: "b-m", size: "M", color: { name: "Blue" }, qty: 2, price: 200, offer_price: 150 },
    { id: "b-l", size: "L", color: { name: "Blue" }, qty: 40, price: 200, offer_price: 160, variant_notify_for_user: true },
    { id: "r-s", size: "S", color: { name: "Red" }, qty: 5, price: 200, offer_price: 160 },
  ],
  ...extra,
});

const view = (raw: any, colors = [color("Blue"), color("Red")]) =>
  toBuyView({
    product: raw,
    colors,
    words: ["Dress"],
    mark: { name: "Zara" },
    currency: "USD",
    counts: { likes: "3", comments: "0", shares: "1" },
    oneSize: "One Size",
    round: (value) => String(value),
  });

describe("sizesOf (the product's sizes, as the old add sheet reads them)", () => {
  it("reads the sizes field in its order", () => {
    expect(sizesOf(product()), "the sizes are not the product's own, in order").toEqual(["S", "M", "L"]);
  });

  it("writes a size's underscore as a dash", () => {
    expect(sizesOf({ sizes: ["S_M"] }), "an underscore in a size name was not turned into a dash").toEqual(["S-M"]);
  });

  it("has no sizes for a product with none", () => {
    expect(sizesOf({}), "a product with no size fields got sizes").toEqual([]);
  });
});

describe("variantOf (the variant of a colour and a size)", () => {
  it("finds the variant of the colour and the size", () => {
    expect(variantOf(product(), ["Blue"], "M")?.id, "the Blue M variant was not found").toBe("b-m");
  });

  it("finds none for a size the colour does not have", () => {
    expect(variantOf(product(), ["Red"], "L"), "a Red L variant was found, but the product has none").toBeNull();
  });

  it("reads the colour row by its key", () => {
    expect(colorRowOf(product(), ["Red"])?.color_name, "the Red colour row was not found by its key").toBe("Red");
  });
});

describe("toBuyView (the buy bar and the size sheet of a real product)", () => {
  it("gives a sold-out size a stock of 0", () => {
    expect(view(product()).sizes[0][0].stock, "Blue S has qty 0, so it must be sold out").toBe(0);
  });

  it("gives a size its variant's stock", () => {
    expect(view(product()).sizes[0][1].stock, "Blue M has qty 2, so the sheet must say last 2").toBe(2);
  });

  it("gives a size the colour does not have a stock of 0", () => {
    expect(view(product()).sizes[1][2].stock, "Red has no L variant, so Red L must be sold out").toBe(0);
  });

  it("recommends the first size in stock (S7d-10)", () => {
    expect(view(product()).recommended[0], "Blue S is sold out, so the sheet must recommend Blue M").toBe(1);
  });

  it("recommends the first size when the colour has stock in it", () => {
    expect(view(product()).recommended[1], "Red S is in stock, so the sheet must recommend Red S").toBe(0);
  });

  it("keeps the shopper's notify flag of a variant", () => {
    expect(view(product()).sizes[0][2].notified, "Blue L is marked notify_for_user, so its bell must be on").toBe(true);
  });

  it("gives a size its own price to pay", () => {
    expect(view(product()).sizes[0][1].price.now, "Blue M costs 150, so the bar must show 150").toBe("150");
  });

  it("shows the old price when it is more", () => {
    expect(view(product()).price.was, "the product's price is 200 and its offer 160, so 200 must show grey").toBe("200");
  });

  it("shows no old price when there is no discount", () => {
    expect(view(product({ offer_price: 200 })).price.was, "price and offer are both 200, so no grey price may show").toBeNull();
  });

  it("has no stock count for a product made after the order", () => {
    expect(
      view(product({ packed_after_ordering: 1 })).sizes[0][0].stock,
      "a product made after the order has no stock limit, so no size may be sold out",
    ).toBeNull();
  });

  it("sells out every size of a country-restricted product", () => {
    expect(
      view(product({ is_country_restricted: true })).sizes[0][1].stock,
      "a country-restricted product cannot be bought, so Blue M must be sold out",
    ).toBe(0);
  });

  it("gives a product with no sizes one size", () => {
    const sizes = view({ id: 1, price: 10, offer_price: 10, available_quantity: 3 }, [color("Blue")]).sizes[0];
    expect(sizes.map((size) => size.code), "a product with no sizes must show one 'One Size' tile").toEqual(["One Size"]);
  });

  it("gives a product with no variants its own stock", () => {
    const sizes = view({ id: 1, price: 10, offer_price: 10, available_quantity: 3 }, [color("Blue")]).sizes[0];
    expect(sizes[0].stock, "a product with no variants must use available_quantity (3)").toBe(3);
  });

  it("puts the colour's photos on the card", () => {
    expect(view(product()).card.colors[1].images, "the card's Red colour lost its photos").toEqual(["/photo-Red.webp"]);
  });
});
