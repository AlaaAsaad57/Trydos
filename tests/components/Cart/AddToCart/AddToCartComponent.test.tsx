// The add-to-cart sheet (components/Cart/AddToCart/AddToCartComponent.tsx).
//
// The sheet is a container: it loads the product, picks the first colour and
// size to show, works out stock, price and "notify me", and hands all of that
// to its children. The children are replaced with small stand-ins that record
// the props they got, so each test reads what the sheet decided and can call
// the callbacks the sheet gave them (pick a colour, pick a size, change the
// quantity, ask to be notified).
//
// No case reaches the network: the product loader, the qty reload, the notify
// calls and analytics are all replaced.
import { act } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AddToCartComponent from "components/Cart/AddToCart/AddToCartComponent";

import { renderWithProviders, screen, userEvent, waitFor } from "../../../render";

// Built before the module stand-ins below, which are lifted to the top of the file.
const { seen, stub } = vi.hoisted(() => {
  const seen: Record<string, any> = {};
  const stub =
    (name: string) =>
    (props: any): any => {
      seen[name] = props;
      return <div data-testid={name}>{props.children}</div>;
    };
  return { seen, stub };
});

vi.mock("components/global/BottomSheet", () => ({
  default: (props: any) => {
    seen.BottomSheet = props;
    return (
      <div data-testid="BottomSheet">
        <button onClick={props.onClose}>close sheet</button>
        {props.children}
      </div>
    );
  },
}));
vi.mock("components/Cart/AddToCart/Card", () => ({ default: stub("Card") }));
vi.mock("components/Cart/AddToCart/ColorSelect", () => ({
  default: stub("ColorSelect"),
}));
vi.mock("components/Cart/AddToCart/SizeSelect", () => ({
  default: stub("SizeSelect"),
}));
vi.mock("components/Cart/AddToCart/PricesRow", () => ({
  default: stub("PricesRow"),
}));
vi.mock("components/Cart/AddToCart/ExtraInfoArea", () => ({
  default: stub("ExtraInfoArea"),
}));
vi.mock("components/Cart/AddToCart/Button", () => ({
  default: stub("Button"),
}));
vi.mock("components/Cart/AddToCart/NotifyButton", () => ({
  default: stub("NotifyButton"),
}));

const getProductDataForAddToCart = vi.fn();
vi.mock("serverRequests", () => ({
  getProductDataForAddToCart: (...a: any[]) => getProductDataForAddToCart(...a),
}));

const home = vi.hoisted(() => ({
  AllowNotifications: vi.fn(),
  GetFireBaseSettings: vi.fn(),
}));
vi.mock("services/home", () => ({ default: home }));
const NotifyForProducts = vi.fn();
vi.mock("services/auth", () => ({
  default: {
    UserID: () => "user-1",
    NotifyForProducts: (...a: any[]) => NotifyForProducts(...a),
  },
}));

const GAevent = vi.fn();
vi.mock("utils/gtag", () => ({ GAevent: (...a: any[]) => GAevent(...a) }));
const trackOrder = vi.fn();
vi.mock("utils/orderFunnel", async (orig) => ({
  ...((await orig()) as object),
  trackOrder: (...a: any[]) => trackOrder(...a),
}));

const fetchData = vi.fn();
vi.mock("utils/fetchData", () => ({
  fetchData: (...a: any[]) => fetchData(...a),
  abortInFlightForLogout: vi.fn(),
}));

const luck = { luckActive: false, secondsLeft: 0 };
vi.mock("hooks/useLuckTimer", () => ({ useLuckTimer: () => luck }));
let redeemed = false;
vi.mock("utils/luck", async (orig) => ({
  ...((await orig()) as object),
  isRedeemed: () => redeemed,
}));

const LogError = vi.fn();
const getCart = vi.fn();
vi.mock("utils/functions", async (orig) => ({
  ...((await orig()) as object),
  getCart: (...a: any[]) => getCart(...a),
  LogError: (...a: any[]) => LogError(...a),
}));

