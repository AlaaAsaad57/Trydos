import React from "react";
import { fireEvent, render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { motionValue } from "framer-motion";

// The bag as the store gives it. Each case sets the error and the loading flag.
const bag = vi.hoisted(() => ({
  error: null as string | null,
  loading: false,
}));
vi.mock("components/DemoApp1/useBagData", () => ({
  useBagData: () => ({
    view: { items: [], out: [], sums: {} },
    loading: bag.loading,
    error: bag.error,
    line: () => null,
    oldLine: () => null,
  }),
}));

// The old bag's actions: the first read and the retry go to the core backend.
const actions = vi.hoisted(() => ({
  openBag: vi.fn(async () => {}),
  retryBag: vi.fn(async () => {}),
}));
vi.mock("components/Cart/bagActions", () => ({
  ...actions,
  addOldLineAgain: vi.fn(),
  beginCheckout: vi.fn(),
  lowerLine: vi.fn(),
  raiseLine: vi.fn(),
}));

vi.mock("next/dynamic", () => ({ default: () => () => null }));

import { NavCtx, type DemoNav } from "components/DemoApp1/screenNav";
import AppCart from "components/DemoApp1/screens/AppCart";

const nav: DemoNav = {
  shown: null,
  navigate: vi.fn(),
  back: vi.fn(),
  locale: "sy-en",
  t: (key) => key,
  barShrink: motionValue(1),
};

const openBag = async () => {
  const view = render(
    <NavCtx.Provider value={nav}>
      <AppCart />
    </NavCtx.Provider>,
  );
  // The first read answers, so the skeleton gives way to the bag.
  await vi.waitFor(() => expect(actions.openBag, "the bag did not read the cart from the core backend").toHaveBeenCalled());
  return view;
};

const errorScreen = (container: HTMLElement) => container.querySelector('[data-pw="app-cart-error"]');
const retry = (container: HTMLElement) =>
  container.querySelector<HTMLButtonElement>('[data-pw="app-cart-error-retry"]');

beforeEach(() => {
  bag.error = null;
  bag.loading = false;
  actions.openBag.mockClear();
  actions.retryBag.mockClear();
});

describe("the bag when the core backend could not read the cart", () => {
  it("shows the error in the new design, not the old error box", async () => {
    bag.error = "Server error";
    const { container, findByText } = await openBag();
    await findByText("Cart Loading Error");
    expect(errorScreen(container), "the bag's error screen is not on show").not.toBeNull();
    expect(
      container.textContent,
      "the error screen lost the old error's sentence",
    ).toContain("We encountered an error while loading your cart. Don't worry, we'll fix this issue for you.");
  });

  it("shows the core backend's own line under the words", async () => {
    bag.error = "Server error";
    const { container, findByText } = await openBag();
    await findByText("Cart Loading Error");
    expect(
      container.querySelector('[data-pw="app-cart-error-note"]')?.textContent,
      "the line the core backend sent is not on the error screen",
    ).toBe("Server error");
  });

  it("reads the cart again on Try Again", async () => {
    bag.error = "Server error";
    const { container, findByText } = await openBag();
    await findByText("Cart Loading Error");
    expect(retry(container)?.textContent, "the error screen has no Try Again button").toBe("Try Again");
    fireEvent.click(retry(container)!);
    expect(actions.retryBag, "Try Again did not read the cart again from the core backend").toHaveBeenCalled();
  });

  it("keeps the error on show, with Try Again waiting, while the cart is read again", async () => {
    bag.error = "Server error";
    bag.loading = true;
    const { container, findByText } = await openBag();
    await findByText("Cart Loading Error");
    expect(errorScreen(container), "the error screen went away while the cart is read again").not.toBeNull();
    expect(retry(container)?.disabled, "Try Again can be tapped again while its read is on its way").toBe(true);
  });

  it("shows the empty bag, not the error, when the read worked", async () => {
    const { container, findByText } = await openBag();
    await findByText("Your cart is empty");
    expect(errorScreen(container), "the error screen shows, but the cart was read").toBeNull();
    expect(retry(container), "the empty bag has a Try Again button").toBeNull();
  });
});
