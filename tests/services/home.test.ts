import { afterEach, describe, expect, it, vi, beforeEach } from "vitest";
import homeService from "services/home";
import { fetchData } from "utils/fetchData";
import { useAppStore } from "store";
import { LogServerError } from "utils/serverErrorReporter";
import { getCart, LogError, translateFunction } from "utils/functions";
import { posthogIdentify } from "utils/posthog";
import { setCookie } from "utils/cookies/cookie-manager";
import chat from "services/chat";
import { useNotificationStore } from "store/notifications/reducer";

vi.mock("utils/fetchData", () => ({
  fetchData: vi.fn(),
}));

vi.mock("utils/serverErrorReporter", () => ({
  LogServerError: vi.fn(),
}));

vi.mock("utils/functions", () => ({
  WaitForCondition: vi.fn(async () => true),
  _isStoreLastJson: vi.fn(),
  getCart: vi.fn(),
  LogError: vi.fn(),
  translateFunction: vi.fn(),
}));

// The browser push client, the chat service and the analytics clients. None of
// them can run in a test, and each is only checked for being called.
const firebase = vi.hoisted(() => ({
  requestFirebaseNotificationPermission: vi.fn(),
  onMessageListener: vi.fn(),
  setupNetworkRecoveryHandler: vi.fn(),
}));
vi.mock("utils/firebaseInitv1", () => firebase);
vi.mock("services/chat", () => ({ default: { getChats: vi.fn() } }));
vi.mock("utils/posthog", async (importOriginal) => ({
  ...(await importOriginal<typeof import("utils/posthog")>()),
  posthogIdentify: vi.fn(),
}));
vi.mock("utils/gtag", () => ({ GAevent: vi.fn(), SetGAUser: vi.fn() }));
vi.mock("utils/cookies/cookie-manager", async (importOriginal) => ({
  ...(await importOriginal<typeof import("utils/cookies/cookie-manager")>()),
  setCookie: vi.fn(),
}));

