import { describe, expect, it } from "vitest";
import {
  beginSelfConsume,
  takeSelfConsume,
  markBackClosing,
  isBackClosing,
} from "utils/popupHistory";

describe("popupHistory utility", () => {
  it("manages selfConsuming flag state and consumption", () => {
    expect(takeSelfConsume(), "initially should return false").toBe(false);

    beginSelfConsume();
    expect(takeSelfConsume(), "takeSelfConsume should return true after beginSelfConsume").toBe(true);
    expect(takeSelfConsume(), "second call should return false after consumption").toBe(false);
  });

  it("manages backClosing flag state", () => {
    expect(isBackClosing(), "initially isBackClosing should be false").toBe(false);

    markBackClosing();
    expect(isBackClosing(), "isBackClosing should be true after markBackClosing").toBe(true);
  });
});

describe("popupHistory safety resets", () => {
  it("drops an unused self-consume mark after 100 ms and the back-closing flag after 50 ms", async () => {
    const { vi } = await import("vitest");
    vi.useFakeTimers();
    try {
      beginSelfConsume();
      markBackClosing();
      vi.advanceTimersByTime(50);
      expect(isBackClosing(), "the back-closing flag outlived its 50 ms").toBe(false);
      vi.advanceTimersByTime(50);
      expect(takeSelfConsume(), "an unused self-consume mark outlived its 100 ms").toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });
});
