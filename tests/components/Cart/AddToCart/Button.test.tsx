// Taking the last one of an item out of the bag, from the add-to-cart button.
//
// `RemoveFromCart` used to crash on a refusal, so this handler jumped straight
// to its `catch`. Now the service reports the refusal instead of throwing, and
// the handler has to read that answer. If it does not, everything after the
// call runs on a removal that never happened: analytics, the order funnel, and
// the words "Removed From Your Bag" over an item still in the bag.
//
// The cart service is replaced rather than answered. This file is about what
// the button does with the answer, not about the request.
import { beforeEach, describe, expect, it, vi } from "vitest";

import AddToCartButton from "components/Cart/AddToCart/Button";
import { useNotificationStore } from "store/notifications/reducer";
import { getCart, LogError } from "utils/functions";

import {
  act,
  fireEvent,
  renderWithProviders,
  screen,
  userEvent,
} from "../../../render";

const RemoveFromCart = vi.fn();
const UpdateCart = vi.fn();
const AddToCart = vi.fn();
const GAevent = vi.fn();
const trackOrder = vi.fn();

vi.mock("services/cart", () => ({
  default: {
    RemoveFromCart: (...args: any[]) => RemoveFromCart(...args),
    UpdateCart: (...args: any[]) => UpdateCart(...args),
    AddToCart: (...args: any[]) => AddToCart(...args),
  },
}));

vi.mock("utils/gtag", () => ({
  GAevent: (...args: any[]) => GAevent(...args),
}));

vi.mock("utils/orderFunnel", async (importOriginal) => ({
  ...((await importOriginal()) as object),
  trackOrder: (...args: any[]) => trackOrder(...args),
}));

vi.mock("utils/functions", async (importOriginal) => ({
  ...((await importOriginal()) as object),
  getCart: vi.fn().mockResolvedValue({ cart: [] }),
  LogError: vi.fn(),
}));

/** One product, no variants, so the button reads the cart row by product id. */
const product = { id: 101, name: "Blue shirt", slug: "blue-shirt", price: 100 };

/** Render the button with one of this item in the bag, then tap the minus. */
async function tapTheMinus() {
  await renderWithProviders(
    <AddToCartButton
      colors={[]}
      sizes={[]}
      selectedSize={null}
      selectedColor={null}
      selectedVariant={{ offer_price: 80 }}
      fullQty={1}
      updateQuantity={vi.fn()}
      loading={false}
      setLoading={() => {}}
      id={product.id}
      product={product}
      reachedMaxQty={() => false}
      initialLoading={false}
      colorChanged={false}
      sizeChanged={false}
    />,
    {
      country: "sy",
      path: "/product/blue-shirt",
      store: {
        localCart: [{ id: 101, item_id: "cart-99", quantity: 1 }],
        currency: { symbol: "$", exchange_rate: 1, decimal_digits: 2 },
      },
    },
  );

  await userEvent.click(document.querySelector(".minuse-qty-icon")!);
}

describe("taking the last one out of the bag from the add-to-cart button", () => {
  beforeEach(() => {
    GAevent.mockClear();
    trackOrder.mockClear();
  });

  it("does not tell analytics about a removal the core backend refused", async () => {
    RemoveFromCart.mockResolvedValue(false);

    await tapTheMinus();

    expect(
      GAevent.mock.calls.map(([call]: any) => call?.action),
      "the item is still in the bag because the core backend refused to remove it, and analytics was told it was removed",
    ).toEqual([]);
  });

  it("does not tell the order funnel about a removal the core backend refused", async () => {
    RemoveFromCart.mockResolvedValue(false);

    await tapTheMinus();

    expect(
      trackOrder.mock.calls.map(([event]: any) => event),
      "the core backend refused to remove the item and the order funnel counted it as removed",
    ).toEqual([]);
  });

  it("tells analytics and the order funnel once the item has really gone", async () => {
    RemoveFromCart.mockResolvedValue(true);

    await tapTheMinus();

    expect(
      trackOrder.mock.calls.map(([event]: any) => event),
      "the core backend removed the item and the order funnel was never told",
    ).toEqual(["cart_item_removed"]);
  });
});

