// The send-code button, from the user's side. AC-1 to AC-7.
//
// This store is what stops a second code being sent too soon, and what stops one
// visitor working through a list of numbers. It lives in session storage rather
// than in a component, on purpose: the old way round, a user could type a
// number, send, press back, type it again, and send again — the limit only ever
// existed on the screen they had just left. So the tests below are written as
// that story, not as "does this function return the right shape".
//
// Time is frozen in every test that depends on it. A cooldown measured against a
// real clock passes on a fast machine and fails on a slow one, and the failure
// looks like a bug in the store rather than in the test.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  getNumberLockRemaining,
  isSessionCapReached,
  lockNumber,
  normalizePhone,
  recordSessionNumber,
} from "utils/otpLocks";

/** A fixed, obviously invented moment. Every time assertion is relative to it. */
const T0 = new Date("2026-01-01T00:00:00.000Z").getTime();

/** The store's own window, restated here so a change to it fails a test. */
const ONE_HOUR_MS = 60 * 60 * 1000;

// Numbers are the documentation range for examples — they cannot be dialled.
const NUMBER_A = "+44 020 7946 0111";
const NUMBER_B = "+44 020 7946 0222";
const NUMBER_C = "+44 020 7946 0333";

/** What the store actually wrote, so a test can prove nothing changed. */
const rawStore = () => {
  const key = window.sessionStorage.key(0);
  return key ? window.sessionStorage.getItem(key) : null;
};

beforeEach(() => {
  window.sessionStorage.clear();
  vi.useFakeTimers();
  vi.setSystemTime(T0);
});

afterEach(() => {
  // Real timers back before the next file's first test, always — a fake clock
  // left installed is the cheapest way to hang a later, unrelated test.
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  window.sessionStorage.clear();
});

describe("reading a number back (AC-1)", () => {
  it("counts a lock down in whole seconds and stops at zero when it runs out", () => {
    lockNumber(NUMBER_A, 60);
    expect(getNumberLockRemaining(NUMBER_A)).toBe(60);

    vi.setSystemTime(T0 + 30_000);
    expect(getNumberLockRemaining(NUMBER_A)).toBe(30);

    // Part of a second still counts as a second: a button that says "0 seconds"
    // while it is still refusing is worse than one that says "1".
    vi.setSystemTime(T0 + 30_500);
    expect(getNumberLockRemaining(NUMBER_A)).toBe(30);

    vi.setSystemTime(T0 + 60_000);
    expect(getNumberLockRemaining(NUMBER_A)).toBe(0);

    vi.setSystemTime(T0 + 60_001);
    expect(getNumberLockRemaining(NUMBER_A)).toBe(0);
  });

  it("treats the same number written differently as the same number", () => {
    lockNumber("+44 020 7946 0111", 60);

    expect(getNumberLockRemaining("440207946 0111")).toBe(60);
    expect(getNumberLockRemaining("+44-020-7946-0111")).toBe(60);
    expect(normalizePhone("+44 (020) 7946-0111")).toBe("4402079460111");
  });

  it("reports a number nobody has locked as free", () => {
    expect(getNumberLockRemaining(NUMBER_A)).toBe(0);
  });
});

describe("locking a number (AC-2)", () => {
  it("stores nothing for a value with no digits in it", () => {
    lockNumber("", 60);
    lockNumber("not a phone number", 60);

    expect(rawStore()).toBeNull();
    expect(getNumberLockRemaining("")).toBe(0);
  });

  it("stores nothing when asked for a lock of zero seconds", () => {
    // Zero is what the caller gets when the server sent no wait time. Writing a
    // lock that has already expired would be harmless but pointless; the store
    // declines it, and this pins that.
    lockNumber(NUMBER_A, 0);

    expect(rawStore()).toBeNull();
    expect(getNumberLockRemaining(NUMBER_A)).toBe(0);
  });
});

describe("counting distinct numbers in a session (AC-3, AC-4)", () => {
  it("does not spend a second slot on a number already counted", () => {
    recordSessionNumber(NUMBER_A);
    const afterFirst = rawStore();

    vi.setSystemTime(T0 + 30 * 60 * 1000);
    recordSessionNumber(NUMBER_A);

    // Byte-for-byte identical: the number was not counted twice, and its
    // first-seen time did not move forward. If it moved, a visitor could hold a
    // slot open for ever by re-sending to the same number.
    expect(rawStore()).toBe(afterFirst);
  });

  it("blocks a new number once the session limit is reached", () => {
    expect(isSessionCapReached(NUMBER_A)).toBe(false);

    recordSessionNumber(NUMBER_A);
    expect(isSessionCapReached(NUMBER_B)).toBe(false);

    recordSessionNumber(NUMBER_B);
    expect(isSessionCapReached(NUMBER_C)).toBe(true);
  });

  it("never blocks a number the visitor has already used", () => {
    recordSessionNumber(NUMBER_A);
    recordSessionNumber(NUMBER_B);

    // The limit is on how many DIFFERENT numbers one visitor may try. Asking
    // again for one they already used is the cooldown's business, not the cap's
    // — otherwise a genuine "the code never arrived, send it again" is refused.
    expect(isSessionCapReached(NUMBER_A)).toBe(false);
    expect(isSessionCapReached(NUMBER_B)).toBe(false);
  });

  it("ignores a value with no digits when counting", () => {
    recordSessionNumber("");
    recordSessionNumber("still not a phone number");

    expect(rawStore()).toBeNull();
    expect(isSessionCapReached(NUMBER_A)).toBe(false);
  });
});

