// @vitest-environment node
//
// The browser suite's own figure for "what the bag should show"
// (`expectedFigureFor` in tests/e2e/actions/cart.ts).
//
// The live checkout journeys (tests/e2e/shopper.live.spec.ts) compare the bag
// against this figure, on staging, where the rate is 100. The helper copies the
// app's rule on purpose — importing it would make both sides move together.
// So when the app's rule changes, this copy must change with it, or the live
// checkout goes red on a correct bag.
//
// _specs/round-price-convert-then-round, AC-10: the bag uses the charged rule —
// multiply by the rate, then round up to the currency's decimals.
import { describe, expect, it } from "vitest";

import { expectedFigureFor } from "../e2e/actions/cart";

const currency = (exchangeRate: number, decimalDigits: number) => ({
  exchangeRate,
  decimalDigits,
  symbol: "",
});

describe("the browser suite's expected bag figure", () => {
  it("follows the charged rule: 69.9998 at rate 100 with 2 decimals is 6999.98", () => {
    expect(
      expectedFigureFor(69.9998, currency(100, 2)),
      "the browser suite still rounds before the rate (7000), so the live checkout would call a correct bag wrong",
    ).toBe(6999.98);
  });

  it("never gives more decimals than the currency: 0.1 at rate 0.2 with 1 decimal is 0.1", () => {
    expect(
      expectedFigureFor(0.1, currency(0.2, 1)),
      "the browser suite's expected figure carries more decimals than a 1-decimal currency allows",
    ).toBe(0.1);
  });

  it("rounds up after the rate: 1.2345 at rate 3 with 2 decimals is 3.71", () => {
    expect(
      expectedFigureFor(1.2345, currency(3, 2)),
      "the browser suite rounded before the rate (3.72) instead of after it (3.7035 → 3.71)",
    ).toBe(3.71);
  });
});
