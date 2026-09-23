// utils/gtag.ts — every analytics event goes to Google Analytics (window.gtag)
// and, with the same shared properties, to PostHog. The country and language
// are read from the address once, when the module loads, so each test loads a
// fresh copy after putting the address in place.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const posthogCapture = vi.hoisted(() => vi.fn());
vi.mock("utils/posthog", () => ({ posthogCapture }));
const LogError = vi.hoisted(() => vi.fn());
vi.mock("utils/functions", async (importOriginal) => ({
  ...(await importOriginal<Record<string, any>>()),
  LogError,
}));

const realUA = navigator.userAgent;
const setUA = (ua: string) => Object.defineProperty(navigator, "userAgent", { value: ua, configurable: true });

async function load(path = "/sy-ar/products") {
  window.history.pushState({}, "", path);
  vi.resetModules();
  const { useAppStore } = await import("store");
  const gtag = await import("utils/gtag");
  return { ...gtag, useAppStore };
}

let gtagSpy: ReturnType<typeof vi.fn>;

beforeEach(() => {
  gtagSpy = vi.fn();
  (window as any).gtag = gtagSpy;
  posthogCapture.mockClear();
  LogError.mockClear();
});

afterEach(() => {
  delete (window as any).gtag;
  setUA(realUA);
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("GAevent", () => {
  it("sends the event to GA and PostHog with the page, country, language and a guest id", async () => {
    const { GAevent, useAppStore } = await load();
    useAppStore.setState({ userProfile: null, session_id: "sess-1" } as any);
    setUA("Mozilla/5.0 (Windows NT 10.0)");
    GAevent({ action: "click", params: { button: "buy" } });
    const [kind, action, payload] = gtagSpy.mock.calls[0];
    expect([kind, action], "GA did not get an event").toEqual(["event", "click"]);
    expect(payload, "the GA payload is wrong").toMatchObject({
      button: "buy",
      screen_path: "/sy-ar/products",
      country_name: "Syria",
      device_language: "Arabic",
      session_id: "sess-1",
      device_type: "desktop",
      operating_system: "Windows",
      platform_source: "WEB",
      user_id_guest: undefined,
    });
    expect(posthogCapture.mock.calls[0]?.[1], "PostHog did not get the same event").toMatchObject({
      button: "buy",
      country_name: "Syria",
      platform_source: "WEB",
    });
  });

  it("sets the GA user for a verified profile and tags events with its id", async () => {
    const { GAevent, useAppStore } = await load("/tr-en");
    useAppStore.setState({
      userProfile: { id: 9, phone: "+905", is_phone_verified: 1, created_at: new Date().toISOString(), gender: { name: "Man" } },
    } as any);
    GAevent({ action: "view" });
    const config = gtagSpy.mock.calls.find((c) => c[0] === "config" && c[2]?.user_type);
    expect(config?.[2], "the GA user is wrong").toMatchObject({
      user_id: 9,
      user_type: "registered",
      user_location: "Turkey",
      gender: "male",
    });
    expect(gtagSpy.mock.calls.find((c) => c[0] === "event")?.[2]?.user_id_verify, "the verified id is missing").toBe(9);
  });

  it("logs the event to the console when analytics logging is on", async () => {
    vi.stubEnv("NEXT_PUBLIC_ANALYTICS_LOG", "true");
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    const { GAevent, useAppStore } = await load();
    useAppStore.setState({ userProfile: null } as any);
    GAevent({ action: "logged", params: { a: 1 } });
    expect(String(log.mock.calls[0]?.[0]), "the event was not logged").toContain("logged");
  });

  it("reports a failure instead of throwing", async () => {
    const { GAevent } = await load();
    gtagSpy.mockImplementation(() => {
      throw new Error("gtag broke");
    });
    expect(() => GAevent({ action: "x" }), "a GA failure escaped").not.toThrow();
    gtagSpy.mockImplementation(() => {
      throw "text";
    });
    GAevent({ action: "y" });
    expect(LogError.mock.calls.map((c) => c[0].error), "the failures were not reported").toEqual(["gtag broke", "text"]);
  });

  it("works with no country or language in the address and no gtag loaded", async () => {
    const { GAevent, useAppStore } = await load("/xx-zz");
    delete (window as any).gtag;
    useAppStore.setState({ userProfile: null } as any);
    GAevent({ action: "bare" });
    expect(posthogCapture.mock.calls[0]?.[1], "an unknown locale was named").toMatchObject({
      country_name: undefined,
      device_language: undefined,
    });
  });
});

describe("SetGAUser", () => {
  it("marks a guest, and a new user", async () => {
    const { SetGAUser } = await load();
    SetGAUser({ id: 1, phone: "0", created_at: "2020-01-01" });
    SetGAUser({ id: 2, phone: "+90", created_at: "2020-01-01" }, true);
    const types = gtagSpy.mock.calls.filter((c) => c[0] === "set" && c[1] === "user_properties").map((c) => c[2].user_type);
    expect(types, "the user types are wrong").toEqual(["guest", "new"]);
  });

  it("BUG-utils-4: a user with no gender is not reported to GA as female", async () => {
    const { SetGAUser } = await load();
    SetGAUser({ id: 1, phone: "+90", created_at: "2020-01-01" });
    const props = gtagSpy.mock.calls.find((c) => c[0] === "set" && c[1] === "user_properties")?.[2];
    expect(props?.gender, "a user who never gave a gender was sent to GA as female").not.toBe("female");
  });
});

describe("globalProps — device and system", () => {
  it.each([
    ["Mozilla/5.0 (iPad; CPU OS 17)", "tablet", "iOS"],
    ["Mozilla/5.0 (Linux; Android 14)", "tablet", "Android"],
    ["Mozilla/5.0 (Linux; Android 14) Mobile", "mobile", "Android"],
    ["Mozilla/5.0 (iPhone; CPU iPhone OS 17)", "mobile", "iOS"],
    ["Mozilla/5.0 (Macintosh; Intel Mac OS X)", "desktop", "Macintosh"],
    ["Mozilla/5.0 (X11; Ubuntu)", "desktop", "Linux"],
    ["BlackBerry9700", "mobile", "Other Mobile"],
    ["SomethingElse", "desktop", "Unknown"],
  ])("names %s as %s on %s", async (ua, device, os) => {
    const { globalProps, useAppStore } = await load();
    useAppStore.setState({ userProfile: { id: 3, phone: "0" } } as any);
    setUA(ua);
    expect(globalProps(), `the device for "${ua}" is wrong`).toMatchObject({
      device_type: device,
      operating_system: os,
      user_id_guest: 3,
    });
  });

  it("answers desktop and Unknown with no navigator", async () => {
    const { globalProps, useAppStore } = await load();
    useAppStore.setState({ userProfile: null } as any);
    vi.stubGlobal("navigator", undefined);
    const props = globalProps();
    vi.unstubAllGlobals();
    expect([props.device_type, props.operating_system], "the no-navigator defaults are wrong").toEqual(["desktop", "Unknown"]);
  });
});
