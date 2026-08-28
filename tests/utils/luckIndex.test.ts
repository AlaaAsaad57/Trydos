import { describe, expect, it, beforeEach } from "vitest";
import {
  computeSecondsLeft,
  readTimer,
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
});