const showErrorMessage = vi.fn();
vi.mock("components/global/AddToCartMessage", () => ({
  showErrorMessage: (...a: any[]) => showErrorMessage(...a),
  showSuccessMessage: vi.fn(),
}));
const showErrorNotification = vi.fn();
const showSuccessNotification = vi.fn();
vi.mock("store/notifications/reducer", async (orig) => ({
  ...((await orig()) as object),
  showErrorNotification: (...a: any[]) => showErrorNotification(...a),
  showSuccessNotification: (...a: any[]) => showSuccessNotification(...a),
}));

const red = { color_name: "Red", color_option: "red", images: [{ file_path: "red.jpg" }] };
const blue = { color_name: "Blue", color_option: "blue", images: [] };

/** Render the sheet. The store has no open widget unless `open` is given. */
async function renderSheet(
  product: any,
  {
    open = null as any,
    store = {} as Record<string, any>,
    color = undefined as any,
    search = "",
    language = "en" as any,
  } = {},
) {
  const r = await renderWithProviders(
    <AddToCartComponent product={product} slug={product.slug} color={color} />,
    {
      country: "sy",
      language,
      search,
      store: {
        localCart: [],
        currency: { code: "USD" },
        selected_product_for_add_to_cart: open,
        ...store,
      },
    },
  );
  // Let the product load settle.
  await act(async () => {});
  return r;
}

beforeEach(() => {
  for (const k of Object.keys(seen)) delete seen[k];
  vi.clearAllMocks();
  luck.luckActive = false;
  luck.secondsLeft = 0;
  redeemed = false;
  getProductDataForAddToCart.mockResolvedValue({});
  // The cart load does nothing by default: its answer would wipe the cart a
  // test seeded. The first test turns it on to check the answer is stored.
  getCart.mockImplementation(() => {});
});

/** The props of whichever bottom button the sheet shows. */
const bottomButton = () => seen.Button ?? seen.NotifyButton;