/** Render the button with sensible defaults; any prop can be replaced. */
async function renderButton(props: Record<string, any> = {}, store: Record<string, any> = {}) {
  const all = {
    colors: [],
    sizes: [],
    selectedSize: null,
    selectedColor: null,
    selectedVariant: { offer_price: 80 },
    fullQty: 0,
    updateQuantity: vi.fn(),
    loading: false,
    setLoading: vi.fn(),
    id: product.id,
    product,
    reachedMaxQty: () => false,
    initialLoading: false,
    colorChanged: false,
    sizeChanged: false,
    ...props,
  };
  const r = await renderWithProviders(<AddToCartButton {...(all as any)} />, {
    country: "sy",
    store: { localCart: [], currency: { code: "USD" }, ...store },
  });
  return { ...r, updateQuantity: all.updateQuantity, setLoading: all.setLoading };
}

const tapAdd = async () => {
  await act(async () => {
    fireEvent.click(document.querySelector("#add-to-cart-button-container")!);
  });
};

describe("adding to the bag from the add-to-cart button", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    GAevent.mockClear();
    trackOrder.mockClear();
    AddToCart.mockReset();
    UpdateCart.mockReset();
    vi.mocked(LogError).mockClear();
    vi.mocked(getCart).mockClear();
    useNotificationStore.setState({ notifications: [] });
    return () => vi.useRealTimers();
  });

  it("adds a new item with the picked colour, size and image", async () => {
    AddToCart.mockResolvedValue(true);
    const shirt = {
      ...product,
      brand: { name: "B", id: 2 },
      categories: [{ name: "Tops", id: 3 }],
      colors: [{ option: "x", name: "Red", color: "#f00" }],
    };
    const { updateQuantity } = await renderButton({
      product: shirt,
      colors: [{}],
      sizes: [{}],
      selectedColor: { color_name: "Red", images: [{ file_path: "red.jpg" }] },
      selectedSize: { option: "M" },
      selectedVariant: { offer_price: 80, price: 100 },
      colorChanged: true,
    });

    await tapAdd();

    expect(AddToCart.mock.calls[0][0], "the add request did not carry the picked colour, size and image").toMatchObject({
      product_id: 101,
      product_variation_id: null,
      color: "#f00",
      choice_1: "M",
      image: "red.jpg",
      offer_price: 80,
    });
    expect(trackOrder.mock.calls.map(([e]: any) => e), "the tap and the add were not both sent to the order funnel").toEqual([
      "add_to_cart_buy_clicked",
      "order_add_to_cart",
    ]);
    expect(trackOrder.mock.calls[1][1], "the add did not report the colour change and the discount").toMatchObject({
      color_changed: true,
      has_discount: true,
      selected_color: "Red",
      selected_size: "M",
    });
    expect(GAevent.mock.calls[0][0].params.items[0].quantity, "analytics did not get one added item").toBe(1);
    expect(updateQuantity, "the stock was not counted down after the add").toHaveBeenCalledWith(true, null, "add");
    expect(getCart, "the bag was not reloaded after the add").toHaveBeenCalled();

    const bag = document.querySelector(".bagIcon")!;
    expect(bag.classList.contains("animated"), "the bag icon did not animate").toBe(true);
    expect(document.querySelector<HTMLElement>("#text-request-response")!.innerText, "the added message was not shown").toBe("Added To Your Bag");
    await act(async () => {
      vi.advanceTimersByTime(2000);
    });
    expect(bag.classList.contains("animated"), "the bag icon kept animating").toBe(false);
    expect(document.querySelector<HTMLElement>("#text-request-response")!.innerText, "the added message did not clear").toBe("");
  });

  it("adds the chosen variant of a luck product at the luck price and ends the luck", async () => {
    AddToCart.mockResolvedValue(true);
    const expireLuck = vi.fn();
    await renderButton(
      {
        product: { ...product, is_luck: true, variation: [{}], images: ["p.jpg"] },
        selectedVariant: { product_variation_id: 55, offer_price: 80, luck_price: 20 },
        selectedSize: "L",
      },
      { expireLuck },
    );

    await tapAdd();

    expect(AddToCart.mock.calls[0][0], "a luck product was not added at the luck price for its variant").toMatchObject({
      product_variation_id: 55,
      offer_price: 20,
      choice_1: "L",
      image: "p.jpg",
    });
    expect(expireLuck, "adding a luck product did not end its luck").toHaveBeenCalledWith(101);
  });

  it("logs and reloads the stock when the core backend refuses the add", async () => {
    AddToCart.mockResolvedValue(false);
    const { updateQuantity, setLoading } = await renderButton();

    await tapAdd();

    expect(vi.mocked(LogError).mock.calls[0][0].scenario, "a refused add was not logged").toBe(
      "click handler for add to cart buttons - add to cart widget",
    );
    expect(updateQuantity, "the stock was not reloaded after a refused add").toHaveBeenCalledWith(false);
    expect(setLoading, "the button stayed loading after a refused add").toHaveBeenLastCalledWith(false);
  });

  it("adds one more of an item already in the bag", async () => {
    UpdateCart.mockResolvedValue(true);
    const { updateQuantity } = await renderButton(
      { fullQty: 1 },
      { localCart: [{ id: 101, item_id: "cart-1", quantity: 2, product_variation_id: 9 }] },
    );
    expect(screen.getByText("X 1"), "the count in the bag was not shown").toBeInTheDocument();
    expect(screen.getByText("Add More To Your Bag"), "the add-more label was not shown").toBeInTheDocument();

    await tapAdd();

    expect(UpdateCart.mock.calls[0][0], "the bag row was not raised by one").toMatchObject({ cart_id: "cart-1", qty: 3 });
    expect(trackOrder.mock.calls.map(([e]: any) => e), "adding one more was not sent to the order funnel").toContain("order_add_to_cart");
    expect(updateQuantity, "the stock was not counted down").toHaveBeenCalledWith(true, 9, "add");
  });

  it("adds one more of the selected variant found by its variation id", async () => {
    UpdateCart.mockResolvedValue(true);
    await renderButton(
      { product: { ...product, variation: [{}] }, selectedVariant: { id: 9 } },
      { localCart: [{ id: 101, item_id: "cart-1", quantity: 1, variation_id: 9 }] },
    );
    await tapAdd();
    expect(UpdateCart.mock.calls[0][0].cart_id, "the variant row was not found by its variation id").toBe("cart-1");
  });

  // The showed_price contract: /cart/update carries the price of ONE piece the
  // sheet shows, and the core backend saves it in place of the old value.
  it("sends the price of one piece the sheet shows when adding one more", async () => {
    UpdateCart.mockResolvedValue(true);
    await renderButton(
      { selectedVariant: { offer_price: 80, price: 100 } },
      { localCart: [{ id: 101, item_id: "cart-1", quantity: 2 }] },
    );
    await tapAdd();
    expect(
      UpdateCart.mock.calls[0]?.[0]?.showed_price,
      "adding one more from the sheet did not send the shown price of one piece (offer price 80) to /cart/update",
    ).toBe(80);
  });

  it("sends the luck line's own price when adding one more to a luck line", async () => {
    UpdateCart.mockResolvedValue(true);
    await renderButton(
      { selectedVariant: { offer_price: 80, price: 100 } },
      { localCart: [{ id: 101, item_id: "cart-1", quantity: 2, is_luck: true, offer_price: 35 }] },
    );
    await tapAdd();
    expect(
      UpdateCart.mock.calls[0]?.[0]?.showed_price,
      "the sheet shows a luck line's own offer price (35), and adding one more sent another price to /cart/update",
    ).toBe(35);
  });

  it("logs when the core backend refuses one more", async () => {
    UpdateCart.mockResolvedValue(false);
    const { updateQuantity } = await renderButton({}, { localCart: [{ id: 101, item_id: "cart-1", quantity: 2 }] });
    await tapAdd();
    expect(vi.mocked(LogError), "a refused raise was not logged").toHaveBeenCalled();
    expect(updateQuantity, "the stock was not reloaded after a refused raise").toHaveBeenCalledWith(false);
  });

  it("does nothing while a request is running", async () => {
    await renderButton({ loading: true });
    await tapAdd();
    expect(AddToCart, "a second add was sent while one was running").not.toHaveBeenCalled();
  });

  it("shows a spinner while the product loads", async () => {
    await renderButton({ initialLoading: true });
    expect(screen.queryByText("Add To Bag"), "the label showed before the product loaded").toBeNull();
  });
});

