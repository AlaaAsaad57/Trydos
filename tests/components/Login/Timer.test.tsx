// The countdown shared by the cart, the returns window and the session timer.
//
// It renders no markup of its own — just the digits — so what matters is the
// shape of those digits and the one callback it fires when it reaches zero.
// Both callers are money-path: a flash-deal line in the cart and the window a
// shopper has to return an order.
import { afterEach, describe, expect, it, vi } from "vitest";

import { useAppStore } from "store";
import Timer from "components/Login/Timer";

import { renderWithProviders, screen, waitFor } from "../../render";

afterEach(() => {
  vi.clearAllMocks();
});

describe("what the countdown shows", () => {
  it("pads every part to two digits", async () => {
    await renderWithProviders(
      <p data-testid="clock">
        <Timer onFinish={vi.fn()} minutes={5} seconds={7} />
      </p>,
    );

    expect(
      screen.getByTestId("clock"),
      "a clock that reads 0:5:7 is not a clock — the parts have to line up as " +
        "they tick down",
    ).toHaveTextContent("00:05:07");
  });

  it("shows only the seconds when that is all the caller wants", async () => {
    await renderWithProviders(
      <p data-testid="clock">
        <Timer onFinish={vi.fn()} minutes={0} seconds={9} onlySeconds />
      </p>,
    );

    expect(
      screen.getByTestId("clock"),
      "the short form sits inline in a sentence — hours and minutes there " +
        "would read as a different number entirely",
    ).toHaveTextContent("09");
  });

  it("counts hours as their own part, not as extra minutes", async () => {
    await renderWithProviders(
      <p data-testid="clock">
        <Timer onFinish={vi.fn()} minutes={125} seconds={0} />
      </p>,
    );

    expect(
      screen.getByTestId("clock"),
      "two hours and five minutes must read as 02:05:00 — 125 minutes in the " +
        "minutes slot is a returns window nobody can read",
    ).toHaveTextContent("02:05:00");
  });
});

describe("when it reaches zero", () => {
  it("tells the caller, once", async () => {
    const onFinish = vi.fn();
    await renderWithProviders(
      <Timer onFinish={onFinish} minutes={0} seconds={1} />,
    );

    await waitFor(
      () => {
        expect(
          onFinish,
          "this callback is the whole point of the component — a flash deal " +
            "that never ends keeps selling at a price that has stopped",
        ).toHaveBeenCalled();
      },
      { timeout: 3000 },
    );
    expect(
      onFinish,
      "and it must fire once, not once a tick after zero",
    ).toHaveBeenCalledTimes(1);
  });
});

describe("the redeem countdown", () => {
  // The cart pauses this one while a product is being added: the shopper is
  // mid-action and the window must not close under them.
  it("holds while the product being added is not finished", async () => {
    const onFinish = vi.fn();
    await renderWithProviders(
      <Timer onFinish={onFinish} minutes={0} seconds={1} isForRedeem />,
      { store: { selected_product_for_add_to_cart: { id: 4, done: false } } },
    );

    await new Promise((resolve) => setTimeout(resolve, 1600));

    expect(
      onFinish,
      "the shopper is part-way through adding this product — running the " +
        "window out under them loses the offer they were taking",
    ).not.toHaveBeenCalled();
  });

  it("runs on once that product is finished", async () => {
    const onFinish = vi.fn();
    await renderWithProviders(
      <Timer onFinish={onFinish} minutes={0} seconds={1} isForRedeem />,
      { store: { selected_product_for_add_to_cart: { id: 4, done: false } } },
    );

    useAppStore.setState({
      selected_product_for_add_to_cart: { id: 4, done: true },
    } as any);

    await waitFor(
      () => {
        expect(
          onFinish,
          "the hold is for the length of the action, not for good — a paused " +
            "window that never resumes never expires either",
        ).toHaveBeenCalled();
      },
      { timeout: 4000 },
    );
  });
});
