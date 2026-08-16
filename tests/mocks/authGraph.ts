// Stand-in bodies for everything the sign-in service imports.
//
// The service reaches eighteen modules — analytics, three sibling services, the
// request helper, the lock store, the error reporter. None of them is the
// subject of this phase, and loading the real ones drags in the translations
// module and a circular import (services/home imports services/auth). So each
// one is replaced, and the bodies live here so three test files do not each
// hand-roll them.
//
// WHAT THIS FILE MAY IMPORT: nothing. `vi` is a global (`globals: true` in
// vitest.config.mts). An import here would be re-executed by every factory on
// every `vi.resetModules()`, and one accidental import of the real store or a
// sibling service would drag the whole graph back in — the exact cost the
// stand-ins exist to avoid.
//
// REGISTRATION STAYS IN THE TEST FILE. `vi.mock` ids are hoisted per file and
// several of them are relative to the service (`./home`, `./wallet`), so this
// module can share the bodies but cannot shorten the registration block. Each
// service test file carries its own ~20 lines of `vi.mock`.

/** A reply queue for a stood-in function, with the shared stand-ins' contract:
 *  replies come back in order, and running out is a loud failure naming the
 *  call — never a quiet success. */
export function queueReplies(spy: any, label: string) {
  const queue: any[] = [];
  spy.mockImplementation(async (...args: any[]) => {
    const next = queue.shift();
    if (!next) {
      const detail = describeCall(args[0]);
      throw new Error(
        `${label}: no reply queued for ${detail}. Queue one with ` +
          `\`reply(...)\`, or find out why the code called again.`,
      );
    }
    if (typeof next === "function") return next(...args);
    if (next instanceof Error) throw next;
    return next;
  });
  return {
    /** Queue one reply (a value, a thrower, or a function of the arguments). */
    reply: (value: any) => queue.push(value),
    /** How many queued replies are still unused. */
    get left() {
      return queue.length;
    },
  };
}

function describeCall(first: any) {
  if (first && typeof first === "object" && "url" in first) {
    return `${first.method ?? "GET"} ${first.url}`;
  }
  return typeof first === "string" ? first : "the call";
}

/** The default reply for the send-code action: an explicit, loud failure.
 *  A test that means to send a code has to say so — a bare spy returning
 *  `undefined` would let a forgotten reply pass quietly. */
export const SEND_OTP_NO_REPLY = {
  success: false,
  message:
    "No reply was set for sendOtpAction. Set one with " +
    "sendOtp.sendOtpAction.mockResolvedValue({ … }).",
};

export const makeFunctionsMock = () => ({
  _isStoreLastJson: vi.fn(),
  LogError: vi.fn(),
  translateFunction: vi.fn((key: string) => key),
});

export const makeSendOtpMock = () => ({
  sendOtpAction: vi.fn(async () => SEND_OTP_NO_REPLY),
});

export const makeOtpLocksMock = () => ({
  lockNumber: vi.fn(),
  recordSessionNumber: vi.fn(),
});

export const makeStoryServiceMock = () => ({
  default: { getStories: vi.fn() },
});

export const makeHomeServiceMock = () => ({
  default: {
    registerForExpire: vi.fn(),
    getNotificationPermissionStatus: vi.fn(),
    getClientData: vi.fn(),
    getCustomerInfo: vi.fn(),
    subscribeToTopicInventory: vi.fn(),
  },
});

export const makeWalletMock = () => ({ checkWallet: vi.fn() });

export const makeGtagMock = () => ({ GAevent: vi.fn(), SetGAUser: vi.fn() });

export const makePosthogMock = () => ({ posthogIdentify: vi.fn() });

export const makeOrderFunnelMock = () => ({
  ORDER_EVENTS: { VERIFY_OTP_FAILED: "verify_otp_failed" },
  resolveVerifyFlowSource: vi.fn((marker: any) => marker ?? "none"),
  trackOrder: vi.fn(),
});

export const makeNotificationsMock = () => ({
  showErrorNotification: vi.fn(),
  showSuccessNotification: vi.fn(),
});

export const makeFetchDataMock = () => ({ fetchData: vi.fn() });

export const makeAuthMeMock = () => ({ fetchAuthMe: vi.fn(async () => null) });

export const makeCookieNamesMock = () => ({
  COOKIE_NAMES: {
    USER_DATA: "User-Data",
    USER_CHAT: "User-Chat",
    USER_STORIES: "User-Stories",
    WALLET_USER: "Wallet-User",
  },
});

export const makeGaEventNamesMock = () => ({
  GA_EVENT_NAMES: { CUSTOM_USER_MAPPING: "custom_user_mapping" },
});

export const makeRequestsMock = () => ({
  REQUESTS_DATA: new Proxy({}, { get: (_t, key) => String(key) }),
});

export const makeErrorReporterMock = () => ({ LogServerError: vi.fn() });

export const makeUploadUtilsMock = () => ({
  GetTicket: vi.fn(async () => "test-upload-ticket"),
});