describe("the add-to-cart button refuses a tap it cannot take", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    AddToCart.mockReset();
    useNotificationStore.setState({ notifications: [] });
    return () => vi.useRealTimers();
  });

  it("says the max quantity is reached", async () => {
    await renderButton({ reachedMaxQty: () => true });
    expect(
      document.querySelector("#button-cart-text")!.textContent,
      "the button did not say the max was reached",
    ).toBe("Max Allowed Quantity Reached");
    await tapAdd();
    expect(
      useNotificationStore.getState().notifications.map((n) => n.message),
      "tapping at the max did not show the max message",
    ).toEqual(["Max Allowed Quantity Reached"]);
    expect(AddToCart, "an item was added past the max").not.toHaveBeenCalled();
  });

  it("shakes the colour picker when no colour is picked", async () => {
    const box = document.createElement("div");
    box.id = "color-select";
    box.scrollIntoView = vi.fn();
    document.body.appendChild(box);
    await renderButton({ colors: [{}] });
    await tapAdd();
    expect(box.classList.contains("shake-anim"), "the colour picker did not shake").toBe(true);
    await act(async () => {
      vi.advanceTimersByTime(1300);
    });
    expect(box.classList.contains("shake-anim"), "the colour picker kept shaking").toBe(false);
    expect(AddToCart, "an item was added with no colour").not.toHaveBeenCalled();
    box.remove();
  });

  it("does not add when no size is picked", async () => {
    await renderButton({ sizes: [{}] });
    await tapAdd();
    expect(AddToCart, "an item was added with no size").not.toHaveBeenCalled();
  });
});