describe("loading the product when the sheet opens", () => {
  it("merges the loaded product and marks the open widget as done", async () => {
    const product = { id: 7, slug: "shirt", name: "Shirt", available_quantity: 50, packed_after_ordering: 0 };
    getCart.mockImplementation(({ callback }) => callback([undefined]));
    getProductDataForAddToCart.mockResolvedValue({ name: "Loaded shirt", sync_color_images: [red], colors: [{ name: "Red" }] });
    const { store } = await renderSheet(product, { open: { id: 7, slug: "shirt" }, language: "ar" });

    await waitFor(() =>
      expect(
        store.getState().selected_product_for_add_to_cart?.done,
        "the open widget was never marked done after the product loaded",
      ).toBe(true),
    );
    expect(seen.Card.name, "the sheet did not show the loaded product name").toBe("Loaded shirt");
    expect(getProductDataForAddToCart, "the product was not asked for with the locale from the path").toHaveBeenCalledWith({ language: "ar", country: "sy", slug: "shirt" });
    expect(store.getState().localCart, "an empty cart answer did not leave the cart empty").toEqual([]);
    expect(trackOrder.mock.calls[0][0], "opening the sheet was not sent to the order funnel").toBe("add_to_cart_widget_opened");
  });

  it("keeps the first colour of the loaded list first for a single-colour product", async () => {
    const product = { id: 7, slug: "shirt", singleColor: true, sync_color_images: [blue, red], colors: [{ name: "Red" }, { name: "Blue" }] };
    getProductDataForAddToCart.mockResolvedValue({ sync_color_images: [red, blue] });
    await renderSheet(product, { open: { id: 8, product_id: 7, slug: "shirt" } });

    await waitFor(() =>
      expect(
        seen.ColorSelect.colors.map((c: any) => c.color_name),
        "a single-colour product did not put the loaded first colour first",
      ).toEqual(["Red", "Blue"]),
    );
  });

  // BUG-cart-101. For a single-colour product the sheet puts "the first
  // loaded colour" in front, found with `data.sync_color_images[0]`
  // (AddToCartComponent.tsx:336-339). When the loaded answer has no colours it
  // falls back to the product's own list, but still searches it for the loaded
  // (missing) first colour, finds nothing, and puts `undefined` at the front.
  // The colour filter at line 750-755 then reads `undefined.color_option` and
  // the whole sheet crashes.
  it("BUG-cart-101: a single-colour product whose loaded answer has no colours shows its own colours instead of crashing", async () => {
    const product = { id: 7, slug: "shirt", singleColor: true, sync_color_images: [blue], colors: [{ name: "Blue" }] };
    getProductDataForAddToCart.mockResolvedValue({});
    await renderSheet(product, { open: { id: 7, slug: "shirt" } });
    await waitFor(() =>
      expect(seen.ColorSelect.colors.map((c: any) => c.color_name), "the product's own colours were lost").toEqual(["Blue"]),
    );
  });

  it("ignores the answer when a different widget is open", async () => {
    const product = { id: 7, slug: "shirt", name: "Shirt" };
    getProductDataForAddToCart.mockResolvedValue({ name: "Other" });
    await renderSheet(product, { open: { id: 9, slug: "other" } });
    expect(seen.Card.name, "the sheet took a product answer for a widget that is not open").toBe("Shirt");
  });

  it("logs a failed product load and stops the loading state", async () => {
    getProductDataForAddToCart.mockRejectedValue(new Error("boom"));
    await renderSheet({ id: 7, slug: "shirt" }, { open: { id: 7, slug: "shirt" } });
    expect(LogError.mock.calls[0][0].scenario, "a failed product load was not logged").toBe(
      "getAllProductData for add to cart - add to cart widget",
    );
    expect(seen.Button.initialLoading, "the sheet stayed loading after the product load failed").toBe(false);
  });

  it("logs when the whole start-up step throws", async () => {
    getProductDataForAddToCart.mockResolvedValue({});
    const product = { id: 7, slug: "shirt" };
    // `setSelectedProductForCart` throwing reaches the outer catch of initializeUI.
    await renderSheet(product, {
      open: { id: 7, slug: "shirt" },
      store: {
        setSelectedProductForCart: vi.fn((p: any) => {
          if (p?.done) throw new Error("store broke");
        }),
      },
    });
    await waitFor(() =>
      expect(LogError.mock.calls.map((c) => c[0].scenario), "a thrown start-up step was not logged").toContain(
        "get Initial Data for add to cart - add to cart widget",
      ),
    );
  });

  it("loads again when the product asks for an update", async () => {
    await renderSheet({ id: 7, slug: "shirt", shouldUpdate: 1 });
    expect(getProductDataForAddToCart, "a product with shouldUpdate was not loaded again").toHaveBeenCalledTimes(2);
  });

  it("hides the page footer while open and shows it again when closed", async () => {
    const footer = document.createElement("div");
    footer.className = "alternate-product-details-footer";
    document.body.appendChild(footer);
    const { unmount } = await renderSheet({ id: 7, slug: "shirt" });
    expect(footer.style.display, "the product page footer was not hidden under the sheet").toBe("none");
    unmount();
    expect(footer.style.display, "the product page footer did not come back").toBe("flex");
    footer.remove();
  });

  it("clears the open widget when the sheet is closed", async () => {
    const { store } = await renderSheet({ id: 7, slug: "shirt" }, { open: { id: 7, slug: "other" } });
    await userEvent.click(screen.getByText("close sheet"));
    expect(store.getState().selected_product_for_add_to_cart, "closing the sheet left the widget open").toBeNull();
  });
});

