// utils/globalErrorListeners.ts — the last-resort catch for uncaught browser
// errors and unhandled promise rejections. Each one goes to LogError once, with
// the page, the user and the locale, unless it is noise or a repeat.
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const LogError = vi.hoisted(() => vi.fn());
vi.mock("utils/functions", () => ({ LogError }));
vi.mock("services/auth", () => ({ default: { UserID: () => 42 } }));

import { installGlobalErrorListeners } from "utils/globalErrorListeners";

/** Fire a window error the way the browser does. */
const fireError = (init: ErrorEventInit) => window.dispatchEvent(new ErrorEvent("error", init));

/** Fire an unhandled rejection. jsdom has no PromiseRejectionEvent. */
const fireRejection = (reason: unknown) => {
  const event = new Event("unhandledrejection");
  (event as any).reason = reason;
  window.dispatchEvent(event);
};

const reported = () => LogError.mock.calls.map((c) => c[0]);

beforeAll(() => {
  installGlobalErrorListeners();
  // A second install must not add a second pair of listeners.
  installGlobalErrorListeners();
});

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-09-01T10:00:00Z"));
  LogError.mockReset();
  window.history.pushState({}, "", "/sy-ar/products");
});

afterEach(() => {
  vi.useRealTimers();
});

describe("window errors", () => {
  it("reports an uncaught error once, with its stack, page, user and locale", () => {
    const err = new Error("boom-1");
    fireError({ error: err, message: "ignored" });
    expect(reported(), "the uncaught error was not reported exactly once").toEqual([
      {
        type: "front-end-exception",
        scenario: "window-onerror",
        message: "boom-1",
        stack: err.stack,
        url: window.location.href,
        user_id: 42,
        user_agent: navigator.userAgent,
        country: "sy",
        language: "ar",
      },
    ]);
  });

  it("uses the event text when there is no Error object, and a default when there is none", () => {
    fireError({ message: "plain-2" });
    fireError({});
    expect(reported().map((r) => [r.message, r.stack]), "the fallback messages are wrong").toEqual([
      ["plain-2", undefined],
      ["Unknown window error", undefined],
    ]);
  });

  it("skips known noise such as a ResizeObserver loop or a failed fetch", () => {
    fireError({ message: "ResizeObserver loop limit exceeded" });
    fireError({ error: new Error("TypeError: Failed to fetch") });
    expect(reported(), "noise was reported").toEqual([]);
  });

  it("reports the same message only once in two seconds", () => {
    fireError({ message: "repeat-3" });
    fireError({ message: "repeat-3" });
    vi.advanceTimersByTime(2001);
    fireError({ message: "repeat-3" });
    expect(reported().map((r) => r.message), "the repeat was not held back for two seconds").toEqual([
      "repeat-3",
      "repeat-3",
    ]);
  });

  it("forgets old messages once it has seen more than fifty", () => {
    fireError({ message: "old-4" });
    vi.advanceTimersByTime(3000);
    for (let i = 0; i < 51; i += 1) fireError({ message: `burst-4-${i}` });
    // "old-4" was dropped from memory, so it counts as new even inside the window.
    fireError({ message: "old-4" });
    expect(reported().filter((r) => r.message === "old-4").map((r) => r.message), "an old message was not forgotten").toEqual(["old-4", "old-4"]);
  });

  it("reports no locale when the page address cannot be read", () => {
    const real = window.location;
    Object.defineProperty(window, "location", {
      value: {
        href: "http://localhost/",
        get pathname(): string {
          throw new Error("no path");
        },
      },
      configurable: true,
    });
    fireError({ message: "no-locale-5" });
    Object.defineProperty(window, "location", { value: real, configurable: true });
    expect(reported()[0], "the locale was invented").toMatchObject({ country: undefined, language: undefined });
  });

  it("does not throw when the reporter itself throws", () => {
    LogError.mockImplementation(() => {
      throw new Error("reporter down");
    });
    expect(() => fireError({ message: "reporter-6" }), "a reporter failure escaped").not.toThrow();
  });
});

describe("unhandled rejections", () => {
  it("reports an Error, a string, and an object as text", () => {
    const err = new Error("rej-7");
    fireRejection(err);
    fireRejection("rej-text-7");
    fireRejection({ code: 7 });
    expect(reported().map((r) => [r.scenario, r.message]), "the rejections were not reported as text").toEqual([
      ["unhandledrejection", "rej-7"],
      ["unhandledrejection", "rej-text-7"],
      ["unhandledrejection", '{"code":7}'],
    ]);
    expect(reported()[0].stack, "the Error stack was lost").toBe(err.stack);
  });

  it("falls back to String() for a value JSON cannot write, and to a default for nothing", () => {
    const circular: any = { name: "c8" };
    circular.self = circular;
    fireRejection(circular);
    fireRejection(undefined);
    expect(reported().map((r) => r.message), "the fallbacks are wrong").toEqual([
      "[object Object]",
      "Unhandled promise rejection",
    ]);
  });
});

describe("installGlobalErrorListeners on the server", () => {
  it("does nothing when there is no window", async () => {
    vi.resetModules();
    const fresh = await import("utils/globalErrorListeners");
    vi.stubGlobal("window", undefined);
    expect(() => fresh.installGlobalErrorListeners(), "the server install threw").not.toThrow();
    vi.unstubAllGlobals();
  });
});
