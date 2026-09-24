// The "Out Of Bag!" list under the cart (components/Cart/OldCartContainer.tsx).
//
// Items that left the bag are listed for 30 minutes with a live countdown and an
// "Add Again?" link. The old-cart and cart reads (utils/functions), the cart and
// home services and the two cart pieces it borrows from components/Cart are
// replaced: each would otherwise reach the core backend, and the cart pieces
// have their own tests.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import OldCartContainer from "components/Cart/OldCartContainer";
import { useAppStore } from "store";

import { act, renderWithProviders, screen, userEvent, waitFor } from "../../render";

const reads = vi.hoisted(() => ({
  getOldCart: vi.fn(async () => {}),
  getCart: vi.fn(async ({ callback }: any) => callback([{ cart: [{ id: 1 }] }])),
}));
vi.mock("utils/functions", async (importOriginal) => ({
  ...(await importOriginal<any>()),
  getOldCart: reads.getOldCart,
  getCart: reads.getCart,
}));

const cartService = vi.hoisted(() => ({ AddToCart: vi.fn() }));
vi.mock("services/cart", () => ({ default: cartService }));

const home = vi.hoisted(() => ({ hideOldCart: vi.fn() }));
vi.mock("services/home", () => ({ default: home }));

vi.mock("components/Cart", () => ({
  CartItemLink: ({ children }: any) => <a data-testid="item-link">{children}</a>,
  QuantutyInput: () => <span data-testid="qty" />,
}));

const NOW = new Date("2026-07-05T10:10:00Z").getTime();

/** Two items that left the bag; the first 10 minutes ago, in server format. */
const oldItems = [
  {
    id: 1,
    product_id: 100,
    name: "Linen shirt with a long name that is cut",
    image: "a.png",
    quantity: "2",
    offer_price: 10,
    product_variation_id: 7,
    count_of_pieces: 1,
    shipping_days: "2",
    created_at: "2026-07-05 10:00:00",
    variations: { color: "Red", Size: "M" },
    brand: { icon: { file_path: "brand.png" } },
  },
  {
    id: 2,
    product_id: 200,
    name: "Hat",
    image: "b.png",
    quantity: "x",
    count_of_pieces: 1,
    created_at: "2026-07-05T09:00:00Z",
    variations: {},
    brand: { icon: "icon.png" },
  },
];