describe("the colour and size picked first", () => {
  it("uses the size filter for a product without variations", async () => {
    await renderSheet({ id: 1, slug: "a", sizes: ["S", "M_L"], sizes_filters: ["XL", "m-l"] });
    expect(seen.Button.selectedSize, "the size filter was not used as the first size").toBe("M-L");
  });

  it("uses the size from the address when no filter matches", async () => {
    await renderSheet(
      { id: 1, slug: "a", choice_options: [{ options: ["S", "M"] }], sizes_filters: ["XL"], sync_color_images: [red, blue], colors: [] },
      { search: "size=m&color=Blue" },
    );
    expect(seen.Button.selectedSize, "the size from the address was not picked").toBe("M");
    expect(seen.Button.selectedColor.color_name, "the colour from the address was not picked").toBe("Blue");
  });

  it("takes the colour prop first and the first size otherwise", async () => {
    await renderSheet({ id: 1, slug: "a", sizes: ["S"], sync_color_images: [red, blue], colors: [] }, { color: "blue" });
    expect(seen.Button.selectedColor.color_name, "the colour prop was not picked").toBe("Blue");
    expect(seen.Button.selectedSize, "the first size was not picked").toBe("S");
  });

  it("takes the first colour that has stock, and the first size of that colour in stock", async () => {
    const variation = [
      { id: 11, color: { name: "Red" }, size: "S", qty: 0 },
      { id: 12, color: { name: "Blue" }, size: "S", qty: 0 },
      { id: 13, color: { name: "Blue" }, size: "M", qty: 2 },
    ];
    await renderSheet({ id: 1, slug: "a", variation, sync_color_images: [red, blue, { color_option: "red" }], colors: [] });
    expect(seen.Button.selectedColor.color_name, "the sheet did not skip the colour with no stock").toBe("Blue");
    expect(seen.Button.selectedSize, "the sheet did not pick the size that has stock").toBe("M");
  });

  it("falls back to the first colour when nothing has stock", async () => {
    const variation = [{ id: 11, color: { name: "Red" }, size: "S", qty: 0 }];
    await renderSheet({ id: 1, slug: "a", variation, sync_color_images: [red], colors: [] });
    expect(bottomButton().selectedColor.color_name, "no colour was picked when nothing has stock").toBe("Red");
    expect(bottomButton().selectedSize, "no size was picked when nothing has stock").toBe("S");
  });

  it("uses a size filter that has stock", async () => {
    const variation = [
      { id: 11, size: "S", qty: 1 },
      { id: 12, size: "M", qty: 1 },
    ];
    await renderSheet({ id: 1, slug: "a", variation, sizes_filters: ["XXL", "m"] });
    expect(seen.Button.selectedSize, "the size filter with stock was not used").toBe("M");
  });

  it("uses the first size in stock when no filter size has stock", async () => {
    const variation = [
      { id: 11, size: "S", qty: 0 },
      { id: 12, size: "M", qty: 1 },
    ];
    await renderSheet({ id: 1, slug: "a", variation, sizes_filters: ["s"] });
    expect(seen.Button.selectedSize, "the in-stock size was not used").toBe("M");
  });

  it("uses the first size when no filter size and no size has stock", async () => {
    const variation = [{ id: 11, size: "S", qty: 0 }];
    await renderSheet({ id: 1, slug: "a", variation, sizes_filters: ["s"] });
    expect(bottomButton().selectedSize, "the first size was not used").toBe("S");
  });

  it("keeps the size from the address when it has stock", async () => {
    const variation = [
      { id: 11, size: "S", qty: 1 },
      { id: 12, size: "M", qty: 1 },
    ];
    await renderSheet({ id: 1, slug: "a", variation }, { search: "size=m" });
    expect(seen.Button.selectedSize, "the in-stock size from the address was not kept").toBe("M");
  });

  it("moves off the address size when it is out of stock", async () => {
    const variation = [
      { id: 11, size: "S", qty: 1 },
      { id: 12, size: "M", qty: 0 },
    ];
    await renderSheet({ id: 1, slug: "a", variation }, { search: "size=m" });
    expect(seen.Button.selectedSize, "an out-of-stock size from the address was kept").toBe("S");
  });

  it("keeps the address size when nothing has stock", async () => {
    const variation = [
      { id: 11, size: "S", qty: 0 },
      { id: 12, size: "M", qty: 0 },
    ];
    await renderSheet({ id: 1, slug: "a", variation }, { search: "size=m" });
    expect(bottomButton().selectedSize, "the address size was dropped when nothing has stock").toBe("M");
  });

  it("uses the first size when nothing has stock and no size was asked for", async () => {
    const variation = [{ id: 11, size: "S", qty: 0 }, { id: 12, size: "M", qty: 0 }];
    await renderSheet({ id: 1, slug: "a", variation });
    expect(bottomButton().selectedSize, "the first size was not used").toBe("S");
  });
});

