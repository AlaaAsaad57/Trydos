// AC-1 to AC-6 — the rule that decides which price a product card shows while a
// flash deal is running, and how much time the deal has left.
//
// The rule takes the moment as an argument, so every case here states a moment
// instead of waiting for one. Nothing in this file reads the clock.
//
// TIMEZONE (FA-5). The end-of-day boundary is local time, on purpose — a deal
// runs to the end of its last day where the shopper is. So the boundary cases
// write the date in the **local** form (`"2026-08-27T00:00:00"`, no `Z`), which
// every timezone parses as local midnight. A bare `"2026-08-27"` is parsed as
// UTC midnight, which lands on the previous day west of Greenwich — that form is
// used only where the case is more than a day from the boundary and no zone can
// flip it.
import { describe, expect, it } from "vitest";

import { resolveCardPrice } from "components/products/ProductCard/flashPrice";

/** Local midnight on the 27th, read the same way in every timezone. */
const ENDS_ON_THE_27TH = "2026-08-27T00:00:00";

/** A moment on the 26th, a day before that deal ends. */
const DAY_BEFORE = new Date(2026, 7, 26, 12, 0, 0);

describe("which price the card shows (AC-1, AC-2)", () => {
  it("shows the deal price while the deal is running", () => {
    const { flashPrice } = resolveCardPrice(
      {
        endDate: ENDS_ON_THE_27TH,
        flashDealPrice: 60,
        offerPrice: 80,
        price: 100,
      },
      DAY_BEFORE,
    );

    expect(
      flashPrice,
      "a running deal did not give the deal price, so a shopper would see the ordinary one",
    ).toBe(60);
  });

  it("falls back to the offer price when a running deal carries no deal price", () => {
    const { flashPrice } = resolveCardPrice(
      {
        endDate: ENDS_ON_THE_27TH,
        flashDealPrice: null,
        offerPrice: 80,
        price: 100,
      },
      DAY_BEFORE,
    );

    expect(
      flashPrice,
      "a deal with no deal price did not fall back to the offer price",
    ).toBe(80);
  });

  it("falls back to the plain price when there is no offer price either", () => {
    const { flashPrice } = resolveCardPrice(
      {
        endDate: ENDS_ON_THE_27TH,
        flashDealPrice: null,
        offerPrice: null,
        price: 100,
      },
      DAY_BEFORE,
    );

    expect(
      flashPrice,
      "a deal with neither a deal price nor an offer price did not fall back to the plain price",
    ).toBe(100);
  });

  it("treats an offer price of zero as a real price, not as a missing one", () => {
    const { flashPrice } = resolveCardPrice(
      { endDate: null, flashDealPrice: null, offerPrice: 0, price: 100 },
      DAY_BEFORE,
    );

    expect(
      flashPrice,
      "an offer price of zero was treated as missing, so the card showed the higher plain price instead",
    ).toBe(0);
  });
});

describe("when a deal counts as running (AC-3)", () => {
  it("is still running in the last moment of its last day", () => {
    const lastMoment = new Date(2026, 7, 27, 23, 59, 59, 998);

    const { flashPrice, timeLeft } = resolveCardPrice(
      {
        endDate: ENDS_ON_THE_27TH,
        flashDealPrice: 60,
        offerPrice: 80,
        price: 100,
      },
      lastMoment,
    );

    expect(
      flashPrice,
      "the deal price was dropped before the end of the deal's last day",
    ).toBe(60);
    expect(
      timeLeft,
      "no time left was reported in the last second of the deal's last day",
    ).not.toBeNull();
  });

  it("has ended once its last day is over", () => {
    const nextDay = new Date(2026, 7, 28, 0, 0, 0);

    const { flashPrice, timeLeft } = resolveCardPrice(
      {
        endDate: ENDS_ON_THE_27TH,
        flashDealPrice: 60,
        offerPrice: 80,
        price: 100,
      },
      nextDay,
    );

    expect(
      flashPrice,
      "an ended deal still showed the deal price, so a shopper would be quoted a price the deal no longer offers",
    ).toBe(80);
    expect(
      timeLeft,
      "an ended deal still reported time left",
    ).toBeNull();
  });
});

