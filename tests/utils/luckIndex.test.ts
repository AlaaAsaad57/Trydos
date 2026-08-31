import { describe, expect, it, beforeEach } from "vitest";
import {
  addRedeemedId,
  computeSecondsLeft,
  isLuckActive,
  readTimer,
  REDEEMED_IDS_COOKIE,
  writeTimer,
  DEFAULT_LUCK_SECONDS,
} from "utils/luck";

describe("luck utility functions", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("computeSecondsLeft", () => {
    it("returns DEFAULT_LUCK_SECONDS for null or undefined timers", () => {
      expect(computeSecondsLeft(null, Date.now()), "null timer should return DEFAULT_LUCK_SECONDS").toBe(DEFAULT_LUCK_SECONDS);
      expect(computeSecondsLeft(undefined, Date.now()), "undefined timer should return DEFAULT_LUCK_SECONDS").toBe(DEFAULT_LUCK_SECONDS);
    });

    it("returns 0 for expired timers", () => {
      expect(
        computeSecondsLeft({ expired: true, deadlineTs: 10000, pausedRemaining: null }, Date.now()),
        "expired timer should return 0",
      ).toBe(0);
    });

    it("returns pausedRemaining when timer is paused", () => {
      const timer = { deadlineTs: null, pausedRemaining: 45, expired: false };
      expect(computeSecondsLeft(timer, Date.now()), "paused timer should return remaining seconds").toBe(45);
    });

    it("computes active countdown remaining seconds against now", () => {
      const now = 1000000;
      const timer = { deadlineTs: now + 30000, pausedRemaining: null, expired: false };
      expect(computeSecondsLeft(timer, now), "active timer should return 30 seconds").toBe(30);
    });
  });

  describe("readTimer & writeTimer", () => {
    it("persists and reads product luck timer state in localStorage", () => {
      const timer = { deadlineTs: Date.now() + 60000, pausedRemaining: null, expired: false };
      writeTimer(101, timer);

      const read = readTimer(101);
      expect(read?.deadlineTs, "persisted deadlineTs should match").toBe(timer.deadlineTs);

      writeTimer(101, null);
      expect(readTimer(101), "deleting timer should return null").toBeNull();
    });
  });

  // The bug this block was written for: components/Cart/AddToCart/Button.tsx
  // reported `is_luck: Boolean(product?.is_luck)` to PostHog, and picked
  // `luck_price` over `offer_price` on the same flag, without ever re-reading
  // the redeemed-products cookie. `is_luck` comes from the product record, so it
  // stays true after the shopper has redeemed that product — and the analytics
  // then say a luck price was on offer when the shopper could no longer get one.
  //
  // It matters more once the product cards are cached: one cached card is shown
  // to every shopper, including the ones who already redeemed.
  describe("isLuckActive", () => {
    beforeEach(() => {
      document.cookie = `${REDEEMED_IDS_COOKIE}=; max-age=0; path=/`;
    });

    it("is active for a luck product the shopper has not redeemed", () => {
      expect(
        isLuckActive({ is_luck: true }, 101),
        "a luck product nobody redeemed was reported as not on luck, so the " +
          "luck price and the is_luck event property would both be dropped",
      ).toBe(true);
    });

    it("is not active once that product has been redeemed", () => {
      addRedeemedId(101);

      expect(
        isLuckActive({ is_luck: true }, 101),
        "the product is in the redeemed cookie, but it was still reported as " +
          "on luck - this is the wrong is_luck sent to PostHog",
      ).toBe(false);
    });

    it("stays active when a different product was the one redeemed", () => {
      addRedeemedId(999);

      expect(
        isLuckActive({ is_luck: true }, 101),
        "redeeming one product switched luck off for another one",
      ).toBe(true);
    });

    it("matches a redeemed id written as a number against a string id", () => {
      addRedeemedId(101);

      expect(
        isLuckActive({ is_luck: true }, "101"),
        "the redeemed id was stored as a number and the card passed a string, " +
          "so the check missed it",
      ).toBe(false);
    });

    it("is never active for a product that carries no luck offer", () => {
      expect(
        isLuckActive({ is_luck: false }, 101),
        "a product with is_luck false was reported as on luck",
      ).toBe(false);
      expect(
        isLuckActive(null, 101),
        "a missing product was reported as on luck",
      ).toBe(false);
    });
  });
});