describe("stock, price and the max quantity", () => {
  it("finds the cart row of a product without variants and stops at the max quantity", async () => {
    await renderSheet(
      { id: 1, slug: "a", max_allowed_qty: 2, available_quantity: 5, packed_after_ordering: 0 },
      { store: { localCart: [{ id: 1, quantity: 2, is_luck: true, offer_price: 9 }] } },
    );
    expect(seen.Button.reachedMaxQty(), "two in the bag of a max of two did not count as the max").toBe(true);
    expect(seen.Card.offer_price, "a luck row in the cart did not show its own price").toBe(9);
    expect(screen.getByText(/Last/).textContent, "the last-items warning did not show the stock").toContain("5");
  });

  it("does not stop at a max of zero, or with nothing in the cart", async () => {
    const r = await renderSheet({ id: 1, slug: "a", max_allowed_qty: 0 }, { store: { localCart: [{ id: 1, quantity: 9 }] } });
    expect(seen.Button.reachedMaxQty(), "a max of zero was treated as a real limit").toBe(false);
    r.unmount();
    await renderSheet({ id: 1, slug: "a", max_allowed_qty: 2 });
    expect(seen.Button.reachedMaxQty(), "an item not in the cart was treated as at the max").toBe(false);
  });

  it("finds the cart row of the selected variant", async () => {
    const variation = [{ product_variation_id: 11, color: { name: "Red" }, size: "S", qty: 3, offer_price: 20 }];
    await renderSheet(
      { id: 1, slug: "a", variation, sync_color_images: [red], colors: [{ name: "Red" }], max_allowed_qty: 1 },
      { store: { localCart: [{ id: 99, product_variation_id: 11, quantity: 1 }] } },
    );
    expect(seen.Button.reachedMaxQty(), "the selected variant's cart row was not found").toBe(true);
    expect(seen.Button.selectedVariant.offer_price, "the selected variant price was not passed on").toBe(20);
    expect(seen.SizeSelect.sizeQty("S"), "the stock of a size was not read from its variant").toBe(3);
  });

  it("finds no cart row when the product has variants but none matches", async () => {
    const variation = [{ color: { name: "Red" }, qty: 3 }];
    await renderSheet({ id: 1, slug: "a", variation, sync_color_images: [red], colors: [], max_allowed_qty: 1 }, { store: { localCart: [{ id: 1, quantity: 5 }] } });
    expect(seen.Button.reachedMaxQty(), "a cart row was matched by product id on a product with variants").toBe(false);
  });

  it("matches a variant by colour only and by size only", async () => {
    const r = await renderSheet({
      id: 1,
      slug: "a",
      variation: [{ id: 21, color: { name: "Red" }, qty: 2, offer_price: 30 }],
      sync_color_images: [red],
      colors: [],
    });
    expect(seen.Button.selectedVariant.id, "a variant was not matched by colour alone").toBe(21);
    r.unmount();
    await renderSheet({ id: 1, slug: "a", variation: [{ id: 22, size: "S", qty: 2 }] });
    expect(seen.Button.selectedVariant.id, "a variant was not matched by size alone").toBe(22);
  });

  it("takes the first variant when there is no colour and no size", async () => {
    await renderSheet({ id: 1, slug: "a", variation: [{ id: 23, qty: 2 }] });
    expect(seen.Button.selectedVariant.id, "the only variant was not used").toBe(23);
  });

  it("reads stock and notify state from the product when there are no variants", async () => {
    await renderSheet({ id: 1, slug: "a", sizes: ["S"], available_quantity: 4, is_product_notify_for_user: true });
    expect(seen.SizeSelect.sizeQty("S"), "stock was not read from the product").toBe(4);
    expect(seen.SizeSelect.isSizeNotified("S"), "notify state was not read from the product").toBe(true);
  });

  it("sends the no-variant fallback while a size is still missing", async () => {
    await renderSheet({ id: 1, slug: "a", sizes: ["S"], price: 50, available_quantity: 4 });
    await act(async () => seen.SizeSelect.setSelectedSize(null));
    expect(seen.Button.selectedVariant.product_variation_id, "a variant was chosen with no size picked").toBeNull();
    expect(seen.Button.selectedVariant.price, "the product price was not used with no size picked").toBe(50);
  });

  it("shows the luck price while the luck window runs", async () => {
    luck.luckActive = true;
    await renderSheet({ id: 1, slug: "a", is_luck: true, luck_price: 5, offer_price: 10 });
    expect(seen.Card.luck_price, "the running luck price was not shown").toBe(5);
    expect(seen.PricesRow.is_luck, "an unredeemed luck product lost its luck flag").toBe(true);
  });

  it("drops the luck flag once the luck was redeemed", async () => {
    redeemed = true;
    await renderSheet({ id: 1, slug: "a", is_luck: true });
    expect(seen.PricesRow.is_luck, "a redeemed luck product still showed luck").toBe(false);
  });
});