describe("a product with no deal at all (AC-4)", () => {
  it("uses the offer price and reports no deal", () => {
    const { flashPrice, timeLeft } = resolveCardPrice(
      { endDate: null, flashDealPrice: 60, offerPrice: 80, price: 100 },
      DAY_BEFORE,
    );

    expect(
      flashPrice,
      "a product with no deal date did not show its offer price",
    ).toBe(80);
    expect(
      timeLeft,
      "a product with no deal date was reported as having a deal running",
    ).toBeNull();
  });

  it("ignores a deal price that arrives with no deal date", () => {
    const { flashPrice } = resolveCardPrice(
      { endDate: undefined, flashDealPrice: 60, offerPrice: 80, price: 100 },
      DAY_BEFORE,
    );

    expect(
      flashPrice,
      "a deal price with no deal date was shown, so a product could sit on a deal price for ever",
    ).toBe(80);
  });
});

describe("how much time the deal has left (AC-5)", () => {
  it("reports the days, hours, minutes and seconds still to run", () => {
    // From 12:00:00 on the 26th to 23:59:59.999 on the 27th:
    // one day, eleven hours, fifty-nine minutes and fifty-nine seconds.
    const { timeLeft } = resolveCardPrice(
      {
        endDate: ENDS_ON_THE_27TH,
        flashDealPrice: 60,
        offerPrice: 80,
        price: 100,
      },
      DAY_BEFORE,
    );

    expect(timeLeft?.days, "the days left were counted wrongly").toBe(1);
    expect(timeLeft?.hours, "the hours left were counted wrongly").toBe(11);
    expect(timeLeft?.minutes, "the minutes left were counted wrongly").toBe(59);
    expect(timeLeft?.seconds, "the seconds left were counted wrongly").toBe(59);
  });

  it("hands back the four keys the countdown banner seeds itself from", () => {
    const { timeLeft } = resolveCardPrice(
      {
        endDate: ENDS_ON_THE_27TH,
        flashDealPrice: 60,
        offerPrice: 80,
        price: 100,
      },
      DAY_BEFORE,
    );

    expect(
      Object.keys(timeLeft ?? {}).sort(),
      "the shape handed to the countdown banner changed — the banner seeds its own state from these keys, so it would start empty",
    ).toEqual(["days", "hours", "minutes", "seconds"]);
  });

  it("reports nothing at all once the deal has ended", () => {
    const { timeLeft } = resolveCardPrice(
      {
        endDate: ENDS_ON_THE_27TH,
        flashDealPrice: 60,
        offerPrice: 80,
        price: 100,
      },
      new Date(2026, 8, 1, 12, 0, 0),
    );

    expect(
      timeLeft,
      "an ended deal reported time left, so the card would keep counting down after the deal was over",
    ).toBeNull();
  });
});

describe("the same question always gets the same answer (AC-6)", () => {
  it("does not depend on the day the check runs", () => {
    const product = {
      endDate: ENDS_ON_THE_27TH,
      flashDealPrice: 60,
      offerPrice: 80,
      price: 100,
    };

    const first = resolveCardPrice(product, DAY_BEFORE);
    const second = resolveCardPrice(product, new Date(DAY_BEFORE.getTime()));

    expect(
      second,
      "the same product judged at the same moment gave two different answers, so the rule is reading something other than what it was handed",
    ).toEqual(first);
  });

  it("reads the moment it is handed, and never the clock", () => {
    const product = {
      endDate: ENDS_ON_THE_27TH,
      flashDealPrice: 60,
      offerPrice: 80,
      price: 100,
    };

    const whileRunning = resolveCardPrice(product, DAY_BEFORE);
    const afterItEnded = resolveCardPrice(product, new Date(2026, 8, 1, 12, 0));

    expect(
      whileRunning.flashPrice,
      "the moment handed in did not decide the price",
    ).toBe(60);
    expect(
      afterItEnded.flashPrice,
      "a later moment handed in did not end the deal, so the rule is reading the real clock instead",
    ).toBe(80);
  });
});