describe("the window moving on (AC-5)", () => {
  it("stops counting a number once its hour is up", () => {
    recordSessionNumber(NUMBER_A);
    recordSessionNumber(NUMBER_B);
    expect(isSessionCapReached(NUMBER_C)).toBe(true);

    // One hour after A and B were first seen, both drop out and the visitor
    // starts again with a clean slate.
    vi.setSystemTime(T0 + ONE_HOUR_MS);
    expect(isSessionCapReached(NUMBER_C)).toBe(false);
  });

  it("keeps counting a number until its hour is actually up", () => {
    recordSessionNumber(NUMBER_A);
    recordSessionNumber(NUMBER_B);

    vi.setSystemTime(T0 + ONE_HOUR_MS - 1);
    expect(isSessionCapReached(NUMBER_C)).toBe(true);
  });

  it("forgets an expired lock and clears it out of storage at once", () => {
    lockNumber(NUMBER_A, 60);
    vi.setSystemTime(T0 + 61_000);

    expect(getNumberLockRemaining(NUMBER_A)).toBe(0);

    // Reading is what cleans up, and the cleaned copy is saved. Before this was
    // fixed the dead entry stayed in storage until some later write happened to
    // flush it, so a long session kept every number it had ever locked.
    expect(rawStore()).not.toContain("4402079460111");
  });

  it("drops a number that has fallen out of the window from storage too", () => {
    recordSessionNumber(NUMBER_A);
    vi.setSystemTime(T0 + ONE_HOUR_MS);

    expect(isSessionCapReached(NUMBER_B)).toBe(false);
    expect(rawStore()).not.toContain("4402079460111");
  });
});

describe("when storage misbehaves (AC-6)", () => {
  it("starts over rather than throwing when the stored state is unreadable", () => {
    lockNumber(NUMBER_A, 60);
    const key = window.sessionStorage.key(0) as string;
    window.sessionStorage.setItem(key, "{ this is not json");

    expect(() => getNumberLockRemaining(NUMBER_A)).not.toThrow();
    expect(getNumberLockRemaining(NUMBER_A)).toBe(0);
    expect(isSessionCapReached(NUMBER_A)).toBe(false);
  });

  it("survives a stored state that is valid but the wrong shape", () => {
    lockNumber(NUMBER_A, 60);
    const key = window.sessionStorage.key(0) as string;
    window.sessionStorage.setItem(key, JSON.stringify({ nothing: "expected" }));

    expect(getNumberLockRemaining(NUMBER_A)).toBe(0);
    expect(isSessionCapReached(NUMBER_A)).toBe(false);
  });

  it("keeps working when storage refuses to accept a write", () => {
    // Full, or turned off in the browser's settings. The user can still use the
    // app; they simply lose the local half of the limit, and the server keeps
    // enforcing the real one.
    //
    // The whole store is replaced rather than its `setItem` spied on: the
    // browser-like environment's storage is a proxy, so defining a property
    // named `setItem` on it stores an ITEM called "setItem" and leaves the real
    // method untouched — the spy silently does nothing.
    vi.stubGlobal("sessionStorage", {
      getItem: () => null,
      setItem: () => {
        throw new Error("QuotaExceededError");
      },
      removeItem: () => undefined,
      clear: () => undefined,
      key: () => null,
      length: 0,
    });

    expect(() => lockNumber(NUMBER_A, 60)).not.toThrow();
    expect(() => recordSessionNumber(NUMBER_A)).not.toThrow();
    expect(getNumberLockRemaining(NUMBER_A)).toBe(0);
  });
});

describe("with no browser present (AC-7)", () => {
  // The sign-in screens are rendered on the server first, where there is no
  // session storage at all. Every one of these must be a quiet no-op there: a
  // throw would take the whole page down before the user saw it.
  beforeEach(() => {
    vi.stubGlobal("window", undefined);
  });

  it("reports nothing locked and nothing capped", () => {
    expect(getNumberLockRemaining(NUMBER_A)).toBe(0);
    expect(isSessionCapReached(NUMBER_A)).toBe(false);
  });

  it("accepts a lock and a recorded number without throwing", () => {
    expect(() => lockNumber(NUMBER_A, 60)).not.toThrow();
    expect(() => recordSessionNumber(NUMBER_A)).not.toThrow();
  });

  it("still normalizes a number, because that needs no storage", () => {
    expect(normalizePhone("+44 020 7946 0111")).toBe("4402079460111");
  });
});