describe("picking a colour or size", () => {
  const variation = [
    { id: 11, color: { name: "Red" }, size: "S", qty: 1, offer_price: 80, luck_price: 60 },
    { id: 12, color: { name: "Blue" }, size: "S", qty: 1, offer_price: 90 },
  ];
  const product = { id: 1, slug: "a", offer_price: 100, variation, sync_color_images: [red, blue], colors: [{ name: "Red" }, { option: "blue" }] };

  it("reports the colour and size changes to analytics", async () => {
    await renderSheet(product);
    await act(async () => seen.ColorSelect.setSelectedColor(blue));
    await act(async () => seen.SizeSelect.setSelectedSize({ option: "S" }));
    expect(GAevent.mock.calls.map((c) => c[0].params.selected_color), "the colour change was not reported with the colour").toEqual(["blue", "blue"]);
    expect(seen.Button.colorChanged, "the colour change was not passed to the button").toBe(true);
    expect(seen.Button.sizeChanged, "the size change was not passed to the button").toBe(true);
  });

  it("works out the discount of each colour", async () => {
    await renderSheet(product);
    expect(seen.ColorSelect.IsColorHasDiscount(null), "no colour gave a discount").toBe(false);
    expect(seen.ColorSelect.IsColorHasDiscount(red), "the red discount was wrong").toBe(20);
    expect(seen.ColorSelect.IsColorHasDiscount({ color_name: "Green" }), "a colour with no variant gave a discount").toBe(false);
  });

  it("works out the luck discount while luck runs", async () => {
    luck.luckActive = true;
    await renderSheet({ ...product, luck_price: 100, sizes: undefined, variation: variation.map(({ size, ...v }) => v) });
    expect(seen.ColorSelect.IsColorHasDiscount(red), "the luck discount was wrong").toBe(40);
  });

  it("gives no discount while a size is still missing", async () => {
    await renderSheet(product);
    await act(async () => seen.SizeSelect.setSelectedSize(null));
    expect(seen.ColorSelect.IsColorHasDiscount(red), "a discount was given with no size picked").toBe(false);
  });

  it("reports the stock of each colour", async () => {
    const r = await renderSheet(product);
    expect(seen.ColorSelect.isQtyIsLast(null), "no colour reported stock").toBe(false);
    expect(seen.ColorSelect.isQtyIsLast(blue).id, "the blue variant was not found").toBe(12);
    r.unmount();
    await renderSheet({ id: 1, slug: "a", available_quantity: 3, offer_price: 4, sync_color_images: [red], colors: [{ name: "Red" }] });
    expect(seen.ColorSelect.isQtyIsLast(red), "stock of a product without variants was wrong").toEqual({ qty: 3, offer_price: 4 });
  });

  it("reports no stock warning for a collect-after-order product", async () => {
    await renderSheet({ ...product, packed_after_ordering: 1 });
    expect(seen.ColorSelect.isQtyIsLast(red), "a collect-after-order product reported stock").toBe(false);
  });
});