describe("taking one out of the bag when more than one is in it", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    UpdateCart.mockReset();
    AddToCart.mockReset();
    vi.mocked(LogError).mockClear();
    return () => vi.useRealTimers();
  });

  const tapMinus = async () => {
    await act(async () => {
      fireEvent.click(document.querySelector(".minuse-qty-icon")!);
    });
  };

  it("lowers the bag row by one", async () => {
    UpdateCart.mockResolvedValue(true);
    const { updateQuantity } = await renderButton(
      { product: { ...product, variation: [{}] }, selectedVariant: { id: 404 } },
      { localCart: [{ id: 101, item_id: "cart-1", quantity: 3, product_variation_id: 7 }] },
    );
    await tapMinus();
    expect(UpdateCart.mock.calls[0][0], "the bag row was not lowered by one").toMatchObject({ cart_id: "cart-1", qty: 2 });
    expect(updateQuantity, "the stock was not counted back up").toHaveBeenCalledWith(true, 7, "decrease");
    expect(AddToCart, "tapping the minus also added the item").not.toHaveBeenCalled();
  });

  it("sends the price of one piece the sheet shows when lowering the row", async () => {
    UpdateCart.mockResolvedValue(true);
    await renderButton(
      { selectedVariant: { offer_price: 80, price: 100 } },
      { localCart: [{ id: 101, item_id: "cart-1", quantity: 3 }] },
    );
    await tapMinus();
    expect(
      UpdateCart.mock.calls[0]?.[0]?.showed_price,
      "lowering the row from the sheet did not send the shown price of one piece (offer price 80) to /cart/update",
    ).toBe(80);
  });

  it("logs when the core backend refuses to lower the row", async () => {
    UpdateCart.mockResolvedValue(false);
    const { updateQuantity } = await renderButton({}, { localCart: [{ id: 101, item_id: "cart-1", quantity: 3 }] });
    await tapMinus();
    expect(vi.mocked(LogError).mock.calls[0][0].scenario, "a refused lower was not logged").toBe("decrase qty button - add to cart widget");
    expect(updateQuantity, "the stock was not reloaded after a refused lower").toHaveBeenCalledWith(false);
  });
});

