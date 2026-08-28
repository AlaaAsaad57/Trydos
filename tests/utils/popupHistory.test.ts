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