describe("changing the quantity from the button", () => {
  const variation = [
    { id: 11, size: "S", qty: 5 },
    { id: 12, size: "M", qty: 5 },
  ];

  it("counts stock down and up for the variant", async () => {
    await renderSheet({ id: 1, slug: "a", variation, available_quantity: 10, packed_after_ordering: 0 });
    await act(() => seen.Button.updateQuantity(true, 11, "add"));
    expect(seen.SizeSelect.sizeQty("S"), "adding one did not take one off the stock").toBe(4);
    expect(seen.SizeSelect.sizeQty("M"), "another variant's stock changed").toBe(5);
    await act(() => seen.Button.updateQuantity(true, 11, "decrease"));
    expect(seen.SizeSelect.sizeQty("S"), "removing one did not put one back").toBe(5);
  });

  it("reloads stock from the core backend after a failure", async () => {
    fetchData.mockResolvedValue({ data: { is_luck: false, variations: [{ product_variation_id: 11, size: "S", qty: 1 }] } });
    await renderSheet({ id: 1, slug: "a", variation: [{ product_variation_id: 11, size: "S", qty: 5, notify_for_user: true }], packed_after_ordering: 0 });
    await act(() => seen.Button.updateQuantity(false));
    expect(fetchData.mock.calls[0][0].url, "the stock reload asked the wrong address").toBe("/web/product/qtyPriceDetails/a?need_decode=true");
    expect(seen.SizeSelect.sizeQty("S"), "the reloaded stock was not used").toBe(1);
  });

  it("does nothing for a collect-after-order product", async () => {
    await renderSheet({ id: 1, slug: "a", variation, packed_after_ordering: 1 });
    await act(() => seen.Button.updateQuantity(true, 11, "add"));
    expect(seen.SizeSelect.sizeQty("S"), "a collect-after-order product changed its stock").toBe(5);
  });

  it("does not use a stock reload that lands after the sheet closed", async () => {
    let resolve: (v: any) => void = () => {};
    fetchData.mockReturnValue(new Promise((r) => (resolve = r)));
    const { unmount } = await renderSheet({ id: 1, slug: "a", variation, packed_after_ordering: 0 });
    const call = seen.Button.updateQuantity(false);
    unmount();
    resolve({ data: {} });
    await expect(call, "a late stock reload threw").resolves.toBeUndefined();
  });
});

