// utils/sessionManager.ts — the time limit on a simulated-user session. The end
// time sits in localStorage; once it passes, the session is wiped and the page
// reloads.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const clearAllUserData = vi.hoisted(() => vi.fn());
vi.mock("utils/tinyUtils", () => ({ clearAllUserData }));

import { checkSessionExpiry, clearSimulatedUserSession, initializeSessionCheck } from "utils/sessionManager";

const NOW = new Date("2026-09-01T10:00:00Z");
const realLocation = window.location;
let reload: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
  localStorage.clear();
  clearAllUserData.mockClear();
  reload = vi.fn();
  Object.defineProperty(window, "location", { value: { ...realLocation, reload }, configurable: true });
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  Object.defineProperty(window, "location", { value: realLocation, configurable: true });
});

const expiresIn = (minutes: number) =>
  localStorage.setItem("sessionExpiry", new Date(NOW.getTime() + minutes * 60_000).toISOString());

describe("checkSessionExpiry", () => {
  it("is valid with no simulated session, and inside the 30 minutes", () => {
    expect(checkSessionExpiry(), "no session was treated as expired").toBe(true);
    expiresIn(10);
    expect(checkSessionExpiry(), "a live session was treated as expired").toBe(true);
  });

  it("wipes and ends a session past its end, or one ending more than 30 minutes away", () => {
    expiresIn(-1);
    expect(checkSessionExpiry(), "a past session was treated as live").toBe(false);
    expiresIn(31);
    expect(checkSessionExpiry(), "an end time too far away was trusted").toBe(false);
    expect(clearAllUserData, "the expired session was not wiped").toHaveBeenCalledTimes(2);
  });

  it("is valid on the server", () => {
    vi.stubGlobal("window", undefined);
    expect(checkSessionExpiry(), "the server said the session expired").toBe(true);
  });
});

describe("clearSimulatedUserSession", () => {
  it("removes the end time and every user, session or simulate key, and keeps the rest", () => {
    localStorage.setItem("sessionExpiry", "x");
    localStorage.setItem("userData", "1");
    localStorage.setItem("my_session", "1");
    localStorage.setItem("simulateFlag", "1");
    localStorage.setItem("theme", "dark");
    clearSimulatedUserSession();
    expect(Object.keys(localStorage), "the wrong keys were removed").toEqual(["theme"]);
  });

  it("does nothing on the server", () => {
    vi.stubGlobal("window", undefined);
    clearSimulatedUserSession();
    expect(clearAllUserData, "the server wiped the session").not.toHaveBeenCalled();
  });
});

describe("initializeSessionCheck", () => {
  it("tells the tester and reloads when the session ended", () => {
    const alert = vi.fn();
    vi.stubGlobal("alert", alert);
    expiresIn(-5);
    initializeSessionCheck();
    expect(alert, "the tester was not told").toHaveBeenCalledWith("Session for simulate user has ended");
    expect(reload, "the page did not reload").toHaveBeenCalled();
  });

  it("does nothing for a live session or on the server", () => {
    expiresIn(5);
    initializeSessionCheck();
    vi.stubGlobal("window", undefined);
    initializeSessionCheck();
    expect(reload, "a live session reloaded the page").not.toHaveBeenCalled();
  });
});
