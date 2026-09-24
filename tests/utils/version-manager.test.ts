// utils/version-manager.ts — on a new app version, wipe the browser's stored
// state once, log the session out and reload. The version lives in the
// APP_VERSION cookie; the test env sets NEXT_PUBLIC_APP_VERSION to 0.0.0-test.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const cookies = vi.hoisted(() => ({
  getCookie: vi.fn(),
  setCookie: vi.fn(),
  deleteCookie: vi.fn(),
  clearHashedUserId: vi.fn(),
}));
vi.mock("utils/cookies/cookie-manager", () => cookies);

const clearAllUserData = vi.hoisted(() => vi.fn(async () => {}));
vi.mock("utils/tinyUtils", () => ({ clearAllUserData }));

const LogError = vi.hoisted(() => vi.fn());
vi.mock("utils/functions", () => ({ LogError }));

import { checkAndUpdateVersion } from "utils/version-manager";

const realLocation = window.location;
let reload: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
  clearAllUserData.mockResolvedValue(undefined);
  reload = vi.fn();
  Object.defineProperty(window, "location", {
    value: { ...realLocation, reload },
    configurable: true,
  });
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  Object.defineProperty(window, "location", { value: realLocation, configurable: true });
  document.cookie = "a=; max-age=0";
});

describe("checkAndUpdateVersion", () => {
  it("stores the current version on a first visit and wipes nothing", async () => {
    cookies.getCookie.mockReturnValue(null);
    await checkAndUpdateVersion();
    expect(cookies.setCookie.mock.calls[0]?.slice(0, 2), "the first-visit version was not stored").toEqual([
      "APP_VERSION",
      "0.0.0-test",
    ]);
    expect(clearAllUserData, "a first visit logged the user out").not.toHaveBeenCalled();
  });

  it("uses 1.0.0 when the build has no version", async () => {
    vi.stubEnv("NEXT_PUBLIC_APP_VERSION", "");
    cookies.getCookie.mockReturnValue(null);
    await checkAndUpdateVersion();
    expect(cookies.setCookie.mock.calls[0]?.[1], "the default version is wrong").toBe("1.0.0");
  });

  it("does nothing when the stored version is the current one", async () => {
    cookies.getCookie.mockReturnValue("0.0.0-test");
    await checkAndUpdateVersion();
    expect(cookies.setCookie, "the same version was written again").not.toHaveBeenCalled();
    expect(reload, "the page reloaded on the same version").not.toHaveBeenCalled();
  });

  it("wipes storage, logs out, keeps the version cookie and reloads on a new version", async () => {
    cookies.getCookie.mockReturnValue("0.0.0-old");
    localStorage.setItem("k", "v");
    sessionStorage.setItem("k", "v");
    document.cookie = "a=1";
    document.cookie = "APP_VERSION=0.0.0-old";
    await checkAndUpdateVersion();
    expect(localStorage.length, "localStorage was not wiped").toBe(0);
    expect(sessionStorage.length, "sessionStorage was not wiped").toBe(0);
    const deleted = cookies.deleteCookie.mock.calls.map((c) => c[0]);
    expect(deleted, "a normal cookie was not deleted").toContain("a");
    expect(deleted, "the version cookie was deleted").not.toContain("APP_VERSION");
    expect(cookies.clearHashedUserId, "the hashed user id was not cleared").toHaveBeenCalled();
    expect(clearAllUserData, "the session was not logged out").toHaveBeenCalled();
    expect(cookies.setCookie.mock.calls[0]?.[1], "the new version was not stored").toBe("0.0.0-test");
    expect(reload, "the page did not reload").toHaveBeenCalled();
    document.cookie = "APP_VERSION=; max-age=0";
  });

  it("still logs out when deleting a cookie fails", async () => {
    cookies.getCookie.mockReturnValue("0.0.0-old");
    cookies.deleteCookie.mockImplementation(() => {
      throw new Error("blocked");
    });
    document.cookie = "a=1";
    await checkAndUpdateVersion();
    expect(clearAllUserData, "a cookie failure stopped the logout").toHaveBeenCalled();
    cookies.deleteCookie.mockReset();
  });

  it("does not reload when the logout fails", async () => {
    cookies.getCookie.mockReturnValue("0.0.0-old");
    clearAllUserData.mockRejectedValue(new Error("offline"));
    await checkAndUpdateVersion();
    expect(reload, "the page reloaded after a failed logout").not.toHaveBeenCalled();
  });

  it("reports a cookie that cannot be read or written, and treats it as a first visit", async () => {
    cookies.getCookie.mockImplementation(() => {
      throw new Error("read blocked");
    });
    cookies.setCookie.mockImplementation(() => {
      throw new Error("write blocked");
    });
    await checkAndUpdateVersion();
    expect(LogError.mock.calls.map((c) => c[0].scenario), "the cookie failures were not reported").toEqual([
      "version-manager: the stored version could not be read",
      "version-manager: the version cookie could not be written",
    ]);
    cookies.getCookie.mockReset();
    cookies.setCookie.mockReset();
  });

  it("reports a failure of the check itself", async () => {
    cookies.getCookie.mockImplementation(() => {
      throw new Error("read blocked");
    });
    LogError.mockImplementationOnce(() => {
      throw new Error("reporter down");
    });
    await checkAndUpdateVersion();
    expect(LogError.mock.calls[1]?.[0]?.scenario, "the failed check was not reported").toBe(
      "version-manager: the version check failed",
    );
    cookies.getCookie.mockReset();
  });

  it("does nothing on the server", async () => {
    vi.stubGlobal("window", undefined);
    await checkAndUpdateVersion();
    expect(cookies.getCookie, "the server read the version cookie").not.toHaveBeenCalled();
  });
});
