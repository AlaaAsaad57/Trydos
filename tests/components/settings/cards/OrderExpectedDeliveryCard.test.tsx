// The expected delivery card and its date maths
// (components/settings/cards/OrderExpectedDeliveryCard.tsx).
//
// Expected work days = the slowest product's shipping days + the store's
// shipping duration. Bad or missing numbers count as 0; a bad or missing
// order time counts from now.
import { afterEach, describe, expect, it, vi } from "vitest";

import OrderExpectedDeliveryCard, {
  getExpectedDelivery,
} from "components/settings/cards/OrderExpectedDeliveryCard";
import { renderWithProviders, screen } from "../../../render";

afterEach(() => vi.useRealTimers());

const DAY = 24 * 60 * 60 * 1000;

describe("getExpectedDelivery", () => {
  it("adds the slowest product's days to the store's shipping duration", () => {
    const { expectedWorkDays, expectedDate } = getExpectedDelivery({
      productsShippingDays: [2, "5", null, "x", -3],
      time: "2030-01-01T00:00:00.000Z",
      shippingDurationDays: "2",
    });
    expect(expectedWorkDays, "the work days are not slowest product + shipping duration").toBe(7);
    expect(expectedDate.toISOString(), "the expected date is not the order date plus the work days").toBe(
      new Date(Date.parse("2030-01-01T00:00:00.000Z") + 7 * DAY).toISOString(),
    );
  });

  it("counts from now when the order time is missing or unreadable, with no products", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2030-06-01T00:00:00.000Z"));
    expect(getExpectedDelivery({}).expectedDate.toISOString(), "a missing time did not count from now").toBe(
      "2030-06-01T00:00:00.000Z",
    );
    expect(
      getExpectedDelivery({ time: "not a date" }).expectedDate.toISOString(),
      "an unreadable time did not count from now",
    ).toBe("2030-06-01T00:00:00.000Z");
  });
});

describe("the expected delivery card", () => {
  it("shows the week day, the date and the work days", async () => {
    await renderWithProviders(
      <OrderExpectedDeliveryCard status="pending" time="2030-01-01T00:00:00.000Z" productsShippingDays={[3]} />,
      { store: { settings: { starting_setting: { shipping_duration_days: 1 } } } },
    );
    expect(screen.getByText("| 4 Work Days"), "the work days are not shown").toBeInTheDocument();
  });

  it("hides the date for a cancelled order and fades the card, right-to-left in Arabic", async () => {
    const { container } = await renderWithProviders(<OrderExpectedDeliveryCard status="canceled" />, {
      language: "ar",
      store: { language: "ar" },
    });
    const card = container.firstChild as HTMLElement;
    expect(card.className, "a cancelled order's card is not faded").toContain("opacity-55");
    expect(card.style.direction, "the card is not right-to-left in Arabic").toBe("rtl");
    expect(container.textContent, "a cancelled order still shows an expected date").toBe("");
  });

  it("falls back to the en-US locale when no language is set", async () => {
    await renderWithProviders(<OrderExpectedDeliveryCard time="2030-01-01T00:00:00.000Z" />, {
      store: { language: "" },
    });
    expect(screen.getByText("| 0 Work Days"), "the card did not render without a language").toBeInTheDocument();
  });
});