async function openList(
  store: Record<string, any> = {},
  items: any[] = oldItems,
  language: "en" | "ar" = "en",
) {
  const view = await renderWithProviders(<OldCartContainer />, {
    language,
    store: {
      cart: [],
      oldCart: { oldCart: items },
      settings: { starting_setting: { shipping_duration_days: "1" } },
      ...store,
    },
  });
  await waitFor(() =>
    expect(
      document.querySelector('[data-pw="hideAll"]'),
      "the Out Of Bag list did not finish loading",
    ).not.toBeNull(),
  );
  return view;
}

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true, now: NOW });
  reads.getOldCart.mockReset().mockResolvedValue(undefined);
  reads.getCart.mockClear();
  cartService.AddToCart.mockReset();
  home.hideOldCart.mockClear();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("the Out Of Bag list", () => {
  it("shows a skeleton while the old cart loads, then the items", async () => {
    let finish: () => void = () => {};
    reads.getOldCart.mockImplementation(
      () => new Promise<void>((r) => (finish = r)),
    );
    await renderWithProviders(<OldCartContainer />, {
      store: { cart: [], oldCart: { oldCart: oldItems } },
    });
    expect(
      document.querySelector('[data-pw="hideAll"]'),
      "the list was drawn before the old cart finished loading",
    ).toBeNull();
    await act(async () => finish());
    await waitFor(() =>
      expect(screen.getAllByTestId("item-link").length > 0, "no item was drawn after loading").toBe(true),
    );
  });

  it("still draws the list when reading the old cart fails", async () => {
    reads.getOldCart.mockRejectedValue(new Error("down"));
    await openList();
    expect(screen.getByText("Hat"), "the list did not draw after a failed read").toBeInTheDocument();
  });

  it("draws nothing when every old item is already back in the bag", async () => {
    await renderWithProviders(<OldCartContainer />, {
      store: {
        cart: [{ product_id: 100, variations: { color: "Red", Size: "M" } }],
        oldCart: { oldCart: [oldItems[0]] },
      },
    });
    await act(async () => {});
    expect(
      document.querySelector('[data-pw="oldCart-outOfBag"]'),
      "an item already in the bag was listed as Out Of Bag",
    ).toBeNull();
  });

  it("draws nothing when there is no old cart", async () => {
    await renderWithProviders(<OldCartContainer />, {
      store: { cart: [], oldCart: null },
    });
    await act(async () => {});
    expect(document.querySelector('[data-pw="oldCart-outOfBag"]'), "a missing old cart drew a list").toBeNull();
  });

  it("counts down the 30-minute window for a fresh item and hides the counter for an old one", async () => {
    await openList({}, oldItems, "ar");
    const labels = document.querySelectorAll('[data-pw="old-cart-add-again"]');
    const fresh = labels[0].parentElement!.textContent!;
    const old = labels[1].parentElement!.textContent!;
    expect(fresh, "a 10-minute-old item did not show about 20 minutes left").toMatch(/-(20:00|19:5\d)/);
    expect(old, "an item past its window still shows a countdown").not.toContain("-");
  });

  // The two cases below run on the real clock. The countdown is a one-second
  // setInterval, and the whole point is to see it fire.
  it("ticks the countdown down every second", async () => {
    vi.useRealTimers();
    await openList({}, [
      { ...oldItems[0], created_at: new Date(Date.now() - 10 * 60_000).toISOString() },
    ]);
    const label = () =>
      document.querySelector('[data-pw="old-cart-add-again"]')!.parentElement!.textContent!;
    const first = label();
    await waitFor(
      () => expect(label(), "the countdown did not tick down").not.toBe(first),
      { timeout: 2500 },
    );
  });

  it("stops the countdown when the window closes", async () => {
    vi.useRealTimers();
    await openList({}, [
      {
        ...oldItems[0],
        created_at: new Date(Date.now() - (30 * 60_000 - 1500)).toISOString(),
      },
    ]);
    const label = () =>
      document.querySelector('[data-pw="old-cart-add-again"]')!.parentElement!.textContent!;
    expect(label(), "a second before the end the countdown was not shown").toMatch(/-0:0\d/);
    await waitFor(
      () =>
        expect(label(), "the countdown was still shown after the window closed").not.toContain(
          "-0:",
        ),
      { timeout: 3500 },
    );
  });

  it("caps a countdown for a date in the future, and treats a missing or numeric date sensibly", async () => {
    await openList({}, [
      { ...oldItems[0], id: 11, created_at: "2026-07-05T12:00:00+00:00" },
      { ...oldItems[0], id: 12, product_id: 101, created_at: null },
      { ...oldItems[0], id: 13, product_id: 102, created_at: NOW - 60_000 },
    ]);
    const texts = Array.from(document.querySelectorAll('[data-pw="old-cart-add-again"]')).map(
      (l) => l.parentElement!.textContent!,
    );
    expect(texts[0], "a future date was not capped at 30 minutes").toContain("-30:00");
    expect(texts[1], "an item with no date showed a countdown").not.toContain("-");
    expect(texts[2], "a numeric date one minute ago did not show 29 minutes").toMatch(/-(29:00|28:5\d)/);
  });

  it("shows the colour, size and shipping days of an item", async () => {
    await openList();
    expect(screen.getByText("Red"), "the colour is not shown").toBeInTheDocument();
    expect(screen.getByText("M"), "the size is not shown").toBeInTheDocument();
    expect(
      screen.getByText("Linen shirt with a long name t"),
      "the name was not cut to 30 characters",
    ).toBeInTheDocument();
    expect(
      document.querySelector('[data-pw="oldProduct-card"]')!.textContent,
      "the shipping days (2 for the item + 1 for the store) are not shown",
    ).toContain("3 Days");
  });

  it("puts an item back in the bag with 'Add Again?' and refreshes both lists", async () => {
    cartService.AddToCart.mockResolvedValue(true);
    await openList();
    reads.getOldCart.mockClear();
    await userEvent.click(document.querySelectorAll('[data-pw="old-cart-add-again"]')[0]);

    expect(cartService.AddToCart.mock.calls[0][0], "the add request did not carry the item").toMatchObject({
      product_id: 100,
      color: "Red",
      choice_1: "M",
      product_variation_id: 7,
      qty: 2,
    });
    await waitFor(() =>
      expect(reads.getCart, "the bag was not read again").toHaveBeenCalled(),
    );
    expect(
      (useAppStore.getState() as any).cart.map((c: any) => c.id),
      "the bag in the store is not the one the refresh returned",
    ).toEqual([1]);
    expect(reads.getOldCart, "the Out Of Bag list was not read again").toHaveBeenCalled();
  });

  it("uses the item id and a quantity of 1 when those are missing, and stops when the add is refused", async () => {
    cartService.AddToCart.mockResolvedValue(false);
    await openList();
    await userEvent.click(document.querySelectorAll('[data-pw="old-cart-add-again"]')[1]);
    expect(cartService.AddToCart.mock.calls[0][0], "a bad quantity was not replaced by 1").toMatchObject({
      product_id: 200,
      qty: 1,
      product_variation_id: null,
    });
    expect(reads.getCart, "the bag was read again after a refused add").not.toHaveBeenCalled();
  });

  it("ignores a second tap while the first add is still running, and survives an add that throws", async () => {
    let fail: (e: Error) => void = () => {};
    cartService.AddToCart.mockImplementation(
      () => new Promise((_, reject) => (fail = reject)),
    );
    await openList();
    const link = document.querySelectorAll('[data-pw="old-cart-add-again"]')[0] as HTMLElement;
    await userEvent.click(link);
    await userEvent.click(link);
    expect(cartService.AddToCart, "a second tap sent a second add").toHaveBeenCalledTimes(1);
    await act(async () => fail(new Error("down")));
    expect(link.className, "the link stayed greyed after the add failed").not.toContain("opacity-50");
  });

  it("hides one item, or all of them", async () => {
    await openList();
    await userEvent.click(document.querySelectorAll(".hide-btn")[0]);
    expect(home.hideOldCart, "hiding one item was not sent for that item").toHaveBeenCalledWith({ id: 1 });
    expect(
      (useAppStore.getState() as any).oldCart.oldCart.map((i: any) => i.id),
      "the hidden item is still in the list",
    ).toEqual([2]);

    await userEvent.click(document.querySelector('[data-pw="hideAll"]')!);
    expect(home.hideOldCart, "'Hide All' was not sent").toHaveBeenCalledWith({});
    expect(
      document.querySelector('[data-pw="oldCart-outOfBag"]'),
      "'Hide All' left the list on screen",
    ).toBeNull();
  });
});
