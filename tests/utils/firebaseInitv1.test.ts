// utils/firebaseInitv1.tsx — the browser side of Firebase: the app, the
// realtime database, FCM messaging, the push-permission flow and the
// network-recovery token refresh.
//
// Firebase itself is replaced here. Each test loads a fresh copy of the module,
// because the module keeps its Firebase instances and the "listener added" flag
// in module variables.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const fb = {
  initializeApp: vi.fn((config: any) => ({ app: config.projectId })),
  getDatabase: vi.fn((app: any) => ({ db: app })),
  getMessaging: vi.fn((app: any) => ({ messaging: app })),
  isSupported: vi.fn(async () => true),
  deleteToken: vi.fn(async (_m: any) => true),
  getToken: vi.fn(async (_m: any, _o: any): Promise<any> => "token-new"),
  onMessage: vi.fn(),
};

vi.mock("firebase/app", () => ({
  initializeApp: (c: any) => fb.initializeApp(c),
}));
vi.mock("firebase/database", () => ({
  getDatabase: (a: any) => fb.getDatabase(a),
}));
vi.mock("firebase/messaging", () => ({
  getMessaging: (a: any) => fb.getMessaging(a),
  isSupported: () => fb.isSupported(),
  deleteToken: (m: any) => fb.deleteToken(m),
  getToken: (m: any, o: any) => fb.getToken(m, o),
  onMessage: (m: any, cb: any) => fb.onMessage(m, cb),
}));

const setNotificationPermission = vi.fn();
vi.mock("store", () => ({
  useAppStore: { getState: () => ({ setNotificationPermission }) },
}));

const handleNotification = vi.fn();
vi.mock("utils/NotificationHandler", () => ({
  foregroundNotificationHandler: {
    handleNotification: (...a: any[]) => handleNotification(...a),
  },
}));

const LogError = vi.fn();
let chatUser: any = {};
vi.mock("utils/functions", () => ({
  LogError: (e: any) => LogError(e),
  getUserChat: () => chatUser,
}));

let userId: any = null;
vi.mock("services/auth", () => ({ default: { UserID: () => userId } }));

const StoreToken = vi.fn(async (_a: any) => {});
vi.mock("services/chat", () => ({
  default: { StoreToken: (a: any) => StoreToken(a) },
}));

const fetchData = vi.fn(async (_r: any): Promise<any> => ({
  success: true,
  data: { id: 55 },
}));
vi.mock("utils/fetchData", () => ({ fetchData: (r: any) => fetchData(r) }));

let topics = new Set<string>();
vi.mock("utils/fcmTopicTracker", () => ({
  getSubscribedTopics: () => topics,
}));

/** A service worker stand-in. `active` decides which wait path runs. */
function installServiceWorker(
  registration: any,
  ready: any = { active: null },
) {
  const register = vi.fn(async () => registration);
  Object.defineProperty(navigator, "serviceWorker", {
    value: { register, ready: Promise.resolve(ready) },
    configurable: true,
  });
  return register;
}

async function load() {
  vi.resetModules();
  return import("utils/firebaseInitv1");
}

beforeEach(() => {
  vi.clearAllMocks();
  fb.isSupported.mockResolvedValue(true);
  fb.getToken.mockResolvedValue("token-new");
  fb.deleteToken.mockResolvedValue(true);
  fetchData.mockResolvedValue({ success: true, data: { id: 55 } });
  localStorage.clear();
  userId = null;
  chatUser = {};
  topics = new Set();
});