describe("the notify-me button", () => {
  it("shows notify for a product that is out of stock and turns notify on", async () => {
    home.AllowNotifications.mockResolvedValue(undefined);
    await renderSheet({ id: 1, slug: "a", available_quantity: 0, is_product_notify_for_user: false });
    expect(screen.getByTestId("NotifyButton"), "an out-of-stock product did not offer notify").toBeInTheDocument();
    await act(async () => seen.NotifyButton.notifyAction());
    await waitFor(() => expect(home.GetFireBaseSettings, "push settings were not refreshed").toHaveBeenCalled());
    expect(NotifyForProducts, "the notify request was not sent for the product").toHaveBeenCalledWith({ id: 1, variant: undefined });
    expect(seen.NotifyButton.isNotified, "the product was not marked as notified").toBe(true);
    expect(GAevent.mock.calls[0][0].params.type_notification, "turning notify on was not reported").toBe("product_availablity");
  });

  it("marks only the selected variant as notified", async () => {
    home.AllowNotifications.mockResolvedValue(undefined);
    const variation = [{ id: 11, size: "S", qty: 0 }, { id: 12, size: "M", qty: 0 }];
    await renderSheet({ id: 1, slug: "a", variation, category: { name: "Tops", id: 3 } });
    await act(async () => seen.NotifyButton.notifyAction());
    await waitFor(() => expect(seen.NotifyButton.isNotified, "the selected variant was not marked notified").toBe(true));
    expect(seen.SizeSelect.isSizeNotified("M"), "another variant was marked notified").toBeUndefined();
  });

  it("says so when notify is already on", async () => {
    home.AllowNotifications.mockResolvedValue(undefined);
    await renderSheet({ id: 1, slug: "a", available_quantity: 0, is_product_notify_for_user: true });
    await act(async () => seen.NotifyButton.notifyAction());
    await waitFor(() =>
      expect(showSuccessNotification.mock.calls[0]?.[0], "the already-notified message was not shown").toBe(
        "You will be notified for this product already",
      ),
    );
  });

  it("shows the error when notifications cannot be turned on", async () => {
    home.AllowNotifications.mockRejectedValue(new Error("denied"));
    await renderSheet({ id: 1, slug: "a", available_quantity: 0 });
    await act(async () => seen.NotifyButton.notifyAction());
    await waitFor(() => expect(showErrorMessage, "the notify error was not shown").toHaveBeenCalledWith("denied"));
    expect(showErrorNotification, "the notify error toast was not shown").toHaveBeenCalledWith("denied");
  });

  it("shows the default error when the failure has no message", async () => {
    home.AllowNotifications.mockRejectedValue(undefined);
    await renderSheet({ id: 1, slug: "a", available_quantity: 0 });
    await act(async () => seen.NotifyButton.notifyAction());
    await waitFor(() =>
      expect(showErrorMessage, "the default notify error was not shown").toHaveBeenCalledWith(
        "Notification Is Not Enabled! please Allow Notification Access",
      ),
    );
  });

  it("passes quantity changes on from the notify button", async () => {
    const variation = [{ id: 11, size: "S", qty: 0 }];
    await renderSheet({ id: 1, slug: "a", is_active: false, variation, packed_after_ordering: 0 });
    await act(() => seen.NotifyButton.updateQuantity(true, 11, "decrease"));
    expect(seen.SizeSelect.sizeQty("S"), "a change from the notify button did not reach the stock").toBe(1);
  });

  it("offers notify for a restricted product and not for collect-after-order", async () => {
    const r = await renderSheet({ id: 1, slug: "a", is_country_restricted: true, available_quantity: 5 });
    expect(screen.queryByTestId("NotifyButton"), "a restricted product did not offer notify").toBeInTheDocument();
    r.unmount();
    await renderSheet({ id: 1, slug: "a", packed_after_ordering: 1, available_quantity: 0 });
    expect(screen.queryByTestId("Button"), "a collect-after-order product did not offer add to bag").toBeInTheDocument();
  });

  it("offers notify when the selected variant is out of stock", async () => {
    const variation = [{ id: 11, size: "S", qty: 0 }, { id: 12, size: "M", qty: 3 }];
    await renderSheet({ id: 1, slug: "a", variation }, { search: "size=s" });
    // The sheet moves off S because it has no stock; pick it again by hand.
    await act(async () => seen.SizeSelect.setSelectedSize("S"));
    expect(screen.queryByTestId("NotifyButton"), "an out-of-stock variant did not offer notify").toBeInTheDocument();
  });
});