describe("Home Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GetFireBaseSettings", () => {
    it("fetches firebase settings and updates store state", async () => {
      const mockSettings = { apiKey: "test-key", appId: "1:123:web:abc" };
      vi.mocked(fetchData).mockResolvedValueOnce({
        success: true,
        data: { firebase_settings: mockSettings },
      });

      let storeFirebaseSettings: any = null;
      useAppStore.setState({
        getFirebaseSettings: (settings: any) => {
          storeFirebaseSettings = settings;
        },
      } as any);

      await homeService.GetFireBaseSettings();

      expect(fetchData, "should call fetchData for firebase settings").toHaveBeenCalledWith(
        expect.objectContaining({
          method: "GET",
          server: "market",
        }),
      );
      expect(storeFirebaseSettings, "store should be updated with firebase settings").toEqual(mockSettings);
    });

    it("resets firebase settings to null when response is unsuccessful", async () => {
      vi.mocked(fetchData).mockResolvedValueOnce({
        success: false,
        message: "Settings error",
      });

      let storeFirebaseSettings: any = "initial";
      useAppStore.setState({
        getFirebaseSettings: (settings: any) => {
          storeFirebaseSettings = settings;
        },
      } as any);

      await homeService.GetFireBaseSettings();
      expect(storeFirebaseSettings, "store firebase settings should be reset to null").toBeNull();
    });
  });

  describe("getCustomerInfo", () => {
    /** The profile write goes to the app's own route with a bare `fetch`. */
    const userDataWrites = (spy: ReturnType<typeof vi.fn>) =>
      spy.mock.calls
        .filter(([url]) => String(url).includes("/api/auth/update-user"))
        .map(([, init]) => JSON.parse(String(init?.body)).updates[0].value);

    beforeEach(() => {
      vi.unstubAllGlobals();
    });

    // E2E run 35845377516, SCRIPT-12: the page's first load sent customer/info
    // as guest 33618, the sign-in as 18081 finished while it was in flight, and
    // the guest answer then replaced the signed-in profile.
    it("does not put the guest back when the sign-in lands while the guest's customer/info is in flight", async () => {
      let answer!: (value: unknown) => void;
      vi.mocked(fetchData).mockReturnValueOnce(
        new Promise((resolve) => {
          answer = resolve;
        }) as any,
      );
      const fetchSpy = vi.fn(async () => new Response("{}"));
      vi.stubGlobal("fetch", fetchSpy);
      useAppStore.setState({
        userProfile: { id: 33618, name: "", is_phone_verified: 0 },
      } as any);

      const pending = homeService.getCustomerInfo();
      await vi.waitFor(() => expect(fetchData).toHaveBeenCalled());

      // The sign-in finishes before the guest's answer arrives.
      useAppStore
        .getState()
        .loginSuccess({ id: 18081, name: "Shopper", is_verified: 1, is_phone_verified: 1 });

      answer({
        success: true,
        data: { customer_info: { id: 33618, name: "guest", is_phone_verified: 0 } },
      });
      await pending;

      expect(
        useAppStore.getState().userProfile?.id,
        "a guest answer that arrived after the sign-in replaced the signed-in shopper in the store",
      ).toBe(18081);
      expect(
        userDataWrites(fetchSpy).map((profile) => profile.id),
        "a guest answer that arrived after the sign-in was written into the User-Data cookie, so /api/auth/me now says guest",
      ).not.toContain(33618);
    });

    it("still saves the answer when it belongs to the shopper who is signed in", async () => {
      vi.mocked(fetchData).mockResolvedValueOnce({
        success: true,
        data: { customer_info: { id: 18081, name: "Shopper", is_phone_verified: 1 } },
      } as any);
      const fetchSpy = vi.fn(async () => new Response("{}"));
      vi.stubGlobal("fetch", fetchSpy);
      useAppStore.setState({
        userProfile: { id: 18081, name: "Shopper", is_phone_verified: 1 },
      } as any);

      await homeService.getCustomerInfo();

      expect(
        userDataWrites(fetchSpy).map((profile) => profile.id),
        "the signed-in shopper's own customer/info answer was not written into the User-Data cookie",
      ).toEqual([18081]);
    });
  });

  describe("hideOldCart", () => {
    beforeEach(() => {
      useAppStore.setState({ rdbLock: null });
    });

    it("records the lock when an RDB payment request holds the cart, and does not treat it as an error", async () => {
      vi.mocked(fetchData).mockResolvedValueOnce({
        success: false,
        httpStatus: 409,
        message:
          "Your cart is locked until the pending RDB payment is completed or cancelled.",
        data: {
          rdb_request_reference: "ref-1",
          expires_at: "2026-09-15T14:30:00+00:00",
        },
      } as any);

      await homeService.hideOldCart({ id: 42 });

      expect(
        useAppStore.getState().rdbLock?.reference,
        "the core backend's locked-cart answer on /old-cart/hide did not reach the store — this is the only one of the six lock call sites with no test",
      ).toBe("ref-1");
      expect(
        LogServerError,
        "a locked cart is normal behaviour and must not be logged as an error",
      ).not.toHaveBeenCalled();
    });
  });
});

// ---------------------------------------------------------------------------
// The rest of the home service: the start-up settings, the guest renewal, the
// push notification set-up and topics, and the small market calls.
// ---------------------------------------------------------------------------

const loggedScenarios = () =>
  vi.mocked(LogServerError).mock.calls.map((call: any[]) => call[0]?.scenario);