afterEach(() => {
  delete (navigator as any).serviceWorker;
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("Firebase instances", () => {
  it("creates the app and the database once and reuses them", async () => {
    const mod = await load();
    const db1 = await mod.getDb();
    const db2 = await mod.getDb();
    expect(db1, "the database was not built from the Firebase app").toEqual({
      db: { app: "trydos-2e2b2" },
    });
    expect(db2, "a second call built a new database").toBe(db1);
    expect(fb.initializeApp.mock.calls.length, "the app was created more than once").toBe(1);
  });

  it("has no messaging without a service worker", async () => {
    const mod = await load();
    expect(await mod.getFirebaseMessaging(), "messaging came back with no service worker").toBeNull();
  });

  it("creates messaging once when a service worker exists", async () => {
    installServiceWorker({ active: {} });
    const mod = await load();
    const m1 = await mod.getFirebaseMessaging();
    const m2 = await mod.getFirebaseMessaging();
    expect(m1, "messaging was not built from the app").toEqual({ messaging: { app: "trydos-2e2b2" } });
    expect(m2, "a second call built new messaging").toBe(m1);
  });
});

describe("requestFirebaseNotificationPermission", () => {
  it("stops when the browser cannot do push", async () => {
    fb.isSupported.mockResolvedValue(false);
    const mod = await load();
    expect(await mod.requestFirebaseNotificationPermission(), "an unsupported browser got a token").toBeUndefined();
    expect(fb.getToken, "a token was asked for anyway").not.toHaveBeenCalled();
  });

  it("stops when there is no messaging (no service worker)", async () => {
    const mod = await load();
    expect(await mod.requestFirebaseNotificationPermission(), "a token came back with no service worker").toBeUndefined();
  });

  it("gets a token, keeps it, and registers it with the market and chat backends", async () => {
    const registration = { active: {} };
    installServiceWorker(registration);
    userId = 7;
    chatUser = { id: 657 };
    const mod = await load();

    const token = await mod.requestFirebaseNotificationPermission();

    expect(token, "the new token was not returned").toBe("token-new");
    expect(fb.deleteToken, "the old token was not removed first").toHaveBeenCalled();
    expect(fb.getToken.mock.calls[0]?.[1], "the token was not tied to the service worker").toEqual({
      serviceWorkerRegistration: registration,
    });
    expect(setNotificationPermission, "the permission flag was not set").toHaveBeenCalledWith(true);
    expect(localStorage.getItem("FB-DEVICE-TOKEN"), "the token was not stored").toBe("token-new");
    await vi.waitFor(() =>
      expect(StoreToken, "the chat backend did not get the token").toHaveBeenCalledWith({
        id: 657,
        token: "token-new",
      }),
    );
    const request = fetchData.mock.calls[0]?.[0];
    expect(request?.url, "the market backend did not get the token").toBe("/firebase_device_tokens");
    expect(JSON.parse(request.body).user_id, "the token was registered for the wrong user").toBe(7);
    expect(localStorage.getItem("FBID"), "the market backend's record id was not kept").toBe("55");
  });

  it("keeps a token younger than one day and does not delete it", async () => {
    installServiceWorker({ active: {} });
    localStorage.setItem("FBTokenExpiry", new Date().toISOString());
    const mod = await load();
    await mod.requestFirebaseNotificationPermission();
    expect(fb.deleteToken, "a fresh token was deleted").not.toHaveBeenCalled();
  });

  it("goes on when deleting the old token fails", async () => {
    installServiceWorker({ active: {} });
    fb.deleteToken.mockRejectedValueOnce(new Error("404")).mockRejectedValueOnce("gone");
    const mod = await load();
    expect(await mod.requestFirebaseNotificationPermission(), "the flow stopped after a failed delete").toBe("token-new");
    localStorage.removeItem("FBTokenExpiry");
    expect(await mod.requestFirebaseNotificationPermission(), "the flow stopped after a failed delete").toBe("token-new");
    expect(LogError.mock.calls.map((c) => c[0].error), "the failed deletes were not reported").toEqual([
      "404",
      "gone",
    ]);
  });

  it("returns nothing and stores nothing when Firebase gives no token", async () => {
    installServiceWorker({ active: {} });
    fb.getToken.mockResolvedValue("");
    const mod = await load();
    expect(await mod.requestFirebaseNotificationPermission(), "an empty token was returned").toBeUndefined();
    expect(localStorage.getItem("FB-DEVICE-TOKEN"), "an empty token was stored").toBeNull();
  });

  it("reports a refused token, clears the permission flag and throws", async () => {
    installServiceWorker({ active: {} });
    const err = new Error("permission denied");
    fb.getToken.mockRejectedValueOnce(err).mockRejectedValueOnce("blocked");
    const mod = await load();
    await expect(mod.requestFirebaseNotificationPermission(), "the refusal was swallowed").rejects.toBe(err);
    await expect(mod.requestFirebaseNotificationPermission(), "the refusal was swallowed").rejects.toBe("blocked");
    expect(setNotificationPermission, "the permission flag was not cleared").toHaveBeenCalledWith(false);
    expect(LogError.mock.calls[0]?.[0]?.error, "the refusal was not reported").toBe("permission denied");
    expect(LogError.mock.calls[2]?.[0]?.error, "a text refusal was not reported").toBe("blocked");
  });

  it("reports a refused market registration and skips the chat backend when there is no chat user", async () => {
    installServiceWorker({ active: {} });
    userId = 7;
    fetchData.mockResolvedValueOnce({ success: false, message: "Unauthorized" });
    const mod = await load();
    await mod.requestFirebaseNotificationPermission();
    await vi.waitFor(() =>
      expect(LogError.mock.calls[0]?.[0], "the market backend refusal was not reported").toEqual({
        scenario: "Error in requestFirebaseNotificationPermission 2nd Block in firebaseInit",
        error: "Unauthorized",
      }),
    );
    expect(StoreToken, "the chat backend was called with no chat user").not.toHaveBeenCalled();
  });

  it("reports a thrown text from the market registration", async () => {
    installServiceWorker({ active: {} });
    userId = 7;
    fetchData.mockRejectedValueOnce("offline");
    const mod = await load();
    await mod.requestFirebaseNotificationPermission();
    await vi.waitFor(() =>
      expect(LogError.mock.calls[0]?.[0]?.error, "the thrown text was not kept").toBe("offline"),
    );
  });
});

describe("waiting for the service worker", () => {
  it("uses the ready registration when the new one is not active yet", async () => {
    const ready = { active: {} };
    installServiceWorker({ active: null }, ready);
    const mod = await load();
    await mod.requestFirebaseNotificationPermission();
    expect(fb.getToken.mock.calls[0]?.[1]?.serviceWorkerRegistration, "the ready registration was not used").toBe(
      ready,
    );
  });

  it("returns at once when the worker turns active while the ready promise settles", async () => {
    let reads = 0;
    const registration: any = {
      get active() {
        reads += 1;
        return reads > 1 ? {} : null;
      },
    };
    installServiceWorker(registration);
    const mod = await load();
    expect(await mod.requestFirebaseNotificationPermission(), "the late-active worker was not used").toBe("token-new");
  });

  it("fails when the service worker disappears after messaging was set up", async () => {
    installServiceWorker({ active: {} });
    const mod = await load();
    await mod.requestFirebaseNotificationPermission();
    delete (navigator as any).serviceWorker;
    localStorage.removeItem("FBTokenExpiry");
    await expect(mod.requestFirebaseNotificationPermission(), "a missing service worker did not fail").rejects.toThrow(
      "Service worker is not supported in this environment",
    );
  });

  it("fails when the registration has no worker at all", async () => {
    installServiceWorker({ active: null });
    const mod = await load();
    await expect(mod.requestFirebaseNotificationPermission(), "a registration with no worker did not fail").rejects.toThrow(
      "Service worker registration has no worker instance",
    );
  });

  it("waits for the installing worker to become active", async () => {
    let onChange: (() => void) | undefined;
    const worker: any = {
      state: "installing",
      addEventListener: (_t: string, fn: any) => (onChange = fn),
      removeEventListener: vi.fn(),
    };
    const registration: any = { active: null, installing: worker };
    installServiceWorker(registration);
    const mod = await load();
    const done = mod.requestFirebaseNotificationPermission();
    await vi.waitFor(() => expect(onChange, "no statechange listener was added").toBeDefined());
    onChange!(); // still installing — keeps waiting
    worker.state = "activated";
    registration.active = {};
    onChange!();
    expect(await done, "the token was not returned after activation").toBe("token-new");
    expect(worker.removeEventListener, "the statechange listener was not removed").toHaveBeenCalled();
  });

  it("gives up after 8 seconds when the worker never activates", async () => {
    vi.useFakeTimers();
    const worker: any = {
      state: "installing",
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
    installServiceWorker({ active: null, waiting: worker });
    const mod = await load();
    const done = mod.requestFirebaseNotificationPermission();
    const check = expect(done, "the wait did not time out").rejects.toThrow(
      "Timed out waiting for service worker activation",
    );
    await vi.advanceTimersByTimeAsync(8000);
    await check;
    expect(worker.removeEventListener, "the listener was not removed on timeout").toHaveBeenCalled();
  });
});

describe("setupNetworkRecoveryHandler", () => {
  /** Fire `online` and wait for the async listener to finish its work. */
  const goOnline = async () => {
    window.dispatchEvent(new Event("online"));
    await new Promise((r) => setTimeout(r, 0));
    await new Promise((r) => setTimeout(r, 0));
  };

  it("adds the listener only once", async () => {
    const add = vi.spyOn(window, "addEventListener");
    const mod = await load();
    mod.setupNetworkRecoveryHandler();
    mod.setupNetworkRecoveryHandler();
    expect(add.mock.calls.filter((c) => c[0] === "online").length, "the online listener was added twice").toBe(1);
    add.mockRestore();
  });

  it("does nothing when push permission is not granted, or Notification is missing", async () => {
    vi.stubGlobal("Notification", { permission: "default" });
    const mod = await load();
    mod.setupNetworkRecoveryHandler();
    await goOnline();
    vi.stubGlobal("Notification", undefined);
    await goOnline();
    expect(fb.getToken, "a token was asked for without permission").not.toHaveBeenCalled();
  });

  it("stops when push is not supported or there is no messaging", async () => {
    vi.stubGlobal("Notification", { permission: "granted" });
    const mod = await load();
    mod.setupNetworkRecoveryHandler();
    fb.isSupported.mockResolvedValueOnce(false);
    await goOnline();
    await goOnline(); // supported, but no service worker → no messaging
    expect(fb.getToken, "a token was asked for without messaging").not.toHaveBeenCalled();
  });

  it("stops when Firebase gives no token", async () => {
    vi.stubGlobal("Notification", { permission: "granted" });
    installServiceWorker({ active: {} });
    fb.getToken.mockResolvedValue(null);
    const mod = await load();
    mod.setupNetworkRecoveryHandler();
    await goOnline();
    expect(localStorage.getItem("FB-DEVICE-TOKEN"), "an empty token was stored").toBeNull();
  });

  it("re-registers a rotated token and re-subscribes every tracked topic", async () => {
    vi.stubGlobal("Notification", { permission: "granted" });
    installServiceWorker({ active: {} });
    const fetchSpy = vi.fn(async () => {
      throw new Error("offline");
    });
    vi.stubGlobal("fetch", fetchSpy);
    localStorage.setItem("FB-DEVICE-TOKEN", "token-old");
    topics = new Set(["shop-1", "shop-2"]);
    const mod = await load();
    mod.setupNetworkRecoveryHandler();
    await goOnline();
    await vi.waitFor(() =>
      expect(
        fetchSpy.mock.calls.map((c: any) => JSON.parse(c[1].body).topic),
        "the tracked topics were not re-subscribed",
      ).toEqual(["shop-1", "shop-2"]),
    );
    expect(localStorage.getItem("FB-DEVICE-TOKEN"), "the new token was not stored").toBe("token-new");
    expect(setNotificationPermission, "the permission flag was not set").toHaveBeenCalledWith(true);
  });

  it("does not re-subscribe when the token did not change, or when no topic is tracked", async () => {
    vi.stubGlobal("Notification", { permission: "granted" });
    installServiceWorker({ active: {} });
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    localStorage.setItem("FB-DEVICE-TOKEN", "token-new");
    topics = new Set(["shop-1"]);
    const mod = await load();
    mod.setupNetworkRecoveryHandler();
    await goOnline();
    localStorage.setItem("FB-DEVICE-TOKEN", "token-old");
    topics = new Set();
    await goOnline();
    expect(fetchSpy, "topics were re-subscribed without a rotation").not.toHaveBeenCalled();
  });

  it("reports a failure during the refresh", async () => {
    vi.stubGlobal("Notification", { permission: "granted" });
    installServiceWorker({ active: {} });
    fb.getToken.mockRejectedValueOnce(new Error("boom")).mockRejectedValueOnce("text");
    const mod = await load();
    mod.setupNetworkRecoveryHandler();
    await goOnline();
    await goOnline();
    expect(LogError.mock.calls.map((c) => c[0]), "the refresh failures were not reported").toEqual([
      { scenario: "Error in network recovery FCM refresh", error: "boom" },
      { scenario: "Error in network recovery FCM refresh", error: "text" },
    ]);
  });

  it("does nothing on the server (no window)", async () => {
    const mod = await load();
    vi.stubGlobal("window", undefined);
    expect(() => mod.setupNetworkRecoveryHandler(), "the server call threw").not.toThrow();
  });
});

describe("onMessageListener", () => {
  it("stops when push is not supported, or there is no messaging", async () => {
    fb.isSupported.mockResolvedValueOnce(false);
    const mod = await load();
    expect(await mod.onMessageListener(), "an unsupported browser got a listener").toBeUndefined();
    expect(await mod.onMessageListener(), "no messaging still got a listener").toBeUndefined();
  });

  it("hands each foreground push to the notification handler", async () => {
    installServiceWorker({ active: {} });
    const mod = await load();
    mod.onMessageListener();
    await vi.waitFor(() => expect(fb.onMessage, "no onMessage listener was added").toHaveBeenCalled());
    const callback = fb.onMessage.mock.calls[0][1];
    await callback({ data: { a: 1 } });
    expect(handleNotification.mock.calls[0]?.[1], "the push was not handed on").toEqual({ data: { a: 1 } });
  });
});