// After an add, the button reads the bag again (`/cart/cart_shipping`). When the
// line it just added or raised costs a different price than the one the sheet
// showed (`showed_price`), the shopper is asked: keep it (Continue) or take the
// line out (Remove).
describe("asking the shopper when the price changed while adding", () => {
  const money = { symbol: "$", exchange_rate: 1, decimal_digits: 2 };

  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    AddToCart.mockReset();
    UpdateCart.mockReset();
    RemoveFromCart.mockReset();
    trackOrder.mockClear();
    vi.mocked(getCart).mockReset();
    vi.mocked(getCart).mockResolvedValue({ cart: [] } as any);
    useNotificationStore.setState({ notifications: [] });
    return () => vi.useRealTimers();
  });

  /** The real AddToCart puts the new line, with its cart id, into the store. */
  const addAs = (itemId: string) =>
    AddToCart.mockImplementation(async () => {
      const { useAppStore } = await import("store");
      useAppStore.getState().addProductToCart({ id: 101, item_id: itemId, quantity: 1 });
      return true;
    });

  /** The bag `/cart/cart_shipping` answers with after the add. */
  const bagAfterAdd = (...lines: any[]) =>
    vi.mocked(getCart).mockResolvedValueOnce({ cart: lines } as any);

  const dialog = () => screen.queryByRole("dialog", { name: "Price Changed" });

  it("asks when the new line costs a different price than the sheet showed", async () => {
    addAs("cart-7");
    bagAfterAdd({ id: "cart-7", product_id: 101, price: 100, offer_price: 90, showed_price: 80, quantity: 1 });
    await renderButton({}, { currency: money });

    await tapAdd();

    expect(dialog(), "the bag line cart-7 costs 90 now but the sheet showed 80, and the shopper was not asked").toBeInTheDocument();
    expect(dialog(), "the question did not say the old and the new price").toHaveTextContent("Price Changed From 80 $ To 90 $");
    expect(screen.getByRole("button", { name: "Continue" }), "the question had no Continue button").toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Remove" }), "the question had no Remove button").toBeInTheDocument();
  });

  it("does not ask when the new line costs what the sheet showed", async () => {
    addAs("cart-7");
    bagAfterAdd({ id: "cart-7", product_id: 101, price: 100, offer_price: 80, showed_price: 80, quantity: 1 });
    await renderButton({}, { currency: money });

    await tapAdd();

    expect(AddToCart, "the add never reached the cart service").toHaveBeenCalled();
    expect(dialog(), "the price did not change (80 both times) and the shopper was asked anyway").toBeNull();
  });

  it("does not ask about another line whose price changed", async () => {
    addAs("cart-7");
    bagAfterAdd(
      { id: "cart-7", product_id: 101, price: 100, offer_price: 80, showed_price: 80, quantity: 1 },
      { id: "cart-3", product_id: 202, price: 50, offer_price: 50, showed_price: 40, quantity: 1 },
    );
    await renderButton({}, { currency: money });

    await tapAdd();

    expect(dialog(), "only line cart-3 changed price, and the add of cart-7 asked about it").toBeNull();
  });

  it("asks when one more is added to a line whose price changed", async () => {
    UpdateCart.mockResolvedValue(true);
    bagAfterAdd({ id: "cart-1", product_id: 101, price: 100, offer_price: 95, showed_price: 80, quantity: 3 });
    await renderButton({}, { currency: money, localCart: [{ id: 101, item_id: "cart-1", quantity: 2 }] });

    await tapAdd();

    expect(UpdateCart, "adding one more never reached the cart service").toHaveBeenCalled();
    expect(dialog(), "line cart-1 costs 95 now but the sheet showed 80, and the shopper was not asked").toHaveTextContent(
      "Price Changed From 80 $ To 95 $",
    );
  });

  it("reads the product prices again when the price changed", async () => {
    addAs("cart-7");
    bagAfterAdd({ id: "cart-7", product_id: 101, price: 100, offer_price: 90, showed_price: 80, quantity: 1 });
    const refreshPricing = vi.fn().mockResolvedValue(undefined);
    await renderButton({ refreshPricing }, { currency: money });

    await tapAdd();

    expect(refreshPricing, "line cart-7 costs 90 now, and the sheet kept showing the old price 80 (prices were not read again)").toHaveBeenCalled();
  });

  it("does not read the product prices again when the price did not change", async () => {
    addAs("cart-7");
    bagAfterAdd({ id: "cart-7", product_id: 101, price: 100, offer_price: 80, showed_price: 80, quantity: 1 });
    const refreshPricing = vi.fn().mockResolvedValue(undefined);
    await renderButton({ refreshPricing }, { currency: money });

    await tapAdd();

    expect(AddToCart, "the add never reached the cart service").toHaveBeenCalled();
    expect(refreshPricing, "the price did not change (80 both times) and the prices were read again anyway").not.toHaveBeenCalled();
  });

  it("Continue closes the question and keeps the line", async () => {
    addAs("cart-7");
    bagAfterAdd({ id: "cart-7", product_id: 101, price: 100, offer_price: 90, showed_price: 80, quantity: 1 });
    await renderButton({}, { currency: money });
    await tapAdd();

    await userEvent.click(screen.getByRole("button", { name: "Continue" }));

    expect(dialog(), "Continue did not close the question").toBeNull();
    expect(RemoveFromCart, "Continue took the line out of the bag").not.toHaveBeenCalled();
  });

  it("Remove takes the line out of the bag and closes the question", async () => {
    addAs("cart-7");
    bagAfterAdd({ id: "cart-7", product_id: 101, price: 100, offer_price: 90, showed_price: 80, quantity: 1 });
    RemoveFromCart.mockResolvedValue(true);
    const { updateQuantity } = await renderButton({}, { currency: money });
    await tapAdd();
    vi.mocked(getCart).mockClear();

    await userEvent.click(screen.getByRole("button", { name: "Remove" }));

    expect(RemoveFromCart.mock.calls[0]?.[0]?.cart_item?.item_id, "Remove did not ask the core backend to remove line cart-7").toBe("cart-7");
    expect(dialog(), "the line was removed and the question stayed open").toBeNull();
    expect(getCart, "the bag was not read again after the removal").toHaveBeenCalled();
    expect(updateQuantity, "the stock was not reloaded after the removal").toHaveBeenCalledWith(false);
    expect(trackOrder.mock.calls.map(([e]: any) => e), "the order funnel was not told the line was removed").toContain("cart_item_removed");
  });

  it("keeps the question open when the core backend refuses the removal", async () => {
    addAs("cart-7");
    bagAfterAdd({ id: "cart-7", product_id: 101, price: 100, offer_price: 90, showed_price: 80, quantity: 1 });
    RemoveFromCart.mockResolvedValue(false);
    await renderButton({}, { currency: money });
    await tapAdd();

    await userEvent.click(screen.getByRole("button", { name: "Remove" }));

    expect(RemoveFromCart, "Remove never reached the cart service").toHaveBeenCalled();
    expect(dialog(), "the core backend kept line cart-7, and the question closed as if it was removed").toBeInTheDocument();
    expect(
      useNotificationStore.getState().notifications.length > 0,
      "the core backend refused the removal and the shopper was not told",
    ).toBe(true);
  });
});