describe("loading the start-up settings (getClientData)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.stubGlobal("fetch", vi.fn(async () => new Response("{}")));
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("stores the settings, loads the profile and the cart, then the chats", async () => {
    const setSettings = vi.fn();
    const initCart = vi.fn();
    useAppStore.setState({
      setSettings,
      initCart,
      language: "ar",
      userChat: { id: 5 },
      userProfile: { id: 9 },
    } as any);
    vi.mocked(fetchData)
      .mockResolvedValueOnce({ success: true, data: { starting_setting: { a: 1 } } } as any)
      .mockResolvedValueOnce({ success: true, data: { customer_info: { id: 9, name: "Sam" } } } as any);
    vi.mocked(getCart).mockImplementation(({ callback }: any) => callback([undefined, {}]));

    await homeService.getClientData();

    expect(
      vi.mocked(fetchData).mock.calls[0][0].url,
      "the start-up settings were not asked for in the shopper's language",
    ).toContain("?language=ar");
    expect(setSettings, "the start-up settings were not stored").toHaveBeenCalled();
    expect(initCart, "an empty cart answer did not start an empty cart").toHaveBeenCalledWith({ cart: [] });

    vi.advanceTimersByTime(5000);
    expect(chat.getChats, "the chats were not loaded for a chat user").toHaveBeenCalledWith(false);
  });

  it("does not load chats for a shopper with no chat account", async () => {
    useAppStore.setState({ setSettings: vi.fn(), initCart: vi.fn(), userChat: null } as any);
    vi.mocked(fetchData).mockResolvedValue({ success: true, data: {} } as any);
    vi.mocked(getCart).mockImplementation(({ callback }: any) => callback([{ cart: [1] }, {}]));

    await homeService.getClientData();
    vi.advanceTimersByTime(5000);

    expect(chat.getChats, "chats were loaded for a shopper with no chat account").not.toHaveBeenCalled();
  });

  it("reports a refused settings call and stores nothing", async () => {
    const setSettings = vi.fn();
    useAppStore.setState({ setSettings, initCart: vi.fn() } as any);
    vi.mocked(fetchData).mockResolvedValueOnce({ success: false, message: "down" } as any);

    await homeService.getClientData();

    expect(setSettings, "settings were stored from a refused answer").not.toHaveBeenCalled();
    expect(loggedScenarios(), "the refused settings call was not reported").toContain(
      "Error In getClientData in services/home",
    );
  });
});

describe("reading the shopper's profile (getCustomerInfo) — the failure paths", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", vi.fn(async () => new Response("{}")));
    useAppStore.setState({ userProfile: { id: 9 } } as any);
  });
  afterEach(() => vi.unstubAllGlobals());

  it("clears a guest placeholder name so the page asks for a real one", async () => {
    vi.mocked(fetchData).mockResolvedValueOnce({
      success: true,
      data: { customer_info: { id: 9, name: "guest", is_approve_policies: 1 } },
    } as any);

    const info: any = await homeService.getCustomerInfo();

    expect(info?.name, "the guest placeholder name was shown as the shopper's name").toBe("");
  });

  it("reports a refused profile call", async () => {
    vi.mocked(fetchData).mockResolvedValueOnce({ success: false, message: "nope" } as any);

    expect(await homeService.getCustomerInfo(), "a refused profile call returned a profile").toBeUndefined();
    expect(loggedScenarios(), "the refused profile call was not reported").toContain(
      "Error In getCustomerInfo in services/home",
    );
  });

  it("reports an answer that carries no profile", async () => {
    vi.mocked(fetchData).mockResolvedValueOnce({ success: true, data: {} } as any);

    expect(await homeService.getCustomerInfo(), "an empty answer returned a profile").toBeUndefined();
    expect(
      (vi.mocked(LogServerError).mock.calls[0]?.[0] as any)?.error?.message,
      "the empty profile answer was not reported as a customer info error",
    ).toBe("Customer Info Error");
  });
});

describe("renewing the guest (registerForExpire)", () => {
  const register = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    register.mockReset();
    vi.stubGlobal("fetch", register);
    window.history.pushState({}, "", "/iq-ar/");
    useAppStore.setState({ isRegisteringReady: true, LoggingOut: false } as any);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("does nothing while the shopper is signing out or another registration runs", async () => {
    useAppStore.setState({ LoggingOut: true } as any);
    await homeService.registerForExpire();
    useAppStore.setState({ LoggingOut: false, isRegisteringReady: false } as any);
    await homeService.registerForExpire();

    expect(register, "a guest was registered during a sign-out or a running registration").not.toHaveBeenCalled();
  });

  it("registers a new guest for the page's country and language, and signs it in", async () => {
    vi.stubEnv("NODE_ENV", "production");
    register.mockResolvedValue({
      ok: true,
      json: async () => ({ data: { user: { id: 501, name: "Guest" }, expires_at: 99 } }),
    });

    await homeService.registerForExpire();

    expect(
      register.mock.calls[0][1].headers,
      "the guest was not registered for the page's country and language",
    ).toMatchObject({ "x-country": "iq", "x-language": "ar" });
    expect(useAppStore.getState().userProfile?.id, "the new guest was not signed in").toBe(501);
    expect(posthogIdentify, "the new guest was not identified to analytics").toHaveBeenCalledWith(501, {
      name: "Guest",
      phone: "guest",
    });
    expect(useAppStore.getState().isRegisteringReady, "the registration lock was left on").toBe(true);
  });

  it("falls back to sy/en and signs nobody in when the answer has no user", async () => {
    window.history.pushState({}, "", "/");
    useAppStore.setState({ userProfile: { id: 1 } } as any);
    register.mockResolvedValue({ ok: true, json: async () => ({ data: {} }) });

    await homeService.registerForExpire();

    expect(register.mock.calls[0][1].headers, "the default locale was not used").toMatchObject({
      "x-country": "sy",
      "x-language": "en",
    });
    expect(useAppStore.getState().userProfile?.id, "an answer with no user changed the shopper").toBe(1);
  });

  it("drops the new guest when a sign-out started while it was being made", async () => {
    useAppStore.setState({ userProfile: { id: 1 } } as any);
    register.mockImplementation(async () => {
      useAppStore.setState({ LoggingOut: true } as any);
      return { ok: true, json: async () => ({ data: { user: { id: 777 } } }) };
    });

    await homeService.registerForExpire();

    expect(useAppStore.getState().userProfile?.id, "a guest made during a sign-out was signed in").toBe(1);
  });

  it("reports a refused registration and frees the lock", async () => {
    register.mockResolvedValue({ ok: false, json: async () => ({ message: "refused" }) });

    await homeService.registerForExpire();

    expect(loggedScenarios(), "the refused registration was not reported").toContain(
      "Error In registerForExpire in services/home",
    );
    expect(useAppStore.getState().isRegisteringReady, "the registration lock was left on").toBe(true);
  });
});

describe("turning push notifications on (AllowNotifications)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    window.history.pushState({}, "", "/sy-en/");
    Object.defineProperty(navigator, "serviceWorker", { value: {}, configurable: true });
    useAppStore.setState({ getFirebaseSettings: vi.fn() } as any);
    vi.mocked(translateFunction).mockImplementation((key: string) => key);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    delete (navigator as any).serviceWorker;
  });

  it("asks the browser first, stores the token, moves the topics and listens", async () => {
    const requestPermission = vi.fn(async () => "granted");
    vi.stubGlobal("Notification", { permission: "default", requestPermission });
    firebase.requestFirebaseNotificationPermission.mockResolvedValue("fb-token");
    firebase.onMessageListener.mockResolvedValue({});
    vi.mocked(fetchData).mockResolvedValueOnce({ success: true, data: { firebase_settings: { x: 1 } } } as any);

    const token = await homeService.AllowNotifications();

    expect(requestPermission, "the browser permission was not asked for").toHaveBeenCalled();
    expect(token, "the device token was not returned").toBe("fb-token");
    expect(localStorage.getItem("FB-DEVICE-TOKEN"), "the device token was not stored").toBe("fb-token");
    expect(localStorage.getItem("lastPair"), "the country-language pair was not remembered").toBe("syen");
    expect(setCookie, "the locale cookie was not written").toHaveBeenCalledWith("local", "sy-en");
    expect(firebase.onMessageListener, "the message listener was not started").toHaveBeenCalled();
  });

  it("reports a failed message listener", async () => {
    vi.stubGlobal("Notification", { permission: "granted" });
    localStorage.setItem("lastPair", "syen");
    firebase.requestFirebaseNotificationPermission.mockResolvedValue("fb-token");
    firebase.onMessageListener.mockRejectedValue(new Error("listener"));

    await homeService.AllowNotifications();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(fetchData, "the topics were moved although the pair did not change").not.toHaveBeenCalled();
    expect(LogError, "the failed listener was not logged").toHaveBeenCalled();
    expect(loggedScenarios(), "the failed listener was not reported").toContain(
      "Error In onMessageListener in services/home",
    );
  });

  it("returns no token when the browser gives none, and never listens", async () => {
    vi.stubGlobal("Notification", undefined);
    firebase.requestFirebaseNotificationPermission.mockResolvedValue(undefined);

    expect(await homeService.AllowNotifications(), "a token was invented").toBeUndefined();
    expect(firebase.onMessageListener, "a device with no token started listening").not.toHaveBeenCalled();
  });

  it("does not listen without a service worker", async () => {
    delete (navigator as any).serviceWorker;
    vi.stubGlobal("Notification", { permission: "granted" });
    localStorage.setItem("lastPair", "syen");
    firebase.requestFirebaseNotificationPermission.mockResolvedValue("fb-token");

    await homeService.AllowNotifications();

    expect(firebase.onMessageListener, "a browser with no service worker started listening").not.toHaveBeenCalled();
  });

  it("throws a readable error, and reports it, when the set-up fails", async () => {
    vi.stubGlobal("Notification", { permission: "granted" });
    firebase.requestFirebaseNotificationPermission.mockRejectedValue(new Error("blocked"));

    await expect(homeService.AllowNotifications(), "a failed set-up was hidden").rejects.toThrow(
      "Notification Is Not Enabled! please Allow Notification Access",
    );
    expect(loggedScenarios(), "the failed set-up was not reported").toContain(
      "Error In AllowNotifications in services/home",
    );
  });
});

describe("moving the push topics to a new country and language (handleTopicsOnPageRefresh)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    useAppStore.setState({ getFirebaseSettings: vi.fn() } as any);
  });

  it("refuses a page address with no country-language pair", async () => {
    window.history.pushState({}, "", "/");

    await expect(
      homeService.handleTopicsOnPageRefresh("tok"),
      "a page with no locale in the address was accepted",
    ).rejects.toThrow("Invalid URL format for country-language pair");
  });

  it("writes the locale cookie but moves nothing without a token", async () => {
    window.history.pushState({}, "", "/IQ-AR/");

    await homeService.handleTopicsOnPageRefresh("");

    expect(setCookie, "the locale cookie was not lower-cased").toHaveBeenCalledWith("local", "iq-ar");
    expect(fetchData, "topics were moved without a device token").not.toHaveBeenCalled();
  });

  it("reports a refused topic move and keeps the old pair", async () => {
    window.history.pushState({}, "", "/sy-en/");
    vi.mocked(fetchData).mockResolvedValueOnce({ success: false, message: "refused" } as any);

    await homeService.handleTopicsOnPageRefresh("tok");

    expect(localStorage.getItem("lastPair"), "a refused move was remembered as done").toBeNull();
    expect(loggedScenarios(), "the refused move was not reported").toContain(
      "Error In handleTopicsOnPageRefresh in services/home",
    );
  });
});

describe("the notification permission state (getNotificationPermissionStatus)", () => {
  const setNotificationModal = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useAppStore.setState({ setNotificationModal } as any);
    useNotificationStore.setState({ notifications: [] } as any);
    vi.mocked(translateFunction).mockImplementation((key: string) => key);
    firebase.requestFirebaseNotificationPermission.mockResolvedValue(undefined);
  });
  afterEach(() => vi.unstubAllGlobals());

  it("asks with the app's own modal when the browser has no notifications", () => {
    vi.stubGlobal("Notification", undefined);

    expect(homeService.getNotificationPermissionStatus(), "an unsupported browser was not 'should ask'").toBe(-1);
    expect(setNotificationModal, "the app's own modal was not opened").toHaveBeenCalledWith(true);
  });

  it("turns notifications on when they are already granted", async () => {
    vi.stubGlobal("Notification", { permission: "granted" });

    expect(homeService.getNotificationPermissionStatus(), "granted was not reported as 1").toBe(1);
    await vi.waitFor(() =>
      expect(
        firebase.setupNetworkRecoveryHandler,
        "a granted permission did not start the push set-up",
      ).toHaveBeenCalled(),
    );
  });

  it("tells the shopper when notifications are denied", () => {
    vi.stubGlobal("Notification", { permission: "denied" });

    expect(homeService.getNotificationPermissionStatus(), "denied was not reported as 0").toBe(0);
    expect(
      useNotificationStore.getState().notifications.map((n: any) => n.message),
      "the shopper was not told notifications are denied",
    ).toContain("Notification is Denied");
  });

  it("opens the app's own modal while the browser has not decided", () => {
    vi.stubGlobal("Notification", { permission: "default" });

    expect(homeService.getNotificationPermissionStatus(), "undecided was not 'should ask'").toBe(-1);
    expect(setNotificationModal, "the app's own modal was not opened").toHaveBeenCalledWith(true);
  });

  it("answers 'should ask' when reading the permission throws", () => {
    vi.stubGlobal("Notification", {
      get permission() {
        throw new Error("blocked");
      },
    });

    expect(homeService.getNotificationPermissionStatus(), "a throwing permission read was not 'should ask'").toBe(-1);
  });
});

describe("subscribing to push topics", () => {
  const post = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    post.mockReset();
    vi.stubGlobal("fetch", post);
    localStorage.clear();
  });
  afterEach(() => vi.unstubAllGlobals());

  it("does nothing without a device token", async () => {
    await homeService.subscribeToTopic({ topic: "t1" });
    await homeService.UnsubscripeFromTopic({ topic: "t1" });

    expect(post, "a topic call was sent with no device token").not.toHaveBeenCalled();
  });

  it("subscribes and unsubscribes the stored device to a topic", async () => {
    localStorage.setItem("FB-DEVICE-TOKEN", "tok");
    post.mockResolvedValue({ ok: true, json: async () => ({ success: true }) });

    await homeService.subscribeToTopic({ topic: "orders_7", variant: "v" });
    await homeService.UnsubscripeFromTopic({ topic: "orders_7" });

    expect(post.mock.calls.map((call) => call[0]), "the topic routes are wrong").toEqual([
      "/api/subscribe",
      "/api/unsubscribe",
    ]);
    expect(JSON.parse(post.mock.calls[0][1].body), "the subscribe body is wrong").toEqual({
      token: "tok",
      topic: "orders_7",
      variant: "v",
    });
    expect(LogServerError, "a successful topic call was reported").not.toHaveBeenCalled();
  });

  it("reports a refused subscribe and unsubscribe, with or without a message", async () => {
    localStorage.setItem("FB-DEVICE-TOKEN", "tok");
    post
      .mockResolvedValueOnce({ ok: false, json: async () => ({ message: "no" }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ success: false }) })
      .mockResolvedValueOnce({ ok: false, json: async () => ({ message: "no" }) })
      .mockResolvedValueOnce({ ok: true, json: async () => null });

    await homeService.subscribeToTopic({ topic: "t1" });
    await homeService.subscribeToTopic({ topic: "t1" });
    await homeService.UnsubscripeFromTopic({ topic: "t1" });
    await homeService.UnsubscripeFromTopic({ topic: "t1" });

    const messages = vi.mocked(LogServerError).mock.calls.map((call: any[]) => call[0]?.error?.message);
    expect(messages, "the refused topic calls were not reported with their reasons").toEqual([
      "no",
      "Subscribe to topic failed",
      "no",
      "Unsubscribe from topic failed",
    ]);
  });

  it("asks the market backend to subscribe or unsubscribe a stock topic", async () => {
    vi.mocked(fetchData).mockResolvedValue({ success: true } as any);

    await homeService.subscribeToTopicInventory({ topic: "stock_1" });
    await homeService.UnsubscribeToTopicInventory({ topic: "stock_1", variant: "Red" as any });

    expect(
      vi.mocked(fetchData).mock.calls.map((call: any[]) => [call[0].url, call[0].body]),
      "the stock topic calls are wrong",
    ).toEqual([
      ["/firebase_device_tokens/subscribe_topic", { topic: "stock_1", variant: null }],
      ["/firebase_device_tokens/unsubscribe_topic", { topic: "stock_1", variant: "Red" }],
    ]);
  });
});

describe("the small market calls", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    useAppStore.setState({ rdbLock: null } as any);
  });

  it("reports a refused old-cart hide", async () => {
    vi.mocked(fetchData).mockResolvedValueOnce({ success: false, message: "no" } as any);

    await homeService.hideOldCart({ id: 1 });

    expect(loggedScenarios(), "the refused old-cart hide was not reported").toContain(
      "Error In hideOldCart in services/home",
    );
  });

  it("does not report a successful old-cart hide", async () => {
    vi.mocked(fetchData).mockResolvedValueOnce({ success: true } as any);

    await homeService.hideOldCart({ id: 1 });

    expect(LogServerError, "a successful old-cart hide was reported").not.toHaveBeenCalled();
  });

  const testSenders = [
    ["TestNotificationBoutique", { boutique_id: 3 }, "send_boutique_created"],
    ["TestNotificationProductToOldCart", undefined, "send_product_cart_expiration"],
    ["TestNotificationProductAvailable", undefined, "send_product_availability"],
    ["TestNotificationProductComment", undefined, "send_product_comment"],
    ["TestNotificationProductDiscount", undefined, "send_product_discount"],
    ["TestNotificationCategoryCreated", undefined, "send_category_created"],
    ["TestNotificationBeforeStockOut", undefined, "send_product_before_stock_out"],
    ["TestNotificationChangeInPrice", undefined, "send_product_when_change_in_price"],
  ] as const;

  for (const [method, args, route] of testSenders) {
    it(`${method} sends the test notification and logs a refusal`, async () => {
      vi.mocked(fetchData)
        .mockResolvedValueOnce({ success: true } as any)
        .mockResolvedValueOnce({ success: false, message: "refused" } as any);

      await (homeService as any)[method](args);
      await (homeService as any)[method](args);

      expect(
        vi.mocked(fetchData).mock.calls[0][0].url,
        `${method} did not call its own test route`,
      ).toBe(`/firebase_device_tokens/${route}`);
      expect(LogError, `${method} did not log the refused test notification`).toHaveBeenCalledTimes(1);
    });
  }

  it("says whether the notification settings were saved", async () => {
    vi.mocked(fetchData)
      .mockResolvedValueOnce({ success: true } as any)
      .mockResolvedValueOnce({ success: false, message: "no" } as any);

    expect(
      await homeService.EditNotificationSettings({ url: "update", body: { a: 1 } }),
      "a saved setting was not reported as saved",
    ).toBe(true);
    expect(
      await homeService.EditNotificationSettings({ url: "update", body: { a: 1 } }),
      "a refused setting was not reported as failed",
    ).toBe(false);
    expect(vi.mocked(fetchData).mock.calls[0][0].url, "the settings route is wrong").toBe(
      "/firebase_device_tokens/update",
    );
  });

  it("likes and unlikes a comment on the comments backend", async () => {
    vi.mocked(fetchData).mockResolvedValue({ success: true } as any);
    const target = { comment_id: "c1", target_type: "comment", product_id: 4 };

    await homeService.LikeComment(target);
    await homeService.UnLikeComment(target);

    expect(
      vi.mocked(fetchData).mock.calls.map((call: any[]) => [call[0].server, call[0].method]),
      "the like calls did not go to the comments backend",
    ).toEqual([
      ["comments", "POST"],
      ["comments", "DELETE"],
    ]);
    expect(JSON.parse(String(vi.mocked(fetchData).mock.calls[0][0].body)), "the like body is wrong").toEqual({
      target_id: "c1",
      target_type: "comment",
      product_id: 4,
    });
  });
});
